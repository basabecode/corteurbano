require('dotenv').config({ path: '.env.local' });

async function testSend() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const adminId = process.env.TELEGRAM_ADMIN_CHAT_ID;

    if (!token) {
        console.error('❌ Missing TELEGRAM_BOT_TOKEN');
        return;
    }
    if (!adminId) {
        console.error('❌ Missing TELEGRAM_ADMIN_CHAT_ID');
        return;
    }

    console.log(`📤 Attempting to send message to Admin ID: ${adminId}`);

    try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: adminId,
                text: '🧪 Prueba de conexión manual desde script de diagnóstico.',
                parse_mode: 'HTML'
            })
        });

        const data = await res.json();
        if (res.ok) {
            console.log('✅ SendMessage SUCCESS:', data);
        } else {
            console.error('❌ SendMessage FAILED:', data);
        }
    } catch (err) {
        console.error('❌ Error testing connection:', err);
    }
}

testSend();
