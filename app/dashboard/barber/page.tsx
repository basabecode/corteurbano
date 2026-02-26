import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BarberDashboardContent } from './components/BarberDashboardContent';

type AppointmentData = {
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

export default async function BarberDashboard() {
  const supabase = createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'barber') redirect('/dashboard/customer');

  // Look up the barber record linked to this user
  const { data: barberRecord } = await supabase
    .from('barbers')
    .select('id, name')
    .eq('profile_id', user.id)
    .single();

  if (!barberRecord) {
    return (
      <BarberDashboardContent
        appointments={[]}
        barberRecord={null}
        userEmail={user.email || ''}
      />
    );
  }

  // Fetch appointments for this barber
  const { data: appointmentsData } = await supabase
    .from('appointments')
    .select(`
      id,
      start_time,
      status,
      client:profiles!appointments_client_id_fkey(full_name, phone),
      service:services!inner(name, price, duration_minutes)
    `)
    .eq('barber_id', barberRecord.id)
    .order('start_time', { ascending: true });

  const appointments: AppointmentData[] = (appointmentsData || []).map((apt: any) => ({
    id: apt.id,
    start_time: apt.start_time,
    status: apt.status,
    client: Array.isArray(apt.client) ? apt.client[0] : apt.client,
    service: Array.isArray(apt.service) ? apt.service[0] : apt.service,
  }));

  return (
    <BarberDashboardContent
      appointments={appointments}
      barberRecord={barberRecord}
      userEmail={user.email || ''}
    />
  );
}
