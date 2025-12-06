import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { answerCallbackQuery, sendTelegramMessage } from '@/lib/telegram';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCOP } from '@/lib/format-currency';

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
    console.log('📥 TELEGRAM WEBHOOK RECEIVED:', JSON.stringify(body, null, 2));

    // Manejar callback queries (botones inline)
    if (body.callback_query) {
      console.log('🔘 Routing to callback query handler');
      return await handleCallbackQuery(body.callback_query);
    }

    // Manejar mensajes de texto (ej: /start)
    if (body.message?.text) {
      console.log('💬 Routing to text message handler');
      return await handleTextMessage(body.message);
    }

    console.log('⚠️ Unknown update type, ignoring');
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('❌ ERROR in telegram webhook:', error);
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
  }
}

async function handleCallbackQuery(callback: NonNullable<TelegramUpdate['callback_query']>) {
  console.log('🔘 CALLBACK QUERY RECEIVED:', JSON.stringify(callback, null, 2));

  const [action, appointmentId] = callback.data.split(':');
  console.log(`📋 Parsed - Action: "${action}", Appointment ID: "${appointmentId}"`);

  if (!action || !appointmentId) {
    console.error('❌ Invalid callback_data format:', callback.data);
    await answerCallbackQuery(callback.id, 'Formato de datos inválido');
    return NextResponse.json({ ok: false, error: 'Invalid callback_data format' });
  }


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

  // Determinar el nuevo estado basado en la acción
  let nextStatus: 'confirmed' | 'cancelled' | 'completed';
  let adminResponse: string;

  switch (action) {
    case 'confirm':
      nextStatus = 'confirmed';
      adminResponse = '✅ Cita confirmada';
      break;
    case 'cancel':
      nextStatus = 'cancelled';
      adminResponse = '❌ Cita cancelada';
      break;
    case 'complete':
      nextStatus = 'completed';
      adminResponse = '✅ Servicio marcado como completado';
      break;
    case 'noshow':
      nextStatus = 'cancelled';
      adminResponse = '❌ Marcado como no realizado';
      break;
    default:
      await answerCallbackQuery(callback.id, 'Acción no reconocida');
      return NextResponse.json({ ok: false, error: 'Unknown action' });
  }

  console.log(`Updating appointment ${appointmentId} to status: ${nextStatus}`);

  // Actualizar estado de la cita
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status: nextStatus })
    .eq('id', appointmentId);

  if (updateError) {
    console.error('❌ Database update failed:', updateError);
    await answerCallbackQuery(callback.id, 'Error al actualizar la cita');
    return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
  }

  console.log(`✅ Appointment ${appointmentId} updated to: ${nextStatus}`);

  // Responder al admin
  console.log(`📤 Sending callback response to admin: "${adminResponse}"`);
  await answerCallbackQuery(callback.id, adminResponse);

  // Notificar al cliente
  const clientName = appointment.client?.full_name || 'Cliente';
  const serviceName = appointment.service?.name || 'Servicio';
  const servicePrice = appointment.service?.price || 0;
  const appointmentDate = format(
    new Date(appointment.start_time),
    "EEEE, dd 'de' MMMM 'a las' HH:mm",
    { locale: es }
  );

  // Preparar mensaje para el cliente según el estado
  let clientMessage = '';

  if (nextStatus === 'confirmed') {
    // Mensaje de confirmación al cliente
    clientMessage = `🎉 *¡Tu cita ha sido confirmada!*

📅 *Detalles de tu cita:*
• Servicio: ${serviceName}
• Fecha: ${appointmentDate}
• Precio: ${formatCOP(servicePrice)}

✨ ¡Te esperamos! Si necesitas cancelar o reprogramar, por favor avísanos con anticipación.`;
  } else if (nextStatus === 'cancelled') {
    // Mensaje de cancelación al cliente
    clientMessage = `❌ *Tu cita ha sido cancelada*

📅 *Detalles de la cita cancelada:*
• Servicio: ${serviceName}
• Fecha: ${appointmentDate}

Si deseas agendar una nueva cita, puedes hacerlo cuando gustes.`;
  } else if (nextStatus === 'completed') {
    // Mensaje de servicio completado
    clientMessage = `✅ *¡Gracias por tu visita!*

Tu servicio de *${serviceName}* ha sido completado exitosamente.

¡Esperamos verte pronto! 💈✨`;
  }

  // Enviar mensaje al cliente si tiene telegram_chat_id y hay mensaje
  if (clientMessage) {
    const clientChatId = appointment.client?.telegram_chat_id;
    if (clientChatId) {
      console.log(`📤 Sending notification to client (${clientChatId})`);
      try {
        await sendTelegramMessage({
          chatId: clientChatId,
          text: clientMessage
        });
        console.log(`✅ Client notification sent successfully`);
      } catch (error) {
        console.error(`❌ Error sending client notification:`, error);
      }
    } else {
      console.log(`⚠️ Client has no telegram_chat_id, skipping notification`);
    }

    // Log para WhatsApp (el admin puede copiar y enviar manualmente)
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
