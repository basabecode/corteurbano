'use client';

import Image from 'next/image';

type ServiceCardProps = {
  serviceId: string;
  name: string;
  duration: number;
  price: number;
  imageUrl?: string;
  onReserve?: (serviceId: string) => void;
};

export function ServiceCard({ serviceId, name, duration, price, imageUrl, onReserve }: ServiceCardProps) {
  const handleReserve = () => {
    if (onReserve) {
      onReserve(serviceId);
    } else {
      // Fallback: solo hacer scroll si no hay callback
      const agendaSection = document.getElementById('agenda');
      if (agendaSection) {
        agendaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <article className="group relative flex flex-col gap-3 md:gap-4 rounded-xl md:rounded-2xl border border-slate-800 bg-slate-900/40 p-4 md:p-6 shadow-lg shadow-black/40 transition-all duration-300 hover:border-amber-500 hover:shadow-2xl hover:shadow-amber-500/10">
      {imageUrl ? (
        <div className="relative h-32 md:h-40 w-full overflow-hidden rounded-lg md:rounded-xl">
          <Image src={imageUrl} alt={name} fill className="object-cover transition duration-500 group-hover:scale-105" />
        </div>
      ) : (
        <div className="h-32 md:h-40 rounded-lg md:rounded-xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 flex items-center justify-center">
          <div className="text-slate-600 text-3xl md:text-4xl">✂️</div>
        </div>
      )}

      <div className="flex flex-col gap-1.5 md:gap-2 text-slate-100">
        <header className="flex items-center justify-between">
          <h3 className="text-base md:text-xl font-semibold tracking-wide">{name}</h3>
          <span className="text-base md:text-lg font-semibold text-amber-400">${price.toFixed(2)}</span>
        </header>
        <p className="text-xs md:text-sm text-slate-400">{duration} min · Estilo signature BarberKing</p>
      </div>

      <button
        onClick={handleReserve}
        className="mt-auto rounded-lg md:rounded-xl bg-amber-500 px-3 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold uppercase tracking-wide text-slate-950 shadow-lg shadow-amber-500/30 transition-all duration-300 hover:bg-amber-400 hover:scale-105 hover:shadow-xl hover:shadow-amber-500/40"
      >
        Reservar servicio
      </button>
    </article>
  );
}







