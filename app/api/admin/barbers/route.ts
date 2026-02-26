import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { z } from 'zod';

const createBarberSchema = z.object({
  name:             z.string().min(2, 'El nombre es demasiado corto'),
  specialty:        z.string().optional(),
  bio:              z.string().optional(),
  photo_url:        z.string().url().optional().or(z.literal('')),
  instagram_handle: z.string().optional(),
  lat:              z.number().optional(),
  lng:              z.number().optional(),
  address_label:    z.string().optional(),
  offers_domicilio: z.boolean().optional()
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
    .from('barbers')
    .select('id, name, specialty, bio, photo_url, instagram_handle, is_active, created_at')
    .order('created_at', { ascending: true });

  if (error) return NextResponse.json({ error: 'Error al obtener barberos' }, { status: 500 });
  return NextResponse.json({ barbers: data });
}

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const admin = await verifyAdmin(supabase);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const json = await request.json();
  const parsed = createBarberSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const { name, specialty, bio, photo_url, instagram_handle, lat, lng, address_label, offers_domicilio } = parsed.data;

  const serviceClient = createSupabaseServiceClient();
  const { data, error } = await serviceClient
    .from('barbers')
    .insert({
      name,
      specialty:        specialty || null,
      bio:              bio || null,
      photo_url:        photo_url || null,
      instagram_handle: instagram_handle || null,
      lat:              lat ?? null,
      lng:              lng ?? null,
      address_label:    address_label || null,
      offers_domicilio: offers_domicilio ?? false,
      is_active:        true
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Error al crear el barbero' }, { status: 500 });
  return NextResponse.json({ barber: data }, { status: 201 });
}
