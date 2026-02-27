'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/estilos',   label: 'Estilos'   },
  { href: '/servicios', label: 'Servicios' },
  { href: '/#agenda',  label: 'Reservar'  },
];

export function Header() {
  const [scrolled,   setScrolled]   = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [mounted,    setMounted]    = useState(false);
  const [user,       setUser]       = useState<{ email: string; name?: string } | null>(null);
  const [loading,    setLoading]    = useState(true);
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

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
      <header className={`transition-all duration-500 ${
        scrolled
          ? 'bg-slate-950/90 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.04)]'
          : 'bg-transparent'
      }`}>
        <div className="flex items-center justify-between px-6 md:px-10 lg:px-12 py-4 md:py-5 lg:py-6">

          {/* ── Logo ──────────────────────────────────── */}
          <Link href="/" className="group flex items-center gap-3 select-none">
            {/* Acento vertical — sólo visible en desktop, da peso visual al logo */}
            <span
              className="hidden lg:block w-0.5 h-9 rounded-full bg-amber-400/55 group-hover:bg-amber-400/80 transition-colors duration-300"
              aria-hidden
            />
            <div className="flex flex-col leading-none">
              <span className="font-display text-xl md:text-[1.45rem] lg:text-[1.875rem] font-semibold tracking-wide text-slate-100 group-hover:text-slate-50 transition-colors">
                Corte <span className="text-amber-400">Urbano</span>
              </span>
              <span className="text-[8px] lg:text-[9px] uppercase tracking-[0.38em] text-slate-500 group-hover:text-slate-400 transition-colors mt-[3px]">
                Barbería Premium
              </span>
            </div>
          </Link>

          {/* ── Desktop nav ───────────────────────────── */}
          <nav className="hidden md:flex items-center gap-8 lg:gap-12" aria-label="Navegación principal">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="relative text-[11px] lg:text-[12px] uppercase tracking-[0.28em] text-slate-400 hover:text-amber-400 transition-colors duration-200 group py-1.5"
              >
                {label}
                <span
                  className="absolute -bottom-px left-0 h-px w-0 bg-amber-400/55 group-hover:w-full transition-all duration-300"
                  aria-hidden
                />
              </Link>
            ))}
          </nav>

          {/* ── Desktop auth ──────────────────────────── */}
          <div className="hidden md:flex items-center gap-4 lg:gap-5">
            {!loading && (
              user ? (
                <>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    {displayName}
                  </span>
                  <div className="h-3.5 w-px bg-slate-800" aria-hidden />
                  <Link
                    href="/dashboard"
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
                <>
                  <Link
                    href="/login"
                    className="text-[11px] uppercase tracking-[0.25em] border border-amber-500/25 text-amber-400/80 px-5 py-2 rounded-full hover:border-amber-400/50 hover:text-amber-400 hover:bg-amber-500/[0.06] transition-all duration-200"
                  >
                    Iniciar sesión
                  </Link>
                  <Link
                    href="/registro"
                    className="text-[11px] uppercase tracking-[0.25em] border border-amber-500/60 text-amber-400 px-5 py-2 rounded-full hover:bg-amber-500/[0.1] hover:border-amber-400 transition-all duration-200"
                  >
                    Registrarse
                  </Link>
                </>
              )
            )}
          </div>

          {/* ── Mobile: hamburger elegante ────────────── */}
          <button
            className="md:hidden flex flex-col items-end justify-center gap-[5px] p-2 -mr-1 group"
            onClick={() => setDrawerOpen(true)}
            aria-label="Abrir menú"
            aria-expanded={drawerOpen}
          >
            {/* Línea larga */}
            <span className="block w-6 h-px rounded-full bg-slate-400 group-hover:bg-amber-400 transition-colors duration-200" />
            {/* Línea media amber — se expande en hover */}
            <span className="block w-[14px] h-px rounded-full bg-amber-400/70 group-hover:w-6 group-hover:bg-amber-400 transition-all duration-300" />
            {/* Línea corta */}
            <span className="block w-5 h-px rounded-full bg-slate-400 group-hover:bg-amber-400 transition-colors duration-200" />
          </button>

        </div>
      </header>

      {/* ══ MOBILE DRAWER ═══════════════════════════════════════════════
          Portal directo a document.body para que fixed:bottom-0 se
          posicione relativo al viewport y no al backdrop-blur del layout
          (comportamiento conocido de iOS Safari).
      ═══════════════════════════════════════════════════════════════════ */}
      {mounted && createPortal(
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
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
            className={`fixed inset-x-0 bottom-0 z-50 md:hidden transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] ${
              drawerOpen ? 'translate-y-0' : 'translate-y-full'
            }`}
          >
            <div className="bg-slate-950 rounded-t-[2rem] border-t border-slate-800/80 max-h-[88dvh] overflow-y-auto px-7 pt-3 pb-8">

              {/* Handle */}
              <div className="flex justify-center mb-5">
                <div className="w-10 h-0.5 bg-slate-700/80 rounded-full" aria-hidden />
              </div>

              {/* Cabecera del drawer */}
              <div className="flex items-center justify-between mb-7">
                <div className="flex items-center gap-2">
                  <span className="w-0.5 h-5 rounded-full bg-amber-400/45" aria-hidden />
                  <span className="font-display text-sm text-slate-500 tracking-wide">
                    Corte <span className="text-amber-500/55">Urbano</span>
                  </span>
                </div>

                {/* Botón cerrar — circular con ✕ */}
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-800 text-slate-500 hover:text-slate-200 hover:border-slate-600 transition-all duration-200"
                  aria-label="Cerrar menú"
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none" aria-hidden>
                    <line x1="1" y1="1" x2="8" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <line x1="8" y1="1" x2="1" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>

              {/* Nav links */}
              <nav className="border-t border-slate-800/50">
                {NAV_LINKS.map(({ href, label }, i) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center justify-between py-[1.05rem] border-b border-slate-800/40 group"
                    onClick={() => setDrawerOpen(false)}
                  >
                    <span className="font-display text-[1.65rem] font-light text-slate-200 group-hover:text-amber-400 transition-colors duration-200 tracking-wide leading-none">
                      {label}
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.3em] text-slate-600 group-hover:text-amber-500/60 transition-colors tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </Link>
                ))}
              </nav>

              {/* Auth */}
              <div className="pt-6">
                {!loading && (
                  user ? (
                    <div className="space-y-3">
                      <p className="text-[10px] uppercase tracking-[0.32em] text-slate-500 mb-4">
                        Hola, {displayName}
                      </p>
                      <Link
                        href="/dashboard"
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
                    <div className="space-y-3">
                      <Link
                        href="/login"
                        className="block w-full text-center rounded-full border border-slate-700/80 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-300 hover:border-slate-500 hover:text-slate-100 active:scale-[0.98] transition-all"
                        onClick={() => setDrawerOpen(false)}
                      >
                        Iniciar sesión
                      </Link>
                      <Link
                        href="/registro?tipo=cliente"
                        className="block w-full text-center rounded-full bg-amber-500 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-950 hover:bg-amber-400 active:scale-[0.98] transition-all"
                        onClick={() => setDrawerOpen(false)}
                      >
                        Soy Cliente
                      </Link>
                      <Link
                        href="/registro?tipo=barbero"
                        className="block w-full text-center rounded-full border border-amber-500/30 px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.25em] text-amber-400/80 hover:border-amber-500/60 hover:text-amber-400 active:scale-[0.98] transition-all"
                        onClick={() => setDrawerOpen(false)}
                      >
                        Soy Barbero
                      </Link>
                    </div>
                  )
                )}
              </div>

            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
