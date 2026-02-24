'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { format, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { formatCOP } from '@/lib/format-currency';
import { User } from 'lucide-react';

import { ConnectTelegramButton } from './ConnectTelegramButton';

type Service = { id: string; name: string; price: number; duration_minutes: number; image_url?: string | null };
type Barber = { id: string; name: string; photo_url: string | null; specialty: string | null };

type BookingFormProps = {
  services: Service[];
  busySlots: string[];
  barbers: Barber[];
  preSelectedServiceId?: string | null;
  onServiceSelected?: () => void;
};

const WORKING_HOURS = { start: 8, end: 20 };
const SIN_PREFERENCIA_ID = 'sin_preferencia';

export function BookingForm({ services, busySlots, barbers, preSelectedServiceId, onServiceSelected }: BookingFormProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [clientData, setClientData] = useState({ fullName: '', phone: '', email: '' });
  const [userId, setUserId] = useState<string | null>(null);
  const [acceptTelegram, setAcceptTelegram] = useState(true);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [isTelegramLinked, setIsTelegramLinked] = useState(false);
  const [dynamicBusySlots, setDynamicBusySlots] = useState<string[] | null>(null);
  const { showToast, ToastComponent } = useToast();
  const router = useRouter();

  // Cargar slots específicos del barbero cuando se elige uno
  const fetchBarberSlots = useCallback(async (barberId: string) => {
    try {
      const res = await fetch(`/api/availability?barberId=${barberId}`);
      if (!res.ok) return;
      const data = await res.json();
      setDynamicBusySlots(data.busySlots ?? []);
    } catch {
      setDynamicBusySlots(null);
    }
  }, []);

  // Auto-seleccionar servicio cuando viene desde ServiceCard
  useEffect(() => {
    if (preSelectedServiceId && services.length > 0) {
      const service = services.find(s => s.id === preSelectedServiceId);
      if (service) {
        setSelectedService(service);
        // Si ya eligió barbero, saltar al paso de fecha (3), si no ir al paso 1
        if (selectedBarber !== undefined) {
          setStep(3);
        } else {
          setStep(1);
        }
        setTime(null);
        setDate(undefined);
        if (onServiceSelected) onServiceSelected();
      }
    }
  }, [preSelectedServiceId, services, onServiceSelected, selectedBarber]);

  const activeBusySlots = dynamicBusySlots ?? busySlots;
  const busySet = useMemo(
    () => new Set(activeBusySlots.map((slot) => new Date(slot).toISOString())),
    [activeBusySlots]
  );

  const timeSlots = useMemo(() => {
    if (!date || !selectedService) return [];
    const slots: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const isToday = selectedDate.getTime() === today.getTime();

    for (let hour = WORKING_HOURS.start; hour < WORKING_HOURS.end; hour++) {
      for (const min of [0, 30]) {
        const slot = new Date(date);
        slot.setHours(hour, min, 0, 0);
        if (isToday && slot <= new Date()) continue;
        const iso = slot.toISOString();
        if (!busySet.has(iso)) slots.push(iso);
      }
    }
    return slots;
  }, [date, busySet, selectedService]);

  const endTime = useMemo(() => {
    if (!time || !selectedService) return null;
    return addMinutes(new Date(time), selectedService.duration_minutes);
  }, [time, selectedService]);

  function handleBarberSelect(barber: Barber | null) {
    setSelectedBarber(barber);
    setDynamicBusySlots(null);
    setDate(undefined);
    setTime(null);

    if (barber && barber.id !== SIN_PREFERENCIA_ID) {
      fetchBarberSlots(barber.id);
    }

    // Si hay servicio pre-seleccionado, saltar a fecha
    if (selectedService) {
      setStep(3);
    } else {
      setStep(2);
    }
  }

  function handleServiceSelect(service: Service) {
    setSelectedService(service);
    setStep(3);
    setTime(null);
  }

  function handleDateSelect(selectedDate: Date | undefined) {
    setDate(selectedDate ?? undefined);
    if (selectedDate) {
      setStep(4);
      setTime(null);
    }
  }

  async function handleTimeSelect(selectedTime: string) {
    setTime(selectedTime);
    setShowConfirmModal(true);

    setProfileLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      setUserId(user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, telegram_chat_id')
        .eq('id', user.id)
        .single();

      if (profile?.telegram_chat_id) setIsTelegramLinked(true);

      setClientData({
        fullName: profile?.full_name || '',
        phone: profile?.phone || '',
        email: user.email || ''
      });
    }
    setProfileLoading(false);
  }

  async function handleConfirmBooking() {
    if (!selectedService || !time) return;

    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setShowConfirmModal(false);
      showToast('Debes iniciar sesión para reservar una cita', 'warning');
      setTimeout(() => router.push('/login'), 1500);
      return;
    }

    if (!clientData.fullName.trim() || !clientData.phone.trim()) {
      showToast('Por favor completa tu nombre y teléfono', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          serviceId: selectedService.id,
          start: time,
          barberId: selectedBarber && selectedBarber.id !== SIN_PREFERENCIA_ID ? selectedBarber.id : undefined,
          clientData: {
            fullName: clientData.fullName,
            phone: clientData.phone
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear la cita');
      }

      showToast('¡Cita reservada exitosamente!', 'success');
      setBookingSuccess(true);
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al reservar la cita', 'error');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setStep(1);
    setSelectedBarber(null);
    setSelectedService(null);
    setDate(undefined);
    setTime(null);
    setBookingSuccess(false);
    setDynamicBusySlots(null);
  }

  const barberDisplayName = selectedBarber
    ? selectedBarber.id === SIN_PREFERENCIA_ID ? 'Sin preferencia' : selectedBarber.name
    : '—';

  return (
    <>
      {ToastComponent}
      <section id="agenda" className="rounded-2xl md:rounded-3xl bg-slate-950/70 p-4 md:p-8 shadow-2xl shadow-black/40 ring-1 ring-slate-900">
        <header className="mb-6 md:mb-8">
          <p className="text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] text-amber-500">Sistema de Agenda</p>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-100">Reserva tu próximo corte</h2>
        </header>

        {/* Progress Steps — 4 pasos */}
        <div className="mb-6 md:mb-8 flex items-center justify-center gap-1 md:gap-2">
          {[
            { n: 1, label: 'Barbero' },
            { n: 2, label: 'Servicio' },
            { n: 3, label: 'Fecha' },
            { n: 4, label: 'Hora' }
          ].map(({ n, label }) => (
            <div key={n} className="flex items-center">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    'flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full border-2 font-semibold transition text-sm md:text-base',
                    step >= n
                      ? 'border-amber-500 bg-amber-500 text-slate-950'
                      : 'border-slate-700 bg-slate-900 text-slate-500'
                  )}
                >
                  {n}
                </div>
                <span className={cn(
                  'text-[9px] md:text-xs',
                  step >= n ? 'text-amber-400' : 'text-slate-600'
                )}>{label}</span>
              </div>
              {n < 4 && (
                <div className={cn('h-px w-5 md:w-10 mx-1 md:mx-2 mb-4 transition', step > n ? 'bg-amber-500' : 'bg-slate-800')} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Seleccionar Barbero */}
        {step === 1 && (
          <div className="space-y-4 md:space-y-6">
            <h3 className="text-lg md:text-xl font-semibold text-slate-200">¿Con quién quieres tu corte?</h3>
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {/* Sin preferencia */}
              <button
                type="button"
                onClick={() => handleBarberSelect({ id: SIN_PREFERENCIA_ID, name: 'Sin preferencia', photo_url: null, specialty: null })}
                className="group flex flex-col items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/60 p-4 text-center transition-all duration-300 hover:border-amber-500 hover:bg-slate-900 hover:scale-105 hover:shadow-xl hover:shadow-amber-500/10"
              >
                <div className="h-14 w-14 rounded-full bg-slate-800 flex items-center justify-center border-2 border-slate-700 group-hover:border-amber-500/50 transition-colors">
                  <User className="h-7 w-7 text-slate-500 group-hover:text-amber-400 transition-colors" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-100 group-hover:text-amber-400 transition-colors">Sin preferencia</p>
                  <p className="text-xs text-slate-500 mt-0.5">Primer disponible</p>
                </div>
              </button>

              {/* Barberos */}
              {barbers.map((barber) => (
                <button
                  key={barber.id}
                  type="button"
                  onClick={() => handleBarberSelect(barber)}
                  className="group flex flex-col items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-center transition-all duration-300 hover:border-amber-500 hover:bg-slate-900 hover:scale-105 hover:shadow-xl hover:shadow-amber-500/10"
                >
                  {barber.photo_url ? (
                    <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-slate-700 group-hover:border-amber-500/50 transition-colors">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={barber.photo_url} alt={barber.name} className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center border-2 border-amber-500/30 group-hover:border-amber-500/60 transition-colors">
                      <span className="text-xl font-bold text-amber-400">{barber.name[0].toUpperCase()}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-100 group-hover:text-amber-400 transition-colors">{barber.name}</p>
                    {barber.specialty && (
                      <p className="text-xs text-slate-500 mt-0.5">{barber.specialty}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Seleccionar Servicio */}
        {step === 2 && (
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <button type="button" onClick={() => setStep(1)}
                  className="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2">
                  <span>←</span> Volver a barbero
                </button>
                <h3 className="mt-4 text-lg md:text-xl font-semibold text-slate-200">Selecciona un servicio</h3>
              </div>
            </div>
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleServiceSelect(service)}
                  className="group rounded-xl md:rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:p-6 text-left transition-all duration-300 hover:border-amber-500 hover:bg-slate-900 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20"
                >
                  <div className="mb-2 md:mb-3 flex items-center justify-between">
                    <h4 className="text-base md:text-lg font-semibold text-slate-100 group-hover:text-amber-400 transition-colors">{service.name}</h4>
                    <span className="text-base md:text-xl font-bold text-amber-400">{formatCOP(service.price)}</span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-400">{service.duration_minutes} minutos</p>
                  <div className="mt-3 md:mt-4 flex items-center gap-2 text-xs uppercase tracking-wide text-amber-500 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
                    Seleccionar <span className="text-lg">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Seleccionar Fecha */}
        {step === 3 && selectedService && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <button type="button" onClick={() => setStep(selectedService ? 2 : 1)}
                  className="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2">
                  <span>←</span> Volver a servicios
                </button>
                <h3 className="mt-4 text-xl font-semibold text-slate-200">Selecciona una fecha</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Servicio: <span className="text-amber-400 font-medium">{selectedService.name}</span>
                  {selectedBarber && selectedBarber.id !== SIN_PREFERENCIA_ID && (
                    <> · Barbero: <span className="text-amber-400 font-medium">{selectedBarber.name}</span></>
                  )}
                </p>
              </div>
            </div>
            <div className="flex justify-center p-3 md:p-4 bg-slate-900/40 rounded-2xl md:rounded-3xl border border-slate-800 w-full max-w-[340px] mx-auto">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                disabled={[{ dayOfWeek: [0] }, { before: new Date() }]}
                locale={es}
                className="p-0"
              />
            </div>
            <p className="text-center text-xs text-slate-500">
              * Atendemos de Lunes a Sábado de 8:00 AM a 8:00 PM
            </p>
          </div>
        )}

        {/* Step 4: Seleccionar Horario */}
        {step === 4 && selectedService && date && (
          <div className="space-y-6">
            <div>
              <button type="button" onClick={() => setStep(3)}
                className="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2">
                <span>←</span> Volver a calendario
              </button>
              <h3 className="mt-4 text-xl font-semibold text-slate-200">Selecciona un horario</h3>
              <p className="mt-1 text-sm text-slate-400 capitalize">
                {format(date, "EEEE, d 'de' MMMM", { locale: es })}
              </p>
            </div>

            {timeSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleTimeSelect(slot)}
                    className={cn(
                      'rounded-lg md:rounded-xl border border-slate-800 px-2 py-3 md:px-4 md:py-3 text-xs md:text-sm font-medium text-slate-200 transition-all duration-200 min-h-[44px]',
                      time === slot
                        ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 scale-105'
                        : 'hover:border-amber-400 hover:bg-slate-900 hover:scale-105'
                    )}
                  >
                    {format(new Date(slot), 'HH:mm')}
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
                <p className="text-slate-400">No hay horarios disponibles para este día.</p>
                <button type="button" onClick={() => setStep(3)}
                  className="mt-4 text-sm text-amber-400 hover:text-amber-300 underline underline-offset-4">
                  Seleccionar otra fecha
                </button>
              </div>
            )}
          </div>
        )}

        {/* Resumen lateral */}
        {(selectedBarber || selectedService || date || time) && (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 animate-fade-in">
            <h4 className="mb-4 text-lg font-semibold text-slate-200">Resumen de tu reserva</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-300">
                <span>Barbero:</span>
                <strong className="text-slate-100">{barberDisplayName}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Servicio:</span>
                <strong className="text-slate-100">{selectedService ? selectedService.name : '—'}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Fecha:</span>
                <strong className="text-slate-100 capitalize">
                  {date ? format(date, "EEEE, dd MMM yyyy", { locale: es }) : '—'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Hora:</span>
                <strong className="text-slate-100">{time ? format(new Date(time), 'HH:mm') : '—'}</strong>
              </div>
              {endTime && (
                <div className="flex items-center justify-between text-slate-300">
                  <span>Finaliza:</span>
                  <strong className="text-slate-100">{format(endTime, 'HH:mm')}</strong>
                </div>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
                <span className="text-lg font-semibold text-slate-200">Total:</span>
                <span className="text-2xl font-bold text-amber-400">
                  {selectedService ? formatCOP(selectedService.price) : '—'}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Modal de Confirmación */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => {
          if (!loading) {
            setShowConfirmModal(false);
            if (bookingSuccess) resetForm();
          }
        }}
        title={bookingSuccess ? "¡Reserva Exitosa!" : "Confirmar Reserva"}
        size="md"
        footer={
          !bookingSuccess ? (
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowConfirmModal(false)} disabled={loading}
                className="flex-1 border-slate-700 text-slate-200 hover:bg-slate-800">
                Cancelar
              </Button>
              <Button onClick={handleConfirmBooking} disabled={loading}
                className="flex-1 bg-amber-500 text-slate-950 hover:bg-amber-400">
                {loading ? 'Reservando...' : 'Confirmar Reserva'}
              </Button>
            </div>
          ) : (
            <Button onClick={() => { setShowConfirmModal(false); resetForm(); }}
              className="w-full bg-slate-800 text-slate-200 hover:bg-slate-700">
              Cerrar
            </Button>
          )
        }
      >
        {bookingSuccess ? (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">🎉</span>
            </div>
            <h3 className="text-xl font-bold text-slate-100">¡Tu cita ha sido solicitada!</h3>
            <p className="text-slate-400">
              {acceptTelegram && isTelegramLinked
                ? "Hemos enviado los detalles a tu Telegram."
                : acceptTelegram
                  ? "Para recibir la confirmación inmediata, activa las notificaciones abajo."
                  : "Hemos registrado tu cita. Te contactaremos pronto."
              }
            </p>
            {acceptTelegram && (
              isTelegramLinked ? (
                <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
                  <p className="text-amber-400 font-medium mb-2">✅ ¡Notificación Enviada!</p>
                  <p className="text-slate-400 text-sm">Revisa tu Telegram, te hemos enviado todos los detalles.</p>
                </div>
              ) : (
                <ConnectTelegramButton
                  userId={userId || undefined}
                  phone={clientData.phone}
                  botUsername={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || 'barberkings_bot'}
                />
              )
            )}
          </div>
        ) : (
          selectedService && time && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
                {selectedBarber && selectedBarber.id !== SIN_PREFERENCIA_ID && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Barbero:</span>
                    <span className="font-semibold text-slate-100">{selectedBarber.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Servicio:</span>
                  <span className="font-semibold text-slate-100">{selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fecha y hora:</span>
                  <span className="font-semibold text-slate-100 capitalize">
                    {format(new Date(time), "EEEE, dd MMM yyyy 'a las' HH:mm", { locale: es })}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 mt-2">
                  <span className="text-slate-400">Total:</span>
                  <span className="text-xl font-bold text-amber-400">{formatCOP(selectedService.price)}</span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">Tus Datos de Contacto</h4>

                {profileLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label htmlFor="fullName" className="text-sm text-slate-400">Nombre Completo</label>
                      <input id="fullName" type="text" value={clientData.fullName}
                        onChange={(e) => setClientData({ ...clientData, fullName: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-base text-slate-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        placeholder="Tu nombre completo" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm text-slate-400">Teléfono / WhatsApp / Telegram</label>
                      <input id="phone" type="tel" value={clientData.phone}
                        onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-base text-slate-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        placeholder="+57 300 123 4567" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm text-slate-400">Email (registrado)</label>
                      <input id="email" type="email" value={clientData.email} disabled
                        className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-base text-slate-500 cursor-not-allowed" />
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                      <div className="flex h-5 items-center">
                        <input id="telegram-consent" type="checkbox" checked={acceptTelegram}
                          onChange={(e) => setAcceptTelegram(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950" />
                      </div>
                      <div className="text-sm">
                        <label htmlFor="telegram-consent" className="font-medium text-slate-200 block">
                          Recibir confirmación inmediata por Telegram
                        </label>
                        <p className="text-slate-400 text-xs">
                          Te enviaremos los detalles y recordatorios directamente a tu chat.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        )}
      </Modal>
    </>
  );
}
