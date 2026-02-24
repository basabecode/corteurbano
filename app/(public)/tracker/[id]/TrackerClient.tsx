'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { motion, type Variants } from 'framer-motion';
import {
  CheckCircle2,
  Clock,
  Scissors,
  Flag,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { getCurrentStepIndex } from '@/lib/tracker-utils';

interface AppointmentData {
  id: string;
  status: string;
  start_time: string;
  created_at: string;
  services: {
    name: string;
    duration_minutes: number;
    price: number;
  };
  profiles: {
    full_name: string;
  };
}

interface TrackerClientProps {
  initialAppointment: AppointmentData;
}

const STEPS = [
  { id: 'pending', title: 'SOLICITUD RECIBIDA', icon: Clock, description: 'Tu cita ha sido registrada. Esperando confirmación del barbero.' },
  { id: 'confirmed', title: 'CITA CONFIRMADA', icon: CheckCircle2, description: 'Todo listo. El barbero te espera en el horario acordado.' },
  { id: 'in_service', title: 'EN SERVICIO', icon: Scissors, description: 'Es tu turno. Precisión y estilo en proceso.' },
  { id: 'completed', title: 'CORTE FINALIZADO', icon: Flag, description: 'Servicio completado exitosamente.' }
];

export default function TrackerClient({ initialAppointment }: TrackerClientProps) {
  const [appointment, setAppointment] = useState<AppointmentData>(initialAppointment);
  const [isMounted, setIsMounted] = useState(false);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    setIsMounted(true);

    const channel = supabase
      .channel(`tracker-${appointment.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `id=eq.${appointment.id}`,
        },
        (payload) => {
          // Optimistic UI Update from Realtime
          setAppointment((prev) => ({
            ...prev,
            status: payload.new.status,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [appointment.id, supabase]);

  const currentIndex = getCurrentStepIndex(appointment);

  if (!isMounted) {
    // Skeleton Screen (Dashboard Optimizer)
    return (
      <div className="w-full bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800 p-8 shadow-2xl animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-10 mx-auto"></div>
        <div className="space-y-8 relative">
          <div className="absolute left-8 top-0 bottom-0 w-px bg-slate-800" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-6 items-start relative z-10">
               <div className="w-16 h-16 rounded-xl bg-slate-800 shrink-0" />
               <div className="space-y-3 flex-1 pt-2">
                 <div className="h-5 bg-slate-800 rounded w-1/2" />
                 <div className="h-4 bg-slate-800/50 rounded w-3/4" />
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Vista Cancelada
  if (appointment.status === 'cancelled') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-slate-900/80 backdrop-blur-xl border border-red-900/50 rounded-2xl p-8 text-center"
      >
        <div className="mx-auto w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2 font-mono uppercase">Cita Cancelada</h2>
        <p className="text-slate-400">Esta reserva ha sido anulada en el sistema. Puedes volver a la página de inicio para agendar un nuevo servicio.</p>
      </motion.div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Ticker Informativo Superior */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 p-4 rounded-xl flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Servicio</span>
          <span className="text-slate-200 font-mono text-sm uppercase truncate" title={appointment.services.name}>
            {appointment.services.name}
          </span>
        </div>
        <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 p-4 rounded-xl flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">Programada</span>
          <span className="text-amber-500 font-mono text-sm uppercase">
            {format(new Date(appointment.start_time), "dd MMM HH:mm", { locale: es })}
          </span>
        </div>
      </div>

      {/* Stepper Industrial */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="w-full bg-slate-900/40 backdrop-blur-xl border border-slate-800/60 rounded-2xl p-6 md:p-10 shadow-2xl relative"
      >
        {/* Línea de conexion vertical (Backdrop) */}
        <div className="absolute left-[3.25rem] md:left-[4.25rem] top-[4rem] bottom-[4rem] w-px bg-slate-800" />

        <div className="space-y-12">
          {STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isPending = index > currentIndex;

            const Icon = step.icon;

            return (
              <motion.div key={step.id} variants={itemVariants} className="relative z-10 flex gap-5 md:gap-8 min-h-[4rem]">
                {/* Connector activo (Overlay) */}
                {index < STEPS.length - 1 && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: isCompleted ? 'calc(100% + 3rem)' : 0 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                    className="absolute left-[1.75rem] md:left-[2.75rem] top-[3rem] w-0.5 bg-amber-500 origin-top shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  />
                )}

                {/* Icon Block */}
                <div className={`
                  shrink-0 w-14 h-14 md:w-20 md:h-20 rounded-2xl flex items-center justify-center border-2 transition-colors duration-500
                  ${isCompleted ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : ''}
                  ${isCurrent ? 'bg-slate-800 border-amber-500 text-amber-400 shadow-[inset_0_0_20px_rgba(245,158,11,0.2)]' : ''}
                  ${isPending ? 'bg-slate-900/50 border-slate-800 text-slate-600' : ''}
                `}>
                  <Icon className={`w-6 h-6 md:w-8 md:h-8 ${isCurrent && 'animate-pulse'}`} />
                </div>

                {/* Texto */}
                <div className="flex-1 pt-1 md:pt-3">
                  <h3 className={`font-mono font-bold tracking-tight mb-1 transition-colors duration-500 md:text-xl
                    ${isCompleted ? 'text-slate-300' : ''}
                    ${isCurrent ? 'text-amber-500' : ''}
                    ${isPending ? 'text-slate-600' : ''}
                  `}>
                    {step.title}
                  </h3>
                  <p className={`text-sm md:text-base transition-colors duration-500
                    ${(isCompleted || isCurrent) ? 'text-slate-400' : 'text-slate-700'}
                  `}>
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
