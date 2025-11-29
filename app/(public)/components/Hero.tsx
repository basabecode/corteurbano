import Image from 'next/image';

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl md:rounded-3xl border border-slate-900 bg-slate-950 p-6 md:p-10 text-slate-100 shadow-2xl shadow-black/60 animate-fade-in min-h-[500px] md:min-h-[400px]">
      {/* Background Image - Ajustado para móvil */}
      <div className="absolute inset-0 opacity-30 md:opacity-40">
        <Image
          src="/images/hero.png"
          alt="BarberShop Interior"
          fill
          className="object-cover object-[center_30%] md:object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b md:bg-gradient-to-r from-slate-950 via-slate-950/90 md:via-slate-950/80 to-slate-950/70 md:to-transparent" />
      </div>

      {/* Contenido - Optimizado para móvil */}
      <div className="relative backdrop-blur-sm bg-slate-950/80 md:bg-slate-950/70 p-6 md:p-8 rounded-xl md:rounded-2xl max-w-full md:max-w-xl space-y-4 md:space-y-6">
        <p className="text-xs md:text-sm uppercase tracking-[0.3em] md:tracking-[0.4em] text-amber-400 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          BarberKing
        </p>
        <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-tight animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Experiencia Dark Luxury para hombres con estilo.
        </h1>
        <p className="text-sm md:text-lg text-slate-300 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          Citas personalizadas, barberos expertos y un ambiente diseñado para que domines la semana con confianza.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <a
            href="#agenda"
            className="text-center rounded-full bg-amber-500 px-5 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-semibold uppercase tracking-wide text-slate-950 shadow-lg shadow-amber-500/30 transition-all duration-300 hover:bg-amber-400 hover:scale-105 hover:shadow-xl hover:shadow-amber-500/50"
          >
            Reservar ahora
          </a>
          <a
            href="#servicios"
            className="text-center rounded-full border border-slate-700 px-5 md:px-6 py-2.5 md:py-3 text-xs md:text-sm font-semibold uppercase tracking-wide text-slate-200 transition-all duration-300 hover:border-amber-500 hover:bg-slate-900 hover:text-amber-400"
          >
            Ver servicios
          </a>
        </div>
      </div>
    </section>
  );
}



