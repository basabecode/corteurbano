# 🚀 Pasos Finales en Vercel - Configuración del Webhook de Telegram

## ✅ Cambios Desplegados

Los siguientes cambios ya están en producción (o se desplegarán automáticamente):

1. ✅ Logging mejorado en el webhook
2. ✅ Endpoint de diagnóstico `/api/telegram/info`
3. ✅ Validación mejorada de callbacks
4. ✅ Scripts de utilidad para configuración

---

## 🔧 PASOS A SEGUIR EN VERCEL

### Paso 1: Esperar el Deployment

1. Ve a [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto **corteurbano**
3. Espera a que el deployment termine (debería ser automático)
4. Verifica que el estado sea "Ready"

---

### Paso 2: Verificar el Endpoint de Diagnóstico

Una vez desplegado, visita:

```
https://corteurbano.vercel.app/api/telegram/info
```

**Esto te mostrará:**
- Estado del webhook actual
- URL configurada
- Errores recientes (si los hay)
- Información del bot
- Variables de entorno configuradas

---

### Paso 3: Configurar el Webhook con allowed_updates

**ESTE ES EL PASO MÁS IMPORTANTE**

Ejecuta desde tu computadora:

```bash
node scripts/setup-webhook.js https://corteurbano.vercel.app/api/telegram-webhook
```

**Esto configurará:**
- ✅ URL del webhook apuntando a Vercel
- ✅ `allowed_updates: ['message', 'callback_query']` ← **CRÍTICO**
- ✅ Limpiará actualizaciones pendientes

**Deberías ver:**
```
✅ Webhook configurado exitosamente!

📋 Detalles:
   - URL: https://corteurbano.vercel.app/api/telegram-webhook
   - Tipos permitidos: message, callback_query
   - Actualizaciones pendientes: Limpiadas
```

---

### Paso 4: Verificar la Configuración

Ejecuta:

```bash
node scripts/check-webhook-status.js
```

**Deberías ver:**
```
✅ Webhook configurado correctamente
```

O visita nuevamente:
```
https://corteurbano.vercel.app/api/telegram/info
```

---

### Paso 5: Probar el Flujo Completo

1. **Crea una cita de prueba** desde la web
   - Ve a: https://corteurbano.vercel.app
   - Regístrate/inicia sesión
   - Agenda una cita

2. **Verifica que el admin recibe el mensaje en Telegram**
   - Deberías ver el mensaje con los botones
   - ✅ Confirmar
   - ❌ Rechazar

3. **Haz clic en "✅ Confirmar"**

4. **Verifica que funciona:**
   - ✅ Aparece un popup en Telegram: "✅ Cita confirmada"
   - ✅ El estado de la cita cambia a "confirmed" en la base de datos
   - ✅ El cliente recibe una notificación (si tiene Telegram vinculado)

---

### Paso 6: Revisar Logs en Vercel (si algo falla)

1. Ve a Vercel Dashboard → Tu Proyecto
2. Click en la pestaña **"Logs"**
3. Filtra por función: `telegram-webhook`
4. Busca los logs con emojis:

```
📥 TELEGRAM WEBHOOK RECEIVED: ...
🔘 Routing to callback query handler
🔘 CALLBACK QUERY RECEIVED: ...
📋 Parsed - Action: "confirm", Appointment ID: "..."
✅ Appointment ... updated to: confirmed
📤 Sending callback response to admin: "✅ Cita confirmada"
```

**Si NO ves estos logs al hacer clic en los botones:**
- Telegram no está enviando los callbacks
- El webhook no tiene `allowed_updates` configurado correctamente
- Ejecuta nuevamente el Paso 3

---

## 🐛 Troubleshooting

### Problema: Los botones aún no responden

**Solución 1: Verificar allowed_updates**

Visita en tu navegador:
```
https://api.telegram.org/bot<TU_TOKEN>/getWebhookInfo
```

Busca en la respuesta:
```json
{
  "ok": true,
  "result": {
    "url": "https://corteurbano.vercel.app/api/telegram-webhook",
    "allowed_updates": ["message", "callback_query"]  ← Debe incluir "callback_query"
  }
}
```

Si `allowed_updates` NO incluye `"callback_query"`, ejecuta nuevamente:
```bash
node scripts/setup-webhook.js https://corteurbano.vercel.app/api/telegram-webhook
```

---

**Solución 2: Verificar Variables de Entorno en Vercel**

1. Ve a Vercel Dashboard → Tu Proyecto → Settings → Environment Variables
2. Verifica que existan:
   ```
   TELEGRAM_BOT_TOKEN=tu_token_completo
   TELEGRAM_ADMIN_CHAT_ID=tu_chat_id
   ```
3. Si las modificaste, haz un **Redeploy** del proyecto

---

**Solución 3: Limpiar Actualizaciones Pendientes**

Si hay muchas actualizaciones pendientes, Telegram puede estar enviando eventos antiguos:

```bash
node scripts/setup-webhook.js https://corteurbano.vercel.app/api/telegram-webhook
```

Esto limpiará automáticamente las actualizaciones pendientes.

---

## 📊 Checklist Final

```
[ ] Deployment en Vercel completado
[ ] Visitado /api/telegram/info para ver el estado
[ ] Ejecutado: node scripts/setup-webhook.js <URL>
[ ] Verificado que allowed_updates incluye "callback_query"
[ ] Creada una cita de prueba
[ ] Recibido mensaje en Telegram con botones
[ ] Clic en "✅ Confirmar" funciona
[ ] Aparece popup de confirmación
[ ] Estado actualizado en base de datos
[ ] Cliente recibe notificación
[ ] Logs visibles en Vercel Dashboard
```

---

## 🎯 Resumen de URLs Importantes

- **App Web:** https://corteurbano.vercel.app
- **Diagnóstico:** https://corteurbano.vercel.app/api/telegram/info
- **Webhook:** https://corteurbano.vercel.app/api/telegram-webhook
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Webhook Info (Telegram):** https://api.telegram.org/bot<TOKEN>/getWebhookInfo

---

## 💡 Próximo Paso Inmediato

**Ejecuta ahora:**

```bash
node scripts/setup-webhook.js https://corteurbano.vercel.app/api/telegram-webhook
```

Luego prueba creando una cita y haciendo clic en los botones.

---

**¿Necesitas ayuda con algún paso?** Estoy aquí para asistirte.
