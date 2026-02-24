const fs = require('fs');
const path = require('path');
const https = require('https');

// 1. Cargar variables de entorno desde .env.local manualmente
console.log('📂 Leyendo .env.local...');
const envPath = path.join(__dirname, '..', '.env.local');

try {
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        envConfig.split('\n').forEach(line => {
            // Ignorar comentarios y líneas vacías
            if (!line || line.startsWith('#')) return;

            // Separar por el primer signo =
            const parts = line.split('=');
            const key = parts[0].trim();
            // Unir el resto por si el valor contiene =
            const value = parts.slice(1).join('=').trim();

            if (key && value) {
                process.env[key] = value;
            }
        });
    } else {
        console.error('❌ No se encontró el archivo .env.local');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Error leyendo .env.local:', error.message);
    process.exit(1);
}

// 2. Obtener credenciales
const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;

if (!token || !chatId) {
    console.error('❌ Faltan credenciales en .env.local');
    console.log('TELEGRAM_BOT_TOKEN:', token ? '✅ Configurado' : '❌ Faltante');
    console.log('TELEGRAM_ADMIN_CHAT_ID:', chatId ? '✅ Configurado' : '❌ Faltante');
    process.exit(1);
}

console.log(`🔑 Token: ${token.substring(0, 5)}...`);
console.log(`👤 Chat ID: ${chatId}`);

// 3. Enviar mensaje de prueba
console.log('📨 Enviando mensaje de prueba a Telegram...');

const data = JSON.stringify({
    chat_id: chatId,
    text: '🔔 *Prueba de Sistema Corte Urbano*\n\nSi estás leyendo esto, ¡tu bot está correctamente configurado! 🚀\n\nYa puedes recibir notificaciones de nuevas citas.',
    parse_mode: 'Markdown'
});

const options = {
    hostname: 'api.telegram.org',
    port: 443,
    path: `/bot${token}/sendMessage`,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (chunk) => body += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            const response = JSON.parse(body);
            if (response.ok) {
                console.log('\n✅ ¡ÉXITO! Mensaje enviado correctamente.');
                console.log('📱 Revisa tu Telegram, deberías haber recibido el mensaje.');
            } else {
                console.error('\n❌ Error de API Telegram:', response.description);
            }
        } else {
            console.error(`\n❌ Error HTTP (${res.statusCode}):`, body);
        }
    });
});

req.on('error', (e) => {
    console.error('\n❌ Error de conexión:', e.message);
});

req.write(data);
req.end();
