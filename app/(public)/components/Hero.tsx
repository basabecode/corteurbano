export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-slate-900 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 p-10 text-slate-100 shadow-2xl shadow-black/60">
      {/* Placeholder background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>
      <div className="relative backdrop-blur-sm bg-slate-950/70 p-8 rounded-2xl max-w-xl space-y-6">
        <p className="text-sm uppercase tracking-[0.4em] text-amber-400">BarberKing</p>
        <h1 className="text-4xl md:text-5xl font-bold leading-tight">
          Experiencia Dark Luxury para hombres con estilo.
        </h1>
        <p className="text-slate-300 text-lg">
          Citas personalizadas, barberos expertos y un ambiente diseñado para que domines la semana con confianza.
        </p>
        <div className="flex flex-wrap gap-4">
          <a
            href="#agenda"
            className="rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-950 shadow-lg shadow-amber-500/30 transition hover:bg-amber-400"
          >
            Reservar ahora
          </a>
          <a href="#servicios" className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-200">
            Ver servicios
          </a>
        </div>
      </div>
    </section>
  );
}


