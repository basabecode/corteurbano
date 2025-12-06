'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, Home, Plus, X, Trash2, CheckSquare, Square, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatCOP } from '@/lib/format-currency';

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

    // Estados para Archivar (Completadas)
    const [showArchiveModal, setShowArchiveModal] = useState(false);
    const [selectedCompletedAppointments, setSelectedCompletedAppointments] = useState<Set<string>>(new Set());
    const [archiveLoading, setArchiveLoading] = useState(false);

    // Estados para Eliminar (Canceladas)
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedCancelledAppointments, setSelectedCancelledAppointments] = useState<Set<string>>(new Set());
    const [deleteLoading, setDeleteLoading] = useState(false);

    const [loading, setLoading] = useState(false);
    const [cancellationReason, setCancellationReason] = useState('');
    const [customReason, setCustomReason] = useState('');

    const { showToast, ToastComponent } = useToast();
    const router = useRouter();

    // Actualización en tiempo real
    useEffect(() => {
        const supabase = createSupabaseBrowserClient();

        const channel = supabase
            .channel('customer-appointments-changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Escuchar INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'appointments'
                },
                (payload) => {
                    console.log('Cambio detectado en citas:', payload);
                    router.refresh(); // Recargar datos del servidor
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [router]);

    const upcomingAppointments = appointments.filter(
        a => a.status !== 'cancelled' && a.status !== 'completed' && new Date(a.start_time) > new Date()
    );

    const completedAppointments = appointments.filter(a => a.status === 'completed');
    const cancelledAppointments = appointments.filter(a => a.status === 'cancelled');

    // Funciones para Completadas (Archivar)
    function toggleCompletedAppointmentSelection(id: string) {
        setSelectedCompletedAppointments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }

    function toggleSelectAllCompleted() {
        if (selectedCompletedAppointments.size === completedAppointments.length) {
            setSelectedCompletedAppointments(new Set());
        } else {
            setSelectedCompletedAppointments(new Set(completedAppointments.map(apt => apt.id)));
        }
    }

    async function handleArchive() {
        if (selectedCompletedAppointments.size === 0) {
            showToast('Selecciona al menos una cita para archivar', 'error');
            return;
        }

        setArchiveLoading(true);
        try {
            const appointmentIds = Array.from(selectedCompletedAppointments);
            const response = await fetch('/api/appointments/archive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointmentIds })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al archivar las citas');
            }

            const result = await response.json();
            showToast(result.message || 'Citas archivadas exitosamente', 'success');
            setSelectedCompletedAppointments(new Set());
            router.refresh();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Error al archivar las citas', 'error');
        } finally {
            setArchiveLoading(false);
        }
    }

    // Funciones para Canceladas (Eliminar)
    function toggleCancelledAppointmentSelection(id: string) {
        setSelectedCancelledAppointments(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    }

    function toggleSelectAllCancelled() {
        if (selectedCancelledAppointments.size === cancelledAppointments.length) {
            setSelectedCancelledAppointments(new Set());
        } else {
            setSelectedCancelledAppointments(new Set(cancelledAppointments.map(apt => apt.id)));
        }
    }

    async function handleDelete() {
        if (selectedCancelledAppointments.size === 0) {
            showToast('Selecciona al menos una cita para eliminar', 'error');
            return;
        }

        setDeleteLoading(true);
        try {
            const appointmentIds = Array.from(selectedCancelledAppointments);
            const response = await fetch('/api/appointments/delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ appointmentIds })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al eliminar las citas');
            }

            const result = await response.json();
            showToast(result.message || 'Citas eliminadas exitosamente', 'success');
            setShowDeleteModal(false);
            setSelectedCancelledAppointments(new Set());
            router.refresh();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Error al eliminar las citas', 'error');
        } finally {
            setDeleteLoading(false);
        }
    }

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
                    <div className="flex flex-wrap gap-2">
                        <Button
                            onClick={() => router.push('/')}
                            variant="outline"
                            size="sm"
                            className="border-slate-700 text-slate-200 hover:bg-slate-800"
                        >
                            <Home className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Inicio</span>
                        </Button>
                        <Button
                            onClick={() => router.push('/dashboard/customer/historial')}
                            variant="outline"
                            size="sm"
                            className="border-amber-700 text-amber-400 hover:bg-amber-900/20"
                        >
                            <History className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Historial</span>
                        </Button>
                        <Button
                            onClick={() => router.push('/#agenda')}
                            size="sm"
                            className="bg-amber-500 text-slate-950 hover:bg-amber-400"
                        >
                            <Plus className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Nueva Cita</span>
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

                {/* Completed Appointments */}
                {completedAppointments.length > 0 && (
                    <div>
                        <div className="flex flex-col gap-3 mb-4">
                            <h2 className="text-xl font-semibold text-slate-100">Citas Completadas</h2>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    onClick={toggleSelectAllCompleted}
                                    variant="outline"
                                    size="default"
                                    className="border-slate-700 text-slate-300 hover:bg-slate-800 w-full sm:w-auto"
                                >
                                    {selectedCompletedAppointments.size === completedAppointments.length && completedAppointments.length > 0 ? (
                                        <><CheckSquare className="h-5 w-5 mr-2" /> Deseleccionar todas</>
                                    ) : (
                                        <><Square className="h-5 w-5 mr-2" /> Seleccionar todas</>
                                    )}
                                </Button>
                                <Button
                                    onClick={handleArchive}
                                    variant="outline"
                                    size="default"
                                    disabled={selectedCompletedAppointments.size === 0 || archiveLoading}
                                    className="border-blue-700 text-blue-400 hover:bg-blue-900/20 disabled:opacity-50 w-full sm:w-auto"
                                >
                                    <Trash2 className="h-5 w-5 mr-2" />
                                    {archiveLoading ? 'Archivando...' : `Archivar (${selectedCompletedAppointments.size})`}
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {completedAppointments.map((appointment) => (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    isPast
                                    isSelected={selectedCompletedAppointments.has(appointment.id)}
                                    onToggleSelection={() => toggleCompletedAppointmentSelection(appointment.id)}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Cancelled Appointments */}
                {cancelledAppointments.length > 0 && (
                    <div>
                        <div className="flex flex-col gap-3 mb-4">
                            <h2 className="text-xl font-semibold text-slate-100">Citas Canceladas</h2>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <Button
                                    onClick={toggleSelectAllCancelled}
                                    variant="outline"
                                    size="default"
                                    className="border-slate-700 text-slate-300 hover:bg-slate-800 w-full sm:w-auto"
                                >
                                    {selectedCancelledAppointments.size === cancelledAppointments.length && cancelledAppointments.length > 0 ? (
                                        <><CheckSquare className="h-5 w-5 mr-2" /> Deseleccionar todas</>
                                    ) : (
                                        <><Square className="h-5 w-5 mr-2" /> Seleccionar todas</>
                                    )}
                                </Button>
                                <Button
                                    onClick={() => setShowDeleteModal(true)}
                                    variant="outline"
                                    size="default"
                                    disabled={selectedCancelledAppointments.size === 0}
                                    className="border-rose-700 text-rose-400 hover:bg-rose-900/20 disabled:opacity-50 w-full sm:w-auto"
                                >
                                    <Trash2 className="h-5 w-5 mr-2" />
                                    Eliminar ({selectedCancelledAppointments.size})
                                </Button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {cancelledAppointments.map((appointment) => (
                                <AppointmentCard
                                    key={appointment.id}
                                    appointment={appointment}
                                    isPast
                                    isSelected={selectedCancelledAppointments.has(appointment.id)}
                                    onToggleSelection={() => toggleCancelledAppointmentSelection(appointment.id)}
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

            {/* Archive Modal */}
            <Modal
                isOpen={showArchiveModal}
                onClose={() => setShowArchiveModal(false)}
                title="Archivar citas completadas"
            >
                <p className="text-slate-300">
                    ¿Estás seguro de que deseas archivar {selectedCompletedAppointments.size} cita(s) completada(s)?
                </p>
                <p className="text-sm text-slate-400 mt-2">
                    Las citas archivadas se moverán al historial y no aparecerán en esta lista, pero se conservarán para estadísticas.
                </p>
                <div className="flex gap-2 mt-4">
                    <Button onClick={() => setShowArchiveModal(false)} variant="outline" className="flex-1 border-slate-700 text-slate-200 hover:bg-slate-800">
                        Cancelar
                    </Button>
                    <Button onClick={handleArchive} disabled={archiveLoading} className="flex-1 bg-blue-600 text-white hover:bg-blue-700">
                        {archiveLoading ? 'Archivando...' : 'Archivar'}
                    </Button>
                </div>
            </Modal>

            {/* Delete Modal */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Eliminar citas canceladas"
            >
                <p className="text-slate-300">
                    ¿Estás seguro de que deseas eliminar {selectedCancelledAppointments.size} cita(s) cancelada(s)?
                </p>
                <div className="rounded-lg border border-rose-900/50 bg-rose-900/20 p-4 mt-4">
                    <p className="text-sm text-rose-200">
                        ⚠️ <strong>Advertencia:</strong> Esta acción no se puede deshacer. Las citas serán eliminadas permanentemente.
                    </p>
                </div>
                <div className="flex gap-2 mt-4">
                    <Button onClick={() => setShowDeleteModal(false)} variant="outline" className="flex-1 border-slate-700 text-slate-200 hover:bg-slate-800">
                        Cancelar
                    </Button>
                    <Button onClick={handleDelete} disabled={deleteLoading} className="flex-1 bg-rose-600 text-white hover:bg-rose-700">
                        {deleteLoading ? 'Eliminando...' : 'Eliminar'}
                    </Button>
                </div>
            </Modal>
        </>
    );
}

function AppointmentCard({
    appointment,
    onCancel,
    isPast = false,
    isSelected = false,
    onToggleSelection
}: {
    appointment: Appointment;
    onCancel?: () => void;
    isPast?: boolean;
    isSelected?: boolean;
    onToggleSelection?: () => void;
}) {
    const canCancel = !isPast && appointment.status !== 'cancelled' && appointment.status !== 'completed';

    return (
        <article className={cn(
            "rounded-xl border p-5 transition-colors",
            isSelected
                ? "border-amber-500/50 bg-amber-500/5"
                : "border-slate-800 bg-slate-900/40 hover:border-slate-700"
        )}>
            <div className="flex items-start gap-4">
                {isPast && onToggleSelection && (
                    <div className="pt-1">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={onToggleSelection}
                            className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950 cursor-pointer"
                        />
                    </div>
                )}

                <div className="flex-1">
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
                                {appointment.service && !isPast && (
                                    <span className="text-amber-400 font-medium">
                                        {formatCOP(appointment.service.price)}
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
                </div>
            </div>
        </article>
    );
}
