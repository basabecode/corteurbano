import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createBookingSchema } from '@/lib/validation';
import { sendTelegramMessage } from '@/lib/telegram';
import { formatCOP } from '@/lib/format-currency';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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

  const { serviceId, start, clientData, barberId } = parsed.data;

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

  const { data: profile } = await supabase.from('profiles').select('full_name, role, phone, telegram_chat_id').eq('id', user.id).single();

  // Si se seleccionó un barbero específico, verificar que existe y está activo
  let barberName: string | null = null;
  if (barberId) {
    const { data: barber } = await supabase
      .from('barbers')
      .select('id, name')
      .eq('id', barberId)
      .eq('is_active', true)
      .single();
    if (barber) barberName = barber.name;
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      client_id: user.id,
      service_id: service.id,
      start_time: start,
      status: 'pending',
      barber_id: barberId || null
    })
    .select('id, start_time')
    .single();

  if (error || !appointment) {
    return NextResponse.json({ error: 'No se pudo crear la cita' }, { status: 500 });
  }

  // Notificar al admin por Telegram
  try {
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
${barberName ? `💈 *Barbero:* ${barberName}\n` : ''}💰 *Precio:* ${formatCOP(service.price)}
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
  } catch (telegramError) {
    console.error('Error enviando notificación a Telegram:', telegramError);
    // No fallamos la request si falla telegram, la cita ya está creada
  }

  // Notificar al cliente si tiene Telegram vinculado
  if (profile?.telegram_chat_id) {
    try {
      const dateStr = format(new Date(appointment.start_time), "EEEE, dd 'de' MMMM", { locale: es });
      const timeStr = format(new Date(appointment.start_time), "HH:mm", { locale: es });

      const clientMsg = `📋 <b>¡Solicitud de Cita Recibida!</b>

Hola ${profile.full_name || 'Cliente'}, hemos recibido tu solicitud.

🛠 <b>Servicio:</b> ${service.name}${barberName ? `\n💈 <b>Barbero:</b> ${barberName}` : ''}
📅 <b>Fecha:</b> ${dateStr}
🕐 <b>Hora:</b> ${timeStr}
💰 <b>Valor:</b> ${formatCOP(service.price)}
📍 <b>Lugar:</b> BarberKing - Calle 123

⚠️ <b>Estado:</b> Pendiente de confirmación
<i>Te avisaremos tan pronto el barbero confirme tu cita.</i>`;

      await sendTelegramMessage({
        chatId: profile.telegram_chat_id,
        text: clientMsg,
        parse_mode: 'HTML'
      });
    } catch (clientTelError) {
      console.error('Error notificando al cliente:', clientTelError);
    }
  }

  return NextResponse.json({ appointmentId: appointment.id }, { status: 201 });
}
