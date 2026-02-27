'use client';

import { useState, useMemo } from 'react';
import { Search, MapPin, Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';

type Barber = {
  id: string;
  name: string;
  photo_url: string | null;
  specialty: string | null;
  lat: number | null;
  lng: number | null;
  address_label: string | null;
  offers_domicilio: boolean;
};

type Props = {
  barbers: Barber[];
  onSelect: (barber: Barber) => void;
  onBack: () => void;
};

export function BarberSearchStep({ barbers, onSelect, onBack }: Props) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return barbers;
    return barbers.filter(
      b =>
        b.name.toLowerCase().includes(q) ||
        (b.specialty ?? '').toLowerCase().includes(q)
    );
  }, [barbers, query]);

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div>
        <button
          type="button"
          onClick={onBack}
          className="group flex items-center gap-2 text-xs text-slate-500 hover:text-amber-400 transition-colors duration-200"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden
            className="group-hover:-translate-x-0.5 transition-transform duration-200">
            <path d="M13 8H3M7 4L3 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Volver a modos
        </button>
        <h3 className="mt-3 text-lg md:text-xl font-semibold text-slate-100">
          Elige tu barbero
        </h3>
        <p className="mt-0.5 text-xs text-slate-500">
          {barbers.length} barbero{barbers.length !== 1 ? 's' : ''} disponible{barbers.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Search input */}
      <div className={cn(
        'relative flex items-center rounded-xl border bg-slate-950/80 transition-all duration-200',
        focused ? 'border-amber-500/60 shadow-lg shadow-amber-500/5' : 'border-slate-800',
      )}>
        <Search className={cn(
          'absolute left-3.5 h-4 w-4 transition-colors duration-200 pointer-events-none',
          focused ? 'text-amber-400' : 'text-slate-600'
        )} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Nombre o especialidad..."
          className="w-full bg-transparent pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 text-slate-600 hover:text-slate-300 transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-10 text-center">
          <Scissors className="h-8 w-8 text-slate-700 mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-sm text-slate-500">No encontramos barberos con ese nombre</p>
          <button
            type="button"
            onClick={() => setQuery('')}
            className="mt-3 text-xs text-amber-500/70 hover:text-amber-400 transition-colors underline underline-offset-2"
          >
            Ver todos los barberos
          </button>
        </div>
      )}

      {/* Barber grid — 2 col mobile, 3 col sm+ */}
      {filtered.length > 0 && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
          {filtered.map((barber, i) => (
            <button
              key={barber.id}
              type="button"
              onClick={() => onSelect(barber)}
              style={{ animationDelay: `${i * 40}ms` }}
              className={cn(
                'group relative flex flex-col items-center gap-3 overflow-hidden',
                'rounded-xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm',
                'p-5 text-center',
                'min-h-[140px]', // touch target
                'transition-all duration-500 ease-out',
                'hover:border-amber-500/50 hover:bg-slate-900/80',
                'hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:shadow-amber-500/10',
              )}
            >
              {/* Hover wash */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/0 to-transparent group-hover:from-amber-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

              {/* Avatar */}
              {barber.photo_url ? (
                <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-slate-700 group-hover:border-amber-500/40 transition-colors duration-300 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={barber.photo_url}
                    alt={barber.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="relative h-14 w-14 rounded-full shrink-0 flex items-center justify-center border-2 border-amber-500/20 bg-gradient-to-br from-amber-500/15 to-amber-600/5 group-hover:border-amber-500/40 transition-colors duration-300">
                  <span className="text-xl font-bold text-amber-400/80 group-hover:text-amber-400 transition-colors duration-200">
                    {barber.name[0].toUpperCase()}
                  </span>
                </div>
              )}

              {/* Info */}
              <div className="relative z-10 w-full min-w-0 flex flex-col items-center">
                <p className="text-sm font-bold text-slate-200 group-hover:text-amber-400 transition-colors duration-300 truncate w-full">
                  {barber.name}
                </p>
                {barber.specialty && (
                  <p className="text-[11px] font-medium text-slate-500 group-hover:text-slate-300 transition-colors mt-1 truncate w-full">
                    {barber.specialty}
                  </p>
                )}
                {barber.address_label && (
                  <p className="flex items-center justify-center gap-0.5 text-[10px] text-slate-700 mt-1 truncate">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                    {barber.address_label}
                  </p>
                )}
                {barber.offers_domicilio && (
                  <span className="inline-block mt-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 px-1.5 py-px text-[9px] font-medium text-blue-400">
                    Domicilio
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
