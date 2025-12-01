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
  message?: {
    text?: string;
    chat: {
      id: number;
    };
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
  try {
    const body = (await request.json()) as TelegramUpdate;
    console.log('Telegram webhook received (v2):', JSON.stringify(body, null, 2));

    // Manejar callback queries (botones inline)
    if (body.callback_query) {
      return await handleCallbackQuery(body.callback_query);
    }

    // Manejar mensajes de texto (ej: /start)
    if (body.message?.text) {
      return await handleTextMessage(body.message);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error in telegram webhook:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

async function handleCallbackQuery(callback: NonNullable<TelegramUpdate['callback_query']>) {
  const [action, appointmentId] = callback.data.split(':');
  console.log(`Callback query - Action: ${action}, Appointment ID: ${appointmentId}`);

  const supabase = createSupabaseServiceClient();
  const { data: appointment, error: fetchError } = await supabase
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

  if (fetchError || !appointment) {
    console.error('Error fetching appointment:', fetchError);
    await answerCallbackQuery(callback.id, 'Cita no encontrada.');
    return NextResponse.json({ ok: true });
  }

  const nextStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
  console.log(`Updating appointment ${appointmentId} to status: ${nextStatus}`);

  // Actualizar estado de la cita
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status: nextStatus })
    .eq('id', appointmentId);

  if (updateError) {
    console.error('Error updating appointment:', updateError);
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
        console.log(`Notification sent to client via Telegram: ${appointment.client.telegram_chat_id}`);
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
        console.log(`Cancellation notification sent to client via Telegram: ${appointment.client.telegram_chat_id}`);
      } catch (error) {
        console.error('Error enviando mensaje de Telegram al cliente:', error);
      }
    }

    if (appointment.client?.phone) {
      console.log(`📱 Mensaje para WhatsApp (${appointment.client.phone}):`, clientMessage);
    }
  }

  console.log(`Appointment ${appointmentId} successfully updated to ${nextStatus}`);
  return NextResponse.json({ ok: true });
}

async function handleTextMessage(message: NonNullable<TelegramUpdate['message']>) {
  // Manejar comandos de texto (ej: /start <user_id>)
  if (message.text?.startsWith('/start')) {
    const chatId = message.chat.id.toString();
    const text = message.text || '';
    const userId = text.split(' ')[1]; // /start <user_id>

    console.log(`/start command received - Chat ID: ${chatId}, User ID: ${userId}`);

    if (userId) {
      const supabase = createSupabaseServiceClient();

      // Verificar si el usuario existe
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        console.error('User not found:', userError);
        await sendTelegramMessage({
          chatId,
          text: '❌ No pudimos encontrar tu usuario. Por favor intenta conectar nuevamente desde la web.'
        });
        return NextResponse.json({ ok: true });
      }

      // Actualizar chat_id
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ telegram_chat_id: chatId })
        .eq('id', userId);

      if (updateError) {
        console.error('Error linking telegram:', updateError);
        await sendTelegramMessage({
          chatId,
          text: '❌ Hubo un error al vincular tu cuenta. Intenta nuevamente.'
        });
      } else {
        console.log(`Telegram linked successfully for user ${userId}`);
        await sendTelegramMessage({
          chatId,
          text: `✅ *¡Cuenta vinculada exitosamente!*\n\nHola ${user.full_name || 'Cliente'}, ahora recibirás confirmaciones de tus citas por aquí.`
        });
      }
    } else {
      // Mensaje genérico si no hay ID (o si es el admin iniciando el bot)
      await sendTelegramMessage({
        chatId,
        text: '👋 ¡Hola! Soy el bot de BarberKing.\n\nSi eres cliente, usa el botón "Conectar Telegram" desde la web para recibir notificaciones.\n\nSi eres administrador, ya puedes recibir alertas de nuevas citas.'
      });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
