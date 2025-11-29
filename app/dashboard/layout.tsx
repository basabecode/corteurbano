import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DashboardNav } from './components/DashboardNav';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <DashboardNav userRole={profile?.role ?? 'customer'} userName={profile?.full_name ?? 'Usuario'} />
      <main className="mx-auto w-full max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}





