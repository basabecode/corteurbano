# ✅ Checklist de Acciones Inmediatas - BarberKing

## 🔴 URGENTE - Hacer Ahora

### 1. Verificar que los Tests Pasen
```bash
# Ejecutar tests unitarios
npm run test:unit

# Si hay errores, revisar:
# - Configuración de .env.test
# - Conexión a Supabase
```

### 2. Configurar Webhook de Telegram en Producción
```bash
# Reemplazar <TU_BOT_TOKEN> con tu token real
curl -X POST "https://api.telegram.org/bot<TU_BOT_TOKEN>/setWebhook" \
  -d "url=https://barberking-three.vercel.app/api/telegram-webhook"

# Verificar que se configuró correctamente
curl "https://api.telegram.org/bot<TU_BOT_TOKEN>/getWebhookInfo"
```

**Resultado esperado:**
```json
{
  "ok": true,
  "result": {
    "url": "https://barberking-three.vercel.app/api/telegram-webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

### 3. Verificar Variables de Entorno en Vercel
Ve a: https://vercel.com/tu-proyecto/settings/environment-variables

Asegúrate de tener:
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `TELEGRAM_BOT_TOKEN`
- [ ] `TELEGRAM_ADMIN_CHAT_ID`

---

## 🟡 IMPORTANTE - Hacer Hoy

### 4. Crear Usuario Administrador
```sql
-- Ejecutar en Supabase SQL Editor
-- Primero, registra un usuario desde la web
-- Luego, obtén su ID y ejecuta:

UPDATE profiles 
SET role = 'admin' 
WHERE email = 'tu-email-admin@ejemplo.com';

-- Verificar
SELECT id, email, role FROM profiles WHERE role = 'admin';
```

### 5. Probar Flujo Completo en Producción
- [ ] Registrar un nuevo usuario (cliente)
- [ ] Agendar una cita
- [ ] Verificar que llegue notificación a Telegram del admin
- [ ] Confirmar/Rechazar desde Telegram
- [ ] Verificar que el cliente reciba notificación
- [ ] Verificar dashboard de cliente
- [ ] Verificar dashboard de admin

### 6. Vincular Telegram del Admin
```bash
# 1. Abre Telegram y busca tu bot
# 2. Envía el comando:
/start

# 3. Obtén tu Chat ID usando @userinfobot
# 4. Actualiza TELEGRAM_ADMIN_CHAT_ID en Vercel
```

---

## 🟢 OPCIONAL - Mejoras Futuras

### 7. Monitoreo y Analytics
- [ ] Configurar Vercel Analytics
- [ ] Implementar error tracking (Sentry)
- [ ] Configurar logs de Telegram

### 8. Optimizaciones
- [ ] Agregar imágenes reales de la barbería
- [ ] Optimizar imágenes con Next.js Image
- [ ] Configurar dominio personalizado

### 9. Funcionalidades Adicionales
- [ ] Sistema de recordatorios (24h antes)
- [ ] Notificaciones por email
- [ ] Sistema de pagos (Stripe)
- [ ] Galería de trabajos

---

## 🐛 Troubleshooting

### Problema: "Webhook no recibe actualizaciones"
**Solución:**
1. Verificar que la URL sea HTTPS
2. Verificar que el endpoint responda 200 OK
3. Revisar logs en Vercel
4. Ejecutar `getWebhookInfo` para ver errores

### Problema: "Bot bloqueado por el usuario"
**Solución:**
1. El usuario debe iniciar conversación con `/start`
2. Verificar que `telegram_chat_id` esté guardado en BD
3. Manejar error gracefully en el código

### Problema: "Tests fallan por timeout"
**Solución:**
1. Verificar conexión a Supabase
2. Deshabilitar email confirmation en Supabase (solo para testing)
3. Aumentar timeout en jest.config.js si es necesario

### Problema: "No autorizado" en dashboard
**Solución:**
1. Verificar que el usuario esté autenticado
2. Revisar políticas RLS en Supabase
3. Verificar que el rol sea correcto (admin/customer)

---

## 📊 Verificación Final

Antes de considerar el proyecto "completo", verifica:

- [x] Build exitoso (`npm run build`)
- [x] Sin errores de TypeScript
- [x] Tests unitarios pasando
- [ ] Webhook de Telegram configurado
- [ ] Usuario admin creado
- [ ] Flujo completo probado en producción
- [ ] Variables de entorno configuradas en Vercel

---

## 🎯 Criterios de Éxito

El proyecto está listo cuando:
1. ✅ Un cliente puede registrarse y agendar una cita
2. ✅ El admin recibe notificación en Telegram
3. ✅ El admin puede confirmar/rechazar desde Telegram
4. ✅ El cliente recibe confirmación en Telegram
5. ✅ Los dashboards muestran la información correcta
6. ✅ No hay errores en consola de Vercel

---

**Tiempo estimado para completar:** 1-2 horas  
**Prioridad:** 🔴 Alta  
**Última actualización:** 2 de Diciembre, 2025
