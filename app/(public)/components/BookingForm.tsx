'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { format, addMinutes } from 'date-fns'
import { es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Modal } from '@/components/ui/modal'
import { useToast } from '@/components/ui/toast'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCOP } from '@/lib/format-currency'
import { User } from 'lucide-react'

import { ConnectTelegramButton } from './ConnectTelegramButton'
import { ModeSelectionStep, type BookingMode } from './ModeSelectionStep'
import { LocationMapStep } from './LocationMapStep'
import { BarberSearchStep } from './BarberSearchStep'

type Service = {
  id: string
  name: string
  price: number
  duration_minutes: number
  image_url?: string | null
}
type Barber = {
  id: string
  name: string
  photo_url: string | null
  specialty: string | null
  lat: number | null
  lng: number | null
  address_label: string | null
  offers_domicilio: boolean
}

type StepName = 'mode' | 'location' | 'barber' | 'service' | 'date' | 'time'

const STEP_SEQUENCES: Record<BookingMode, StepName[]> = {
  presencial: ['mode', 'location', 'barber', 'service', 'date', 'time'],
  conocido: ['mode', 'barber', 'service', 'date', 'time'],
  domicilio: ['mode', 'service', 'date', 'time'],
}

const STEP_LABELS: Record<StepName, string> = {
  mode: 'Modo',
  location: 'Ubicación',
  barber: 'Barbero',
  service: 'Servicio',
  date: 'Fecha',
  time: 'Hora',
}

type BookingFormProps = {
  services: Service[]
  busySlots: string[]
  barbers: Barber[]
  preSelectedServiceId?: string | null
  onServiceSelected?: () => void
}

const WORKING_HOURS = { start: 8, end: 20 }

export function BookingForm({
  services,
  busySlots,
  barbers,
  preSelectedServiceId,
  onServiceSelected,
}: BookingFormProps) {
  const [mode, setMode] = useState<BookingMode | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [date, setDate] = useState<Date | undefined>()
  const [time, setTime] = useState<string | null>(null)
  const [clientAddress, setClientAddress] = useState('')

  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [clientData, setClientData] = useState({
    fullName: '',
    phone: '',
    email: '',
  })
  const [userId, setUserId] = useState<string | null>(null)
  const [acceptTelegram, setAcceptTelegram] = useState(true)
  const [bookingSuccess, setBookingSuccess] = useState(false)
  const [isTelegramLinked, setIsTelegramLinked] = useState(false)
  const [dynamicBusySlots, setDynamicBusySlots] = useState<string[] | null>(
    null
  )

  const { showToast, ToastComponent } = useToast()
  const router = useRouter()

  // Derived state
  const currentSequence: StepName[] = mode ? STEP_SEQUENCES[mode] : ['mode']
  const currentStep: StepName = currentSequence[currentStepIndex] ?? 'mode'
  const progressSteps = mode ? STEP_SEQUENCES[mode] : []

  function goNext() {
    setCurrentStepIndex(i => Math.min(i + 1, currentSequence.length - 1))
  }

  function goBack() {
    if (currentStepIndex === 0 || (mode && currentStepIndex === 1)) {
      // Volver a selección de modo
      setMode(null)
      setCurrentStepIndex(0)
      setSelectedBarber(null)
      setSelectedService(null)
      setDate(undefined)
      setTime(null)
      setDynamicBusySlots(null)
    } else {
      setCurrentStepIndex(i => i - 1)
    }
  }

  // Cargar slots específicos del barbero cuando se elige uno
  const fetchBarberSlots = useCallback(async (barberId: string) => {
    try {
      const res = await fetch(`/api/availability?barberId=${barberId}`)
      if (!res.ok) return
      const data = await res.json()
      setDynamicBusySlots(data.busySlots ?? [])
    } catch {
      setDynamicBusySlots(null)
    }
  }, [])

  // Auto-seleccionar servicio cuando viene desde ServiceCard
  useEffect(() => {
    if (preSelectedServiceId && services.length > 0) {
      const service = services.find(s => s.id === preSelectedServiceId)
      if (service) {
        setSelectedService(service)
        if (onServiceSelected) onServiceSelected()
      }
    }
  }, [preSelectedServiceId, services, onServiceSelected])

  const activeBusySlots = dynamicBusySlots ?? busySlots
  const busySet = useMemo(
    () => new Set(activeBusySlots.map(slot => new Date(slot).toISOString())),
    [activeBusySlots]
  )

  const timeSlots = useMemo(() => {
    if (!date || !selectedService) return []
    const slots: string[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selectedDate = new Date(date)
    selectedDate.setHours(0, 0, 0, 0)
    const isToday = selectedDate.getTime() === today.getTime()

    for (let hour = WORKING_HOURS.start; hour < WORKING_HOURS.end; hour++) {
      for (const min of [0, 30]) {
        const slot = new Date(date)
        slot.setHours(hour, min, 0, 0)
        if (isToday && slot <= new Date()) continue
        const iso = slot.toISOString()
        if (!busySet.has(iso)) slots.push(iso)
      }
    }
    return slots
  }, [date, busySet, selectedService])

  const endTime = useMemo(() => {
    if (!time || !selectedService) return null
    return addMinutes(new Date(time), selectedService.duration_minutes)
  }, [time, selectedService])

  // Handlers for each step
  function handleModeSelect(selectedMode: BookingMode) {
    setMode(selectedMode)
    setCurrentStepIndex(1)
  }

  function handleBarberSelect(barber: Barber) {
    setSelectedBarber(barber)
    setDynamicBusySlots(null)
    setDate(undefined)
    setTime(null)
    fetchBarberSlots(barber.id)
    goNext()
  }

  function handleServiceSelect(service: Service) {
    setSelectedService(service)
    setTime(null)
    goNext()
  }

  function handleDateSelect(selectedDate: Date | undefined) {
    setDate(selectedDate ?? undefined)
    if (selectedDate) {
      goNext()
      setTime(null)
    }
  }

  async function handleTimeSelect(selectedTime: string) {
    setTime(selectedTime)
    setShowConfirmModal(true)

    setProfileLoading(true)
    const supabase = createSupabaseBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, phone, telegram_chat_id')
        .eq('id', user.id)
        .single()

      if (profile?.telegram_chat_id) setIsTelegramLinked(true)

      setClientData({
        fullName: profile?.full_name || '',
        phone: profile?.phone || '',
        email: user.email || '',
      })
    }
    setProfileLoading(false)
  }

  async function handleConfirmBooking() {
    if (!selectedService || !time) return

    // Validar dirección si es domicilio
    if (mode === 'domicilio' && !clientAddress.trim()) {
      showToast(
        'Por favor ingresa tu dirección para el servicio a domicilio',
        'error'
      )
      return
    }

    const supabase = createSupabaseBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setShowConfirmModal(false)
      showToast('Debes iniciar sesión para reservar una cita', 'warning')
      setTimeout(() => router.push('/login'), 1500)
      return
    }

    if (!clientData.fullName.trim() || !clientData.phone.trim()) {
      showToast('Por favor completa tu nombre y teléfono', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/booking/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          serviceId: selectedService.id,
          start: time,
          barberId: selectedBarber?.id,
          bookingType: mode === 'domicilio' ? 'domicilio' : 'presencial',
          clientAddress:
            mode === 'domicilio' ? clientAddress.trim() : undefined,
          clientData: {
            fullName: clientData.fullName,
            phone: clientData.phone,
          },
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al crear la cita')
      }

      showToast('¡Cita reservada exitosamente!', 'success')
      setBookingSuccess(true)
      router.refresh()
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Error al reservar la cita',
        'error'
      )
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setMode(null)
    setCurrentStepIndex(0)
    setSelectedBarber(null)
    setSelectedService(null)
    setDate(undefined)
    setTime(null)
    setClientAddress('')
    setBookingSuccess(false)
    setDynamicBusySlots(null)
  }

  async function handleGoogleAuth() {
    setLoading(true)
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
    if (error) {
      showToast(error.message, 'error')
      setLoading(false)
    }
  }

  // Barra de progreso dinámica refinada
  const progressBar = mode ? (
    <div className="mb-7 md:mb-9">
      {/* Track + steps */}
      <div className="flex items-start justify-center gap-0">
        {progressSteps.map((stepName, idx) => {
          const isCompleted = idx < currentStepIndex
          const isCurrent = idx === currentStepIndex
          const isUpcoming = idx > currentStepIndex
          const isLast = idx === progressSteps.length - 1

          return (
            <div key={stepName} className="flex items-start">
              {/* Step node */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border transition-all duration-300 shrink-0',
                    isCompleted
                      ? 'border-amber-500/60 bg-amber-500 text-slate-950'
                      : isCurrent
                        ? 'border-amber-500 bg-slate-950 text-amber-400 shadow-md shadow-amber-500/20'
                        : 'border-slate-800 bg-slate-900 text-slate-700'
                  )}
                >
                  {isCompleted ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      aria-hidden
                    >
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span
                      className={cn(
                        'text-[10px] font-bold tabular-nums',
                        isCurrent ? 'text-amber-400' : 'text-slate-700'
                      )}
                    >
                      {idx + 1}
                    </span>
                  )}
                </div>
                <span
                  className={cn(
                    'text-[8px] md:text-[9px] font-medium uppercase tracking-wide whitespace-nowrap transition-colors duration-200',
                    isCompleted
                      ? 'text-amber-500/70'
                      : isCurrent
                        ? 'text-amber-400'
                        : 'text-slate-700'
                  )}
                >
                  {STEP_LABELS[stepName]}
                </span>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div className="mt-3.5 mx-1 h-px w-5 md:w-8 shrink-0 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={cn(
                      'h-full bg-amber-500 transition-all duration-500',
                      isCompleted ? 'w-full' : 'w-0'
                    )}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  ) : null

  return (
    <>
      {ToastComponent}
      <section
        id="agenda"
        className="rounded-2xl md:rounded-3xl bg-slate-950/70 p-4 md:p-8 shadow-2xl shadow-black/40 ring-1 ring-slate-900"
      >
        <header className="mb-6 md:mb-8">
          <p className="text-xs md:text-sm uppercase tracking-[0.2em] md:tracking-[0.3em] text-amber-500">
            Sistema de Agenda para clientes
          </p>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-100">
            Reserva el próximo corte a tu manera
          </h2>
        </header>

        {progressBar}

        {/* Step: Selección de Modo */}
        {currentStep === 'mode' && (
          <ModeSelectionStep onSelect={handleModeSelect} />
        )}

        {/* Step: Ubicación / Mapa */}
        {currentStep === 'location' && (
          <LocationMapStep
            barbers={barbers}
            onSelect={handleBarberSelect}
            onBack={goBack}
          />
        )}

        {/* Step: Buscar Barbero (modo conocido) */}
        {currentStep === 'barber' && (
          <BarberSearchStep
            barbers={barbers}
            onSelect={handleBarberSelect}
            onBack={goBack}
          />
        )}

        {/* Step: Seleccionar Servicio */}
        {currentStep === 'service' && (
          <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  type="button"
                  onClick={goBack}
                  className="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2"
                >
                  <span>←</span> Volver
                </button>
                <h3 className="mt-4 text-lg md:text-xl font-semibold text-slate-200">
                  Selecciona un servicio
                </h3>
                {mode === 'domicilio' && (
                  <p className="mt-1 text-xs text-amber-400/80">
                    Servicio a domicilio — ingresarás tu dirección al confirmar
                  </p>
                )}
              </div>
            </div>
            <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {services.map(service => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => handleServiceSelect(service)}
                  className="group rounded-xl md:rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:p-6 text-left transition-all duration-300 hover:border-amber-500 hover:bg-slate-900 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20"
                >
                  <div className="mb-2 md:mb-3 flex items-center justify-between">
                    <h4 className="text-base md:text-lg font-semibold text-slate-100 group-hover:text-amber-400 transition-colors">
                      {service.name}
                    </h4>
                    <span className="text-base md:text-xl font-bold text-amber-400">
                      {formatCOP(service.price)}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-400">
                    {service.duration_minutes} minutos
                  </p>
                  <div className="mt-3 md:mt-4 flex items-center gap-2 text-xs uppercase tracking-wide text-amber-500 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
                    Seleccionar <span className="text-lg">→</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Seleccionar Fecha */}
        {currentStep === 'date' && selectedService && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  type="button"
                  onClick={goBack}
                  className="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2"
                >
                  <span>←</span> Volver
                </button>
                <h3 className="mt-4 text-xl font-semibold text-slate-200">
                  Selecciona una fecha
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Servicio:{' '}
                  <span className="text-amber-400 font-medium">
                    {selectedService.name}
                  </span>
                  {selectedBarber && (
                    <>
                      {' '}
                      · Barbero:{' '}
                      <span className="text-amber-400 font-medium">
                        {selectedBarber.name}
                      </span>
                    </>
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

        {/* Step: Seleccionar Horario */}
        {currentStep === 'time' && selectedService && date && (
          <div className="space-y-6">
            <div>
              <button
                type="button"
                onClick={goBack}
                className="text-sm text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-2"
              >
                <span>←</span> Volver a calendario
              </button>
              <h3 className="mt-4 text-xl font-semibold text-slate-200">
                Selecciona un horario
              </h3>
              <p className="mt-1 text-sm text-slate-400 capitalize">
                {format(date, "EEEE, d 'de' MMMM", { locale: es })}
              </p>
            </div>

            {timeSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7">
                {timeSlots.map(slot => (
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
                <p className="text-slate-400">
                  No hay horarios disponibles para este día.
                </p>
                <button
                  type="button"
                  onClick={goBack}
                  className="mt-4 text-sm text-amber-400 hover:text-amber-300 underline underline-offset-4"
                >
                  Seleccionar otra fecha
                </button>
              </div>
            )}
          </div>
        )}

        {/* Resumen lateral — solo cuando hay algo seleccionado más allá del modo */}
        {mode &&
          currentStep !== 'mode' &&
          (selectedBarber || selectedService || date || time) && (
            <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 animate-fade-in">
              <h4 className="mb-4 text-lg font-semibold text-slate-200">
                Resumen de tu reserva
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Modo:</span>
                  <strong className="text-slate-100 capitalize">
                    {mode === 'presencial'
                      ? 'Ir a la barbería'
                      : mode === 'conocido'
                        ? 'Mi barbero'
                        : 'A domicilio'}
                  </strong>
                </div>
                {selectedBarber && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Barbero:</span>
                    <strong className="text-slate-100">
                      {selectedBarber.name}
                    </strong>
                  </div>
                )}
                {mode === 'domicilio' && (
                  <div className="flex items-center justify-between text-slate-300">
                    <span>Barbero:</span>
                    <strong className="text-slate-100 text-sm">
                      Asignado al confirmar
                    </strong>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-300">
                  <span>Servicio:</span>
                  <strong className="text-slate-100">
                    {selectedService ? selectedService.name : '—'}
                  </strong>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Fecha:</span>
                  <strong className="text-slate-100 capitalize">
                    {date
                      ? format(date, 'EEEE, dd MMM yyyy', { locale: es })
                      : '—'}
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
                    <strong className="text-slate-100">
                      {format(endTime, 'HH:mm')}
                    </strong>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
                  <span className="text-lg font-semibold text-slate-200">
                    Total:
                  </span>
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
            setShowConfirmModal(false)
            if (bookingSuccess) resetForm()
          }
        }}
        title={
          bookingSuccess
            ? '¡Reserva Exitosa!'
            : !profileLoading && !userId
              ? 'Inicia sesión para reservar'
              : 'Confirmar Reserva'
        }
        size="md"
        footer={
          bookingSuccess ? (
            <Button
              onClick={() => {
                setShowConfirmModal(false)
                resetForm()
              }}
              className="w-full bg-slate-800 text-slate-200 hover:bg-slate-700"
            >
              Cerrar
            </Button>
          ) : !profileLoading && !userId ? (
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              className="w-full border-slate-700 text-slate-400 hover:bg-slate-800"
            >
              Volver
            </Button>
          ) : (
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
          )
        }
      >
        {/* Sin sesión → pantalla de login/registro */}
        {!profileLoading && !userId && !bookingSuccess ? (
          <div className="space-y-5 py-2">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
                <User className="h-6 w-6 text-amber-400" />
              </div>
              <h3 className="font-semibold text-slate-100 text-lg">
                Necesitas una cuenta
              </h3>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">
                Para completar tu reserva, inicia sesión o crea una cuenta
                gratuita como cliente.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-slate-200 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? 'Redirigiendo...' : 'Continuar con Google'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-slate-900 px-3 text-slate-500">
                  o con email
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Link
                href="/login"
                className="flex items-center justify-center rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 hover:border-amber-500/50 hover:text-amber-400 transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro?tipo=cliente"
                className="flex items-center justify-center rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition-colors"
              >
                Crear cuenta
              </Link>
            </div>

            <p className="text-center text-xs text-slate-600">
              Tu reserva es gratuita · Sin tarjeta de crédito
            </p>
          </div>
        ) : bookingSuccess ? (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">🎉</span>
            </div>
            <h3 className="text-xl font-bold text-slate-100">
              ¡Tu cita ha sido solicitada!
            </h3>
            <p className="text-slate-400">
              {acceptTelegram && isTelegramLinked
                ? 'Hemos enviado los detalles a tu Telegram.'
                : acceptTelegram
                  ? 'Para recibir la confirmación inmediata, activa las notificaciones abajo.'
                  : 'Hemos registrado tu cita. Te contactaremos pronto.'}
            </p>
            {acceptTelegram &&
              (isTelegramLinked ? (
                <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
                  <p className="text-amber-400 font-medium mb-2">
                    ✅ ¡Notificación Enviada!
                  </p>
                  <p className="text-slate-400 text-sm">
                    Revisa tu Telegram, te hemos enviado todos los detalles.
                  </p>
                </div>
              ) : (
                <ConnectTelegramButton
                  userId={userId || undefined}
                  phone={clientData.phone}
                  botUsername={
                    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
                    'barberkings_bot'
                  }
                />
              ))}
          </div>
        ) : (
          selectedService &&
          time && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 space-y-2">
                {selectedBarber && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Barbero:</span>
                    <span className="font-semibold text-slate-100">
                      {selectedBarber.name}
                    </span>
                  </div>
                )}
                {mode === 'domicilio' && !selectedBarber && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Barbero:</span>
                    <span className="text-slate-500 text-sm">
                      Asignado automáticamente
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Servicio:</span>
                  <span className="font-semibold text-slate-100">
                    {selectedService.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fecha y hora:</span>
                  <span className="font-semibold text-slate-100 capitalize">
                    {format(new Date(time), "EEEE, dd MMM yyyy 'a las' HH:mm", {
                      locale: es,
                    })}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-2 mt-2">
                  <span className="text-slate-400">Total:</span>
                  <span className="text-xl font-bold text-amber-400">
                    {formatCOP(selectedService.price)}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-slate-300 uppercase tracking-wide">
                  Tus Datos de Contacto
                </h4>

                {profileLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <label
                        htmlFor="fullName"
                        className="text-sm text-slate-400"
                      >
                        Nombre Completo
                      </label>
                      <input
                        id="fullName"
                        type="text"
                        value={clientData.fullName}
                        onChange={e =>
                          setClientData({
                            ...clientData,
                            fullName: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-base text-slate-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        placeholder="Tu nombre completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm text-slate-400">
                        Teléfono / WhatsApp / Telegram
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={clientData.phone}
                        onChange={e =>
                          setClientData({
                            ...clientData,
                            phone: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-base text-slate-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                        placeholder="+57 300 123 4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm text-slate-400">
                        Email (registrado)
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={clientData.email}
                        disabled
                        className="w-full rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-base text-slate-500 cursor-not-allowed"
                      />
                    </div>

                    {/* Campo de dirección — solo para domicilio */}
                    {mode === 'domicilio' && (
                      <div className="space-y-2">
                        <label
                          htmlFor="clientAddress"
                          className="text-sm text-slate-400"
                        >
                          Dirección de servicio{' '}
                          <span className="text-rose-400">*</span>
                        </label>
                        <input
                          id="clientAddress"
                          type="text"
                          value={clientAddress}
                          onChange={e => setClientAddress(e.target.value)}
                          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-base text-slate-100 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                          placeholder="Calle 5 #28-40, Apto 302, Cali"
                        />
                        <p className="text-xs text-slate-500">
                          Incluye número de apto o indicaciones si aplica
                        </p>
                      </div>
                    )}

                    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
                      <div className="flex h-5 items-center">
                        <input
                          id="telegram-consent"
                          type="checkbox"
                          checked={acceptTelegram}
                          onChange={e => setAcceptTelegram(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950"
                        />
                      </div>
                      <div className="text-sm">
                        <label
                          htmlFor="telegram-consent"
                          className="font-medium text-slate-200 block"
                        >
                          Recibir confirmación inmediata por Telegram
                        </label>
                        <p className="text-slate-400 text-xs">
                          Te enviaremos los detalles y recordatorios
                          directamente a tu chat.
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
  )
}
