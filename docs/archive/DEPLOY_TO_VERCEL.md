# 🚀 Guía de Despliegue en Vercel

Esta guía te explica cómo subir tu proyecto a Vercel para que esté disponible en internet y puedas probar el bot de Telegram en tiempo real.

## 📋 Requisitos Previos

1.  Cuenta en [Vercel](https://vercel.com) (puedes usar tu cuenta de GitHub).
2.  Código subido a GitHub.

## 👣 Pasos para Desplegar

### 1. Subir código a GitHub
Si aún no lo has hecho:

```bash
git add .
git commit -m "Preparado para deploy"
git push origin main
```

### 2. Crear Proyecto en Vercel
1.  Ve a tu Dashboard de Vercel.
2.  Haz clic en **"Add New..."** > **"Project"**.
3.  Selecciona tu repositorio `corteurbano`.
4.  Haz clic en **"Import"**.

### 3. Configurar Variables de Entorno (¡IMPORTANTE!)
En la pantalla de configuración del proyecto, busca la sección **"Environment Variables"** y agrega las siguientes (copia los valores de tu `.env.local`):

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://...` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` |
| `TELEGRAM_BOT_TOKEN` | `123...` |
| `TELEGRAM_ADMIN_CHAT_ID` | `123...` |

> **Nota:** No necesitas agregar `NEXT_PUBLIC_SITE_URL` todavía, Vercel la genera automáticamente.

### 4. Desplegar
Haz clic en **"Deploy"**. Vercel construirá tu proyecto. Esto tomará unos minutos.

Cuando termine, verás una pantalla de felicitaciones con la URL de tu proyecto (ej: `https://corteurbano.vercel.app`).

---

## 🔗 Conectar el Webhook de Telegram

Una vez que tengas tu URL de Vercel (ej: `https://tu-proyecto.vercel.app`), necesitas decirle a Telegram que envíe las notificaciones allí.

### Opción A: Usando el navegador (Fácil)
Abre esta URL en tu navegador (reemplaza los valores):

```
https://api.telegram.org/bot<TU_TOKEN>/setWebhook?url=https://<TU_URL_VERCEL>/api/telegram-webhook
```

Si sale bien, verás: `{"ok":true, "result":true, "description":"Webhook was set"}`

### Opción B: Usando la terminal
Ejecuta este comando en tu terminal:

```bash
curl -X POST "https://api.telegram.org/bot<TU_TOKEN>/setWebhook" -d "url=https://<TU_URL_VERCEL>/api/telegram-webhook"
```

---

## 🧪 Prueba Final en Tiempo Real

1.  Entra a tu web (`https://tu-proyecto.vercel.app`).
2.  Reserva una cita.
3.  Recibirás el mensaje en Telegram.
4.  **¡Prueba los botones!** Dale a "Confirmar".
5.  El estado de la cita cambiará en tu base de datos y recibirás la confirmación.
