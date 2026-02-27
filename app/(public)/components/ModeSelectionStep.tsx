'use client'

import { MapPin, Scissors, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BookingMode = 'presencial' | 'conocido' | 'domicilio'

type ModeCard = {
  mode: BookingMode
  Icon: React.ElementType
  title: string
  subtitle: string
  detail: string
  delay: string
}

const MODES: ModeCard[] = [
  {
    mode: 'presencial',
    Icon: MapPin,
    title: 'Ir a la barbería',
    subtitle: 'EL ESTUDIO',
    detail: 'Encuentra la sede más cercana. Elige tu barbero por distancia.',
    delay: '0ms',
  },
  {
    mode: 'conocido',
    Icon: Scissors,
    title: 'Ya conozco mi barbero',
    subtitle: 'MI BARBERO',
    detail: 'Busca por nombre y reserva directo con quien ya confías.',
    delay: '80ms',
  },
  {
    mode: 'domicilio',
    Icon: Home,
    title: 'Servicio a domicilio',
    subtitle: 'DONDE ESTÉS',
    detail: 'Un maestro barbero llega a tu puerta. Solo ingresa tu dirección.',
    delay: '160ms',
  },
]

type Props = {
  onSelect: (mode: BookingMode) => void
}

export function ModeSelectionStep({ onSelect }: Props) {
  return (
    <div className="space-y-5 md:space-y-6">
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.3em] text-amber-500/60 font-medium">
          Paso 1
        </p>
        <h3 className="text-lg md:text-xl font-semibold text-slate-100 leading-snug">
          ¿Cómo prefieres tu servicio?, escoge una de las siguientes opciones:
        </h3>
      </div>

      {/* Cards: stacked on mobile, 3-col on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {MODES.map(({ mode, Icon, title, subtitle, detail, delay }) => (
          <button
            key={mode}
            type="button"
            onClick={() => onSelect(mode)}
            style={{ animationDelay: delay }}
            className={cn(
              'group relative flex overflow-hidden text-left',
              'rounded-xl md:rounded-2xl border border-slate-800/80 bg-slate-900/50',
              // Mobile: row layout; sm+: column
              'flex-row sm:flex-col gap-4 sm:gap-0',
              'items-center sm:items-start',
              'p-4 sm:p-5 md:p-6',
              // Touch targets
              'min-h-[72px] sm:min-h-[196px]',
              // Transitions
              'transition-all duration-300 ease-out',
              'hover:border-amber-500/50 hover:bg-slate-900',
              'hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-amber-500/10'
            )}
          >
            {/* Ambient glow wash */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-600/0 group-hover:from-amber-500/8 group-hover:to-amber-600/3 transition-all duration-500 pointer-events-none" />

            {/* Top border shimmer */}
            <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-amber-500/0 to-transparent group-hover:via-amber-500/50 transition-all duration-500 pointer-events-none" />

            {/* Icon container */}
            <div
              className={cn(
                'relative shrink-0 flex items-center justify-center',
                'h-11 w-11 sm:h-12 sm:w-12 rounded-xl',
                'bg-slate-800/80 border border-slate-700/50',
                'group-hover:bg-amber-500/10 group-hover:border-amber-500/25',
                'transition-all duration-300',
                'sm:mb-4'
              )}
            >
              <Icon
                strokeWidth={1.5}
                className="h-5 w-5 text-slate-500 group-hover:text-amber-400 transition-colors duration-300"
              />
            </div>

            {/* Text */}
            <div className="relative flex-1 sm:flex-none min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-slate-600 group-hover:text-amber-500/60 transition-colors duration-300 mb-1">
                {subtitle}
              </p>
              <p className="text-sm sm:text-[0.9rem] font-semibold text-slate-200 group-hover:text-white transition-colors duration-200 leading-snug">
                {title}
              </p>
              <p className="hidden sm:block mt-2 text-xs leading-relaxed text-slate-500 group-hover:text-slate-400 transition-colors duration-300">
                {detail}
              </p>
            </div>

            {/* Arrow — mobile */}
            <div className="relative sm:hidden ml-auto shrink-0 text-slate-700 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all duration-200">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
              >
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* CTA — desktop, fades in on hover */}
            <div className="relative hidden sm:flex items-center gap-1.5 mt-auto pt-4 text-xs font-semibold text-amber-500/0 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all duration-300">
              Seleccionar
              <svg
                width="14"
                height="14"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
              >
                <path
                  d="M3 8h10M9 4l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </button>
        ))}
      </div>

      <p className="text-center text-[11px] text-slate-700">
        Todos los modos incluyen confirmación inmediata · Sin costo adicional
      </p>
    </div>
  )
}
