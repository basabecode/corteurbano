# Cómo probar notificaciones de Telegram

Hemos creado una herramienta para verificar si el sistema puede enviar mensajes correctamente a un cliente específico.

## Pasos para probar

### 1. Obtener un Chat ID
Para probar, necesitas un ID de Telegram válido (puede ser el tuyo o el de un cliente que te haya dado su ID).
- En Telegram, busca el bot **@userinfobot**.
- Dale a iniciar y copia el número (ej: `123456789`).

### 2. Enviar mensaje de prueba (Simulación)
Abre un terminal (PowerShell o Git Bash) y ejecuta el siguiente comando, reemplazando `TU_CHAT_ID` por el número que obtuviste:

**PowerShell:**
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/test-telegram" -Method POST -ContentType "application/json" -Body '{"chatId": "TU_CHAT_ID", "type": "confirmation_simulation"}'
```

**Curl (Bash/CMD):**
```bash
curl -X POST http://localhost:3000/api/test-telegram \
  -H "Content-Type: application/json" \
  -d '{"chatId": "TU_CHAT_ID", "type": "confirmation_simulation"}'
```

### 3. Verificar
- Si recibes el mensaje en Telegram: **La conexión funciona correctamente.**
- Si el comando da error 500: Revisa los logs de la terminal de Next.js.
- Si el comando dice "success" pero no llega nada:
  - Verifica que el usuario haya iniciado el bot (no puede recibir mensajes si bloqueó el bot).
  - Verifica que el TOKEN del bot en `.env` sea el correcto.

## Solución de problemas comunes

- **Error 400 "Bad Request" de Telegram**: El Chat ID no existe o es inválido.
- **Error 403 "Forbidden"**: El usuario bloqueó al bot o nunca le ha escrito (`/start`).
- **Error 401 "Unauthorized"**: El token del bot es incorrecto.
