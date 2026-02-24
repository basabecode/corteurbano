'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, XCircle, Clock, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCOP } from '@/lib/format-currency';

export type Appointment = {
  id: string;
  start_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  cancellation_reason?: string | null;
  client: {
    full_name: string;
    telegram_chat_id?: string | null;
    phone?: string | null;
  } | null;
  service: {
    name: string;
    price: number;
    duration_minutes: number;
  } | null;
};

type AppointmentsTableProps = {
  appointments: Appointment[];
  onStatusChange: (id: string, newStatus: 'confirmed' | 'cancelled') => Promise<void>;
  loading?: boolean;
  selectedAppointments?: Set<string>;
  onToggleSelection?: (id: string) => void;
  cleanableAppointments?: Appointment[];
};

const statusConfig = {
  pending:   { label: 'Pendiente',  color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',  icon: Clock },
  confirmed: { label: 'Confirmada', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',     icon: CheckCircle2 },
  completed: { label: 'Completada', color: 'text-green-400 bg-green-400/10 border-green-400/20',  icon: CheckCircle2 },
  cancelled: { label: 'Cancelada',  color: 'text-red-400 bg-red-400/10 border-red-400/20',        icon: XCircle },
};

export function AppointmentsTable({
  appointments,
  onStatusChange,
  loading,
  selectedAppointments = new Set(),
  onToggleSelection,
  cleanableAppointments = [],
}: AppointmentsTableProps) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
        <p className="text-slate-400">No hay citas para mostrar</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">

      {/* ══ VISTA MÓVIL — Cards (< md) ════════════════════════════════ */}
      <div className="md:hidden divide-y divide-slate-800/70">
        {appointments.map((appointment) => {
          const status    = statusConfig[appointment.status];
          const StatusIcon = status.icon;
          const isCleanable = cleanableAppointments.some(apt => apt.id === appointment.id);
          const isSelected  = selectedAppointments.has(appointment.id);
          const endMs = new Date(appointment.start_time).getTime()
            + (appointment.service?.duration_minutes ?? 0) * 60_000;

          return (
            <div
              key={appointment.id}
              className={cn(
                'p-4 transition-colors',
                isSelected ? 'bg-amber-500/5' : 'hover:bg-slate-900/60',
              )}
            >
              {/* Fila superior: checkbox + fecha + estado */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-start gap-3">
                  {isCleanable && onToggleSelection && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelection(appointment.id)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950 cursor-pointer"
                    />
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {format(new Date(appointment.start_time), 'dd MMM yyyy', { locale: es })}
                    </p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(appointment.start_time), 'HH:mm', { locale: es })}
                      {' — '}
                      {format(new Date(endMs), 'HH:mm', { locale: es })}
                    </p>
                  </div>
                </div>

                <span className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0',
                  status.color,
                )}>
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
                </span>
              </div>

              {/* Cliente + Servicio/Precio */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="text-sm text-slate-100 truncate">
                      {appointment.client?.full_name ?? 'Cliente desconocido'}
                    </span>
                  </div>
                  {appointment.client?.phone && (
                    <div className="flex items-center gap-1.5 mt-0.5 ml-5">
                      <Phone className="h-3 w-3 text-amber-500 shrink-0" />
                      <span className="text-xs text-slate-400 font-mono">
                        {appointment.client.phone}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm text-slate-200">{appointment.service?.name ?? 'N/A'}</p>
                  <p className="text-xs text-slate-500">{appointment.service?.duration_minutes ?? 0} min</p>
                  <p className="text-sm font-semibold text-amber-400 mt-0.5">
                    {formatCOP(appointment.service?.price ?? 0)}
                  </p>
                </div>
              </div>

              {/* Motivo de cancelación */}
              {appointment.status === 'cancelled' && appointment.cancellation_reason && (
                <p className="mb-3 text-xs text-slate-500 italic">
                  Motivo: {appointment.cancellation_reason}
                </p>
              )}

              {/* Acciones */}
              {appointment.status === 'pending' && (
                <div className="flex gap-2 mt-1">
                  <Button
                    size="sm"
                    onClick={() => onStatusChange(appointment.id, 'confirmed')}
                    disabled={loading}
                    className="flex-1 bg-green-600 text-white hover:bg-green-500"
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onStatusChange(appointment.id, 'cancelled')}
                    disabled={loading}
                    className="flex-1 border-red-600 text-red-400 hover:bg-red-600/10"
                  >
                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                    Cancelar
                  </Button>
                </div>
              )}
              {appointment.status === 'confirmed' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onStatusChange(appointment.id, 'cancelled')}
                  disabled={loading}
                  className="w-full border-red-600 text-red-400 hover:bg-red-600/10 mt-1"
                >
                  Cancelar cita
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {/* ══ VISTA DESKTOP — Tabla (≥ md) ══════════════════════════════ */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-800 bg-slate-900/60">
            <tr>
              {cleanableAppointments.length > 0 && onToggleSelection && (
                <th className="px-4 py-4 text-left w-12" />
              )}
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Fecha y Hora</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Cliente</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Servicio</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Precio</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300">Estado</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {appointments.map((appointment) => {
              const status     = statusConfig[appointment.status];
              const StatusIcon = status.icon;
              const isCleanable = cleanableAppointments.some(apt => apt.id === appointment.id);
              const isSelected  = selectedAppointments.has(appointment.id);

              return (
                <tr key={appointment.id} className="transition hover:bg-slate-900/40">
                  {cleanableAppointments.length > 0 && onToggleSelection && (
                    <td className="px-4 py-4">
                      {isCleanable && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelection(appointment.id)}
                          className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950 cursor-pointer"
                        />
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-100">
                      {format(new Date(appointment.start_time), 'dd MMM yyyy', { locale: es })}
                    </div>
                    <div className="text-xs text-slate-400">
                      {format(new Date(appointment.start_time), 'HH:mm', { locale: es })} -{' '}
                      {format(
                        new Date(new Date(appointment.start_time).getTime() + (appointment.service?.duration_minutes ?? 0) * 60_000),
                        'HH:mm',
                        { locale: es },
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="text-sm text-slate-100">
                          {appointment.client?.full_name ?? 'Cliente desconocido'}
                        </span>
                      </div>
                      {appointment.client?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-amber-500" />
                          <span className="text-xs text-slate-400 font-mono">
                            {appointment.client.phone}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-200">{appointment.service?.name ?? 'N/A'}</span>
                    <div className="text-xs text-slate-400">
                      {appointment.service?.duration_minutes ?? 0} min
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-amber-400">
                      {formatCOP(appointment.service?.price ?? 0)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium w-fit',
                        status.color,
                      )}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                      {appointment.status === 'cancelled' && appointment.cancellation_reason && (
                        <div className="mt-1 text-xs text-slate-400 italic">
                          Motivo: {appointment.cancellation_reason}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {appointment.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => onStatusChange(appointment.id, 'confirmed')}
                          disabled={loading}
                          className="bg-green-600 text-white hover:bg-green-500"
                        >
                          <CheckCircle2 className="mr-1.5 h-4 w-4" />
                          Confirmar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onStatusChange(appointment.id, 'cancelled')}
                          disabled={loading}
                          className="border-red-600 text-red-400 hover:bg-red-600/10"
                        >
                          <XCircle className="mr-1.5 h-4 w-4" />
                          Cancelar
                        </Button>
                      </div>
                    )}
                    {appointment.status === 'confirmed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onStatusChange(appointment.id, 'cancelled')}
                        disabled={loading}
                        className="border-red-600 text-red-400 hover:bg-red-600/10"
                      >
                        Cancelar
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
