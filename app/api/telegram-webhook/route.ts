import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { answerCallbackQuery, sendTelegramMessage } from '@/lib/telegram';

type TelegramUpdate = {
  callback_query?: {
    id: string;
    data: string;
    message?: { chat: { id: number } };
  };
};

type AppointmentRecord = {
  id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  client: { telegram_chat_id: string | null; full_name: string | null } | null;
  service: { name: string | null } | null;
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
        status,
        client:profiles!appointments_client_id_fkey(telegram_chat_id, full_name),
        service:services(name)
      `
    )
    .eq('id', appointmentId)
    .single<AppointmentRecord>();

  if (!appointment) {
    await answerCallbackQuery(callback.id, 'Cita no encontrada.');
    return NextResponse.json({ ok: true });
  }

  const nextStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
  await supabase.from('appointments').update({ status: nextStatus }).eq('id', appointmentId);

  await answerCallbackQuery(callback.id, nextStatus === 'confirmed' ? 'Cita confirmada' : 'Cita cancelada');

  if (appointment.client?.telegram_chat_id) {
    await sendTelegramMessage({
      chatId: appointment.client.telegram_chat_id,
      text:
        nextStatus === 'confirmed'
          ? `Tu cita para ${appointment.service?.name ?? 'BarberKing'} fue confirmada.`
          : `Tu cita para ${appointment.service?.name ?? 'BarberKing'} fue cancelada.`
    });
  }

  return NextResponse.json({ ok: true });
}




