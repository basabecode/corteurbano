'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, User, Scissors, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatCOP } from '@/lib/format-currency';

type Appointment = {
  id: string;
  start_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  client: {
    full_name: string | null;
    phone: string | null;
  } | null;
  service: {
    name: string;
    price: number;
    duration_minutes: number;
  } | null;
};

type BarberRecord = {
  id: string;
  name: string;
};

type Props = {
  appointments: Appointment[];
  barberRecord: BarberRecord | null;
  userEmail: string;
};

const statusConfig = {
  pending: { label: 'Pendiente', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30' },
  confirmed: { label: 'Confirmada', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30' },
  completed: { label: 'Completada', color: 'text-slate-400 bg-slate-400/10 border-slate-400/30' },
  cancelled: { label: 'Cancelada', color: 'text-rose-400 bg-rose-400/10 border-rose-400/30' },
};

export function BarberDashboardContent({ appointments, barberRecord, userEmail }: Props) {
  const router = useRouter();

  // Realtime subscription
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel('barber-appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'appointments',
        },
        () => {
          router.refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  if (!barberRecord) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
        <div className="rounded-full bg-amber-500/10 p-6">
          <AlertCircle className="h-12 w-12 text-amber-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-100">Cuenta pendiente de activación</h2>
          <p className="text-slate-400 max-w-md">
            Tu cuenta de barbero está registrada pero aún no ha sido vinculada por el administrador.
          </p>
          <p className="text-slate-500 text-sm">
            Cuenta: <span className="text-slate-400">{userEmail}</span>
          </p>
        </div>
        <p className="text-slate-500 text-sm max-w-sm">
          Contacta al administrador para que active tu perfil y puedas ver tus citas asignadas.
        </p>
      </div>
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = appointments.filter((a) => {
    const d = new Date(a.start_time);
    return d >= today && d < tomorrow && a.status !== 'cancelled';
  });

  const upcomingAppointments = appointments.filter((a) => {
    const d = new Date(a.start_time);
    return d >= tomorrow && a.status !== 'cancelled' && a.status !== 'completed';
  });

  const completedAppointments = appointments.filter((a) => a.status === 'completed');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Mis Citas</h1>
        <p className="text-slate-400 mt-1">
          Bienvenido, <span className="text-amber-400">{barberRecord.name}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-3">
              <Scissors className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Hoy</p>
              <p className="text-2xl font-bold text-slate-100">{todayAppointments.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <Calendar className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Próximas</p>
              <p className="text-2xl font-bold text-slate-100">{upcomingAppointments.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-500/10 p-3">
              <Clock className="h-5 w-5 text-slate-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Completadas</p>
              <p className="text-2xl font-bold text-slate-100">{completedAppointments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's appointments */}
      {todayAppointments.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Citas de Hoy</h2>
          <div className="space-y-3">
            {todayAppointments.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcomingAppointments.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Próximas Citas</h2>
          <div className="space-y-3">
            {upcomingAppointments.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completedAppointments.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-slate-100 mb-4">Citas Completadas</h2>
          <div className="space-y-3">
            {completedAppointments.map((apt) => (
              <AppointmentCard key={apt.id} appointment={apt} />
            ))}
          </div>
        </section>
      )}

      {appointments.length === 0 && (
        <div className="text-center py-12 rounded-xl border border-slate-800 bg-slate-900/40">
          <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No tienes citas asignadas aún</p>
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const status = statusConfig[appointment.status];

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 hover:border-slate-700 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-lg font-semibold text-slate-100">
              {appointment.service?.name || 'Servicio'}
            </h3>
            <span
              className={cn(
                'rounded-full border px-3 py-0.5 text-xs uppercase tracking-wide font-medium',
                status.color
              )}
            >
              {status.label}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-5 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span className="capitalize">
                {format(new Date(appointment.start_time), "EEEE, dd 'de' MMMM", { locale: es })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>{format(new Date(appointment.start_time), 'HH:mm')}</span>
            </div>
            {appointment.service && (
              <span className="text-amber-400 font-medium">
                {formatCOP(appointment.service.price)}
              </span>
            )}
          </div>

          {appointment.client && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <User className="h-4 w-4 flex-shrink-0" />
              <span>
                {appointment.client.full_name || 'Cliente'}
                {appointment.client.phone && (
                  <span className="ml-2 text-slate-600">· {appointment.client.phone}</span>
                )}
              </span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
