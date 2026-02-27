'use client'

import { cn } from '@/lib/utils'

export type BookingMode = 'presencial' | 'conocido' | 'domicilio'

type ModeCard = {
  mode: BookingMode
  number: string
  title: string
  subtitle: string
  detail: string
  delay: string
}

const MODES: ModeCard[] = [
  {
    mode: 'presencial',
    number: '01',
    title: 'Ir a la barbería',
    subtitle: 'EL ESTUDIO',
    detail: 'Encuentra la sede más cercana. Elige tu barbero por distancia.',
    delay: '0ms',
  },
  {
    mode: 'conocido',
    number: '02',
    title: 'Ya conozco mi barbero',
    subtitle: 'MI BARBERO',
    detail: 'Busca por nombre y reserva directo con quien ya confías.',
    delay: '80ms',
  },
  {
    mode: 'domicilio',
    number: '03',
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
        {MODES.map(({ mode, number, title, subtitle, detail, delay }) => (
          <button
            key={mode}
            type="button"
            onClick={() => onSelect(mode)}
            style={{ animationDelay: delay }}
            className={cn(
              'group relative flex overflow-hidden text-left',
              'rounded-xl md:rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm',
              // Mobile: row layout; sm+: column
              'flex-row sm:flex-col gap-4 sm:gap-0',
              'items-center sm:items-start',
              'p-5 sm:p-6 md:p-7',
              // Touch targets
              'min-h-[72px] sm:min-h-[220px]',
              // Transitions
              'transition-all duration-500 ease-out hover:-translate-y-1',
              'hover:border-amber-500/50 hover:bg-slate-900/80',
              'hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)] hover:shadow-amber-500/10'
            )}
          >
            {/* Ambient glow wash */}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/0 to-transparent group-hover:from-amber-500/5 opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

            {/* Top border shimmer */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-700 pointer-events-none" />

            {/* Number indicator */}
            <div
              className={cn(
                'relative z-10 shrink-0 flex items-center justify-center',
                'h-11 w-11 sm:h-14 sm:w-14 rounded-xl',
                'bg-slate-800/80 border border-slate-700/50',
                'group-hover:bg-amber-500/10 group-hover:border-amber-500/30 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.15)]',
                'transition-all duration-500',
                'sm:mb-5 font-black text-xl sm:text-2xl text-slate-500 group-hover:text-amber-400 tracking-tighter'
              )}
            >
              {number}
            </div>

            {/* Text */}
            <div className="relative z-10 flex-1 sm:flex-none min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-slate-500 group-hover:text-amber-500/80 transition-colors duration-300 mb-1.5">
                {subtitle}
              </p>
              <p className="text-sm sm:text-base font-bold text-slate-200 group-hover:text-amber-400 transition-colors duration-300 leading-snug drop-shadow-sm">
                {title}
              </p>
              <p className="hidden sm:block mt-2.5 text-xs leading-relaxed text-slate-500 group-hover:text-slate-300 transition-colors duration-300">
                {detail}
              </p>
            </div>

            {/* Arrow — mobile */}
            <div className="relative z-10 sm:hidden ml-auto shrink-0 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-300">
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
            <div className="relative z-10 hidden sm:flex items-center gap-1.5 mt-auto pt-5 text-xs font-bold uppercase tracking-widest text-slate-500 transition-all duration-300 group-hover:text-amber-500">
              Seleccionar
              <span className="text-base opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">→</span>
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
