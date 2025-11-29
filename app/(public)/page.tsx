import { Hero } from './components/Hero';
import { ServicesBookingSection } from './components/ServicesBookingSection';
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

  const mockImages: Record<string, string> = {
    'Corte Clásico': '/images/classic-cut.png',
    'Afeitado Premium': '/images/shave.png',
    'Fade + Barba': '/images/fade.png',
    'Corte + Barba': '/images/fade.png',
    'Corte Niño': '/images/classic-cut.png',
    'Diseño de Barba': '/images/beard-design.png',
    'Tratamiento Capilar': '/images/hair-treatment.png',
    'Corte + Barba + Bigote': '/images/fade.png'
  };

  if (error || !data || data.length === 0) {
    return [
      { id: '11111111-1111-1111-1111-111111111111', name: 'Corte Clásico', price: 25, duration_minutes: 45, image_url: '/images/classic-cut.png' },
      { id: '22222222-2222-2222-2222-222222222222', name: 'Afeitado Premium', price: 30, duration_minutes: 40, image_url: '/images/shave.png' },
      { id: '33333333-3333-3333-3333-333333333333', name: 'Fade + Barba', price: 35, duration_minutes: 60, image_url: '/images/fade.png' }
    ];
  }

  return data.map(service => ({
    ...service,
    image_url: service.image_url || mockImages[service.name] || null
  }));
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
      <ServicesBookingSection services={services} busySlots={busySlots} />
    </div>
  );
}
