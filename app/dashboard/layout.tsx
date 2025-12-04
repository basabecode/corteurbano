import { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { DashboardNav } from './components/DashboardNav';
import { AutoCompletePastAppointments } from './components/AutoCompletePastAppointments';
import { BottomNav } from '@/components/ui/bottom-nav';

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

  const userRole = (profile?.role ?? 'customer') as 'customer' | 'admin';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <AutoCompletePastAppointments />
      <DashboardNav userRole={userRole} userName={profile?.full_name ?? 'Usuario'} />
      <main className="mx-auto w-full max-w-7xl px-4 md:px-6 py-6 md:py-10 pb-24 md:pb-10">
        {children}
      </main>
      <BottomNav role={userRole} />
    </div>
  );
}
