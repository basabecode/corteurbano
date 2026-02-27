'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, User, Home } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

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

  const panelLabel =
    userRole === 'admin'  ? 'Administración'
    : userRole === 'barber' ? 'Panel Barbero'
    : 'Mi Cuenta';

  return (
    <header className="border-b border-slate-800/60 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-40">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 md:px-10 py-4">

        {/* ── Logo — idéntico al Header público ──────────────────────── */}
        <Link href="/" className="group flex items-center gap-3 select-none">
          <span
            className="hidden lg:block w-0.5 h-8 rounded-full bg-amber-400/55 group-hover:bg-amber-400/80 transition-colors duration-300"
            aria-hidden
          />
          <div className="flex flex-col leading-none">
            <span className="font-display text-lg md:text-[1.35rem] font-semibold tracking-wide text-slate-100 group-hover:text-slate-50 transition-colors">
              Corte <span className="text-amber-400">Urbano</span>
            </span>
            <span className="text-[8px] uppercase tracking-[0.35em] text-slate-500 group-hover:text-slate-400 transition-colors mt-[3px]">
              {panelLabel}
            </span>
          </div>
        </Link>

        {/* ── Derecha ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 md:gap-6">

          {/* Ir al Inicio */}
          <Link
            href="/"
            className="hidden md:flex items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] text-slate-500 hover:text-amber-400 transition-colors duration-200"
          >
            <Home className="h-3.5 w-3.5" />
            <span>Inicio</span>
          </Link>

          <div className="hidden md:block h-3.5 w-px bg-slate-800" aria-hidden />

          {/* Usuario + badge de rol */}
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-500">
            <User className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="hidden sm:inline max-w-[140px] truncate normal-case text-slate-400">
              {userName}
            </span>
            {userRole === 'admin' && (
              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold text-amber-400 tracking-widest">
                ADMIN
              </span>
            )}
            {userRole === 'barber' && (
              <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-bold text-emerald-400 tracking-widest">
                BARBERO
              </span>
            )}
          </div>

          <div className="h-3.5 w-px bg-slate-800" aria-hidden />

          {/* Cerrar sesión */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.25em] text-slate-500 hover:text-red-400 transition-colors duration-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Salir</span>
          </button>

        </div>
      </div>
    </header>
  );
}
