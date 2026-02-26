import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CustomerDashboardContent } from './components/CustomerDashboardContent';


type AppointmentData = {
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

export default async function CustomerDashboard() {
  const supabase = createSupabaseServerClient();

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Redirigir barberos a su propio panel
  const { data: profileCheck } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profileCheck?.role === 'barber') redirect('/dashboard/barber');

  // Obtener citas del cliente
  const { data: appointmentsData } = await supabase
    .from('appointments')
    .select(`
  id,
  start_time,
  status,
  service:services!inner(id, name, price, duration_minutes)
`)
    .eq('client_id', user.id)
    .order('start_time', { ascending: true });

  // Transform the data to handle the service array issue
  const appointments: AppointmentData[] = (appointmentsData || []).map((apt: any) => ({
    id: apt.id,
    start_time: apt.start_time,
    status: apt.status,
    service: Array.isArray(apt.service) ? apt.service[0] : apt.service
  }));

  // Obtener perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .single();

  return (
    <CustomerDashboardContent
      appointments={appointments}
      userEmail={user.email || ''}
      userName={profile?.full_name || ''}
    />
  );
}
