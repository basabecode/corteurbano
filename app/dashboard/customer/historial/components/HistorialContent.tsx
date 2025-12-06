'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, ArrowLeft, Archive, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatCOP } from '@/lib/format-currency';

type ArchivedAppointment = {
    id: string;
    start_time: string;
    status: 'completed' | 'cancelled';
    service_name: string;
    service_price: number;
    service_duration_minutes: number;
    archived_at: string;
    cancellation_reason?: string | null;
};

type Props = {
    archivedAppointments: ArchivedAppointment[];
    userEmail: string;
    userName: string;
};

const statusConfig = {
    completed: { label: 'Completada', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
    cancelled: { label: 'Cancelada', color: 'text-rose-400 bg-rose-400/10 border-rose-400/30' }
};

export function HistorialContent({ archivedAppointments, userEmail, userName }: Props) {
    const router = useRouter();

    // Agrupar por mes
    const groupedByMonth = archivedAppointments.reduce((acc, apt) => {
        const monthKey = format(new Date(apt.start_time), 'MMMM yyyy', { locale: es });
        if (!acc[monthKey]) {
            acc[monthKey] = [];
        }
        acc[monthKey].push(apt);
        return acc;
    }, {} as Record<string, ArchivedAppointment[]>);

    const months = Object.keys(groupedByMonth);

    return (
        <>
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="rounded-lg bg-amber-500/10 p-2">
                            <History className="h-6 w-6 text-amber-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-100">Historial de Citas</h1>
                    </div>
                    <p className="text-slate-400">Consulta tus cortes anteriores</p>
                </div>
                <Button
                    onClick={() => router.push('/dashboard/customer')}
                    variant="outline"
                    className="border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al Dashboard
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-amber-500/10 p-3">
                            <Archive className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Total Archivadas</p>
                            <p className="text-2xl font-bold text-slate-100">{archivedAppointments.length}</p>
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
                                {archivedAppointments.filter(a => a.status === 'completed').length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-rose-500/10 p-3">
                            <Calendar className="h-5 w-5 text-rose-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Canceladas</p>
                            <p className="text-2xl font-bold text-slate-100">
                                {archivedAppointments.filter(a => a.status === 'cancelled').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Historial agrupado por mes */}
            {months.length > 0 ? (
                <div className="space-y-8">
                    {months.map((monthKey) => (
                        <div key={monthKey}>
                            <h2 className="text-xl font-semibold text-slate-100 mb-4 capitalize flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-amber-400" />
                                {monthKey}
                            </h2>
                            <div className="space-y-3">
                                {groupedByMonth[monthKey].map((appointment) => (
                                    <HistorialCard key={appointment.id} appointment={appointment} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 rounded-xl border border-slate-800 bg-slate-900/40">
                    <Archive className="h-16 w-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-300 mb-2">No hay citas archivadas</h3>
                    <p className="text-slate-400 mb-6">
                        Cuando archives citas completadas, aparecerán aquí para que puedas consultar tu historial.
                    </p>
                    <Button
                        onClick={() => router.push('/dashboard/customer')}
                        className="bg-amber-500 text-slate-950 hover:bg-amber-400"
                    >
                        Ir al Dashboard
                    </Button>
                </div>
            )}
        </>
    );
}

function HistorialCard({ appointment }: { appointment: ArchivedAppointment }) {
    return (
        <article className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 hover:border-slate-700 transition-colors">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-100">
                            {appointment.service_name}
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
                                {format(new Date(appointment.start_time), "EEEE, dd 'de' MMMM yyyy", { locale: es })}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{format(new Date(appointment.start_time), 'HH:mm')}</span>
                        </div>
                    </div>
                    {appointment.cancellation_reason && (
                        <div className="mt-2 text-sm text-slate-500">
                            <span className="font-medium">Motivo: </span>
                            {appointment.cancellation_reason}
                        </div>
                    )}
                    <div className="mt-2 text-xs text-slate-500">
                        Archivada el {format(new Date(appointment.archived_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-amber-400">
                        {formatCOP(appointment.service_price)}
                    </div>
                    <div className="text-sm text-slate-500">
                        {appointment.service_duration_minutes} min
                    </div>
                </div>
            </div>
        </article>
    );
}
