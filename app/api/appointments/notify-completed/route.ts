import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { sendTelegramMessage } from '@/lib/telegram';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCOP } from '@/lib/format-currency';

/**
 * Endpoint para enviar notificaciones al admin sobre citas que están por terminar
 * Pregunta si el servicio se completó exitosamente
 */
export async function POST() {
    try {
        const supabase = createSupabaseServiceClient();
        const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

        if (!adminChatId) {
            return NextResponse.json(
                { error: 'TELEGRAM_ADMIN_CHAT_ID no configurado' },
                { status: 500 }
            );
        }

        const now = new Date();

        // Buscar citas confirmadas que terminaron en los últimos 30 minutos
        // (para dar tiempo a que el servicio termine)
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);

        const { data: recentlyEndedAppointments, error: fetchError } = await supabase
            .from('appointments')
            .select(`
        id,
        start_time,
        status,
        client:profiles!appointments_client_id_fkey(full_name, phone),
        service:services(name, price, duration_minutes)
      `)
            .eq('status', 'confirmed')
            .lt('start_time', now.toISOString())
            .gte('start_time', thirtyMinutesAgo.toISOString());

        if (fetchError) {
            console.error('Error fetching appointments:', fetchError);
            return NextResponse.json(
                { error: 'Error al obtener citas' },
                { status: 500 }
            );
        }

        if (!recentlyEndedAppointments || recentlyEndedAppointments.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No hay citas recién terminadas',
                notified: 0
            });
        }

        let notifiedCount = 0;

        // Enviar notificación para cada cita
        for (const appointment of recentlyEndedAppointments) {
            const client = appointment.client as any;
            const service = appointment.service as any;

            const appointmentDate = format(
                new Date(appointment.start_time),
                "EEEE, dd 'de' MMMM 'a las' HH:mm",
                { locale: es }
            );

            const message = `⏰ *Cita Recién Terminada*

👤 *Cliente:* ${client?.full_name || 'Cliente'}
${client?.phone ? `📱 *Teléfono:* ${client.phone}` : ''}

✂️ *Servicio:* ${service?.name || 'Servicio'}
💰 *Precio:* ${formatCOP(service?.price ?? 0)}
⏱️ *Duración:* ${service?.duration_minutes || 0} min

📅 *Fecha:* ${appointmentDate}

¿El servicio se completó exitosamente?`;

            try {
                await sendTelegramMessage({
                    chatId: adminChatId,
                    text: message,
                    buttons: [
                        { text: '✅ Sí, completado', callback_data: `complete:${appointment.id}` },
                        { text: '❌ No se realizó', callback_data: `noshow:${appointment.id}` }
                    ]
                });

                notifiedCount++;
                console.log(`✅ Notificación enviada para cita ${appointment.id}`);
            } catch (error) {
                console.error(`Error enviando notificación para cita ${appointment.id}:`, error);
            }
        }

        return NextResponse.json({
            success: true,
            message: `${notifiedCount} notificación(es) enviada(s)`,
            notified: notifiedCount
        });

    } catch (error) {
        console.error('Error in notify-completed:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// También permitir GET para cron jobs
export async function GET() {
    return POST();
}
