import { Hero } from './components/Hero';
import { BookingForm } from './components/BookingForm';
import { ServiceCard } from './components/ServiceCard';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type ServiceRecord = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  image_url: string | null;
};

type AppointmentSlot = {
  start_time: string;
};

async function getServices(): Promise<ServiceRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes, image_url')
    .order('price', { ascending: true });

  if (error || !data) {
    // Fallback a servicios mock si hay error o no hay datos
    return [
      { id: '11111111-1111-1111-1111-111111111111', name: 'Corte Clásico', price: 25, duration_minutes: 45, image_url: null },
      { id: '22222222-2222-2222-2222-222222222222', name: 'Afeitado Premium', price: 30, duration_minutes: 40, image_url: null },
      { id: '33333333-3333-3333-3333-333333333333', name: 'Fade + Barba', price: 35, duration_minutes: 60, image_url: null }
    ];
  }

  return data;
}

async function getBusySlots(): Promise<string[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('appointments')
    .select('start_time')
    .in('status', ['pending', 'confirmed'])
    .gte('start_time', new Date().toISOString());

  return data?.map((appointment: AppointmentSlot) => appointment.start_time) ?? [];
}

export default async function HomePage() {
  const [services, busySlots] = await Promise.all([getServices(), getBusySlots()]);


  return (
    <div className="space-y-16 px-4 py-12 md:px-10">
      <Hero />

      <section id="servicios" className="space-y-6">
        <header>
          <p className="text-sm uppercase tracking-[0.3em] text-amber-500">Servicios signature</p>
          <h2 className="text-3xl font-bold text-slate-100">Cortes diseñados para líderes</h2>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              name={service.name}
              duration={service.duration_minutes}
              price={service.price}
              imageUrl={service.image_url ?? undefined}
            />
          ))}
        </div>
      </section>

      <BookingForm services={services} busySlots={busySlots} />
    </div>
  );
}

