'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User, Scissors } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

type DashboardNavProps = {
  userRole: string;
  userName: string;
};

export function DashboardNav({ userRole, userName }: DashboardNavProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <Scissors className="h-6 w-6 text-amber-400" />
          <div>
            <h1 className="text-xl font-semibold text-amber-400">BarberKing</h1>
            <p className="text-xs text-slate-400">
              {userRole === 'admin' ? 'Panel de Administración' : 'Mi Cuenta'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <User className="h-4 w-4" />
            <span>{userName}</span>
            {userRole === 'admin' && (
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                Admin
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="text-slate-400 hover:text-slate-100"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Salir
          </Button>
        </div>
      </div>
    </header>
  );
}

