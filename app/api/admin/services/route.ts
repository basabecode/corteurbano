import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { z } from 'zod';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/á/g, 'a').replace(/é/g, 'e').replace(/í/g, 'i')
    .replace(/ó/g, 'o').replace(/ú/g, 'u').replace(/ñ/g, 'n')
    .replace(/\+/g, 'mas')
    .replace(/[^a-z0-9-]/g, '');
}

const createServiceSchema = z.object({
  name: z.string().min(2, 'Nombre demasiado corto'),
  price: z.number().positive('El precio debe ser positivo'),
  duration_minutes: z.number().int().positive('La duración debe ser positiva'),
  description: z.string().optional(),
  image_url: z.string().url().optional().or(z.literal(''))
});

async function verifyAdmin(supabase: ReturnType<typeof createSupabaseServerClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  return user;
}

export async function GET() {
  const supabase = createSupabaseServerClient();
  const admin = await verifyAdmin(supabase);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const serviceClient = createSupabaseServiceClient();
  const { data, error } = await serviceClient
    .from('services')
    .select('id, name, price, duration_minutes, description, image_url, is_active, slug')
    .order('price', { ascending: true });

  if (error) return NextResponse.json({ error: 'Error al obtener servicios' }, { status: 500 });
  return NextResponse.json({ services: data });
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const admin = await verifyAdmin(supabase);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const json = await request.json();
  const parsed = createServiceSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { name, price, duration_minutes, description, image_url } = parsed.data;
  const slug = generateSlug(name);

  const serviceClient = createSupabaseServiceClient();
  const { data, error } = await serviceClient
    .from('services')
    .insert({
      name,
      price,
      duration_minutes,
      description: description || null,
      image_url: image_url || null,
      slug,
      is_active: true
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un servicio con ese nombre' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al crear el servicio' }, { status: 500 });
  }

  return NextResponse.json({ service: data }, { status: 201 });
}
