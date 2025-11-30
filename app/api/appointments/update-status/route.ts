import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateStatusSchema = z.object({
  appointmentId: z.string().uuid(),
  status: z.enum(['confirmed', 'cancelled', 'completed']),
  cancellationReason: z.string().optional()
});

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const json = await request.json();
  const parsed = updateStatusSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const { appointmentId, status, cancellationReason } = parsed.data;

  // Obtener la cita para verificar permisos
  const { data: appointment } = await supabase
    .from('appointments')
    .select('client_id')
    .eq('id', appointmentId)
    .single();

  if (!appointment) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
  }

  // Verificar permisos
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';
  const isOwner = appointment.client_id === user.id;

  // Solo el admin puede confirmar/completar, pero el cliente puede cancelar su propia cita
  if (status !== 'cancelled' && !isAdmin) {
    return NextResponse.json({ error: 'Solo administradores pueden confirmar citas' }, { status: 403 });
  }

  if (status === 'cancelled' && !isAdmin && !isOwner) {
    return NextResponse.json({ error: 'No puedes cancelar esta cita' }, { status: 403 });
  }

  // Preparar datos de actualización
  const updateData: any = { status };
  if (status === 'cancelled' && cancellationReason) {
    updateData.cancellation_reason = cancellationReason;
  }

  // Actualizar estado
  const { error } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', appointmentId);

  if (error) {
    return NextResponse.json({ error: 'Error al actualizar el estado' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}


