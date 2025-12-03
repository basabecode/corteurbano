#!/usr/bin/env node

/**
 * Script para configurar el webhook de Telegram
 * 
 * Uso: node scripts/setup-webhook.js <WEBHOOK_URL>
 * Ejemplo: node scripts/setup-webhook.js https://tu-dominio.vercel.app/api/telegram-webhook
 */

require('dotenv').config({ path: '.env.local' });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.argv[2];

if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN no está configurado en .env.local');
    process.exit(1);
}

if (!WEBHOOK_URL) {
    console.error('❌ Por favor proporciona la URL del webhook');
    console.error('\nUso: node scripts/setup-webhook.js <WEBHOOK_URL>');
    console.error('Ejemplo: node scripts/setup-webhook.js https://tu-dominio.vercel.app/api/telegram-webhook');
    process.exit(1);
}

async function setupWebhook() {
    try {
        console.log('🔧 Configurando webhook de Telegram...\n');
        console.log(`URL del webhook: ${WEBHOOK_URL}\n`);

        // Configurar el webhook con allowed_updates para incluir callback_query
        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: WEBHOOK_URL,
                    allowed_updates: ['message', 'callback_query'], // IMPORTANTE: Incluir callback_query
                    drop_pending_updates: true // Limpiar actualizaciones pendientes
                })
            }
        );

        const data = await response.json();

        if (data.ok) {
            console.log('✅ Webhook configurado exitosamente!\n');
            console.log('📋 Detalles:');
            console.log(`   - URL: ${WEBHOOK_URL}`);
            console.log(`   - Tipos permitidos: message, callback_query`);
            console.log(`   - Actualizaciones pendientes: Limpiadas\n`);

            console.log('💡 Próximos pasos:');
            console.log('   1. Verifica el estado: node scripts/check-webhook-status.js');
            console.log('   2. Crea una cita de prueba desde la web');
            console.log('   3. Haz clic en los botones de Telegram\n');
        } else {
            console.error('❌ Error al configurar el webhook:', data);
            console.error('\n💡 Posibles causas:');
            console.error('   - La URL no es accesible desde internet');
            console.error('   - La URL no usa HTTPS');
            console.error('   - El certificado SSL es inválido');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

setupWebhook();
