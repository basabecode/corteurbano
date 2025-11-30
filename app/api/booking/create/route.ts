import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createBookingSchema } from '@/lib/validation';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(request: Request) {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const json = await request.json();
  const parsed = createBookingSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { serviceId, start, clientData } = parsed.data;

  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, name, price, duration_minutes')
    .eq('id', serviceId)
    .single();

  if (serviceError || !service) {
    return NextResponse.json({ error: 'Servicio no disponible' }, { status: 404 });
  }

  // Actualizar perfil si vienen datos
  if (clientData) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: clientData.fullName,
        phone: clientData.phone,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error actualizando perfil:', updateError);
    }
  }

  const { data: profile } = await supabase.from('profiles').select('full_name, role, phone').eq('id', user.id).single();

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      client_id: user.id,
      service_id: service.id,
      start_time: start,
      status: 'pending'
    })
    .select('id, start_time')
    .single();

  if (error || !appointment) {
    return NextResponse.json({ error: 'No se pudo crear la cita' }, { status: 500 });
  }

  // Notificar al admin por Telegram
  const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (adminChatId) {
    const clientName = profile?.full_name ?? 'Cliente BarberKing';
    const clientPhone = profile?.phone ? `\n📱 Tel: ${profile.phone}` : '';
    const clientEmail = user.email ? `\n📧 Email: ${user.email}` : '';

    const appointmentDate = new Date(appointment.start_time).toLocaleString('es-ES', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const text = `🔔 *Nueva cita pendiente*

👤 *Cliente:* ${clientName}${clientPhone}${clientEmail}

✂️ *Servicio:* ${service.name}
💰 *Precio:* $${service.price.toFixed(2)}
⏱️ *Duración:* ${service.duration_minutes} min

📅 *Fecha y hora:*
${appointmentDate}

⚠️ *Estado:* Pendiente de confirmación`;

    await sendTelegramMessage({
      chatId: adminChatId,
      text,
      buttons: [
        { text: '✅ Confirmar', callback_data: `confirm:${appointment.id}` },
        { text: '❌ Rechazar', callback_data: `cancel:${appointment.id}` }
      ]
    });
  }

  return NextResponse.json({ appointmentId: appointment.id }, { status: 201 });
}
