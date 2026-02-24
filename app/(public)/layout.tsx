import Link from 'next/link';
import { Header } from './components/Header';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-slate-950 font-body selection:bg-amber-500/25">

      {/* ── MANCHAS DE LUZ — position:fixed, z-0 ─────────────────────
          Capas de luz desfocada que dan profundidad sin grano visual.
          Cada mancha tiene tamaño, posición y opacidad distintos para
          crear una perspectiva de iluminación natural de barbería.
      ─────────────────────────────────────────────────────────────── */}

      {/* Foco principal — esquina superior-izquierda, gran y suave */}
      <div className="fixed top-[-18%] left-[-10%] w-[58%] h-[58%] rounded-full bg-amber-500/[0.06] blur-[160px] pointer-events-none z-0" aria-hidden />

      {/* Contraluz — esquina inferior-derecha */}
      <div className="fixed bottom-[-15%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-700/[0.05] blur-[140px] pointer-events-none z-0" aria-hidden />

      {/* Destello cálido — centro-derecha, más pequeño y nítido */}
      <div className="fixed top-[38%] right-[5%] w-[22%] h-[28%] rounded-full bg-amber-400/[0.035] blur-[90px] pointer-events-none z-0" aria-hidden />

      {/* Toque frío-oscuro — borde superior-derecho (equilibrio tonal) */}
      <div className="fixed top-[-8%] right-[-5%] w-[30%] h-[30%] rounded-full bg-slate-700/[0.15] blur-[100px] pointer-events-none z-0" aria-hidden />

      {/* Suelo cálido — base inferior-izquierda, casi invisible */}
      <div className="fixed bottom-[0%] left-[10%] w-[35%] h-[20%] rounded-full bg-amber-600/[0.03] blur-[120px] pointer-events-none z-0" aria-hidden />

      {/* ── MARCO INTERIOR ───────────────────────────────────────────── */}
      <div className="relative z-10 flex flex-col min-h-screen border border-slate-800/70 m-2 md:m-3 rounded-xl">

        {/* Acento dorado — borde superior del marco */}
        <div
          className="absolute top-0 left-14 right-14 h-px pointer-events-none z-10"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.22), transparent)' }}
          aria-hidden
        />

        {/* Header */}
        <div className="shrink-0 border-b border-slate-800/70 bg-slate-950/60 backdrop-blur-md rounded-t-xl">
          <Header />
        </div>

        {/* Main */}
        <main className="flex-1">
          {children}
        </main>

        {/* Footer */}
        <footer className="shrink-0 border-t border-slate-800/60 bg-slate-950 rounded-b-xl py-5 px-6 md:px-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">

            <div>
              <span className="font-display text-base text-amber-400/75 tracking-wide">
                Corte Urbano
              </span>
              <p className="text-[10px] text-slate-600 uppercase tracking-[0.28em] mt-0.5">
                © {new Date().getFullYear()} · Barbería Premium
              </p>
            </div>

            <nav className="flex items-center gap-5 text-[10px] text-slate-500 uppercase tracking-[0.22em]">
              <Link href="/servicios" className="hover:text-amber-400 transition-colors duration-200">Servicios</Link>
              <Link href="/#agenda"   className="hover:text-amber-400 transition-colors duration-200">Reservar</Link>
              <Link href="/login"     className="hover:text-amber-400 transition-colors duration-200">Portal</Link>
            </nav>

          </div>
        </footer>
      </div>
    </div>
  );
}
