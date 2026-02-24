import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export async function GET(request: Request) {
    // Basic connectivity check to Admin
    try {
        const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
        if (!adminChatId) {
            return NextResponse.json({ error: 'TELEGRAM_ADMIN_CHAT_ID missing' }, { status: 500 });
        }

        await sendTelegramMessage({
            chatId: adminChatId,
            text: '🔔 Test check: Backend can send messages to Admin.'
        });

        return NextResponse.json({ success: true, message: 'Message sent to Admin' });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    // Advanced test: Send customized message to ANY Chat ID to sanity check delivery
    try {
        const body = await request.json();
        const { chatId, type = 'text' } = body;

        if (!chatId) {
            return NextResponse.json({ error: 'Missing chatId in body' }, { status: 400 });
        }

        let message = '';
        if (type === 'confirmation_simulation') {
            message = `✅ <b>TEST DE CONFIRMACION</b>
            
📋 <b>Detalles (Simulación):</b>
🛠 Servicio: Corte Test
📅 Fecha: 01/01/2025
🕐 Hora: 10:00

<i>Si recibes esto, el bot puede escribirte correctamente.</i>`;
        } else {
            message = '👋 This is a manual test message from Corte Urbano API.';
        }

        console.log(`Sending test message to ${chatId}...`);

        await sendTelegramMessage({
            chatId: chatId,
            text: message,
            parse_mode: 'HTML'
        });

        return NextResponse.json({
            success: true,
            message: `Message sent to ${chatId}`,
            sent_content: message
        });

    } catch (error: any) {
        console.error('Test Telegram Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
