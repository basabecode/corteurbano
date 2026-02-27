'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar, Clock, User, Scissors, AlertCircle,
  Phone, MapPin, Home, ChevronRight, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { formatCOP } from '@/lib/format-currency';

type Appointment = {
  id: string;
  start_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  booking_type: 'presencial' | 'domicilio' | null;
  client_address: string | null;
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
  pending: {
    label: 'Pendiente',
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
    cardBorder: 'border-amber-500/40',
    pulse: true,
  },
  confirmed: {
    label: 'Confirmada',
    color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
    cardBorder: 'border-emerald-500/30',
    pulse: false,
  },
  completed: {
    label: 'Completada',
    color: 'text-slate-400 bg-slate-400/10 border-slate-400/30',
    cardBorder: 'border-slate-700',
    pulse: false,
  },
  cancelled: {
    label: 'Cancelada',
    color: 'text-rose-400 bg-rose-400/10 border-rose-400/30',
    cardBorder: 'border-rose-500/20',
    pulse: false,
  },
};

export function BarberDashboardContent({ appointments, barberRecord, userEmail }: Props) {
  const router = useRouter();
  const [newAppointmentIds, setNewAppointmentIds] = useState<Set<string>>(new Set());

  // Realtime subscription
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel('barber-appointments-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
        },
        (payload) => {
          setNewAppointmentIds(prev => new Set([...prev, payload.new.id]));
          router.refresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
        <div className="rounded-full bg-amber-500/10 border border-amber-500/20 p-8">
          <AlertCircle className="h-12 w-12 text-amber-400" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h2 className="text-2xl font-bold text-slate-100">Cuenta pendiente de activación</h2>
          <p className="text-slate-400">
            Tu cuenta está registrada pero el administrador aún no ha vinculado tu perfil a un barbero.
          </p>
          <p className="text-slate-600 text-sm pt-1">
            {userEmail}
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-6 py-4 text-sm text-slate-400 max-w-sm">
          <p className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-amber-400 flex-shrink-0" />
            Contacta al administrador para activar tu perfil y comenzar a recibir citas.
          </p>
        </div>
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

  const pendingCount = appointments.filter(a =>
    (a.status === 'pending') && new Date(a.start_time) >= today
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Scissors className="h-5 w-5 text-amber-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-100">Mis Citas</h1>
          </div>
          <p className="text-slate-400">
            Hola, <span className="text-amber-400 font-medium">{barberRecord.name}</span>
            {' '}— {format(new Date(), "EEEE dd 'de' MMMM", { locale: es })}
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
            </span>
            <span className="text-sm font-medium text-amber-400">{pendingCount} pendiente{pendingCount > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<Sparkles className="h-4 w-4 text-amber-400" />}
          bg="bg-amber-500/10"
          label="Hoy"
          value={todayAppointments.length}
          highlight={todayAppointments.length > 0}
        />
        <StatCard
          icon={<Calendar className="h-4 w-4 text-emerald-400" />}
          bg="bg-emerald-500/10"
          label="Próximas"
          value={upcomingAppointments.length}
          highlight={false}
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-slate-400" />}
          bg="bg-slate-500/10"
          label="Completadas"
          value={completedAppointments.length}
          highlight={false}
        />
      </div>

      {/* Today */}
      {todayAppointments.length > 0 && (
        <section>
          <SectionHeader
            title="Citas de Hoy"
            count={todayAppointments.length}
            accent="amber"
          />
          <div className="space-y-3 mt-3">
            {todayAppointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                isNew={newAppointmentIds.has(apt.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcomingAppointments.length > 0 && (
        <section>
          <SectionHeader
            title="Próximas Citas"
            count={upcomingAppointments.length}
            accent="emerald"
          />
          <div className="space-y-3 mt-3">
            {upcomingAppointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                isNew={newAppointmentIds.has(apt.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completedAppointments.length > 0 && (
        <section>
          <SectionHeader
            title="Completadas"
            count={completedAppointments.length}
            accent="slate"
          />
          <div className="space-y-3 mt-3">
            {completedAppointments.map((apt) => (
              <AppointmentCard
                key={apt.id}
                appointment={apt}
                isNew={false}
              />
            ))}
          </div>
        </section>
      )}

      {appointments.length === 0 && (
        <div className="text-center py-16 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="rounded-full bg-slate-800 p-5 w-fit mx-auto mb-4">
            <Calendar className="h-10 w-10 text-slate-600" />
          </div>
          <p className="text-slate-400 font-medium">No tienes citas asignadas</p>
          <p className="text-slate-600 text-sm mt-1">Las nuevas citas aparecerán aquí automáticamente.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon, bg, label, value, highlight
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: number;
  highlight: boolean;
}) {
  return (
    <div className={cn(
      'rounded-xl border bg-slate-900/40 p-4 transition-all',
      highlight ? 'border-amber-500/30 shadow-sm shadow-amber-500/10' : 'border-slate-800'
    )}>
      <div className={cn('rounded-lg p-2 w-fit mb-3', bg)}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function SectionHeader({ title, count, accent }: {
  title: string;
  count: number;
  accent: 'amber' | 'emerald' | 'slate';
}) {
  const colorMap = {
    amber: 'text-amber-400 bg-amber-400/10',
    emerald: 'text-emerald-400 bg-emerald-400/10',
    slate: 'text-slate-400 bg-slate-400/10',
  };
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      <span className={cn(
        'rounded-full px-2 py-0.5 text-xs font-bold',
        colorMap[accent]
      )}>
        {count}
      </span>
    </div>
  );
}

function AppointmentCard({
  appointment, isNew
}: {
  appointment: Appointment;
  isNew: boolean;
}) {
  const cfg = statusConfig[appointment.status];
  const isDomicilio = appointment.booking_type === 'domicilio';

  return (
    <article className={cn(
      'rounded-xl border bg-slate-900/50 p-4 sm:p-5 transition-all',
      cfg.cardBorder,
      cfg.pulse && 'shadow-sm shadow-amber-500/10',
      isNew && 'animate-pulse-once'
    )}>
      {/* Top row: service + status badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <h3 className="text-base font-semibold text-slate-100 truncate">
            {appointment.service?.name || 'Servicio'}
          </h3>
          {isDomicilio ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 uppercase tracking-wide">
              <Home className="h-2.5 w-2.5" />
              Domicilio
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-600 bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
              <MapPin className="h-2.5 w-2.5" />
              Presencial
            </span>
          )}
        </div>
        <span className={cn(
          'flex-shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium flex items-center gap-1',
          cfg.color
        )}>
          {cfg.pulse && (
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
            </span>
          )}
          {cfg.label}
        </span>
      </div>

      {/* Date + time + price */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-400 mb-3">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="capitalize">
            {format(new Date(appointment.start_time), "EEE dd 'de' MMM", { locale: es })}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="font-medium text-slate-300">
            {format(new Date(appointment.start_time), 'HH:mm')}
          </span>
        </div>
        {appointment.service && (
          <>
            <span className="text-slate-600">·</span>
            <span className="text-amber-400 font-semibold">
              {formatCOP(appointment.service.price)}
            </span>
            <span className="text-slate-600">{appointment.service.duration_minutes} min</span>
          </>
        )}
      </div>

      {/* Client info */}
      {appointment.client && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          <div className="flex items-center gap-2 text-sm text-slate-400 min-w-0">
            <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-slate-800">
              <User className="h-3.5 w-3.5 text-slate-500" />
            </div>
            <span className="truncate font-medium text-slate-300">
              {appointment.client.full_name || 'Cliente'}
            </span>
          </div>
          {appointment.client.phone && (
            <a
              href={`tel:${appointment.client.phone}`}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <Phone className="h-3 w-3" />
              {appointment.client.phone}
            </a>
          )}
        </div>
      )}

      {/* Domicilio address */}
      {isDomicilio && appointment.client_address && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-3 py-2 text-xs text-blue-400">
          <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>{appointment.client_address}</span>
        </div>
      )}
    </article>
  );
}
