
// Usando https nativo para evitar dependencias
const https = require('https');

const data = JSON.stringify({
    callback_query: {
        id: "test_callback_id_123",
        data: "confirm:1493fd3e-fa05-442b9-a862-ab0f707ecae4",
        from: {
            id: 123456789,
            first_name: "Test Admin"
        },
        message: {
            chat: {
                id: 123456789
            },
            text: "Mensaje original"
        }
    }
});

const options = {
    hostname: 'corteurbano.vercel.app',
    port: 443,
    path: '/api/telegram-webhook',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

console.log('Enviando petición de prueba al webhook...');

const req = https.request(options, (res) => {
    console.log(`Status Code: ${res.statusCode}`);

    res.on('data', (d) => {
        process.stdout.write(d);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
