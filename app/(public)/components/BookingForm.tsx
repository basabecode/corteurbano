'use client';

import { useMemo, useState } from 'react';
import { format, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

type Service = { id: string; name: string; price: number; duration_minutes: number; image_url?: string | null };

type BookingFormProps = {
  services: Service[];
  busySlots: string[];
};

const WORKING_HOURS = { start: 8, end: 20 };

export function BookingForm({ services, busySlots }: BookingFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showToast, ToastComponent } = useToast();
  const router = useRouter();

  const busySet = useMemo(() => new Set(busySlots.map((slot) => new Date(slot).toISOString())), [busySlots]);

  const timeSlots = useMemo(() => {
    if (!date || !selectedService) return [];
    const slots: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const isToday = selectedDate.getTime() === today.getTime();

    for (let hour = WORKING_HOURS.start; hour < WORKING_HOURS.end; hour++) {
      const slot = new Date(date);
      slot.setHours(hour, 0, 0, 0);

      // Si es hoy, solo mostrar horas futuras
      if (isToday && slot <= new Date()) continue;

      const iso = slot.toISOString();
      if (!busySet.has(iso)) slots.push(iso);
    }
    return slots;
  }, [date, busySet, selectedService]);

  const endTime = useMemo(() => {
    if (!time || !selectedService) return null;
    return addMinutes(new Date(time), selectedService.duration_minutes);
  }, [time, selectedService]);

  function handleServiceSelect(service: Service) {
    setSelectedService(service);
    setStep(2);
    setTime(null);
  }

  function handleDateSelect(selectedDate: Date | undefined) {
    setDate(selectedDate ?? undefined);
    if (selectedDate) {
      setStep(3);
      setTime(null);
    }
  }

  function handleTimeSelect(selectedTime: string) {
    setTime(selectedTime);
    setShowConfirmModal(true);
  }

  async function handleConfirmBooking() {
    if (!selectedService || !time) return;

    // Verificar autenticación
    const supabase = createSupabaseBrowserClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setShowConfirmModal(false);
      showToast('Debes iniciar sesión para reservar una cita', 'warning');
      setTimeout(() => router.push('/login'), 1500);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ serviceId: selectedService.id, start: time })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear la cita');
      }

      showToast('¡Cita reservada exitosamente!', 'success');
      setShowConfirmModal(false);

      // Reset form
      setTimeout(() => {
        setStep(1);
        setSelectedService(null);
        setDate(undefined);
        setTime(null);
        router.refresh();
      }, 1500);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al reservar la cita', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {ToastComponent}
      <section id="agenda" className="rounded-3xl bg-slate-950/70 p-8 shadow-2xl shadow-black/40 ring-1 ring-slate-900">
        <header className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-500">Agenda premium</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-100">Reserva tu próximo corte</h2>
        </header>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full border-2 font-semibold transition',
                  step >= s
                    ? 'border-amber-500 bg-amber-500 text-slate-950'
                    : 'border-slate-700 bg-slate-900 text-slate-500'
                )}
              >
                {s}
              </div>
              {s < 3 && (
                <div
                  className={cn('h-1 w-16 transition', step > s ? 'bg-amber-500' : 'bg-slate-800')}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Seleccionar Servicio */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-slate-200">Selecciona un servicio</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleServiceSelect(service)}
                  className="group rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-left transition-all duration-300 hover:border-amber-500 hover:bg-slate-900 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-slate-100 group-hover:text-amber-400 transition-colors">{service.name}</h4>
                    <span className="text-xl font-bold text-amber-400">${service.price.toFixed(2)}</span>
                  </div>
                  <p className="text-sm text-slate-400">{service.duration_minutes} minutos</p>
                  <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-wide text-amber-500 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
                    Seleccionar <span className="text-lg">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Seleccionar Fecha */}
        {step === 2 && selectedService && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2"
                >
                  <span>←</span> Volver a servicios
                </button>
                <h3 className="mt-4 text-xl font-semibold text-slate-200">Selecciona una fecha</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Servicio seleccionado: <span className="text-amber-400 font-medium">{selectedService.name}</span>
                </p>
              </div>
            </div>
            <div className="flex justify-center p-4 bg-slate-900/40 rounded-3xl border border-slate-800">
              <Calendar
                mode="single"
                selected={date}
                onSelect={handleDateSelect}
                disabled={[
                  { before: new Date() }, // Deshabilitar días pasados
                  { dayOfWeek: [0] }      // Deshabilitar Domingos (0)
                ]}
                locale={es}
                className="rounded-xl"
                classNames={{
                  head_cell: "text-slate-400 rounded-md w-10 font-medium text-[0.8rem] uppercase tracking-wide capitalize", // Asegurar mayúsculas
                }}
              />
            </div>
            <p className="text-center text-xs text-slate-500">
              * Atendemos de Lunes a Sábado de 8:00 AM a 8:00 PM
            </p>
          </div>
        )}

        {/* Step 3: Seleccionar Horario */}
        {step === 3 && selectedService && date && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2"
                >
                  <span>←</span> Volver a calendario
                </button>
                <h3 className="mt-4 text-xl font-semibold text-slate-200">Selecciona un horario</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {format(date, "EEEE, d 'de' MMMM", { locale: es })}
                </p>
              </div>
            </div>

            {timeSlots.length > 0 ? (
              <div className="grid grid-cols-4 gap-3 md:grid-cols-6 lg:grid-cols-8">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => handleTimeSelect(slot)}
                    className={cn(
                      'rounded-xl border border-slate-800 px-4 py-3 text-sm font-medium text-slate-200 transition-all duration-200',
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
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="mt-4 text-sm text-amber-400 hover:text-amber-300 underline underline-offset-4"
                >
                  Seleccionar otra fecha
                </button>
              </div>
            )}
          </div>
        )}

        {/* Resumen lateral (siempre visible cuando hay selección) */}
        {(selectedService || date || time) && (
          <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 animate-fade-in">
            <h4 className="mb-4 text-lg font-semibold text-slate-200">Resumen de tu reserva</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-slate-300">
                <span>Servicio:</span>
                <strong className="text-slate-100">
                  {selectedService ? selectedService.name : '—'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Fecha:</span>
                <strong className="text-slate-100 capitalize">
                  {date ? format(date, "EEEE, dd MMM yyyy", { locale: es }) : '—'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Hora:</span>
                <strong className="text-slate-100">
                  {time ? format(new Date(time), 'HH:mm') : '—'}
                </strong>
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
                  {selectedService ? `$${selectedService.price.toFixed(2)}` : '—'}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Modal de Confirmación */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => !loading && setShowConfirmModal(false)}
        title="Confirmar Reserva"
        size="md"
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={loading}
              className="flex-1 border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmBooking}
              disabled={loading}
              className="flex-1 bg-amber-500 text-slate-950 hover:bg-amber-400"
            >
              {loading ? 'Reservando...' : 'Confirmar Reserva'}
            </Button>
          </div>
        }
      >
        {selectedService && time && (
          <div className="space-y-4">
            <p className="text-slate-300">¿Confirmas esta reserva?</p>
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
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
              <div className="flex justify-between">
                <span className="text-slate-400">Duración:</span>
                <span className="font-semibold text-slate-100">{selectedService.duration_minutes} minutos</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-2 mt-2">
                <span className="text-slate-400">Total:</span>
                <span className="text-xl font-bold text-amber-400">
                  ${selectedService.price.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
