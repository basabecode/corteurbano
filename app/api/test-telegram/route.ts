import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';

export async function GET() {
    try {
        const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
        const token = process.env.TELEGRAM_BOT_TOKEN;

        if (!token) {
            console.error('Test Telegram: Token missing');
            return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN is missing' }, { status: 500 });
        }
        if (!adminChatId) {
            console.error('Test Telegram: Admin Chat ID missing');
            return NextResponse.json({ error: 'TELEGRAM_ADMIN_CHAT_ID is missing' }, { status: 500 });
        }

        console.log('Test Telegram Config:', {
            chatId: adminChatId,
            tokenPrefix: token.substring(0, 5) + '...'
        });

        await sendTelegramMessage({
            chatId: adminChatId,
            text: '🔔 Test message from BarberKing App (Admin Debug)'
        });

        return NextResponse.json({ success: true, message: 'Message sent to admin' });
    } catch (error: any) {
        console.error('Test Telegram Error:', error);
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
