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
    'Corte Básico': '/images/classic-cut.png',
    'Afeitado Express': '/images/shave.png',
    'Corte con Estilo': '/images/fade.png',
    'Corte + Barba': '/images/fade.png',
    'Corte Niño': '/images/classic-cut.png',
    'Diseño de Barba': '/images/beard-design.png',
    'Tratamiento Capilar': '/images/hair-treatment.png',
    'Corte + Barba + Bigote': '/images/fade.png',
    'Pigmento en Cabello': '/images/hair-treatment.png'
  };

  if (error || !data || data.length === 0) {
    return [
      { id: '11111111-1111-1111-1111-111111111111', name: 'Corte Básico', price: 50000, duration_minutes: 45, image_url: '/images/classic-cut.png' },
      { id: '22222222-2222-2222-2222-222222222222', name: 'Afeitado Express', price: 35000, duration_minutes: 40, image_url: '/images/shave.png' },
      { id: '33333333-3333-3333-3333-333333333333', name: 'Corte con Estilo', price: 60000, duration_minutes: 60, image_url: '/images/fade.png' },
      { id: '44444444-4444-4444-4444-444444444444', name: 'Pigmento en Cabello', price: 80000, duration_minutes: 60, image_url: '/images/hair-treatment.png' }
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
    <div className="space-y-16 px-4 py-12 md:px-10 max-w-7xl mx-auto">
      <Hero />
      <ServicesBookingSection services={services} busySlots={busySlots} />
    </div>
  );
}
