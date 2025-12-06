'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowLeft, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { formatCOP } from '@/lib/format-currency';

type ArchivedAppointment = {
    id: string;
    original_appointment_id: string;
    client_id: string;
    service_id: string;
    start_time: string;
    status: 'completed' | 'cancelled';
    cancellation_reason?: string;
    archived_at: string;
    service_name: string;
    service_price: number;
    service_duration_minutes: number;
    client_name?: string;
    client_phone?: string;
    client_email?: string;
};

type ActiveCompletedAppointment = {
    id: string;
    start_time: string;
    services: {
        name: string;
        price: number;
        duration_minutes: number;
    }[];
};

type Props = {
    appointments: ArchivedAppointment[];
    activeCompleted: ActiveCompletedAppointment[];
};

export function HistorialAdminContent({ appointments, activeCompleted }: Props) {
    const router = useRouter();
    const [selectedMonth, setSelectedMonth] = useState<string>('all');

    // Agrupar por mes
    const appointmentsByMonth = useMemo(() => {
        const grouped: Record<string, ArchivedAppointment[]> = {};

        appointments.forEach(apt => {
            const date = new Date(apt.start_time);
            const monthKey = format(date, 'yyyy-MM');
            if (!grouped[monthKey]) {
                grouped[monthKey] = [];
            }
            grouped[monthKey].push(apt);
        });

        return Object.entries(grouped)
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([month, apps]) => ({
                month,
                label: format(new Date(month + '-01'), 'MMMM yyyy', { locale: es }),
                appointments: apps
            }));
    }, [appointments]);

    // Filtrar por mes seleccionado
    const filteredGroups = useMemo(() => {
        if (selectedMonth === 'all') return appointmentsByMonth;
        return appointmentsByMonth.filter(g => g.month === selectedMonth);
    }, [appointmentsByMonth, selectedMonth]);

    // Calcular estadísticas COMBINANDO archivadas + activas
    const stats = useMemo(() => {
        const archivedCompleted = appointments.filter(a => a.status === 'completed');
        const archivedCancelled = appointments.filter(a => a.status === 'cancelled');

        // Ingresos de archivadas completadas
        const archivedRevenue = archivedCompleted.reduce((sum, a) => sum + Number(a.service_price), 0);

        // Ingresos de activas completadas (NO archivadas)
        const activeRevenue = activeCompleted.reduce((sum, a) => {
            const service = Array.isArray(a.services) ? a.services[0] : a.services;
            return sum + Number(service?.price || 0);
        }, 0);

        return {
            total: appointments.length,
            completed: archivedCompleted.length + activeCompleted.length, // Suma ambas
            cancelled: archivedCancelled.length,
            revenue: archivedRevenue + activeRevenue // Total ingresos
        };
    }, [appointments, activeCompleted]);

    // Estadísticas por mes
    const monthlyStats = useMemo(() => {
        if (selectedMonth === 'all') return null;

        const monthData = appointmentsByMonth.find(g => g.month === selectedMonth);
        if (!monthData) return null;

        const archivedCompleted = monthData.appointments.filter(a => a.status === 'completed');
        const archivedRevenue = archivedCompleted.reduce((sum, a) => sum + Number(a.service_price), 0);

        // Filtrar activas completadas del mismo mes
        const activeInMonth = activeCompleted.filter(a => {
            const date = new Date(a.start_time);
            const monthKey = format(date, 'yyyy-MM');
            return monthKey === selectedMonth;
        });

        const activeRevenue = activeInMonth.reduce((sum, a) => {
            const service = Array.isArray(a.services) ? a.services[0] : a.services;
            return sum + Number(service?.price || 0);
        }, 0);

        return {
            completed: archivedCompleted.length + activeInMonth.length,
            cancelled: monthData.appointments.length - archivedCompleted.length,
            revenue: archivedRevenue + activeRevenue
        };
    }, [selectedMonth, appointmentsByMonth, activeCompleted]);

    const statusConfig = {
        completed: { label: 'Completada', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
        cancelled: { label: 'Cancelada', color: 'text-rose-400 bg-rose-400/10 border-rose-400/30' }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-100">Historial de Citas</h1>
                    <p className="text-slate-400 mt-1">Consulta estadísticas e ingresos mensuales</p>
                </div>
                <Button
                    onClick={() => router.push('/dashboard/admin')}
                    variant="outline"
                    className="border-slate-700 text-slate-200 hover:bg-slate-800"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Volver al Dashboard
                </Button>
            </div>

            {/* Filtro por mes */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <Button
                    onClick={() => setSelectedMonth('all')}
                    variant={selectedMonth === 'all' ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                        selectedMonth === 'all'
                            ? 'bg-amber-500 text-slate-950'
                            : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    )}
                >
                    Todos
                </Button>
                {appointmentsByMonth.map(({ month, label }) => (
                    <Button
                        key={month}
                        onClick={() => setSelectedMonth(month)}
                        variant={selectedMonth === month ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                            selectedMonth === month
                                ? 'bg-amber-500 text-slate-950'
                                : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                        )}
                    >
                        {label}
                    </Button>
                ))}
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-amber-500/10 p-3">
                            <TrendingUp className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Ingresos {selectedMonth !== 'all' ? 'del mes' : 'totales'}</p>
                            <p className="text-2xl font-bold text-slate-100">
                                {formatCOP(monthlyStats?.revenue || stats.revenue)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
                    <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-emerald-500/10 p-3">
                            <Calendar className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Completadas</p>
                            <p className="text-2xl font-bold text-slate-100">
                                {monthlyStats?.completed || stats.completed}
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
                                {monthlyStats?.cancelled || stats.cancelled}
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
                            <p className="text-sm text-slate-400">Total archivadas</p>
                            <p className="text-2xl font-bold text-slate-100">{stats.total}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Listado por mes */}
            <div className="space-y-6">
                {filteredGroups.length === 0 ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8 text-center">
                        <p className="text-slate-400">No hay citas archivadas</p>
                    </div>
                ) : (
                    filteredGroups.map(({ month, label, appointments: monthAppts }) => (
                        <div key={month} className="space-y-3">
                            <h2 className="text-xl font-semibold text-slate-100 capitalize">{label}</h2>
                            <div className="space-y-2">
                                {monthAppts.map(apt => (
                                    <div
                                        key={apt.id}
                                        className="rounded-lg border border-slate-800 bg-slate-900/40 p-4 hover:bg-slate-900/60 transition"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <h3 className="font-medium text-slate-100">{apt.service_name}</h3>
                                                    <span className={cn(
                                                        'px-2 py-0.5 rounded-md text-xs font-medium border',
                                                        statusConfig[apt.status].color
                                                    )}>
                                                        {statusConfig[apt.status].label}
                                                    </span>
                                                </div>
                                                <div className="space-y-1 text-sm text-slate-400">
                                                    <p>👤 {apt.client_name || 'Cliente'} {apt.client_phone && `• ${apt.client_phone}`}</p>
                                                    <p>📅 {format(new Date(apt.start_time), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}</p>
                                                    {apt.cancellation_reason && (
                                                        <p className="text-amber-400">💬 {apt.cancellation_reason}</p>
                                                    )}
                                                    <p className="text-xs text-slate-500">
                                                        Archivada: {format(new Date(apt.archived_at), "d 'de' MMMM, yyyy", { locale: es })}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-lg font-bold text-amber-400">
                                                    {formatCOP(Number(apt.service_price))}
                                                </span>
                                                <span className="text-xs text-slate-500">
                                                    {apt.service_duration_minutes} min
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
