import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { sendWhatsAppMessage, markWhatsAppMessageAsRead } from '@/lib/whatsapp';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { formatCOP } from '@/lib/format-currency';

// Tipos para el payload de WhatsApp
type WhatsAppChangeValue = {
    messaging_product: 'whatsapp';
    metadata: {
        display_phone_number: string;
        phone_number_id: string;
    };
    contacts?: Array<{
        profile: {
            name: string;
        };
        wa_id: string;
    }>;
    messages?: Array<{
        from: string;
        id: string;
        timestamp: string;
        text?: {
            body: string;
        };
        type: 'text' | 'interactive' | 'image';
        interactive?: {
            type: 'button_reply';
            button_reply: {
                id: string;
                title: string;
            };
        };
    }>;
};

type WhatsAppEntry = {
    id: string;
    changes: Array<{
        value: WhatsAppChangeValue;
        field: 'messages';
    }>;
};

type WhatsAppPayload = {
    object: 'whatsapp_business_account';
    entry: WhatsAppEntry[];
};

type AppointmentRecord = {
    id: string;
    start_time: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
    client: {
        full_name: string | null;
        phone: string | null;
    } | null;
    service: {
        name: string | null;
        price: number | null;
        duration_minutes: number | null;
    } | null;
};

/**
 * GET: Verificación del Webhook (requerido por Meta)
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('✅ WEBHOOK_VERIFIED');
            return new Response(challenge, { status: 200 });
        } else {
            return new Response('Forbidden', { status: 403 });
        }
    }

    return new Response('Bad Request', { status: 400 });
}

/**
 * POST: Recepción de eventos (mensajes, estados)
 */
export async function POST(request: Request) {
    try {
        const body = (await request.json()) as WhatsAppPayload;
        // console.log('📥 WHATSAPP WEBHOOK RECEIVED:', JSON.stringify(body, null, 2));

        if (body.object) {
            if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages && body.entry[0].changes[0].value.messages[0]) {
                const message = body.entry[0].changes[0].value.messages[0];
                const businessPhoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
                const from = message.from; // Número de teléfono (e.g. 573001234567)
                const messageId = message.id;

                // Marcar como leído
                await markWhatsAppMessageAsRead(messageId);

                // Manejar mensaje de texto
                if (message.type === 'text' && message.text) {
                    const text = message.text.body;
                    await handleWhatsAppMessage(from, text);
                } else if (message.type === 'interactive' && message.interactive) {
                    // Manejar respuestas a botones si es necesario
                    // const buttonId = message.interactive.button_reply.id;
                    // await handleButtonReply(from, buttonId);
                }
            }
            return NextResponse.json({ ok: true });
        } else {
            return NextResponse.json({ ok: false, error: 'Not a WhatsApp event' }, { status: 404 });
        }
    } catch (error) {
        console.error('❌ ERROR in whatsapp webhook:', error);
        return NextResponse.json({ ok: false, error: String(error) }, { status: 500 });
    }
}

async function handleWhatsAppMessage(from: string, text: string) {
    const supabase = createSupabaseServiceClient();

    // Limpiar el número para buscar en DB (Asumiendo formato colombiano 57 + 10 digitos)
    // Base de datos suele tener 10 digitos (300...)
    let searchPhone = from;
    if (from.startsWith('57') && from.length === 12) {
        searchPhone = from.substring(2);
    } else if (from.startsWith('57') && from.length > 10) {
        // Caso genérico, quitar prefijo 57 si existe
        searchPhone = from.substring(2);
    }

    console.log(`🔍 Searching user with phone: ${searchPhone} (Raw: ${from})`);

    // Buscar usuario
    const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .eq('phone', searchPhone)
        .maybeSingle();

    if (!user) {
        console.log('User not found via phone');
        // Usuario no encontrado => Mensaje de bienvenida genérico
        await sendWhatsAppMessage({
            to: from,
            text: `👋 <b>¡Hola! Bienvenido a Corte Urbano</b>
    
No hemos encontrado una cuenta con el número *${searchPhone}*.

🔹 Regístrate o agenda tu cita en nuestra web primero.
🔹 Ofrecemos servicios en tienda y <b>a domicilio</b> 🛵.

Si ya tienes cuenta, verifica que tu número sea el correcto.`
        });
        return;
    }

    // Usuario encontrado
    const firstName = user.full_name?.split(' ')[0] || 'Cliente';

    // Analizar intención básica
    const lowerText = text.toLowerCase();

    if (lowerText.includes('hola') || lowerText.includes('inicio') || lowerText.includes('start')) {
        await sendWhatsAppMessage({
            to: from,
            text: `💈 ¡Hola *${firstName}*! Qué gusto saludarte.
        
¿En qué podemos ayudarte hoy? `
        });

        // Mostrar última cita si existe
        await sendLastAppointmentStatus(from, user.id);
    } else if (lowerText.includes('domicilio')) {
        await sendWhatsAppMessage({
            to: from,
            text: `🛵 *Servicio a Domicilio*
          
Llevamos la experiencia Corte Urbano a tu casa.
Para agendar a domicilio, selecciona la opción "Domicilio" al reservar en nuestra web o indícanos por aquí tu dirección y horario deseado para gestionarlo manualmente.`
        });
    } else {
        // Respuesta por defecto
        await sendWhatsAppMessage({
            to: from,
            text: `Gracias por escribirnos.
          
Recuerda que puedes gestionar tus citas en nuestra web.
Si tienes una consulta urgente, un asesor te responderá pronto.`
        });
    }
}

async function sendLastAppointmentStatus(to: string, userId: string) {
    const supabase = createSupabaseServiceClient();

    // Obtener última cita
    const { data: lastAppointment } = await supabase
        .from('appointments')
        .select(`
        id,
        start_time,
        status,
        service:services(name, price, duration_minutes)
      `)
        .eq('client_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle<AppointmentRecord>();

    if (lastAppointment) {
        const serviceName = lastAppointment.service?.name || 'Servicio';
        const dateStr = format(new Date(lastAppointment.start_time), "EEEE, dd 'de' MMMM", { locale: es });
        const timeStr = format(new Date(lastAppointment.start_time), "HH:mm", { locale: es });
        const priceStr = lastAppointment.service?.price ? formatCOP(lastAppointment.service.price) : 'N/A';
        const statusMap: Record<string, string> = {
            'pending': '⏳ Pendiente',
            'confirmed': '✅ Confirmada',
            'cancelled': '❌ Cancelada',
            'completed': '✨ Completada'
        };
        const statusText = statusMap[lastAppointment.status] || lastAppointment.status;

        const msg = `📋 *Tu última solicitud:*

🛠 Servicio: ${serviceName}
📅 Fecha: ${dateStr}
🕐 Hora: ${timeStr}
💰 Valor: ${priceStr}
stat Estado: ${statusText}`;

        await sendWhatsAppMessage({
            to: to,
            text: msg
        });
    }
}
