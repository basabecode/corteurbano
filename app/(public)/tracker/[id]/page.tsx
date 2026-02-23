import { createSupabaseServerClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import TrackerClient from './TrackerClient';
import { Metadata } from 'next';

interface PageProps {
  params: {
    id: string;
  };
}

// 1. GENERATE METADATA (SEO Architect Skill)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const supabase = createSupabaseServerClient();
  const { data: appointment } = await supabase
    .from('appointments')
    .select('status, services(name)')
    .eq('id', params.id)
    .single();

  if (!appointment) {
    return {
      title: 'Cita no encontrada | CORTEURBANO',
    };
  }

  // Traducción sutil del estado para metadatos
  const statusMap: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmada',
    completed: 'Completada',
    cancelled: 'Cancelada',
  };

  const statusText = statusMap[appointment.status] || appointment.status;
  const serviceName = appointment.services ? appointment.services.name : 'Servicio';

  return {
    title: `Estado de Cita #${params.id.split('-')[0]} - ${statusText} | CORTEURBANO`,
    description: `Seguimiento en tiempo real de tu reserva de ${serviceName} en CORTEURBANO BarberKing.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function TrackerPage({ params }: PageProps) {
  const supabase = createSupabaseServerClient();

  // Búsqueda del appointment asegurando que el auth del usuario coincida con el client_id
  // RLS ya maneja esta capa de seguridad.
  const { data: appointment, error } = await supabase
    .from('appointments')
    .select(`
      id,
      status,
      start_time,
      created_at,
      services:service_id (name, duration_minutes, price),
      profiles:client_id (full_name)
    `)
    .eq('id', params.id)
    .single();

  if (error || !appointment) {
    console.error('Tracker Fetch Error:', error);
    notFound();
  }

  return (
    <article
      className="min-h-screen bg-slate-950 text-slate-50 selection:bg-amber-500/30 font-sans flex flex-col items-center pt-16 md:pt-24 px-4 overflow-hidden"
      aria-labelledby="tracker-title"
    >
      {/* Background ambient light */}
      <div className="fixed top-0 inset-x-0 h-96 bg-gradient-to-b from-amber-500/10 to-transparent pointer-events-none -z-10 blur-3xl" />

      <header className="mb-12 text-center w-full max-w-xl">
        <h1
          id="tracker-title"
          className="text-3xl md:text-5xl font-bold tracking-tight mb-3"
        >
          SEGUIMIENTO EN <span className="text-amber-500">TIEMPO REAL</span>
        </h1>
        <p className="text-slate-400 font-mono text-sm tracking-wider uppercase flex justify-center items-center gap-2">
          ORDEN <span className="text-amber-400 border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 rounded-sm">#{appointment.id.split('-')[0]}</span>
        </p>
      </header>

      <main className="w-full max-w-2xl relative z-10">
        <TrackerClient initialAppointment={appointment} />
      </main>
    </article>
  );
}
