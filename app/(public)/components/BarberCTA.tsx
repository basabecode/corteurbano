'use client'

import Link from 'next/link'
import { useState } from 'react'

const benefits = [
  {
    title: 'Agenda organizada, sin papel',
    description:
      'Visualiza tus citas del día, la semana y el mes en un panel limpio, sin ruido visual. Sin anotaciones en papel, sin llamadas para confirmar. Todo en un solo lugar.',
  },
  {
    title: 'Notificaciones directas a tu Telegram',
    description:
      'Cuando se confirme, cancele o complete una cita tuya, recibes un mensaje instantáneo en Telegram. Siempre informado. Nunca te tomas por sorpresa.',
  },
  {
    title: 'Tu panel desde cualquier dispositivo',
    description:
      'Funciona igual en móvil, tablet y computador. Revisa tu agenda en casa antes de llegar, o desde la silla entre un cliente y otro.',
  },
  {
    title: 'Historial real de tu trabajo',
    description:
      'Cada cita completada queda registrada. Con el tiempo puedes ver tu carga de trabajo, el volumen de clientes atendidos y cómo crece tu actividad.',
  },
  {
    title: 'Tu información solo la ves tú',
    description:
      'El sistema aplica políticas de seguridad a nivel de base de datos: ningún otro barbero ve tus citas, tus clientes ni tu agenda. Acceso estrictamente individual.',
  },
  {
    title: 'Sin fricción administrativa',
    description:
      'El cliente reserva, el sistema notifica al administrador y te asigna la cita. Tú llegas y trabajas. Ningún paso intermedio que te quite tiempo.',
  },
]

function BenefitItem({
  title,
  description,
  index,
}: {
  title: string
  description: string
  index: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-slate-800/50 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-start justify-between gap-6 py-4 text-left"
        aria-expanded={open}
      >
        <div className="flex items-baseline gap-4 min-w-0">
          <span
            className="shrink-0 text-[10px] uppercase tracking-[0.3em] tabular-nums transition-colors duration-200"
            style={{ color: open ? '#f59e0b' : '#475569' }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <span
            className="text-sm font-medium leading-snug tracking-wide transition-colors duration-200"
            style={{ color: open ? '#f1f5f9' : '#94a3b8' }}
          >
            {title}
          </span>
        </div>
        <span
          className="shrink-0 text-base leading-none select-none transition-all duration-300"
          style={{
            color: open ? '#f59e0b' : '#475569',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            display: 'inline-block',
          }}
          aria-hidden
        >
          +
        </span>
      </button>

      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? '160px' : '0px' }}
      >
        <p className="pb-4 pl-9 text-xs text-slate-500 leading-relaxed max-w-lg">
          {description}
        </p>
      </div>
    </div>
  )
}

export function BarberCTA() {
  const [expanded, setExpanded] = useState(false)

  return (
    // Sin overflow-hidden → el borde se estira con el contenido naturalmente
    <section className="rounded-2xl border border-amber-500/20 bg-slate-900/30 px-6 py-10 md:px-10 md:py-12">

      {/* Label */}
      <p className="text-[11px] uppercase tracking-[0.38em] text-amber-500/55 mb-5">
        Para barberos
      </p>

      {/* Título + toggle */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="group w-full text-left mb-5"
        aria-expanded={expanded}
        aria-controls="barber-benefits"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            className="font-bold text-slate-100 leading-[1.06] tracking-tight transition-colors duration-200 group-hover:text-amber-50"
            style={{ fontSize: 'clamp(1.75rem, 5vw, 3rem)' }}
          >
            Trabaja con la{' '}
            <span className="text-amber-400">tecnología</span>{' '}
            que mereces.
          </h2>
          <span
            className="shrink-0 mt-2 text-xl font-light leading-none select-none text-amber-500/60 group-hover:text-amber-400 transition-all duration-300"
            style={{
              transform: expanded ? 'rotate(45deg)' : 'rotate(0deg)',
              display: 'inline-block',
            }}
            aria-hidden
          >
            +
          </span>
        </div>
      </button>

      {/* Subtítulo */}
      <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-xl mb-7">
        Corte Urbano gestiona la logística para que tú solo pienses en el
        corte. Panel propio, notificaciones en tiempo real y cero papel.
      </p>

      {/* CTA — siempre visible, sin margen inferior para que el colapsable arranque pegado */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Link
          href="/registro?tipo=barbero"
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-950 hover:bg-amber-400 active:scale-[0.98] transition-all duration-200 shadow-md shadow-amber-500/20 w-full sm:w-auto"
        >
          Registrarme como barbero
          <span
            className="inline-block transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          >
            →
          </span>
        </Link>
        <p className="text-slate-600 text-xs text-center sm:text-left">
          Gratis ·{' '}
          <Link
            href="/login"
            className="text-slate-500 hover:text-amber-400 transition-colors underline underline-offset-2 decoration-slate-700"
          >
            Ya tengo cuenta
          </Link>
        </p>
      </div>

      {/* Colapsable — overflow-hidden aquí, NO en el section */}
      <div
        id="barber-benefits"
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{ maxHeight: expanded ? '1400px' : '0px' }}
      >
        {/* Padding interior incluido dentro del colapsable para que no quede espacio al cerrar */}
        <div className="pt-8">
          <div className="h-px bg-slate-800/60 w-full mb-2" />

          {benefits.map((item, i) => (
            <BenefitItem
              key={item.title}
              title={item.title}
              description={item.description}
              index={i}
            />
          ))}

          <button
            onClick={() => setExpanded(false)}
            className="mt-5 text-[10px] uppercase tracking-[0.3em] text-slate-700 hover:text-slate-500 transition-colors"
          >
            Cerrar ↑
          </button>
        </div>
      </div>

    </section>
  )
}
