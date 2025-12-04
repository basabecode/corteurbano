# 📝 Código para Actualizar el Webhook de Telegram

## Instrucciones

Abre el archivo `app/api/telegram-webhook/route.ts` y realiza los siguientes cambios:

---

## CAMBIO 1: Líneas 96-97

**BUSCAR:**
```typescript
  const nextStatus = action === 'confirm' ? 'confirmed' : 'cancelled';
  console.log(`Updating appointment ${appointmentId} to status: ${nextStatus}`);
```

**REEMPLAZAR CON:**
```typescript
  // Determinar el nuevo estado basado en la acción
  let nextStatus: 'confirmed' | 'cancelled' | 'completed';
  let adminResponse: string;

  switch (action) {
    case 'confirm':
      nextStatus = 'confirmed';
      adminResponse = '✅ Cita confirmada';
      break;
    case 'cancel':
      nextStatus = 'cancelled';
      adminResponse = '❌ Cita cancelada';
      break;
    case 'complete':
      nextStatus = 'completed';
      adminResponse = '✅ Servicio marcado como completado';
      break;
    case 'noshow':
      nextStatus = 'cancelled';
      adminResponse = '❌ Marcado como no realizado';
      break;
    default:
      await answerCallbackQuery(callback.id, 'Acción no reconocida');
      return NextResponse.json({ ok: false, error: 'Unknown action' });
  }

  console.log(`Updating appointment ${appointmentId} to status: ${nextStatus}`);
```

---

## CAMBIO 2: Líneas 113-116

**BUSCAR:**
```typescript
  console.log(`✅ Appointment ${appointmentId} updated to: ${nextStatus}`);

  // Responder al admin
  const adminResponse = nextStatus === 'confirmed' ? '✅ Cita confirmada' : '❌ Cita cancelada';
  console.log(`📤 Sending callback response to admin: "${adminResponse}"`);
  await answerCallbackQuery(callback.id, adminResponse);
```

**REEMPLAZAR CON:**
```typescript
  console.log(`✅ Appointment ${appointmentId} updated to: ${nextStatus}`);

  // Responder al admin (adminResponse ya está definido en el switch)
  console.log(`📤 Sending callback response to admin: "${adminResponse}"`);
  await answerCallbackQuery(callback.id, adminResponse);
```

---

## CAMBIO 3: Líneas 128-188 (TODA LA SECCIÓN DE NOTIFICACIÓN AL CLIENTE)

**BUSCAR TODO DESDE:**
```typescript
  if (nextStatus === 'confirmed') {
    // Mensaje de confirmación al cliente
```

**HASTA:**
```typescript
    }
  }

  console.log(`Appointment ${appointmentId} successfully updated to ${nextStatus}`);
  return NextResponse.json({ ok: true });
}
```

**REEMPLAZAR CON:**
```typescript
  // Preparar mensaje para el cliente según el estado
  let clientMessage = '';

  if (nextStatus === 'confirmed') {
    // Mensaje de confirmación al cliente
    clientMessage = `🎉 *¡Tu cita ha sido confirmada!*

📅 *Detalles de tu cita:*
• Servicio: ${serviceName}
• Fecha: ${appointmentDate}
• Precio: $${servicePrice.toFixed(2)}

✨ ¡Te esperamos! Si necesitas cancelar o reprogramar, por favor avísanos con anticipación.`;
  } else if (nextStatus === 'cancelled') {
    // Mensaje de cancelación al cliente
    clientMessage = `❌ *Tu cita ha sido cancelada*

📅 *Detalles de la cita cancelada:*
• Servicio: ${serviceName}
• Fecha: ${appointmentDate}

Si deseas agendar una nueva cita, puedes hacerlo cuando gustes.`;
  } else if (nextStatus === 'completed') {
    // Mensaje de servicio completado
    clientMessage = `✅ *¡Gracias por tu visita!*

Tu servicio de *${serviceName}* ha sido completado exitosamente.

¡Esperamos verte pronto! 💈✨`;
  }

  // Enviar mensaje al cliente si tiene telegram_chat_id y hay mensaje
  if (clientMessage) {
    const clientChatId = appointment.client?.telegram_chat_id;
    if (clientChatId) {
      console.log(`📤 Sending notification to client (${clientChatId})`);
      try {
        await sendTelegramMessage({
          chatId: clientChatId,
          text: clientMessage
        });
        console.log(`✅ Client notification sent successfully`);
      } catch (error) {
        console.error(`❌ Error sending client notification:`, error);
      }
    } else {
      console.log(`⚠️ Client has no telegram_chat_id, skipping notification`);
    }

    // Log para WhatsApp (el admin puede copiar y enviar manualmente)
    if (appointment.client?.phone) {
      console.log(`📱 Mensaje para WhatsApp (${appointment.client.phone}):`, clientMessage);
    }
  }

  console.log(`Appointment ${appointmentId} successfully updated to ${nextStatus}`);
  return NextResponse.json({ ok: true });
}
```

---

## ✅ Resumen de Cambios

1. **Switch statement** para manejar 4 acciones: `confirm`, `cancel`, `complete`, `noshow`
2. **adminResponse** se define en el switch (no duplicado)
3. **Mensajes al cliente** unificados en un solo bloque con if/else
4. **Soporte para "completado"** - Envía mensaje de agradecimiento
5. **Soporte para "no-show"** - Marca como cancelado con mensaje apropiado

---

## 🧪 Para Probar

Después de hacer los cambios:

1. Guarda el archivo
2. El servidor debería recargar automáticamente (pnpm run dev)
3. Crea una cita de prueba
4. Confirma que los botones funcionen
5. Prueba el endpoint `/api/appointments/notify-completed`

---

## ⚠️ Importante

- No elimines ninguna otra parte del código
- Solo reemplaza las secciones indicadas
- Mantén la indentación correcta
- Asegúrate de que las llaves `{}` estén balanceadas
