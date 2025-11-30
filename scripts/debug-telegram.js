const http = require('http');

http.get('http://localhost:3000/api/test-telegram', (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('Error:', json.error);
        } catch (e) {
            console.log('Raw Body:', data);
        }
    });
}).on('error', (err) => {
    console.error('Network Error:', err.message);
});
