import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { formatCOP } from '@/lib/format-currency';
import { Clock, Scissors, ArrowLeft, ChevronRight } from 'lucide-react';

type Props = {
  params: { slug: string };
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

async function getService(slug: string) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes, description, image_url, slug')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (!data) return null;
  return {
    ...data,
    image_url: data.image_url || MOCK_IMAGES[data.name] || null,
  };
}

async function getOtherServices(currentSlug: string) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes, slug')
    .eq('is_active', true)
    .neq('slug', currentSlug)
    .order('price', { ascending: true })
    .limit(3);
  return data ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = await getService(params.slug);
  if (!service) return { title: 'Servicio no encontrado — BarberKing' };

  return {
    title: `${service.name} — BarberKing`,
    description: service.description
      || `${service.name}: ${service.duration_minutes} minutos por ${formatCOP(service.price)}. Reserva tu cita en BarberKing.`,
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const [service, others] = await Promise.all([
    getService(params.slug),
    getOtherServices(params.slug),
  ]);

  if (!service) notFound();

  return (
    <div className="px-4 py-12 md:px-10 max-w-5xl mx-auto space-y-12">
      {/* Back */}
      <Link
        href="/servicios"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-amber-400 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Todos los servicios
      </Link>

      {/* Main content */}
      <div className="grid md:grid-cols-2 gap-10 items-start">
        {/* Imagen */}
        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-slate-800">
          {service.image_url ? (
            <Image
              src={service.image_url}
              alt={service.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="h-full bg-slate-900 flex items-center justify-center">
              <Scissors className="h-24 w-24 text-slate-700" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-500 mb-2">Servicio</p>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100">{service.name}</h1>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Precio</p>
              <p className="text-3xl font-bold text-amber-400">{formatCOP(service.price)}</p>
            </div>
            <div className="h-12 w-px bg-slate-800" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Duración</p>
              <p className="flex items-center gap-1.5 text-xl font-semibold text-slate-200">
                <Clock className="h-5 w-5 text-amber-500" />
                {service.duration_minutes} min
              </p>
            </div>
          </div>

          {service.description && (
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Descripción</p>
              <p className="text-slate-300 leading-relaxed">{service.description}</p>
            </div>
          )}

          {/* Includes */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 space-y-3">
            <p className="text-xs uppercase tracking-wide text-amber-500 font-medium">Incluye</p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                Consulta personalizada de estilo
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                Lavado de cabello
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                Estilizado final
              </li>
            </ul>
          </div>

          <a
            href="/#agenda"
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-4 text-sm font-semibold uppercase tracking-wide text-slate-950 shadow-lg shadow-amber-500/30 transition-all duration-300 hover:bg-amber-400 hover:scale-105 w-full"
          >
            <Scissors className="h-4 w-4" />
            Reservar este servicio
          </a>
        </div>
      </div>

      {/* Otros servicios */}
      {others.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-100">Otros servicios</h2>
            <Link href="/servicios" className="flex items-center gap-1 text-sm text-amber-400 hover:text-amber-300 transition-colors">
              Ver todos <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {others.map((s) => (
              <Link
                key={s.id}
                href={s.slug ? `/servicios/${s.slug}` : '/servicios'}
                className="group rounded-xl border border-slate-800 bg-slate-900/40 p-4 hover:border-amber-500/50 transition-all duration-300"
              >
                <h3 className="font-semibold text-slate-100 group-hover:text-amber-400 transition-colors mb-1">
                  {s.name}
                </h3>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-amber-400 font-medium">{formatCOP(s.price)}</span>
                  <span className="flex items-center gap-1 text-slate-500">
                    <Clock className="h-3 w-3" /> {s.duration_minutes}min
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
