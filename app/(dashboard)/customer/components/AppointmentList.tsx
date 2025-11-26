import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

type Appointment = {
  id: string;
  service: string;
  date: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
};

const statusStyles: Record<Appointment['status'], string> = {
  pending: 'text-amber-400 border-amber-400/60',
  confirmed: 'text-emerald-400 border-emerald-400/40',
  completed: 'text-slate-300 border-slate-500/50',
  cancelled: 'text-rose-400 border-rose-400/50'
};

export function AppointmentList({ appointments }: { appointments: Appointment[] }) {
  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <article key={appointment.id} className="rounded-2xl border border-slate-900 bg-slate-900/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-slate-100">{appointment.service}</h3>
              <p className="text-sm text-slate-400">
                {format(new Date(appointment.date), "EEEE d 'de' MMMM · HH:mm", { locale: es })}
              </p>
            </div>
            <span className={cn('rounded-full border px-4 py-1 text-xs uppercase tracking-wide', statusStyles[appointment.status])}>
              {appointment.status}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}







