#!/usr/bin/env node

/**
 * Enhanced Telegram Webhook Simulator
 * 
 * This script simulates Telegram callback queries to test the webhook locally.
 * 
 * Usage:
 *   node scripts/test-webhook-callback.js <APPOINTMENT_ID> [action]
 * 
 * Examples:
 *   node scripts/test-webhook-callback.js abc123 confirm
 *   node scripts/test-webhook-callback.js abc123 cancel
 */

const http = require('http');

const APPOINTMENT_ID = process.argv[2];
const ACTION = process.argv[3] || 'confirm';

if (!APPOINTMENT_ID) {
    console.error('❌ Por favor proporciona el ID de la cita como argumento.');
    console.error('\nUso: node scripts/test-webhook-callback.js <APPOINTMENT_ID> [action]');
    console.error('\nEjemplos:');
    console.error('  node scripts/test-webhook-callback.js abc123 confirm');
    console.error('  node scripts/test-webhook-callback.js abc123 cancel');
    process.exit(1);
}

if (!['confirm', 'cancel'].includes(ACTION)) {
    console.error(`❌ Acción inválida: "${ACTION}". Debe ser "confirm" o "cancel".`);
    process.exit(1);
}

const payload = {
    update_id: 123456789,
    callback_query: {
        id: 'test-callback-query-id-' + Date.now(),
        from: {
            id: 123456789,
            is_bot: false,
            first_name: 'Test',
            last_name: 'Admin',
            username: 'testadmin'
        },
        message: {
            message_id: 999,
            chat: {
                id: 123456789,
                type: 'private'
            },
            date: Math.floor(Date.now() / 1000),
            text: 'Test message'
        },
        chat_instance: 'test-chat-instance',
        data: `${ACTION}:${APPOINTMENT_ID}`
    }
};

const data = JSON.stringify(payload);

console.log('🚀 Simulando callback query de Telegram...\n');
console.log('📋 Datos del callback:');
console.log(`   - Appointment ID: ${APPOINTMENT_ID}`);
console.log(`   - Action: ${ACTION}`);
console.log(`   - Callback Data: ${payload.callback_query.data}\n`);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/telegram-webhook',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`📡 Status Code: ${res.statusCode}\n`);

    let responseData = '';

    res.on('data', (chunk) => {
        responseData += chunk;
    });

    res.on('end', () => {
        console.log('📥 Response:');
        try {
            const parsed = JSON.parse(responseData);
            console.log(JSON.stringify(parsed, null, 2));

            if (parsed.ok) {
                console.log('\n✅ Webhook procesado exitosamente!');
                console.log('\n💡 Verifica:');
                console.log('   1. Los logs del servidor para ver el flujo completo');
                console.log('   2. La base de datos para confirmar el cambio de estado');
                console.log('   3. Que el cliente recibió la notificación (si tiene Telegram vinculado)');
            } else {
                console.log('\n❌ El webhook retornó un error');
            }
        } catch (e) {
            console.log(responseData);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error al conectar con el webhook:', error.message);
    console.error('\n💡 Asegúrate de que el servidor esté corriendo:');
    console.error('   npm run dev');
});

req.write(data);
req.end();
