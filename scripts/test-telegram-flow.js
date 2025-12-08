// scripts/test-telegram-flow.js
// Script para probar el flujo de confirmación de Telegram
// Requiere que el servidor de desarrollo esté corriendo en localhost:3000

const BASE_URL = 'http://localhost:3000';

async function main() {
    console.log('🚀 Iniciando prueba de flujo Telegram...');

    // 1. Simular un Appointment ID existente (o uno falso para probar validación)
    // Lo ideal sería crear uno real, pero para probar rápidamente usaremos uno falso
    // o pediremos al usuario que ingrese uno.

    const appointmentId = process.argv[2] || 'test-appointment-id';
    console.log(`📋 Usando Appointment ID: ${appointmentId}`);

    if (appointmentId === 'test-appointment-id') {
        console.warn('⚠️ ADVERTENCIA: Usando ID de prueba. La base de datos probablemente no encontrará esta cita.');
        console.warn('   Para una prueba real, pasa un ID válido como argumento: node scripts/test-telegram-flow.js <UUID>');
    }

    // 2. Simular Callback de "Confirmar" desde Telegram
    console.log('\n🔄 Simulando click en botón "Confirmar"...');

    const callbackPayload = {
        callback_query: {
            id: 'test_callback_id_' + Date.now(),
            data: `confirm:${appointmentId}`,
            message: {
                message_id: 12345,
                chat: {
                    id: 987654321 // Fake Admin ID
                },
                text: 'Mensaje original de solicitud de cita...'
            }
        }
    };

    try {
        const res = await fetch(`${BASE_URL}/api/telegram-webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(callbackPayload)
        });

        const data = await res.json();
        console.log('📡 Respuesta del Webhook:', res.status, data);

        if (res.ok) {
            console.log('✅ Webhook procesado correctamente.');
            console.log('   - Verifica en la consola del servidor si se intentó "editMessageText".');
            console.log('   - Verifica si se intentó notificar al cliente.');
        } else {
            console.error('❌ Error en el webhook:', data);
        }

    } catch (error) {
        console.error('❌ Error de conexión:', error.message);
        console.log('   Asegúrate de que el servidor esté corriendo (pnpm run dev).');
    }
}

main();
