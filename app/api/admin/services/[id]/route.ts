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

const updateServiceSchema = z.object({
  name: z.string().min(2).optional(),
  price: z.number().positive().optional(),
  duration_minutes: z.number().int().positive().optional(),
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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const admin = await verifyAdmin(supabase);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const json = await request.json();
  const parsed = updateServiceSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.name) {
    updateData.slug = generateSlug(parsed.data.name);
  }
  if (parsed.data.image_url === '') {
    updateData.image_url = null;
  }

  const serviceClient = createSupabaseServiceClient();
  const { data, error } = await serviceClient
    .from('services')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya existe un servicio con ese nombre' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Error al actualizar el servicio' }, { status: 500 });
  }

  return NextResponse.json({ service: data });
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const admin = await verifyAdmin(supabase);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const serviceClient = createSupabaseServiceClient();

  // Obtener estado actual y hacer toggle
  const { data: current } = await serviceClient
    .from('services')
    .select('is_active')
    .eq('id', params.id)
    .single();

  if (!current) return NextResponse.json({ error: 'Servicio no encontrado' }, { status: 404 });

  const { data, error } = await serviceClient
    .from('services')
    .update({ is_active: !current.is_active })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: 'Error al actualizar el estado' }, { status: 500 });
  return NextResponse.json({ service: data });
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient();
  const admin = await verifyAdmin(supabase);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const serviceClient = createSupabaseServiceClient();

  // Verificar que no tenga citas pendientes o confirmadas
  const { data: activeCitas } = await serviceClient
    .from('appointments')
    .select('id')
    .eq('service_id', params.id)
    .in('status', ['pending', 'confirmed'])
    .limit(1);

  if (activeCitas && activeCitas.length > 0) {
    return NextResponse.json(
      { error: 'No se puede eliminar: tiene citas activas. Desactívalo primero.' },
      { status: 409 }
    );
  }

  const { error } = await serviceClient.from('services').delete().eq('id', params.id);
  if (error) return NextResponse.json({ error: 'Error al eliminar el servicio' }, { status: 500 });

  return NextResponse.json({ success: true });
}
