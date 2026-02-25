'use client';

import Image from 'next/image';
import { formatCOP } from '@/lib/format-currency';

type ServiceCardProps = {
  serviceId: string;
  name: string;
  duration: number;
  price: number;
  imageUrl?: string;
  index?: number;
  onReserve?: (serviceId: string) => void;
};

export function ServiceCard({ serviceId, name, duration, price, imageUrl, index = 0, onReserve }: ServiceCardProps) {
  const handleReserve = () => {
    if (onReserve) {
      onReserve(serviceId);
    } else {
      const el = document.getElementById('agenda');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const num = String(index + 1).padStart(2, '0');

  return (
    <article className="group relative flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/30 overflow-hidden transition-all duration-500 hover:border-yellow-500/40 hover:bg-slate-900/60 hover:shadow-2xl hover:shadow-yellow-500/5 hover:-translate-y-0.5">
      {/* Imagen / placeholder */}
      <div className="relative aspect-square w-full overflow-hidden shrink-0 bg-slate-800/50 p-4">
        {imageUrl ? (
          <div className="relative h-full w-full">
            <Image
              src={imageUrl}
              alt={name}
              fill
              className="object-contain object-center drop-shadow-xl transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-slate-800/70 to-slate-900/70 flex items-end p-4 rounded-xl">
            <span className="font-display text-6xl font-bold text-slate-700/50 leading-none select-none">
              {num}
            </span>
          </div>
        )}
        {/* Overlay sutil con número cuando hay imagen */}
        {imageUrl && (
          <div className="absolute bottom-3 left-4 z-10">
            <span className="font-display text-xs font-semibold tracking-[0.3em] text-yellow-400/70 uppercase">
              {num}
            </span>
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent z-0" />
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-5 md:p-6 gap-4">
        {/* Nombre + precio */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl md:text-2xl font-semibold leading-tight text-slate-100 group-hover:text-white transition-colors">
            {name}
          </h3>
          <span className="font-display text-xl font-bold text-yellow-400 shrink-0 leading-tight">
            {formatCOP(price)}
          </span>
        </div>

        {/* Duración */}
        <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-widest">
          <span className="inline-block w-4 h-px bg-yellow-500/40" />
          {duration} min
        </div>

        {/* CTA */}
        <button
          onClick={handleReserve}
          className="mt-auto w-full rounded-xl bg-yellow-500/10 border border-yellow-500/20 px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-yellow-400 transition-all duration-300 hover:bg-yellow-500 hover:text-slate-950 hover:border-yellow-500 hover:shadow-lg hover:shadow-yellow-500/20"
        >
          Reservar servicio
        </button>
      </div>
    </article>
  );
}
