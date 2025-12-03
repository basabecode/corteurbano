#!/usr/bin/env node

/**
 * Script para obtener actualizaciones recientes de Telegram
 * Útil para obtener el chat_id del administrador
 * 
 * Uso: node scripts/get-telegram-updates.js
 */

require('dotenv').config({ path: '.env.local' });

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN no está configurado en .env.local');
    process.exit(1);
}

async function getUpdates() {
    try {
        console.log('📥 Obteniendo actualizaciones recientes de Telegram...\n');

        const response = await fetch(
            `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`
        );

        const data = await response.json();

        if (!data.ok) {
            console.error('❌ Error:', data);
            return;
        }

        if (data.result.length === 0) {
            console.log('⚠️ No hay actualizaciones recientes.\n');
            console.log('💡 Para obtener tu chat_id:');
            console.log('   1. Abre Telegram');
            console.log('   2. Busca tu bot');
            console.log('   3. Envía el comando: /start');
            console.log('   4. Ejecuta este script nuevamente\n');
            return;
        }

        console.log(`✅ Se encontraron ${data.result.length} actualizaciones:\n`);
        console.log('━'.repeat(80));

        data.result.forEach((update, index) => {
            console.log(`\n📨 Actualización #${index + 1}:`);
            console.log(`   Update ID: ${update.update_id}`);

            if (update.message) {
                const msg = update.message;
                console.log(`   Tipo: Mensaje`);
                console.log(`   Chat ID: ${msg.chat.id} ← 🎯 USA ESTE ID`);
                console.log(`   Usuario: ${msg.from.first_name} ${msg.from.last_name || ''}`);
                console.log(`   Username: @${msg.from.username || 'N/A'}`);
                console.log(`   Texto: "${msg.text || 'N/A'}"`);
                console.log(`   Fecha: ${new Date(msg.date * 1000).toLocaleString('es-ES')}`);
            }

            if (update.callback_query) {
                const cb = update.callback_query;
                console.log(`   Tipo: Callback Query (Botón)`);
                console.log(`   Callback ID: ${cb.id}`);
                console.log(`   Chat ID: ${cb.message?.chat.id || 'N/A'}`);
                console.log(`   Usuario: ${cb.from.first_name} ${cb.from.last_name || ''}`);
                console.log(`   Username: @${cb.from.username || 'N/A'}`);
                console.log(`   Datos: "${cb.data}"`);
            }

            console.log('━'.repeat(80));
        });

        // Encontrar el chat_id más común (probablemente el admin)
        const chatIds = data.result
            .map(u => u.message?.chat.id || u.callback_query?.message?.chat.id)
            .filter(Boolean);

        if (chatIds.length > 0) {
            const mostCommon = chatIds.reduce((acc, id) => {
                acc[id] = (acc[id] || 0) + 1;
                return acc;
            }, {});

            const adminChatId = Object.entries(mostCommon)
                .sort((a, b) => b[1] - a[1])[0][0];

            console.log('\n💡 CONFIGURACIÓN RECOMENDADA:');
            console.log('━'.repeat(80));
            console.log(`\nEn tu archivo .env.local, configura:`);
            console.log(`\nTELEGRAM_ADMIN_CHAT_ID=${adminChatId}\n`);
            console.log('━'.repeat(80));
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

getUpdates();
