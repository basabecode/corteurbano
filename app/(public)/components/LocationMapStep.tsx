'use client';

import { useEffect, useState } from 'react';
import { MapPin, Navigation, CheckCircle2 } from 'lucide-react';
import { haversineDistance, getUserLocation } from '@/lib/geo-utils';
import { ZONAS_CALI } from '@/lib/location-data';
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

type UserCoords = { lat: number; lng: number };
type BarberWithDist = Barber & { distance: number };

export function LocationMapStep({ barbers, onSelect, onBack }: Props) {
  const [userCoords, setUserCoords] = useState<UserCoords | null>(null);
  const [geoError, setGeoError] = useState(false);
  const [geoLoading, setGeoLoading] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

  const mappedBarbers = barbers.filter(b => b.lat !== null && b.lng !== null);

  useEffect(() => {
    getUserLocation()
      .then(coords => {
        setUserCoords({ lat: coords.latitude, lng: coords.longitude });
        setGeoLoading(false);
      })
      .catch(() => {
        setGeoError(true);
        setGeoLoading(false);
      });
  }, []);

  const effectiveCoords: UserCoords | null = userCoords ?? (
    selectedZoneId
      ? (() => {
          const zone = ZONAS_CALI.find(z => z.id === selectedZoneId);
          return zone ? { lat: zone.lat, lng: zone.lng } : null;
        })()
      : null
  );

  const barbersWithDist: BarberWithDist[] = effectiveCoords
    ? mappedBarbers
        .map(b => ({
          ...b,
          distance: haversineDistance(effectiveCoords.lat, effectiveCoords.lng, b.lat!, b.lng!)
        }))
        .sort((a, b) => a.distance - b.distance)
    : mappedBarbers.map(b => ({ ...b, distance: 0 }));

  const noMappedBarbers = mappedBarbers.length === 0;

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
          Barberos cerca de ti
        </h3>
      </div>

      {/* Geo loading */}
      {geoLoading && (
        <div className="flex items-center gap-3 rounded-xl border border-slate-800/60 bg-slate-900/30 px-4 py-3">
          <div className="h-4 w-4 rounded-full border-2 border-amber-500 border-t-transparent animate-spin shrink-0" />
          <p className="text-sm text-slate-400">Detectando tu ubicación…</p>
        </div>
      )}

      {/* Geo success */}
      {!geoLoading && userCoords && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
          <Navigation className="h-4 w-4 text-emerald-400 shrink-0" strokeWidth={1.5} />
          <p className="text-sm text-emerald-300">
            Ubicación detectada — resultados ordenados por proximidad
          </p>
        </div>
      )}

      {/* Zone fallback picker */}
      {!geoLoading && geoError && (
        <div className="space-y-3 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-amber-500/60 mt-0.5 shrink-0" strokeWidth={1.5} />
            <p className="text-sm text-slate-400">
              Sin acceso a tu ubicación. Elige tu zona en Cali:
            </p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {ZONAS_CALI.map(zone => (
              <button
                key={zone.id}
                type="button"
                onClick={() => setSelectedZoneId(zone.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-all duration-200',
                  selectedZoneId === zone.id
                    ? 'border-amber-500/60 bg-amber-500/10 text-amber-400 shadow-sm shadow-amber-500/10'
                    : 'border-slate-800 text-slate-400 hover:border-amber-500/30 hover:text-amber-400/80 hover:bg-slate-900/60'
                )}
              >
                {selectedZoneId === zone.id && (
                  <CheckCircle2 className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                )}
                <span className="truncate">{zone.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No mapped barbers empty state */}
      {noMappedBarbers && (
        <div className="rounded-xl border border-slate-800/40 bg-slate-900/20 p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900">
            <MapPin className="h-6 w-6 text-slate-600" strokeWidth={1.5} />
          </div>
          <p className="text-sm text-slate-500 font-medium">Sin barberos con ubicación</p>
          <p className="mt-1 text-xs text-slate-700">
            El admin puede agregar coordenadas desde el panel de barberos.
          </p>
        </div>
      )}

      {/* Barber distance list */}
      {!noMappedBarbers && effectiveCoords && (
        <div className="space-y-2.5">
          {barbersWithDist.map((barber, i) => {
            const isSelected = selectedBarber?.id === barber.id;
            return (
              <button
                key={barber.id}
                type="button"
                onClick={() => setSelectedBarber(isSelected ? null : barber)}
                style={{ animationDelay: `${i * 40}ms` }}
                className={cn(
                  'group relative w-full flex items-center gap-4 rounded-xl border p-5 text-left',
                  'transition-all duration-400 ease-out overflow-hidden backdrop-blur-sm',
                  isSelected
                    ? 'border-amber-500 bg-amber-500/10 shadow-[0_4px_20px_rgba(245,158,11,0.15)] scale-[1.01]'
                    : 'border-slate-800 bg-slate-900/40 hover:border-amber-500/50 hover:bg-slate-900/80 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]',
                )}
              >
                {/* Selection glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 to-transparent group-hover:from-amber-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
                {isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-transparent pointer-events-none" />
                )}

                {/* Distance rank badge */}
                <div className={cn(
                  'relative shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-200',
                  i === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700/50',
                )}>
                  {i + 1}
                </div>

                {/* Avatar */}
                {barber.photo_url ? (
                  <div className={cn(
                    'h-12 w-12 shrink-0 rounded-full overflow-hidden border-2 transition-colors duration-300',
                    isSelected ? 'border-amber-500/50' : 'border-slate-700 group-hover:border-amber-500/30'
                  )}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={barber.photo_url} alt={barber.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className={cn(
                    'h-12 w-12 shrink-0 rounded-full flex items-center justify-center border-2 transition-colors duration-300',
                    isSelected
                      ? 'border-amber-500/50 bg-amber-500/15'
                      : 'border-amber-500/20 bg-amber-500/10 group-hover:border-amber-500/35'
                  )}>
                    <span className="text-base font-bold text-amber-400">
                      {barber.name[0].toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Info */}
                <div className="relative flex-1 min-w-0">
                  <p className={cn(
                    'font-semibold text-sm transition-colors duration-200 truncate',
                    isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                  )}>
                    {barber.name}
                    {i === 0 && (
                      <span className="ml-2 text-[9px] font-bold uppercase tracking-wider text-amber-500/80">
                        Más cercano
                      </span>
                    )}
                  </p>
                  {barber.specialty && (
                    <p className="text-xs text-slate-500 truncate mt-0.5">{barber.specialty}</p>
                  )}
                  {barber.address_label && (
                    <p className="flex items-center gap-1 text-[11px] text-slate-600 mt-0.5 truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {barber.address_label}
                    </p>
                  )}
                </div>

                {/* Distance badge */}
                <div className="relative shrink-0 text-right">
                  <span className={cn(
                    'inline-block rounded-full border px-2.5 py-1 text-xs font-semibold tabular-nums transition-all duration-200',
                    isSelected
                      ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                      : 'border-slate-700/60 bg-slate-800/60 text-slate-400 group-hover:border-amber-500/30 group-hover:text-amber-400/70'
                  )}>
                    ~{barber.distance.toFixed(1)} km
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Fallback grid (no effective coords, no geo error) */}
      {!noMappedBarbers && !effectiveCoords && !geoLoading && !geoError && (
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
          {mappedBarbers.map(barber => (
            <button
              key={barber.id}
              type="button"
              onClick={() => setSelectedBarber(barber)}
              className={cn(
                'group relative overflow-hidden flex flex-col items-center gap-3 rounded-xl border bg-slate-900/40 backdrop-blur-sm p-5 text-center',
                'min-h-[140px] transition-all duration-500 ease-out hover:-translate-y-1',
                selectedBarber?.id === barber.id
                  ? 'border-amber-500 bg-amber-500/10 shadow-[0_4px_20px_rgba(245,158,11,0.15)]'
                  : 'border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]'
              )}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-amber-500/0 to-transparent group-hover:from-amber-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />
              <div className="relative z-10 h-14 w-14 rounded-full bg-amber-500/10 shadow-inner flex items-center justify-center border-2 border-amber-500/30 group-hover:border-amber-500/60 transition-colors duration-300">
                <span className="text-base font-bold text-amber-400">{barber.name[0].toUpperCase()}</span>
              </div>
              <div className="relative z-10 w-full">
                <p className="text-sm font-bold text-slate-200 group-hover:text-amber-400 transition-colors duration-300 truncate w-full">
                  {barber.name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Confirm CTA — sticky feel at bottom */}
      {selectedBarber && (
        <div className="relative rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/8 to-amber-600/3 p-4 space-y-3">
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
          <div className="flex items-center gap-3">
            {selectedBarber.photo_url ? (
              <div className="h-9 w-9 shrink-0 rounded-full overflow-hidden border border-amber-500/40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={selectedBarber.photo_url} alt={selectedBarber.name} className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="h-9 w-9 shrink-0 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                <span className="text-sm font-bold text-amber-400">{selectedBarber.name[0]}</span>
              </div>
            )}
            <div>
              <p className="text-xs text-slate-400">Barbero seleccionado</p>
              <p className="text-sm font-semibold text-amber-300">{selectedBarber.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onSelect(selectedBarber)}
            className={cn(
              'w-full rounded-lg bg-amber-500 py-3 text-sm font-semibold text-slate-950',
              'hover:bg-amber-400 active:scale-[0.98] transition-all duration-200',
              'shadow-lg shadow-amber-500/20',
            )}
          >
            Continuar con {selectedBarber.name} →
          </button>
        </div>
      )}
    </div>
  );
}
