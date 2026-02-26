import { Hero } from './components/Hero';
import { ServicesBookingSection } from './components/ServicesBookingSection';
import { BarberCTA } from './components/BarberCTA';
import { createSupabaseServerClient } from '@/lib/supabase/server';

type ServiceRecord = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  image_url: string | null;
};

type BarberRecord = {
  id: string;
  name: string;
  photo_url: string | null;
  specialty: string | null;
  lat: number | null;
  lng: number | null;
  address_label: string | null;
  offers_domicilio: boolean;
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
    'Corte Básico': '/images/corte-clasico.png',
    'Afeitado Express': '/images/afeitado-express.png',
    'Corte con Estilo': '/images/corte-con-estilo.png',
    'Corte + Barba': '/images/fade.png',
    'Corte Niño': '/images/styles/corte-niño.png',
    'Diseño de Barba': '/images/beard-design.png',
    'Tratamiento Capilar': '/images/hair-treatment.png',
    'Corte + Barba + Bigote': '/images/fade.png',
    'Pigmento en Cabello': '/images/pigmento-cabello-hombre.png'
  };

  if (error || !data || data.length === 0) {
    return [
      { id: '11111111-1111-1111-1111-111111111111', name: 'Corte Básico', price: 50000, duration_minutes: 45, image_url: '/images/corte-clasico.png' },
      { id: '22222222-2222-2222-2222-222222222222', name: 'Afeitado Express', price: 35000, duration_minutes: 40, image_url: '/images/afeitado-express.png' },
      { id: '33333333-3333-3333-3333-333333333333', name: 'Corte con Estilo', price: 60000, duration_minutes: 60, image_url: '/images/corte-con-estilo.png' },
      { id: '44444444-4444-4444-4444-444444444444', name: 'Pigmento en Cabello', price: 80000, duration_minutes: 60, image_url: '/images/pigmento-cabello-hombre.png' }
    ];
  }

  return data.map(service => ({
    ...service,
    image_url: service.image_url || mockImages[service.name] || null
  }));
}

async function getBarbers(): Promise<BarberRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('barbers')
    .select('id, name, photo_url, specialty, lat, lng, address_label, offers_domicilio')
    .eq('is_active', true)
    .order('created_at', { ascending: true });
  return data ?? [];
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
  const [services, busySlots, barbers] = await Promise.all([
    getServices(),
    getBusySlots(),
    getBarbers()
  ]);

  return (
    <div className="space-y-16 px-4 py-12 md:px-10 max-w-7xl mx-auto">
      <Hero />
      <ServicesBookingSection services={services} busySlots={busySlots} barbers={barbers} />
      <BarberCTA />
    </div>
  );
}
