import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatCOP } from '@/lib/format-currency';
import { Clock, Scissors, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Nuestros Servicios — Corte Urbano',
  description: 'Descubre todos los servicios de Corte Urbano: cortes clásicos, degradados, diseño de barba, tratamientos capilares y más. Precios claros y barberos expertos.',
};

type Service = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description: string | null;
  image_url: string | null;
  slug: string | null;
};

const MOCK_IMAGES: Record<string, string> = {
  'Corte Básico': '/images/classic-cut.png',
  'Afeitado Express': '/images/shave.png',
  'Corte con Estilo': '/images/fade.png',
  'Corte + Barba': '/images/fade.png',
  'Corte Niño': '/images/classic-cut.png',
  'Diseño de Barba': '/images/beard-design.png',
  'Tratamiento Capilar': '/images/hair-treatment.png',
};

async function getServices(): Promise<Service[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes, description, image_url, slug')
    .eq('is_active', true)
    .order('price', { ascending: true });

  if (error || !data) return [];

  return data.map((s) => ({
    ...s,
    image_url: s.image_url || MOCK_IMAGES[s.name] || null,
  }));
}

export default async function ServiciosPage() {
  const services = await getServices();

  return (
    <div className="space-y-12 px-4 py-12 md:px-10 max-w-7xl mx-auto">
      {/* Header */}
      <header className="space-y-4 animate-fade-in">
        <p className="text-xs md:text-sm uppercase tracking-[0.3em] text-amber-500">
          Lo que ofrecemos
        </p>
        <h1 className="text-3xl md:text-5xl font-bold text-slate-100 leading-tight">
          Nuestros Servicios
        </h1>
        <p className="text-base md:text-lg text-slate-400 max-w-2xl">
          Cada servicio está diseñado para darte el mejor look. Barberos con experiencia,
          técnicas modernas y un ambiente premium que te hace sentir en otro nivel.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <a
            href="/#agenda"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-950 shadow-lg shadow-amber-500/30 transition-all duration-300 hover:bg-amber-400 hover:scale-105"
          >
            <Scissors className="h-4 w-4" />
            Reservar cita
          </a>
        </div>
      </header>

      {/* Grid de servicios */}
      {services.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Scissors className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No hay servicios disponibles por el momento.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}

      {/* CTA final */}
      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-100">
          ¿No encuentras lo que buscas?
        </h2>
        <p className="text-slate-400">
          Contáctanos y te asesoramos con el estilo que más te conviene.
        </p>
        <a
          href="/#agenda"
          className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-950 hover:bg-amber-400 transition-all duration-300"
        >
          Reservar ahora
        </a>
      </section>
    </div>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const href = service.slug ? `/servicios/${service.slug}` : `/#agenda`;

  return (
    <article className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-900/40 overflow-hidden transition-all duration-300 hover:border-amber-500/50 hover:shadow-2xl hover:shadow-amber-500/10">
      {/* Imagen */}
      <div className="relative h-48 overflow-hidden bg-slate-900">
        {service.image_url ? (
          <Image
            src={service.image_url}
            alt={service.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full flex items-center justify-center text-slate-700">
            <Scissors className="h-16 w-16" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
        <div className="absolute bottom-3 left-4">
          <span className="text-2xl font-bold text-amber-400">{formatCOP(service.price)}</span>
        </div>
      </div>

      {/* Contenido */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-100 group-hover:text-amber-400 transition-colors">
            {service.name}
          </h2>
          <span className="flex items-center gap-1 text-xs text-slate-500 shrink-0 mt-1">
            <Clock className="h-3 w-3" />
            {service.duration_minutes} min
          </span>
        </div>

        {service.description ? (
          <p className="text-sm text-slate-400 line-clamp-3 flex-1">
            {service.description}
          </p>
        ) : (
          <p className="text-sm text-slate-500 italic flex-1">
            Estilo signature Corte Urbano
          </p>
        )}

        <div className="flex gap-2 mt-2">
          <Link
            href={href}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 py-2.5 text-xs font-medium text-slate-300 hover:border-amber-500 hover:text-amber-400 transition-all"
          >
            Ver detalle <ChevronRight className="h-3 w-3" />
          </Link>
          <a
            href="/#agenda"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-3 py-2.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 transition-all"
          >
            Reservar
          </a>
        </div>
      </div>
    </article>
  );
}
