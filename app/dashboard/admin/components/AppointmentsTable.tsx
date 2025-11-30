'use client';

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, XCircle, Clock, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
};

export function AppointmentsTable({ appointments, onStatusChange, loading }: AppointmentsTableProps) {
  const statusConfig = {
    pending: { label: 'Pendiente', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20', icon: Clock },
    confirmed: { label: 'Confirmada', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20', icon: CheckCircle2 },
    completed: { label: 'Completada', color: 'text-green-400 bg-green-400/10 border-green-400/20', icon: CheckCircle2 },
    cancelled: { label: 'Cancelada', color: 'text-red-400 bg-red-400/10 border-red-400/20', icon: XCircle }
  };

  if (appointments.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
        <p className="text-slate-400">No hay citas para mostrar</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-800 bg-slate-900/60">
            <tr>
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
              const status = statusConfig[appointment.status];
              const StatusIcon = status.icon;

              return (
                <tr key={appointment.id} className="transition hover:bg-slate-900/40">
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-100">
                      {format(new Date(appointment.start_time), "dd MMM yyyy", { locale: es })}
                    </div>
                    <div className="text-xs text-slate-400">
                      {format(new Date(appointment.start_time), "HH:mm", { locale: es })} -{' '}
                      {format(
                        new Date(new Date(appointment.start_time).getTime() + (appointment.service?.duration_minutes ?? 0) * 60000),
                        "HH:mm",
                        { locale: es }
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
                      ${appointment.service?.price.toFixed(2) ?? '0.00'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium w-fit',
                          status.color
                        )}
                      >
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

