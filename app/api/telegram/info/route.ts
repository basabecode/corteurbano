import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const token = process.env.TELEGRAM_BOT_TOKEN;

        if (!token) {
            return NextResponse.json(
                { error: 'TELEGRAM_BOT_TOKEN not configured' },
                { status: 500 }
            );
        }

        // Get webhook info from Telegram
        const response = await fetch(
            `https://api.telegram.org/bot${token}/getWebhookInfo`
        );

        const data = await response.json();

        // Get bot info
        const botResponse = await fetch(
            `https://api.telegram.org/bot${token}/getMe`
        );

        const botData = await botResponse.json();

        return NextResponse.json({
            webhook: data.result,
            bot: botData.result,
            environment: {
                hasToken: !!token,
                hasAdminChatId: !!process.env.TELEGRAM_ADMIN_CHAT_ID,
                adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || 'NOT SET'
            }
        });
    } catch (error) {
        return NextResponse.json(
            { error: String(error) },
            { status: 500 }
        );
    }
}
