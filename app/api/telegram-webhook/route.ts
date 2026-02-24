import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { answerCallbackQuery, sendTelegramMessage, editMessageText } from '@/lib/telegram';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCOP } from '@/lib/format-currency';

type TelegramUpdate = {
  callback_query?: {
    id: string;
    data: string;
    message?: {
      message_id: number;
      chat: { id: number }
    };
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

  // Editar el mensaje original del admin para quitar botones y mostrar estado
  if (callback.message) {
    const adminChatId = callback.message.chat.id;
    const adminMessageId = callback.message.message_id;

    // Preparar texto actualizado para el admin
    const clientName = appointment.client?.full_name || 'Cliente';
    const clientPhone = appointment.client?.phone || 'Sin teléfono';
    const serviceName = appointment.service?.name || 'Servicio';
    const dateStr = format(new Date(appointment.start_time), "dd/MM/yyyy", { locale: es });
    const timeStr = format(new Date(appointment.start_time), "HH:mm", { locale: es });

    let adminUpdateText = '';

    if (nextStatus === 'confirmed') {
      adminUpdateText = `✅ <b>CITA CONFIRMADA</b>

📋 <b>Detalles de la cita:</b>
👤 Cliente: ${clientName}
📞 Teléfono: ${clientPhone}
🛠 Servicio: ${serviceName}
📅 Fecha: ${dateStr}
🕐 Hora: ${timeStr}

<i>Cliente notificado ✓</i>`;
    } else if (nextStatus === 'cancelled') {
      adminUpdateText = `❌ <b>CITA RECHAZADA/CANCELADA</b>

📋 <b>Detalles:</b>
👤 Cliente: ${clientName}
📞 Teléfono: ${clientPhone}
🛠 Servicio: ${serviceName}

<i>Cliente notificado ✓</i>`;
    } else {
      adminUpdateText = `ℹ️ <b>Estado actualizado: ${nextStatus}</b>
       
👤 Cliente: ${clientName}`;
    }

    // Editar mensaje
    await editMessageText({
      chatId: adminChatId,
      messageId: adminMessageId,
      text: adminUpdateText,
      parse_mode: 'HTML'
    });
  }

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

  const timeStr = format(new Date(appointment.start_time), "HH:mm", { locale: es });
  const dateStrSimple = format(new Date(appointment.start_time), "dd/MM/yyyy", { locale: es });

  if (nextStatus === 'confirmed') {
    // Mensaje de confirmación al cliente
    clientMessage = `✅ <b>¡Tu cita ha sido confirmada!</b>

📋 <b>Detalles de tu cita:</b>
🛠 Servicio: ${serviceName}
📅 Fecha: ${dateStrSimple}
🕐 Hora: ${timeStr}
📍 Dirección: Calle 123 (Corte Urbano)

<b>Recomendaciones:</b>
• Llega 10 minutos antes
• Trae tu Notificacion validada
• Si necesitas cancelar, avísanos con 24h de anticipación desde el aplicativo.

¿Necesitas algo más? Escribe /ayuda`;
  } else if (nextStatus === 'cancelled') {
    // Mensaje de cancelación al cliente
    clientMessage = `❌ <b>Tu cita ha sido cancelada/rechazada</b>

📋 <b>Detalles:</b>
🛠 Servicio solicitado: ${serviceName}
📅 Fecha solicitada: ${dateStrSimple}

<b>Motivo:</b>
No hay disponibilidad en esa fecha/hora o fue cancelada a petición.

💡 <b>¿Qué puedes hacer?</b>
• Solicita otra fecha en nuestra web
• Escribe /ayuda para más opciones`;
  } else if (nextStatus === 'completed') {
    // Mensaje de servicio completado
    clientMessage = `✅ <b>¡Gracias por tu visita!</b>

Tu servicio de <b>${serviceName}</b> ha sido completado exitosamente.

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
          text: clientMessage,
          parse_mode: 'HTML'
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
  const chatId = message.chat.id.toString();
  const text = (message.text || '').trim();

  // 1. Comando /start
  if (text.startsWith('/start')) {
    const params = text.split(' ')[1]; // /start <params>

    if (params) {
      // Opción A: Vinculación por teléfono (deep linking nuevo)
      if (params.startsWith('TELEFONO_')) {
        const telefono = params.replace('TELEFONO_', '');
        return await linkUserByPhone(chatId, telefono);
      }

      // Opción B: Vinculación por ID (legacy/existente)
      // Asumimos que si no es TELEFONO_ es un ID
      return await linkUserById(chatId, params);
    }

    // Sin parámetros: Solicitar registro manual
    await sendTelegramMessage({
      chatId,
      text: `👋 <b>¡Hola! Bienvenido a Corte Urbano</b>

Para recibir notificaciones de tus citas, necesito que te registres.

Por favor, envíame tu número de teléfono (el mismo que usas en la web).

Ejemplo: 3001234567`,
      parse_mode: 'HTML'
    });
    return NextResponse.json({ ok: true });
  }

  // 2. Manejo de número de teléfono enviado manualmente
  // Aceptamos 10 dígitos, ignorando espacios
  const cleanPhone = text.replace(/\s/g, '');
  if (/^\d{10}$/.test(cleanPhone)) {
    return await linkUserByPhone(chatId, cleanPhone);
  }

  // 3. Otros mensajes / Ayuda
  if (text === '/ayuda') {
    await sendTelegramMessage({
      chatId,
      text: `📖 <b>Comandos disponibles:</b>

/start - Iniciar
/ayuda - Ver este mensaje

Si intentas registrarte, por favor envía solo tu número de teléfono.`,
      parse_mode: 'HTML'
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}

async function linkUserByPhone(chatId: string, phone: string) {
  const supabase = createSupabaseServiceClient();

  // Buscar usuario por teléfono
  // Nota: El formato del teléfono en DB debe coincidir.
  // Asumimos que se guarda limpio o el usuario lo envía igual.
  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, full_name, phone')
    .eq('phone', phone)
    .single();

  if (userError || !user) {
    console.error('User not found by phone:', userError);
    await sendTelegramMessage({
      chatId,
      text: `❌ No encontré el número <b>${phone}</b> en nuestro sistema.

¿Ya solicitaste una cita en nuestra web?
Asegúrate de haber registrado una cita primero.`,
      parse_mode: 'HTML'
    });
    return NextResponse.json({ ok: true });
  }

  return await finalizeLinking(chatId, user);
}

async function linkUserById(chatId: string, userId: string) {
  const supabase = createSupabaseServiceClient();

  const { data: user, error: userError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('id', userId)
    .single();

  if (userError || !user) {
    console.error('User not found by ID:', userError);
    await sendTelegramMessage({
      chatId,
      text: '❌ No pudimos encontrar tu usuario. Por favor intenta conectar nuevamente desde la web.',
      parse_mode: 'HTML'
    });
    return NextResponse.json({ ok: true });
  }

  return await finalizeLinking(chatId, user);
}

async function finalizeLinking(chatId: string, user: { id: string, full_name: string | null }) {
  const supabase = createSupabaseServiceClient();

  // Actualizar chat_id
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ telegram_chat_id: chatId })
    .eq('id', user.id);

  if (updateError) {
    console.error('Error linking telegram:', updateError);
    await sendTelegramMessage({
      chatId,
      text: '❌ Hubo un error al vincular tu cuenta. Intenta nuevamente.',
      parse_mode: 'HTML'
    });
  } else {
    console.log(`Telegram linked successfully for user ${user.id}`);

    // 1. Send welcome message
    await sendTelegramMessage({
      chatId,
      text: `✅ <b>¡Cuenta vinculada exitosamente!</b>

Hola ${user.full_name || 'Cliente'}, tu Telegram ha sido vinculado correcto.`,
      parse_mode: 'HTML'
    });

    // 2. Check for latest pending/confirmed appointment and send details
    const { data: lastAppointment } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        status,
        service:services(name, price, duration_minutes)
      `)
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single<AppointmentRecord>();

    if (lastAppointment) {
      const serviceName = lastAppointment.service?.name || 'Servicio';
      const dateStr = format(new Date(lastAppointment.start_time), "EEEE, dd 'de' MMMM", { locale: es });
      const timeStr = format(new Date(lastAppointment.start_time), "HH:mm", { locale: es });
      const priceStr = lastAppointment.service?.price ? formatCOP(lastAppointment.service.price) : 'N/A';

      const detailsMsg = `📋 <b>Detalles de tu última solicitud:</b>

🛠 <b>Servicio:</b> ${serviceName}
📅 <b>Fecha:</b> ${dateStr}
🕐 <b>Hora:</b> ${timeStr}
💰 <b>Valor:</b> ${priceStr}

⚠️ <b>Estado:</b> ${lastAppointment.status === 'confirmed' ? 'Confirmada ✅' : 'Pendiente de aprobación ⏳'}

<i>Recibirás una notificación cuando el estado cambie.</i>`;

      await sendTelegramMessage({
        chatId,
        text: detailsMsg,
        parse_mode: 'HTML'
      });
    }
  }
  return NextResponse.json({ ok: true });
}
