#!/usr/bin/env node

/**
 * Script para verificar el estado del webhook de Telegram
 * 
 * Uso: node scripts/check-webhook-status.js
 */

require('dotenv').config({ path: '.env.local' });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN no está configurado en .env.local');
    process.exit(1);
}

async function checkWebhookStatus() {
    try {
        console.log('🔍 Verificando estado del webhook de Telegram...\n');

        // Obtener información del webhook
        const webhookResponse = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`
        );
        const webhookData = await webhookResponse.json();

        if (!webhookData.ok) {
            console.error('❌ Error al obtener información del webhook:', webhookData);
            return;
        }

        const info = webhookData.result;

        console.log('📋 Estado del Webhook:');
        console.log('━'.repeat(60));
        console.log(`URL: ${info.url || '❌ NO CONFIGURADO'}`);
        console.log(`Actualizaciones pendientes: ${info.pending_update_count || 0}`);
        console.log(`Máximo de conexiones: ${info.max_connections || 'N/A'}`);

        if (info.last_error_date) {
            const errorDate = new Date(info.last_error_date * 1000);
            console.log(`\n⚠️ Último error: ${errorDate.toLocaleString('es-ES')}`);
            console.log(`   Mensaje: ${info.last_error_message || 'N/A'}`);
        } else {
            console.log('\n✅ Sin errores recientes');
        }

        if (info.allowed_updates && info.allowed_updates.length > 0) {
            console.log(`\nTipos de actualización permitidos: ${info.allowed_updates.join(', ')}`);
        }

        console.log('━'.repeat(60));

        // Verificar si el webhook está configurado
        if (!info.url) {
            console.log('\n⚠️ PROBLEMA DETECTADO:');
            console.log('   El webhook NO está configurado en Telegram.');
            console.log('\n💡 Solución:');
            console.log('   Ejecuta: node scripts/setup-webhook.js');
            return;
        }

        // Verificar si hay actualizaciones pendientes
        if (info.pending_update_count > 0) {
            console.log('\n⚠️ ADVERTENCIA:');
            console.log(`   Hay ${info.pending_update_count} actualizaciones pendientes.`);
            console.log('   Esto puede indicar que el webhook no está procesando correctamente.');
            console.log('\n💡 Posibles causas:');
            console.log('   1. El servidor no está accesible desde internet');
            console.log('   2. Hay errores en el código del webhook');
            console.log('   3. El certificado SSL tiene problemas');
        }

        // Verificar si hay errores recientes
        if (info.last_error_date) {
            const hoursSinceError = (Date.now() / 1000 - info.last_error_date) / 3600;
            if (hoursSinceError < 24) {
                console.log('\n❌ PROBLEMA DETECTADO:');
                console.log('   Hubo errores en las últimas 24 horas.');
                console.log('\n💡 Revisa los logs del servidor para más detalles.');
            }
        }

        // Obtener información del bot
        console.log('\n🤖 Información del Bot:');
        console.log('━'.repeat(60));
        const botResponse = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`
        );
        const botData = await botResponse.json();

        if (botData.ok) {
            const bot = botData.result;
            console.log(`Nombre: @${bot.username}`);
            console.log(`ID: ${bot.id}`);
            console.log(`Nombre completo: ${bot.first_name}`);
            console.log(`Puede unirse a grupos: ${bot.can_join_groups ? 'Sí' : 'No'}`);
            console.log(`Puede leer todos los mensajes: ${bot.can_read_all_group_messages ? 'Sí' : 'No'}`);
        }
        console.log('━'.repeat(60));

        // Resumen
        console.log('\n📊 RESUMEN:');
        if (!info.url) {
            console.log('❌ Webhook NO configurado');
        } else if (info.last_error_date && (Date.now() / 1000 - info.last_error_date) < 86400) {
            console.log('⚠️ Webhook configurado pero con errores recientes');
        } else if (info.pending_update_count > 5) {
            console.log('⚠️ Webhook configurado pero con actualizaciones pendientes');
        } else {
            console.log('✅ Webhook configurado correctamente');
        }

    } catch (error) {
        console.error('❌ Error al verificar el webhook:', error.message);
    }
}

checkWebhookStatus();
