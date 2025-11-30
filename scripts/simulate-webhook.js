const http = require('http');

// ID de la cita a confirmar (Reemplazar con un ID real de la base de datos si es necesario)
// Puedes obtener un ID real mirando la respuesta de la creación de la cita o en la base de datos.
const APPOINTMENT_ID = process.argv[2];

if (!APPOINTMENT_ID) {
    console.error('Por favor proporciona el ID de la cita como argumento.');
    console.error('Uso: node scripts/simulate-webhook.js <APPOINTMENT_ID>');
    process.exit(1);
}

const payload = {
    callback_query: {
        id: '123456789',
        data: `confirm:${APPOINTMENT_ID}`,
        message: {
            chat: {
                id: 123456789 // ID simulado del admin
            }
        }
    }
};

const data = JSON.stringify(payload);

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
