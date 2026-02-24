# ✂️ Corte Urbano - Sistema de Agendamiento para Barbería

Sistema web completo de agendamiento de citas para barberías con integración de Telegram para gestión operativa y actualización en tiempo real. Diseñado con estética **Dark Luxury** inspirada en barberías premium modernas.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)

## 🎨 Características

### Diseño Dark Luxury
- **Paleta de colores:** Slate-950 (fondos oscuros), Amber-500 (acentos dorados), Zinc-100 (textos claros)
- **Estética:** Inspirada en Blind Barber y Schorem, modernizada con funcionalidad tipo Fresha
- **UI/UX:** Interfaz masculina, elegante y profesional con animaciones suaves

### Funcionalidades Principales

#### Para Clientes 👤
- ✅ Visualización de servicios disponibles con precios
- ✅ Sistema de reserva de citas con calendario interactivo
- ✅ Dashboard personal con historial de citas
- ✅ **Actualización en tiempo real** - Los cambios se reflejan automáticamente sin recargar
- ✅ **Selección múltiple y eliminación** de citas del historial
- ✅ Cancelación de citas con motivo registrado
- ✅ Autenticación con Email/Password y Google OAuth
- ✅ Notificaciones automáticas por Telegram (si está vinculado)
- ✅ Vinculación de cuenta con Telegram para recibir notificaciones

#### Para Administradores 🔧
- ✅ Dashboard administrativo con estadísticas en tiempo real
- ✅ **Actualización automática** cuando hay cambios en las citas
- ✅ Gestión de citas pendientes/confirmadas/completadas
- ✅ **Selección múltiple y eliminación** de citas completadas/canceladas
- ✅ **Reportes mensuales** con ingresos y estadísticas
- ✅ Integración con Telegram para gestión rápida
- ✅ Vista de ingresos calculados solo de servicios completados
- ✅ Auto-completado de citas pasadas al cargar el dashboard
- ✅ Filtros por fecha y estado de citas

#### Automatización con Telegram 🤖
- ✅ Notificaciones automáticas al admin cuando se crea una cita
- ✅ Botones inline para confirmar/cancelar citas desde Telegram
- ✅ **Confirmación de servicios completados** - El admin puede marcar si el cliente asistió
- ✅ Notificaciones diferenciadas al cliente según el estado:
  - Confirmación de cita con detalles y precio
  - Cancelación de cita
  - Agradecimiento por servicio completado
- ✅ Actualización en tiempo real del estado de las citas
- ✅ Vinculación de cuentas de cliente con Telegram mediante comando `/start`

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS + Shadcn/UI
- **Calendario:** react-day-picker
- **Validación:** Zod
- **Realtime:** Supabase Realtime (PostgreSQL Change Data Capture)

### Backend
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **API Routes:** Next.js API Routes
- **Seguridad:** Row Level Security (RLS)
- **Realtime Updates:** Supabase Realtime Channels

### Integraciones
- **Telegram:** Telegram Bot API (Webhooks)
- **MCP:** Model Context Protocol (para interacción con BD)

## 📁 Estructura del Proyecto

```
corteurbano/
├── app/
│   ├── (public)/              # Rutas públicas
│   │   ├── components/        # Hero, ServiceCard, BookingForm
│   │   ├── login/            # Página de autenticación
│   │   ├── layout.tsx
│   │   └── page.tsx          # Página principal
│   ├── dashboard/             # Rutas protegidas
│   │   ├── admin/            # Dashboard admin
│   │   │   └── components/   # StatsCards, AppointmentsList, AdminActions
│   │   ├── customer/         # Dashboard cliente
│   │   │   └── components/   # CustomerDashboardContent
│   │   └── layout.tsx
│   ├── api/
│   │   ├── appointments/
│   │   │   ├── create/       # Crear citas
│   │   │   ├── update-status/ # Actualizar estado de citas
│   │   │   ├── delete/       # Eliminar citas (múltiples)
│   │   │   ├── complete-past/ # Auto-completar citas pasadas
│   │   │   └── notify-completed/ # Notificar servicios completados
│   │   ├── admin/
│   │   │   ├── reports/      # Reportes mensuales
│   │   │   └── archive-appointments/ # Archivar citas
│   │   ├── telegram-webhook/  # Webhook de Telegram
│   │   └── auth/
│   │       └── callback/     # Callbacks de auth
│   └── layout.tsx
├── components/
│   └── ui/                   # Componentes Shadcn/UI
├── lib/
│   ├── supabase/             # Clientes Supabase
│   │   ├── client.ts         # Cliente para navegador (Realtime)
│   │   ├── server.ts         # Cliente para servidor
│   │   └── service.ts        # Cliente con Service Role
│   ├── telegram.ts           # Helpers de Telegram
│   ├── validation.ts         # Schemas Zod
│   ├── utils.ts             # Utilidades generales
│   └── mcp.ts               # Helpers MCP
├── styles/
│   └── globals.css          # Estilos globales
├── public/                  # Assets estáticos
├── docs/                    # Documentación
│   ├── CONFIRMACION_SERVICIO_TELEGRAM.md
│   ├── INSTRUCCIONES_WEBHOOK_MANUAL.md
│   ├── SELECCION_CITAS_RESUMEN.md
│   └── SETUP_DATABASE.md
├── .env.example            # Variables de entorno de ejemplo
├── mcp_config.json         # Configuración MCP
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ y npm/pnpm
- Cuenta en [Supabase](https://supabase.com)
- Bot de Telegram (crear con [@BotFather](https://t.me/BotFather))

### Paso 1: Instalar Dependencias

**Opción A: Con pnpm (Recomendado)**
```bash
# Si no tienes pnpm, instálalo primero
npm install -g pnpm

# Luego instala las dependencias
pnpm install
```

**Opción B: Con npm**
```bash
npm install
```

**Opción C: Scripts Automáticos**
- En PowerShell: `.\install.ps1`
- En CMD: `install.bat`

**Nota:** Si `npm` o `pnpm` no están disponibles, necesitas instalar Node.js desde [nodejs.org](https://nodejs.org/). Después de instalar Node.js, reinicia tu terminal.

### Paso 2: Configurar Variables de Entorno

1. Copia `.env.example` a `.env.local`:
```bash
cp .env.example .env.local
```

2. Edita `.env.local` con tus credenciales:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Telegram
TELEGRAM_BOT_TOKEN=tu-bot-token
TELEGRAM_ADMIN_CHAT_ID=tu-chat-id

# Site URL (para webhooks y callbacks)
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

**Cómo obtener las credenciales:**
- **Supabase:** Dashboard → Settings → API
- **Telegram Bot:** Habla con @BotFather en Telegram
- **Chat ID:** Usa @userinfobot en Telegram para obtener tu ID

### Paso 3: Configurar Base de Datos

1. Ve a tu proyecto en Supabase Dashboard
2. Abre el **SQL Editor**
3. Ejecuta el script completo de `docs/SETUP_DATABASE.md`
4. Inserta servicios de ejemplo (ver guía)

**Importante:** Asegúrate de que las políticas RLS estén habilitadas y configuradas correctamente.

### Paso 4: Habilitar Supabase Realtime

1. En Supabase Dashboard, ve a **Database** → **Replication**
2. Habilita Realtime para la tabla `appointments`:
   - Marca la casilla de `appointments`
   - Guarda los cambios

Esto permite que los dashboards se actualicen automáticamente cuando hay cambios.

### Paso 5: Configurar Webhook de Telegram

1. Obtén la URL de tu webhook (una vez desplegado):
   ```
   https://tu-dominio.com/api/telegram-webhook
   ```

2. Configura el webhook:
   ```bash
   curl -X POST "https://api.telegram.org/bot<TU_BOT_TOKEN>/setWebhook" \
     -d "url=https://tu-dominio.com/api/telegram-webhook"
   ```

3. Verifica que el webhook esté configurado:
   ```bash
   curl "https://api.telegram.org/bot<TU_BOT_TOKEN>/getWebhookInfo"
   ```

### Paso 6: Ejecutar en Desarrollo

**Con pnpm:**
```bash
pnpm run dev
```

**Con npm:**
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📖 Uso

### Para Clientes

1. **Registro/Login:** Visita `/login` para crear cuenta o iniciar sesión
2. **Ver Servicios:** En la página principal, explora los servicios disponibles
3. **Reservar Cita:**
   - Selecciona un servicio
   - Elige fecha y hora disponible
   - Confirma la reserva
4. **Dashboard:** Accede a `/dashboard/customer` para:
   - Ver tus citas próximas
   - Revisar historial de citas completadas/canceladas
   - Cancelar citas con motivo
   - Eliminar citas antiguas del historial (selección múltiple)
   - Ver actualizaciones en tiempo real cuando el admin confirma/cancela
5. **Vincular Telegram (Opcional):**
   - Desde el dashboard, haz clic en "Conectar Telegram"
   - Sigue las instrucciones para vincular tu cuenta
   - Recibirás notificaciones automáticas de tus citas

### Para Administradores

1. **Login:** Inicia sesión con una cuenta de rol `admin`
2. **Dashboard:** Visita `/dashboard/admin` para ver:
   - Citas pendientes del día
   - Ingresos del día (solo servicios completados)
   - Estadísticas generales
   - Listado completo de citas con filtros
3. **Gestión de Citas:**
   - Confirmar/cancelar citas pendientes
   - Seleccionar múltiples citas completadas/canceladas para eliminar
   - Ver información de contacto de clientes (teléfono)
   - Filtrar por fecha y estado
4. **Reportes:**
   - Haz clic en "Ver Reportes" para ver estadísticas mensuales
   - Revisa ingresos, tasa de éxito y total de citas por mes
5. **Telegram:**
   - Recibirás notificaciones cuando se cree una nueva cita
   - Usa los botones inline para confirmar/cancelar
   - Después de que termine una cita, recibirás un mensaje para confirmar si se completó
   - Las actualizaciones se reflejan automáticamente en el dashboard

## 🔄 Actualización en Tiempo Real

El sistema utiliza **Supabase Realtime** para mantener los dashboards sincronizados:

- **Panel de Cliente:** Se actualiza automáticamente cuando el admin confirma/cancela una cita
- **Panel de Admin:** Se actualiza automáticamente cuando:
  - Un cliente crea una nueva cita
  - Se confirma/cancela una cita desde Telegram
  - Se completa o elimina una cita

**No es necesario recargar la página** - Los cambios aparecen instantáneamente.

## 🤖 Flujo de Telegram

### Creación de Cita
1. Cliente crea una cita desde la web
2. Admin recibe notificación en Telegram con:
   - Detalles del cliente (nombre, teléfono)
   - Servicio solicitado
   - Fecha y hora
   - Botones: `✅ Confirmar` y `❌ Cancelar`
3. Admin presiona un botón
4. Cliente recibe notificación (si tiene Telegram vinculado)
5. Dashboard se actualiza automáticamente

### Confirmación de Servicio Completado
1. Cuando una cita confirmada termina (según su hora de fin)
2. Admin recibe mensaje en Telegram:
   - Detalles de la cita
   - Botones: `✅ Sí, completado` y `❌ No se realizó`
3. Admin confirma el estado
4. Cliente recibe mensaje de agradecimiento (si se completó)
5. Dashboard se actualiza con el estado final

## 🔒 Seguridad

- **Row Level Security (RLS):** Implementado en todas las tablas
- **Autenticación:** Supabase Auth con soporte para Email/Password y OAuth
- **Validación:** Zod schemas para validar todas las entradas
- **Service Role Key:** Solo usado en el servidor, nunca expuesto al cliente
- **Clientes Supabase Diferenciados:**
  - `createSupabaseBrowserClient`: Para componentes del cliente (Realtime)
  - `createSupabaseServerClient`: Para Server Components
  - `createSupabaseServiceClient`: Para API Routes con permisos elevados

## 🗄️ Esquema de Base de Datos

### Tablas Principales

- **profiles:** Información de usuarios (roles, telegram_chat_id, phone)
- **services:** Servicios ofrecidos (nombre, precio, duración)
- **appointments:** Citas reservadas (cliente, servicio, fecha, estado, motivo de cancelación)

**Estados de Citas:**
- `pending`: Recién creada, esperando confirmación
- `confirmed`: Confirmada por el admin
- `completed`: Servicio realizado
- `cancelled`: Cancelada por admin o cliente

Ver `docs/SETUP_DATABASE.md` para el esquema completo y políticas RLS.

## 📚 Documentación Adicional

- **[CONFIRMACION_SERVICIO_TELEGRAM.md](docs/CONFIRMACION_SERVICIO_TELEGRAM.md):** Flujo de confirmación de servicios completados
- **[INSTRUCCIONES_WEBHOOK_MANUAL.md](docs/INSTRUCCIONES_WEBHOOK_MANUAL.md):** Guía para actualizar el webhook de Telegram
- **[SELECCION_CITAS_RESUMEN.md](docs/SELECCION_CITAS_RESUMEN.md):** Funcionalidad de selección múltiple y eliminación
- **[SETUP_DATABASE.md](docs/SETUP_DATABASE.md):** Guía detallada de configuración de BD

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Scripts Disponibles

```bash
pnpm run dev      # Servidor de desarrollo
pnpm run build    # Build de producción
pnpm run start    # Servidor de producción
pnpm run lint     # Ejecutar ESLint
```

## 🐛 Troubleshooting

### Error: "No autorizado"
- Verifica que estés autenticado
- Revisa las políticas RLS en Supabase
- Asegúrate de que tu usuario tenga el rol correcto

### Telegram no envía mensajes
- Verifica que `TELEGRAM_BOT_TOKEN` sea correcto
- Asegúrate de que el webhook esté configurado correctamente
- Revisa que `TELEGRAM_ADMIN_CHAT_ID` sea tu ID de Telegram
- Verifica los logs del servidor para ver errores

### Error de conexión a Supabase
- Verifica las variables de entorno en `.env.local`
- Confirma que la URL y keys sean correctas
- Asegúrate de que el proyecto de Supabase esté activo

### Realtime no funciona
- Verifica que Realtime esté habilitado en Supabase para la tabla `appointments`
- Asegúrate de usar `createSupabaseBrowserClient` en componentes del cliente
- Revisa la consola del navegador para ver errores de conexión

### Error: "Supabase URL or Service Role Key is missing"
- Este error ocurre cuando se usa `createSupabaseServiceClient` en el cliente
- Usa `createSupabaseBrowserClient` en componentes con `'use client'`
- Usa `createSupabaseServerClient` en Server Components
- Usa `createSupabaseServiceClient` solo en API Routes

## 🚀 Despliegue en Producción

### Vercel (Recomendado)

1. Conecta tu repositorio de GitHub con Vercel
2. Configura las variables de entorno en Vercel Dashboard
3. Despliega automáticamente con cada push a `main`
4. Configura el webhook de Telegram con la URL de producción

### Variables de Entorno en Vercel

Asegúrate de configurar todas las variables de `.env.local` en:
**Vercel Dashboard → Settings → Environment Variables**

## 📊 Características Destacadas

### ✨ Actualización en Tiempo Real
- Sincronización automática entre todos los usuarios conectados
- Sin necesidad de recargar la página
- Basado en PostgreSQL Change Data Capture

### 🎯 Gestión Inteligente
- Auto-completado de citas pasadas
- Selección múltiple para operaciones en lote
- Filtros avanzados por fecha y estado

### 📱 Integración Telegram Completa
- Notificaciones bidireccionales
- Gestión desde el móvil
- Confirmación de servicios completados

### 📈 Reportes y Estadísticas
- Ingresos mensuales precisos
- Tasa de éxito de citas
- Estadísticas en tiempo real

## 📄 Licencia

Este proyecto es privado y de uso interno.

## 👨‍💻 Autor

Desarrollado para Corte Urbano - Sistema de Agendamiento Premium

---

**¿Necesitas ayuda?** Revisa la documentación en `docs/` o contacta al equipo de desarrollo.