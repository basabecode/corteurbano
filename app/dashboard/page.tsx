import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Hub de redirección: detecta el rol del usuario y lo envía
 * al dashboard correcto. Resuelve el problema de "Mi Panel"
 * apuntando siempre a /dashboard/customer sin importar el rol.
 */
export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role ?? 'customer';

  if (role === 'admin')  redirect('/dashboard/admin');
  if (role === 'barber') redirect('/dashboard/barber');
  redirect('/dashboard/customer');
}
