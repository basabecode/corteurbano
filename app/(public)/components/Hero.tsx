import Image from 'next/image';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl md:rounded-3xl min-h-[540px] md:min-h-[520px] animate-fade-in">
      {/* ── Imagen de fondo ─────────────────────────── */}
      <div className="absolute inset-0">
        <div className="relative h-full w-full md:hidden">
          <Image
            src="/images/hero-mobile.png"
            alt="Interior barbería Corte Urbano"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative hidden md:block h-full w-full">
          <Image
            src="/images/hero.png"
            alt="Interior barbería Corte Urbano"
            fill
            className="object-cover object-center"
            priority
          />
        </div>

        {/* Gradientes: más oscuro en móvil, split en desktop */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20 md:hidden" />
        <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-transparent" />
        {/* Viñeta inferior desktop */}
        <div className="absolute bottom-0 left-0 right-0 h-32 hidden md:block bg-gradient-to-t from-slate-950 to-transparent" />
      </div>

      {/* ── Contenido ────────────────────────────────── */}
      <div className="relative z-10 flex flex-col justify-end md:justify-center h-full min-h-[540px] md:min-h-[520px] px-6 pb-10 pt-20 md:px-12 md:py-16 max-w-2xl">

        {/* Etiqueta superior */}
        <p
          className="text-xs uppercase tracking-[0.4em] text-amber-400/80 mb-4 animate-fade-in"
          style={{ animationDelay: '0.05s' }}
        >
          Corte Urbano · Barberías
        </p>

        {/* Línea decorativa */}
        <div className="gold-rule mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }} />

        {/* Titular principal — Cormorant Garamond */}
        <h1
          className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight text-slate-50 mb-6 animate-fade-in"
          style={{ animationDelay: '0.15s' }}
        >
          El corte que<br />
          <span className="text-shimmer">define tu estilo.</span>
        </h1>

        {/* Subtítulo — DM Sans, más delgado */}
        <p
          className="text-sm md:text-base text-slate-300/90 font-light leading-relaxed max-w-md mb-8 animate-fade-in"
          style={{ animationDelay: '0.25s' }}
        >
          Barberos expertos, citas sin espera y un acabado que habla por ti.
          Reserva en menos de 2 minutos.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row gap-3 mb-10 animate-fade-in"
          style={{ animationDelay: '0.35s' }}
        >
          <a
            href="#agenda"
            className="text-center rounded-full bg-amber-500 px-7 py-3 text-sm font-semibold uppercase tracking-widest text-slate-950 shadow-lg shadow-amber-500/30 transition-all duration-300 hover:bg-amber-400 hover:shadow-xl hover:shadow-amber-500/40 hover:-translate-y-0.5"
          >
            Reservar ahora
          </a>
          <Link
            href="/servicios"
            className="text-center rounded-full border border-slate-600 px-7 py-3 text-sm font-semibold uppercase tracking-widest text-slate-200 transition-all duration-300 hover:border-amber-500/60 hover:text-amber-400 hover:bg-slate-900/60"
          >
            Ver servicios
          </Link>
        </div>

        {/* Stats bar */}
        <div
          className="flex items-center gap-6 animate-fade-in"
          style={{ animationDelay: '0.45s' }}
        >
          {[
            { value: '500+', label: 'Clientes satisfechos' },
            { value: '5★', label: 'Valoración media' },
            { value: '< 2 min', label: 'Para reservar' },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col">
              <span className="font-display text-xl font-bold text-amber-400 leading-none">{value}</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
