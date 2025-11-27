import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

const updateStatusSchema = z.object({
  appointmentId: z.string().uuid(),
  status: z.enum(['confirmed', 'cancelled'])
});

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Verificar que sea admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Acceso denegado. Se requiere rol de administrador' }, { status: 403 });
  }

  const json = await request.json();
  const parsed = updateStatusSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  const { appointmentId, status } = parsed.data;

  // Actualizar estado
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', appointmentId);

  if (error) {
    return NextResponse.json({ error: 'Error al actualizar el estado' }, { status: 500 });
  }

  // Si se confirma, enviar notificación a Telegram si está configurado
  if (status === 'confirmed') {
    const { data: appointment } = await supabase
      .from('appointments')
      .select(`
        client:profiles!appointments_client_id_fkey!inner(telegram_chat_id, full_name),
        service:services!inner(name)
      `)
      .eq('id', appointmentId)
      .single();

    const clientData = appointment?.client as any;
    if (clientData?.telegram_chat_id) {
      // Notificar al cliente vía Telegram si tiene chat_id
      // Esto se puede implementar más adelante
    }
  }

  return NextResponse.json({ success: true });
}

