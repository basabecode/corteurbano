import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { StatsCards } from './components/StatsCards';
import { AppointmentsList } from './components/AppointmentsList';
import { AdminActions } from './components/AdminActions';

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
  const totalRevenue = todayAppointments
    ?.filter((a) => a.status === 'confirmed' || a.status === 'completed')
    .reduce((sum, a) => {
      const service = a.service as any;
      const price = service?.price ?? 0;
      return sum + price;
    }, 0) ?? 0;

  const stats = [
    { label: 'Ingresos hoy', value: `$${totalRevenue.toFixed(2)}`, trend: `${confirmedCount} confirmadas` },
    { label: 'Citas pendientes', value: pendingCount.toString(), trend: 'Requieren acción' },
    { label: 'Citas confirmadas', value: confirmedCount.toString(), trend: 'Hoy' }
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

      <div>
        <h2 className="mb-4 text-2xl font-semibold text-slate-100">Listado de Citas</h2>
        <AppointmentsList initialAppointments={appointments} />
      </div>
    </div>
  );
}
