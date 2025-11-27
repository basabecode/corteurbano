import Image from 'next/image';

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-900 bg-slate-950 p-10 text-slate-100 shadow-2xl shadow-black/60 animate-fade-in">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-40">
        <Image
          src="/images/hero.png"
          alt="BarberShop Interior"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent" />
      </div>
      <div className="relative backdrop-blur-sm bg-slate-950/70 p-8 rounded-2xl max-w-xl space-y-6">
        <p className="text-sm uppercase tracking-[0.4em] text-amber-400 animate-fade-in" style={{ animationDelay: '0.1s' }}>BarberKing</p>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Experiencia Dark Luxury para hombres con estilo.
        </h1>
        <p className="text-slate-300 text-lg animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Citas personalizadas, barberos expertos y un ambiente diseñado para que domines la semana con confianza.
        </p>
        <div className="flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <a
            href="#agenda"
            className="rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-950 shadow-lg shadow-amber-500/30 transition-all duration-300 hover:bg-amber-400 hover:scale-105 hover:shadow-xl hover:shadow-amber-500/50"
          >
            Reservar ahora
          </a>
          <a
            href="#servicios"
            className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-200 transition-all duration-300 hover:border-amber-500 hover:bg-slate-900 hover:text-amber-400"
          >
            Ver servicios
          </a>
        </div>
      </div>
    </section>
  );
}


