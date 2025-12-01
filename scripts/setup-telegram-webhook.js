/**
 * Script para configurar y verificar el webhook de Telegram
 * Ejecutar con: node scripts/setup-telegram-webhook.js
 */

// Cargar variables de entorno
require('dotenv').config({ path: '.env.local' });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const WEBHOOK_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ Error: TELEGRAM_BOT_TOKEN no está configurado en .env.local');
    process.exit(1);
}

const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function getWebhookInfo() {
    console.log('\n📡 Obteniendo información del webhook...\n');

    const response = await fetch(`${TELEGRAM_API}/getWebhookInfo`);
    const data = await response.json();

    if (data.ok) {
        console.log('✅ Información del webhook:');
        console.log(JSON.stringify(data.result, null, 2));
        return data.result;
    } else {
        console.error('❌ Error obteniendo información del webhook:', data);
        return null;
    }
}

async function setWebhook(url) {
    console.log(`\n🔧 Configurando webhook a: ${url}\n`);

    const response = await fetch(`${TELEGRAM_API}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
    });

    const data = await response.json();

    if (data.ok) {
        console.log('✅ Webhook configurado exitosamente');
        return true;
    } else {
        console.error('❌ Error configurando webhook:', data);
        return false;
    }
}

async function deleteWebhook() {
    console.log('\n🗑️  Eliminando webhook...\n');

    const response = await fetch(`${TELEGRAM_API}/deleteWebhook`);
    const data = await response.json();

    if (data.ok) {
        console.log('✅ Webhook eliminado exitosamente');
        return true;
    } else {
        console.error('❌ Error eliminando webhook:', data);
        return false;
    }
}

async function testWebhook() {
    console.log('\n🧪 Probando webhook...\n');

    const webhookInfo = await getWebhookInfo();

    if (!webhookInfo) {
        return;
    }

    if (!webhookInfo.url) {
        console.log('⚠️  No hay webhook configurado');
        return;
    }

    console.log(`\n📊 Estado del webhook:`);
    console.log(`   URL: ${webhookInfo.url}`);
    console.log(`   Actualizaciones pendientes: ${webhookInfo.pending_update_count}`);
    console.log(`   Último error: ${webhookInfo.last_error_message || 'Ninguno'}`);
    console.log(`   Fecha último error: ${webhookInfo.last_error_date ? new Date(webhookInfo.last_error_date * 1000).toLocaleString() : 'N/A'}`);

    if (webhookInfo.last_error_message) {
        console.log('\n⚠️  Hay errores en el webhook. Considera reconfigurarlo.');
    }
}

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    console.log('🤖 Telegram Webhook Manager');
    console.log('============================');

    switch (command) {
        case 'info':
            await getWebhookInfo();
            break;

        case 'set':
            const url = args[1] || `${WEBHOOK_URL}/api/telegram-webhook`;
            await setWebhook(url);
            await getWebhookInfo();
            break;

        case 'delete':
            await deleteWebhook();
            await getWebhookInfo();
            break;

        case 'test':
            await testWebhook();
            break;

        default:
            console.log('\n📖 Uso:');
            console.log('   node scripts/setup-telegram-webhook.js info          - Ver información del webhook');
            console.log('   node scripts/setup-telegram-webhook.js set [URL]     - Configurar webhook');
            console.log('   node scripts/setup-telegram-webhook.js delete        - Eliminar webhook');
            console.log('   node scripts/setup-telegram-webhook.js test          - Probar webhook');
            console.log('\nEjemplo:');
            console.log('   node scripts/setup-telegram-webhook.js set https://tu-app.vercel.app/api/telegram-webhook');
            await testWebhook();
    }
}

main().catch(console.error);
