import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { BarberosContent } from './components/BarberosContent';

async function getAdminAndBarbers() {
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
  const { data: barbers } = await serviceClient
    .from('barbers')
    .select('id, name, specialty, bio, photo_url, instagram_handle, is_active, created_at')
    .order('created_at', { ascending: true });

  return { barbers: barbers ?? [] };
}

export default async function AdminBarberosPage() {
  const { barbers } = await getAdminAndBarbers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Gestión de Barberos</h1>
        <p className="mt-1 text-slate-400">Administra el equipo de barberos del negocio</p>
      </div>
      <BarberosContent initialBarbers={barbers} />
    </div>
  );
}
