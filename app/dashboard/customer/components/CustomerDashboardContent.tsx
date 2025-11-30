'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, Home, Plus, X, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';

type Appointment = {
    id: string;
    start_time: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    service: {
        id: string;
        name: string;
        price: number;
        duration_minutes: number;
    } | null;
};

type Props = {
    appointments: Appointment[];
    userEmail: string;
    userName: string;
};

const statusConfig = {
    pending: { label: 'Pendiente', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
    confirmed: { label: 'Confirmada', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
    completed: { label: 'Completada', color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' },
    cancelled: { label: 'Cancelada', color: 'text-rose-400 bg-rose-400/10 border-rose-400/30' }
};

const CANCELLATION_REASONS = [
    'Tengo un compromiso urgente',
    'Problemas de salud',
    'Cambio de planes',
    'No puedo asistir a esa hora',
    'Prefiero otro día',
    'Otro motivo'
];

export function CustomerDashboardContent({ appointments, userEmail, userName }: Props) {
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cancellationReason, setCancellationReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const { showToast, ToastComponent } = useToast();
    const router = useRouter();

    const upcomingAppointments = appointments.filter(
        a => a.status !== 'cancelled' && a.status !== 'completed' && new Date(a.start_time) > new Date()
    );
    const pastAppointments = appointments.filter(
        a => a.status === 'completed' || new Date(a.start_time) <= new Date()
    );

    async function handleCancelAppointment() {
        if (!selectedAppointment) return;

        // Validar que haya seleccionado un motivo
        const finalReason = cancellationReason === 'Otro motivo' ? customReason : cancellationReason;
        if (!finalReason.trim()) {
            showToast('Por favor selecciona o escribe un motivo', 'error');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/appointments/update-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    appointmentId: selectedAppointment.id,
                    status: 'cancelled',
                    cancellationReason: finalReason
                })
            });

            if (!response.ok) throw new Error('Error al cancelar la cita');

            showToast('Cita cancelada exitosamente', 'success');
            setShowCancelModal(false);
            setCancellationReason('');
            setCustomReason('');
            router.refresh();
        } catch (error) {
            showToast('Error al cancelar la cita', 'error');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            {ToastComponent}
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-100">Mis Citas</h1>
                        <p className="text-slate-400 mt-1">Bienvenido, {userName || userEmail}</p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={() => router.push('/')}
                            variant="outline"
                            className="border-slate-700 text-slate-200 hover:bg-slate-800"
                        >
                            <Home className="h-4 w-4 mr-2" />
                            Inicio
                        </Button>
                        <Button
                            onClick={() => router.push('/#agenda')}
                            className="bg-amber-500 text-slate-950 hover:bg-amber-400"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nueva Cita
                        </Button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-amber-500/10 p-3">
                                <Calendar className="h-5 w-5 text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Próximas</p>
                                <p className="text-2xl font-bold text-slate-100">{upcomingAppointments.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-emerald-500/10 p-3">
                                <Clock className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Completadas</p>
                                <p className="text-2xl font-bold text-slate-100">
                                    {appointments.filter(a => a.status === 'completed').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-slate-500/10 p-3">
                                <Calendar className="h-5 w-5 text-slate-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Total</p>
                                <p className="text-2xl font-bold text-slate-100">{appointments.length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Appointments */}
                {upcomingAppointments.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold text-slate-100 mb-4">Próximas Citas</h2>
                        <div className="space-y-3">
                            {upcomingAppointments.map((appointment) => (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    onCancel={() => {
                                        setSelectedAppointment(appointment);
                                        setShowCancelModal(true);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Past Appointments */}
                {pastAppointments.length > 0 && (
                    <div>
                        <h2 className="text-xl font-semibold text-slate-100 mb-4">Historial</h2>
                        <div className="space-y-3">
                            {pastAppointments.map((appointment) => (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    isPast
                                />
                            ))}
                        </div>
                    </div>
                )}

                {appointments.length === 0 && (
                    <div className="text-center py-12 rounded-xl border border-slate-800 bg-slate-900/40">
                        <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 mb-4">No tienes citas agendadas</p>
                        <Button
                            onClick={() => router.push('/#agenda')}
                            className="bg-amber-500 text-slate-950 hover:bg-amber-400"
                        >
                            Agendar mi primera cita
                        </Button>
                    </div>
                )}
            </div>

            {/* Cancel Modal */}
            <Modal
                isOpen={showCancelModal}
                onClose={() => {
                    if (!loading) {
                        setShowCancelModal(false);
                        setCancellationReason('');
                        setCustomReason('');
                    }
                }}
                title="Cancelar Cita"
                size="md"
                footer={
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowCancelModal(false);
                                setCancellationReason('');
                                setCustomReason('');
                            }}
                            disabled={loading}
                            className="flex-1 border-slate-700 text-slate-200 hover:bg-slate-800"
                        >
                            No, mantener
                        </Button>
                        <Button
                            onClick={handleCancelAppointment}
                            disabled={loading || !cancellationReason}
                            className="flex-1 bg-rose-500 text-white hover:bg-rose-600"
                        >
                            {loading ? 'Cancelando...' : 'Sí, cancelar'}
                        </Button>
                    </div>
                }
            >
                {selectedAppointment && (
                    <div className="space-y-5">
                        <p className="text-slate-300">
                            ¿Estás seguro de que deseas cancelar esta cita?
                        </p>

                        <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Servicio:</span>
                                <span className="font-semibold text-slate-100">
                                    {selectedAppointment.service?.name}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Fecha:</span>
                                <span className="font-semibold text-slate-100 capitalize">
                                    {format(new Date(selectedAppointment.start_time), "EEEE, dd MMM yyyy 'a las' HH:mm", { locale: es })}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium text-slate-300">
                                Motivo de cancelación <span className="text-rose-400">*</span>
                            </label>
                            <div className="space-y-2">
                                {CANCELLATION_REASONS.map((reason) => (
                                    <label
                                        key={reason}
                                        className={cn(
                                            'flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors',
                                            cancellationReason === reason
                                                ? 'border-amber-500 bg-amber-500/10'
                                                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="cancellation_reason"
                                            value={reason}
                                            checked={cancellationReason === reason}
                                            onChange={(e) => setCancellationReason(e.target.value)}
                                            className="h-4 w-4 text-amber-500 focus:ring-amber-500"
                                        />
                                        <span className="text-sm text-slate-200">{reason}</span>
                                    </label>
                                ))}
                            </div>

                            {cancellationReason === 'Otro motivo' && (
                                <div className="mt-3 animate-fade-in">
                                    <textarea
                                        value={customReason}
                                        onChange={(e) => setCustomReason(e.target.value)}
                                        placeholder="Escribe tu motivo aquí..."
                                        rows={3}
                                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                                    />
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-slate-500">
                            Esta acción no se puede deshacer. El motivo será registrado y podrás agendar una nueva cita cuando lo desees.
                        </p>
                    </div>
                )}
            </Modal>
        </>
    );
}

function AppointmentCard({
    appointment,
    onCancel,
    isPast = false
}: {
    appointment: Appointment;
    onCancel?: () => void;
    isPast?: boolean;
}) {
    const canCancel = !isPast && appointment.status !== 'cancelled' && appointment.status !== 'completed';

    return (
        <article className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 hover:border-slate-700 transition-colors">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-100">
                            {appointment.service?.name || 'Servicio'}
                        </h3>
                        <span className={cn(
                            'rounded-full border px-3 py-0.5 text-xs uppercase tracking-wide font-medium',
                            statusConfig[appointment.status].color
                        )}>
                            {statusConfig[appointment.status].label}
                        </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span className="capitalize">
                                {format(new Date(appointment.start_time), "EEEE, dd 'de' MMMM", { locale: es })}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{format(new Date(appointment.start_time), 'HH:mm')}</span>
                        </div>
                        {appointment.service && (
                            <span className="text-amber-400 font-medium">
                                ${appointment.service.price.toFixed(2)}
                            </span>
                        )}
                    </div>
                </div>
                {canCancel && onCancel && (
                    <Button
                        onClick={onCancel}
                        variant="outline"
                        size="sm"
                        className="border-rose-700 text-rose-400 hover:bg-rose-900/20"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                    </Button>
                )}
            </div>
        </article>
    );
}
