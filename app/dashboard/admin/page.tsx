import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { StatsCards } from './components/StatsCards';
import { AppointmentsList } from './components/AppointmentsList';
import { AdminActions } from './components/AdminActions';
import { formatCOP } from '@/lib/format-currency';
import Link from 'next/link';
import { Scissors, User, History } from 'lucide-react';

async function getAdminData() {
  const supabase = createSupabaseServerClient();

  // Verificar autenticación y rol
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard/customer');
  }

  // Completar automáticamente citas pasadas
  try {
    await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/appointments/complete-past`, {
      method: 'POST',
      cache: 'no-store'
    });
  } catch (error) {
    console.error('Error completing past appointments:', error);
    // No bloqueamos la carga del dashboard si falla
  }

  // Obtener estadísticas del día
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: todayAppointments } = await supabase
    .from('appointments')
    .select('status, service:services!inner(price)')
    .gte('start_time', today.toISOString())
    .lt('start_time', tomorrow.toISOString());

  const { data: allAppointments } = await supabase
    .from('appointments')
    .select(`
      id,
      start_time,
      status,
      cancellation_reason,
      client:profiles!appointments_client_id_fkey!inner(full_name, telegram_chat_id, phone),
      service:services!inner(name, price, duration_minutes)
    `)
    .order('start_time', { ascending: true });

  // Calcular estadísticas
  const pendingCount = todayAppointments?.filter((a) => a.status === 'pending').length ?? 0;
  const confirmedCount = todayAppointments?.filter((a) => a.status === 'confirmed').length ?? 0;
  const completedCount = todayAppointments?.filter((a) => a.status === 'completed').length ?? 0;

  // Ingresos = citas completadas (ya realizadas)
  const totalRevenue = todayAppointments
    ?.filter((a) => a.status === 'completed')
    .reduce((sum, a) => {
      const service = a.service as any;
      const price = service?.price ?? 0;
      return sum + price;
    }, 0) ?? 0;

  const stats = [
    {
      label: 'Ingresos hoy',
      value: formatCOP(totalRevenue),
      trend: `${completedCount} completadas`
    },
    {
      label: 'Citas pendientes',
      value: pendingCount.toString(),
      trend: 'Requieren acción'
    },
    {
      label: 'Citas confirmadas',
      value: confirmedCount.toString(),
      trend: 'Hoy'
    }
  ];

  return {
    stats,
    appointments: (allAppointments ?? []) as any
  };
}

export default async function AdminDashboard() {
  const { stats, appointments } = await getAdminData();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Panel del Administrador</h1>
          <p className="mt-1 text-slate-400">Gestiona citas y visualiza estadísticas</p>
        </div>
        <AdminActions />
      </div>

      <StatsCards stats={stats} />

      {/* Navegación rápida */}
      <div>
        <h2 className="mb-4 text-sm font-semibold text-slate-400 uppercase tracking-wide">Gestión</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/dashboard/admin/servicios"
            className="group flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition-all duration-300 hover:border-amber-500/50 hover:bg-slate-900/70"
          >
            <div className="rounded-lg bg-amber-500/10 p-3 group-hover:bg-amber-500/20 transition-colors">
              <Scissors className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-100">Servicios</p>
              <p className="text-xs text-slate-400">Crear y editar servicios</p>
            </div>
          </Link>
          <Link
            href="/dashboard/admin/barberos"
            className="group flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition-all duration-300 hover:border-amber-500/50 hover:bg-slate-900/70"
          >
            <div className="rounded-lg bg-amber-500/10 p-3 group-hover:bg-amber-500/20 transition-colors">
              <User className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-100">Barberos</p>
              <p className="text-xs text-slate-400">Gestionar el equipo</p>
            </div>
          </Link>
          <Link
            href="/dashboard/admin/historial"
            className="group flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition-all duration-300 hover:border-amber-500/50 hover:bg-slate-900/70"
          >
            <div className="rounded-lg bg-amber-500/10 p-3 group-hover:bg-amber-500/20 transition-colors">
              <History className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-100">Historial</p>
              <p className="text-xs text-slate-400">Citas archivadas</p>
            </div>
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-semibold text-slate-100">Listado de Citas</h2>
        <AppointmentsList initialAppointments={appointments} />
      </div>
    </div>
  );
}
