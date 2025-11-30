import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { answerCallbackQuery, sendTelegramMessage } from '@/lib/telegram';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type TelegramUpdate = {
  callback_query?: {
    id: string;
    data: string;
    message?: { chat: { id: number } };
  };
};

type AppointmentRecord = {
  id: string;
  start_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  client: {
    telegram_chat_id: string | null;
    full_name: string | null;
    phone: string | null;
  } | null;
  service: {
    name: string | null;
    price: number | null;
    duration_minutes: number | null;
  } | null;
};

export async function POST(request: Request) {
  const body = (await request.json()) as TelegramUpdate;

  if (!body.callback_query) {
    return NextResponse.json({ ok: true });
  }

  const callback = body.callback_query;
  const [action, appointmentId] = callback.data.split(':');

  const supabase = createSupabaseServiceClient();
  const { data: appointment } = await supabase
    .from('appointments')
    .select(
      `
        id,
        start_time,
        status,
        client:profiles!appointments_client_id_fkey(telegram_chat_id, full_name, phone),
        service:services(name, price, duration_minutes)
      `
    )
    .eq('id', appointmentId)
    .single<AppointmentRecord>();

  if (!appointment) {
    await answerCallbackQuery(callback.id, 'Cita no encontrada.');
    return NextResponse.json({ ok: true });
  }

  const nextStatus = action === 'confirm' ? 'confirmed' : 'cancelled';

  // Actualizar estado de la cita
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status: nextStatus })
    .eq('id', appointmentId);

  if (updateError) {
    await answerCallbackQuery(callback.id, 'Error al actualizar la cita');
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  // Responder al admin
  await answerCallbackQuery(
    callback.id,
    nextStatus === 'confirmed' ? '✅ Cita confirmada' : '❌ Cita cancelada'
  );

  // Notificar al cliente
  const clientName = appointment.client?.full_name || 'Cliente';
  const serviceName = appointment.service?.name || 'Servicio';
  const servicePrice = appointment.service?.price || 0;
  const appointmentDate = format(
    new Date(appointment.start_time),
    "EEEE, dd 'de' MMMM 'a las' HH:mm",
    { locale: es }
  );

  if (nextStatus === 'confirmed') {
    // Mensaje de confirmación al cliente
    const clientMessage = `🎉 *¡Tu cita ha sido confirmada!*

📅 *Detalles de tu cita:*
• Servicio: ${serviceName}
• Fecha: ${appointmentDate}
• Precio: $${servicePrice.toFixed(2)}

📍 *BarberKing*
Te esperamos puntualmente.

💬 Si necesitas cancelar o reprogramar, ingresa a tu panel de cliente.`;

    // Intentar enviar por Telegram si tiene chat_id
    if (appointment.client?.telegram_chat_id) {
      try {
        await sendTelegramMessage({
          chatId: appointment.client.telegram_chat_id,
          text: clientMessage
        });
      } catch (error) {
        console.error('Error enviando mensaje de Telegram al cliente:', error);
      }
    }

    // Log para WhatsApp (el admin puede copiar y enviar manualmente)
    if (appointment.client?.phone) {
      console.log(`📱 Mensaje para WhatsApp (${appointment.client.phone}):`, clientMessage);
    }
  } else {
    // Mensaje de cancelación al cliente
    const clientMessage = `❌ *Tu cita ha sido cancelada*

📅 *Detalles de la cita cancelada:*
• Servicio: ${serviceName}
• Fecha: ${appointmentDate}

Puedes agendar una nueva cita cuando lo desees desde nuestra web.

¡Esperamos verte pronto! 💈`;

    if (appointment.client?.telegram_chat_id) {
      try {
        await sendTelegramMessage({
          chatId: appointment.client.telegram_chat_id,
          text: clientMessage
        });
      } catch (error) {
        console.error('Error enviando mensaje de Telegram al cliente:', error);
      }
    }

    if (appointment.client?.phone) {
      console.log(`📱 Mensaje para WhatsApp (${appointment.client.phone}):`, clientMessage);
    }
  }

  return NextResponse.json({ ok: true });
}





