import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { z } from 'zod';

const updateBarberSchema = z.object({
  name: z.string().min(2).optional(),
  specialty: z.string().optional(),
  bio: z.string().optional(),
  photo_url: z.string().url().optional().or(z.literal('')),
  instagram_handle: z.string().optional()
});

async function verifyAdmin(supabase: ReturnType<typeof createSupabaseServerClient>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return null;
  return user;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const admin = await verifyAdmin(supabase);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const json = await request.json();
  const parsed = updateBarberSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.photo_url === '') updateData.photo_url = null;

  const serviceClient = createSupabaseServiceClient();
  const { data, error } = await serviceClient
    .from('barbers')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Error al actualizar el barbero' }, { status: 500 });
  return NextResponse.json({ barber: data });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const admin = await verifyAdmin(supabase);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const serviceClient = createSupabaseServiceClient();

  const { data: current } = await serviceClient
    .from('barbers')
    .select('is_active')
    .eq('id', params.id)
    .single();

  if (!current) return NextResponse.json({ error: 'Barbero no encontrado' }, { status: 404 });

  const { data, error } = await serviceClient
    .from('barbers')
    .update({ is_active: !current.is_active })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Error al actualizar el estado' }, { status: 500 });
  return NextResponse.json({ barber: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const admin = await verifyAdmin(supabase);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const serviceClient = createSupabaseServiceClient();

  // Verificar que no tenga citas activas
  const { data: activeCitas } = await serviceClient
    .from('appointments')
    .select('id')
    .eq('barber_id', params.id)
    .in('status', ['pending', 'confirmed'])
    .limit(1);

  if (activeCitas && activeCitas.length > 0) {
    return NextResponse.json(
      { error: 'No se puede eliminar: tiene citas activas. Desactívalo primero.' },
      { status: 409 }
    );
  }

  const { error } = await serviceClient.from('barbers').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Error al eliminar el barbero' }, { status: 500 });

  return NextResponse.json({ success: true });
}
