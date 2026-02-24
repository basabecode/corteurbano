# 📦 Guía de Instalación y Configuración - Corte Urbano

Esta guía te ayudará a instalar, configurar y desplegar el sistema Corte Urbano.

## ⚡ Inicio Rápido

Si ya tienes experiencia, aquí tienes los pasos resumidos:

1.  **Instalar dependencias:** `npm install` o `pnpm install`
2.  **Configurar entorno:** Copia `.env.example` a `.env.local` y agrega tus credenciales.
3.  **Base de Datos:** Ejecuta el script SQL en Supabase (ver `DATABASE_SETUP.md`).
4.  **Ejecutar:** `npm run dev`

---

## 🔧 Prerrequisitos

*   **Node.js 18+**: [Descargar](https://nodejs.org/)
*   **Cuenta en Supabase**: [Crear cuenta](https://supabase.com/)
*   **Cuenta en Telegram** (Opcional, para el bot)

## 📥 Instalación Detallada

### 1. Instalar Dependencias

Recomendamos usar `pnpm` por su velocidad, pero `npm` funciona perfectamente.

```bash
# Opción 1: pnpm (Recomendado)
npm install -g pnpm
pnpm install

# Opción 2: npm
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto. **NO** uses `env.local` (sin punto) ni formatos incorrectos como `:`.

**Formato correcto (`.env.local`):**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Telegram Bot Configuration (Opcional)
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
TELEGRAM_ADMIN_CHAT_ID=123456789

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Nota:** Puedes obtener tus credenciales de Supabase en **Settings > API**.

### 3. Configurar Base de Datos

Para configurar las tablas y políticas de seguridad, consulta el archivo [DATABASE_SETUP.md](./DATABASE_SETUP.md).

### 4. Ejecutar en Desarrollo

```bash
npm run dev
# o
pnpm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🚀 Guía de Finalización del Proyecto

Sigue estos pasos para llevar el proyecto de "código listo" a "producción".

### Paso 1: Crear Cuenta de Admin

1.  Regístrate en la aplicación (`/login`).
2.  Ve a Supabase > Authentication > Users y copia tu `User UID`.
3.  Ejecuta en el SQL Editor de Supabase:
    ```sql
    UPDATE profiles SET role = 'admin' WHERE id = 'TU_USER_ID';
    ```

### Paso 2: Configurar Telegram (Opcional)

1.  Crea un bot con [@BotFather](https://t.me/BotFather) y obtén el token.
2.  Obtén tu ID con [@userinfobot](https://t.me/userinfobot).
3.  Agrégalos a `.env.local`.
4.  Para producción, configura el webhook:
    ```bash
    curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" -d "url=https://tu-dominio.vercel.app/api/telegram-webhook"
    ```

### Paso 3: Deploy en Vercel

1.  Sube tu código a GitHub.
2.  Importa el proyecto en Vercel.
3.  Configura las variables de entorno en Vercel (las mismas de `.env.local`).
4.  Deploy!

---

## 🐛 Solución de Problemas Comunes

### Error: "npm no se reconoce"
*   **Solución:** Instala Node.js y reinicia la terminal.

### Error: "Invalid API key" o problemas de conexión a Supabase
*   **Causa:** Credenciales incorrectas o formato inválido en `.env.local`.
*   **Solución:** Verifica que no haya espacios extra, que uses `=` y no `:`, y que las keys sean las correctas del dashboard de Supabase.

### Error: "Row Level Security policy violation"
*   **Causa:** No se han configurado las políticas RLS o el usuario no tiene permisos.
*   **Solución:** Ejecuta los scripts de `DATABASE_SETUP.md`.

### Error: "Recursión infinita" en políticas
*   **Solución:** Asegúrate de usar la función `is_admin` con `SECURITY DEFINER` como se explica en los scripts de base de datos.
