import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
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

  const { serviceId, start, clientData, barberId, bookingType, clientAddress } = parsed.data;

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

  // Resolver barberId: si domicilio y no tiene barbero, asignar primer disponible con offers_domicilio
  let resolvedBarberId: string | undefined = barberId;
  let barberName: string | null = null;
  let barberProfileId: string | null = null;

  if (bookingType === 'domicilio' && !resolvedBarberId) {
    const serviceClient = createSupabaseServiceClient();
    const { data: domicilioBarbers } = await serviceClient
      .from('barbers')
      .select('id, name, profile_id')
      .eq('is_active', true)
      .eq('offers_domicilio', true);

    if (!domicilioBarbers || domicilioBarbers.length === 0) {
      return NextResponse.json(
        { error: 'No hay barberos disponibles para servicio a domicilio en este momento' },
        { status: 409 }
      );
    }

    // Filtrar los que no tienen cita en ese start_time
    const { data: busyBarbers } = await serviceClient
      .from('appointments')
      .select('barber_id')
      .eq('start_time', start)
      .in('status', ['pending', 'confirmed'])
      .in('barber_id', domicilioBarbers.map(b => b.id));

    const busyIds = new Set((busyBarbers ?? []).map(b => b.barber_id));
    const available = domicilioBarbers.find(b => !busyIds.has(b.id));

    if (!available) {
      return NextResponse.json(
        { error: 'No hay barberos de domicilio disponibles para ese horario' },
        { status: 409 }
      );
    }

    resolvedBarberId = available.id;
    barberName = available.name;
    barberProfileId = available.profile_id ?? null;
  } else if (resolvedBarberId) {
    const { data: barber } = await supabase
      .from('barbers')
      .select('id, name, profile_id')
      .eq('id', resolvedBarberId)
      .eq('is_active', true)
      .single();
    if (barber) {
      barberName = barber.name;
      barberProfileId = barber.profile_id ?? null;
    }
  }

  const { data: appointment, error } = await supabase
    .from('appointments')
    .insert({
      client_id: user.id,
      service_id: service.id,
      start_time: start,
      status: 'pending',
      barber_id: resolvedBarberId || null,
      booking_type: bookingType,
      client_address: clientAddress || null
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
      const clientName = profile?.full_name ?? 'Cliente Corte Urbano';
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

      const domicilioLine = bookingType === 'domicilio'
        ? `\n🏠 *Tipo:* A domicilio${clientAddress ? `\n📌 *Dirección:* ${clientAddress}` : ''}`
        : '';

      const text = `🔔 *Nueva cita pendiente*

👤 *Cliente:* ${clientName}${clientPhone}${clientEmail}

✂️ *Servicio:* ${service.name}
${barberName ? `💈 *Barbero:* ${barberName}\n` : ''}💰 *Precio:* ${formatCOP(service.price)}
⏱️ *Duración:* ${service.duration_minutes} min${domicilioLine}

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

      const lugarLine = bookingType === 'domicilio' && clientAddress
        ? `🏠 <b>Lugar:</b> A domicilio - ${clientAddress}`
        : `📍 <b>Lugar:</b> Corte Urbano - Calle 123`;

      const clientMsg = `📋 <b>¡Solicitud de Cita Recibida!</b>

Hola ${profile.full_name || 'Cliente'}, hemos recibido tu solicitud.

🛠 <b>Servicio:</b> ${service.name}${barberName ? `\n💈 <b>Barbero:</b> ${barberName}` : ''}
📅 <b>Fecha:</b> ${dateStr}
🕐 <b>Hora:</b> ${timeStr}
💰 <b>Valor:</b> ${formatCOP(service.price)}
${lugarLine}

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

  // Notificar al barbero si tiene Telegram vinculado
  if (resolvedBarberId && barberProfileId) {
    try {
      const serviceClient = createSupabaseServiceClient();
      const { data: barberProfile } = await serviceClient
        .from('profiles')
        .select('telegram_chat_id')
        .eq('id', barberProfileId)
        .single();

      if (barberProfile?.telegram_chat_id) {
        const dateStr = format(new Date(appointment.start_time), "EEEE, dd 'de' MMMM", { locale: es });
        const timeStr = format(new Date(appointment.start_time), "HH:mm", { locale: es });
        const clientName = profile?.full_name ?? 'Cliente';
        const clientPhone = profile?.phone ?? 'Sin teléfono';

        const domicilioLine = bookingType === 'domicilio' && clientAddress
          ? `\n🏠 <b>Tipo:</b> A domicilio\n📌 <b>Dirección:</b> ${clientAddress}`
          : '\n📍 <b>Tipo:</b> Presencial';

        const barberMsg = `💈 <b>Nueva cita asignada</b>

👤 <b>Cliente:</b> ${clientName}
📱 <b>Teléfono:</b> ${clientPhone}
🛠 <b>Servicio:</b> ${service.name}
📅 <b>Fecha:</b> ${dateStr}
🕐 <b>Hora:</b> ${timeStr}
⏱ <b>Duración:</b> ${service.duration_minutes} min
💰 <b>Precio:</b> ${formatCOP(service.price)}${domicilioLine}

⏳ <b>Estado:</b> Pendiente de confirmación del admin`;

        await sendTelegramMessage({
          chatId: barberProfile.telegram_chat_id,
          text: barberMsg,
          parse_mode: 'HTML'
        });
      }
    } catch (barberTelError) {
      console.error('Error notificando al barbero:', barberTelError);
    }
  }

  return NextResponse.json({ appointmentId: appointment.id }, { status: 201 });
}
