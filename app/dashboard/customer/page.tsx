import { createSupabaseServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CustomerDashboardContent } from './components/CustomerDashboardContent';

export default async function CustomerDashboard() {
  const supabase = createSupabaseServerClient();

  // Verificar autenticación
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Obtener citas del cliente
  const { data: appointments } = await supabase
    .from('appointments')
    .select(`
      id,
      start_time,
      status,
      service:services(id, name, price, duration_minutes)
    `)
    .eq('client_id', user.id)
    .order('start_time', { ascending: true });

  // Obtener perfil
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone')
    .eq('id', user.id)
    .single();

  return (
    <CustomerDashboardContent
      appointments={appointments || []}
      userEmail={user.email || ''}
      userName={profile?.full_name || ''}
    />
  );
}
