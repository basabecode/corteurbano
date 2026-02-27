import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { ServiciosContent } from './components/ServiciosContent';
import { Breadcrumb } from '@/app/dashboard/components/Breadcrumb';

async function getAdminAndServices() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') redirect('/dashboard/customer');

  const serviceClient = createSupabaseServiceClient();
  const { data: services } = await serviceClient
    .from('services')
    .select('id, name, price, duration_minutes, description, image_url, is_active, slug')
    .order('price', { ascending: true });

  return { services: services ?? [] };
}

export default async function AdminServiciosPage() {
  const { services } = await getAdminAndServices();

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Panel Admin', href: '/dashboard/admin' },
          { label: 'Servicios' },
        ]}
      />
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Gestión de Servicios</h1>
        <p className="mt-1 text-slate-400">Crea, edita y gestiona los servicios de la barbería</p>
      </div>
      <ServiciosContent initialServices={services} />
    </div>
  );
}
