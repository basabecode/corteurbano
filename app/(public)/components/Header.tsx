'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/estilos',   label: 'Estilos'   },
  { href: '/servicios', label: 'Servicios' },
  { href: '/#agenda',  label: 'Reservar'  },
];

export function Header() {
  const [scrolled,    setScrolled]    = useState(false);
  const [drawerOpen,  setDrawerOpen]  = useState(false);
  const [user,        setUser]        = useState<{ email: string; name?: string } | null>(null);
  const [loading,     setLoading]     = useState(true);
  const router   = useRouter();
  const pathname = usePathname();

  /* ── Scroll ───────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Cerrar drawer al navegar ─────────────────── */
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  /* ── Bloquear scroll del body ─────────────────── */
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  /* ── Auth ─────────────────────────────────────── */
  useEffect(() => { checkUser(); }, []);

  async function checkUser() {
    const supabase = createSupabaseBrowserClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles').select('full_name').eq('id', authUser.id).single();
      setUser({ email: authUser.email || '', name: profile?.full_name });
    }
    setLoading(false);
  }

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    setDrawerOpen(false);
    router.push('/');
    router.refresh();
  }

  const displayName = user?.name?.split(' ')[0] ?? user?.email?.split('@')[0];

  return (
    <>
      {/* ══ HEADER ══════════════════════════════════════════════════════ */}
      <header
        className={`transition-all duration-500 ${
          scrolled
            ? 'bg-slate-950/90 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.04)]'
            : 'bg-transparent'
        }`}
      >
        <div className="flex items-center justify-between px-6 md:px-10 py-4 md:py-5">

          {/* Logo */}
          <Link href="/" className="group flex flex-col leading-none select-none">
            <span className="font-display text-xl md:text-2xl font-semibold tracking-wide text-slate-100 group-hover:text-slate-50 transition-colors">
              Corte <span className="text-amber-400">Urbano</span>
            </span>
            <span className="text-[8px] uppercase tracking-[0.38em] text-slate-600 mt-px">
              Barbería Premium
            </span>
          </Link>

          {/* ── Desktop nav ─────────────────────────── */}
          <nav className="hidden md:flex items-center gap-10" aria-label="Navegación principal">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="relative text-[11px] uppercase tracking-[0.25em] text-slate-400 hover:text-amber-400 transition-colors duration-200 group py-1"
              >
                {label}
                {/* underline animado */}
                <span
                  className="absolute -bottom-px left-0 h-px w-0 bg-amber-400/50 group-hover:w-full transition-all duration-300"
                  aria-hidden
                />
              </Link>
            ))}
          </nav>

          {/* ── Desktop auth ─────────────────────────── */}
          <div className="hidden md:flex items-center gap-5">
            {!loading && (
              user ? (
                <>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    {displayName}
                  </span>
                  <div className="h-3.5 w-px bg-slate-800" aria-hidden />
                  <Link
                    href="/dashboard/customer"
                    className="text-[11px] uppercase tracking-[0.2em] text-amber-400/80 hover:text-amber-400 transition-colors"
                  >
                    Mi Panel
                  </Link>
                  <div className="h-3.5 w-px bg-slate-800" aria-hidden />
                  <button
                    onClick={handleLogout}
                    className="text-[11px] uppercase tracking-[0.2em] text-slate-500 hover:text-red-400 transition-colors"
                  >
                    Salir
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-[11px] uppercase tracking-[0.25em] border border-amber-500/25 text-amber-400/80 px-5 py-2 rounded-full hover:border-amber-400/50 hover:text-amber-400 hover:bg-amber-500/[0.06] transition-all duration-200"
                >
                  Iniciar sesión
                </Link>
              )
            )}
          </div>

          {/* ── Mobile: botón texto ──────────────────── */}
          <button
            className="md:hidden text-[10px] uppercase tracking-[0.32em] text-slate-400 hover:text-amber-400 transition-colors py-1 px-0"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={drawerOpen}
          >
            Menú
          </button>
        </div>
      </header>

      {/* ══ MOBILE BOTTOM DRAWER ════════════════════════════════════════ */}

      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-400 md:hidden ${
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setDrawerOpen(false)}
        aria-hidden
      />

      {/* Panel deslizable desde abajo */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
          drawerOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* Cabecera del drawer */}
        <div className="bg-slate-950 rounded-t-3xl border-t border-slate-800/80 pt-3 pb-2 px-8">

          {/* Handle visual */}
          <div className="flex justify-center mb-5">
            <div className="w-9 h-0.5 bg-slate-700 rounded-full" aria-hidden />
          </div>

          {/* Marca pequeña */}
          <div className="flex items-center justify-between mb-6">
            <span className="font-display text-sm text-slate-600 tracking-wide">
              Corte <span className="text-amber-500/50">Urbano</span>
            </span>
            <button
              onClick={() => setDrawerOpen(false)}
              className="text-[10px] uppercase tracking-[0.28em] text-slate-500 hover:text-slate-300 transition-colors"
              aria-label="Cerrar menú"
            >
              Cerrar
            </button>
          </div>

          {/* Nav links — tipografía grande y elegante */}
          <nav className="border-t border-slate-800/60">
            {NAV_LINKS.map(({ href, label }, i) => (
              <Link
                key={href}
                href={href}
                className="flex items-center justify-between py-4 border-b border-slate-800/40 group"
                onClick={() => setDrawerOpen(false)}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <span className="font-display text-3xl font-light text-slate-200 group-hover:text-amber-400 transition-colors duration-200 tracking-wide">
                  {label}
                </span>
                <span className="text-[9px] uppercase tracking-[0.3em] text-slate-600 group-hover:text-amber-500/60 transition-colors">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </Link>
            ))}
          </nav>

          {/* Auth */}
          <div className="pt-6 pb-10">
            {!loading && (
              user ? (
                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-[0.32em] text-slate-500 mb-5">
                    Hola, {displayName}
                  </p>
                  <Link
                    href="/dashboard/customer"
                    className="block w-full text-center rounded-full bg-amber-500 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-950 hover:bg-amber-400 active:scale-[0.98] transition-all"
                    onClick={() => setDrawerOpen(false)}
                  >
                    Mi Panel
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-center rounded-full border border-slate-700/80 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400 hover:border-red-500/30 hover:text-red-400 active:scale-[0.98] transition-all"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="block w-full text-center rounded-full bg-amber-500 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-950 hover:bg-amber-400 active:scale-[0.98] transition-all"
                  onClick={() => setDrawerOpen(false)}
                >
                  Iniciar sesión
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </>
  );
}
