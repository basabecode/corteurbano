# ✂️ BarberKing - Sistema de Agendamiento para Barbería

Sistema web completo de agendamiento de citas para barberías con integración de Telegram para gestión operativa. Diseñado con estética **Dark Luxury** inspirada en barberías premium modernas.

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue?style=for-the-badge&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwind-css)

## 🎨 Características

### Diseño Dark Luxury
- **Paleta de colores:** Slate-950 (fondos oscuros), Amber-500 (acentos dorados), Zinc-100 (textos claros)
- **Estética:** Inspirada en Blind Barber y Schorem, modernizada con funcionalidad tipo Fresha
- **UI/UX:** Interfaz masculina, elegante y profesional

### Funcionalidades Principales

#### Para Clientes 👤
- ✅ Visualización de servicios disponibles con precios
- ✅ Sistema de reserva de citas con calendario interactivo
- ✅ Dashboard personal con historial de citas
- ✅ Autenticación con Email/Password y Google OAuth
- ✅ Notificaciones de confirmación de citas

#### Para Administradores 🔧
- ✅ Dashboard administrativo con estadísticas del día
- ✅ Gestión de citas pendientes/confirmadas
- ✅ Integración con Telegram para aprobar/rechazar citas
- ✅ Vista de ingresos y métricas

#### Automatización con Telegram 🤖
- ✅ Notificaciones automáticas al admin cuando se crea una cita
- ✅ Botones inline para aceptar/rechazar citas desde Telegram
- ✅ Actualización en tiempo real del estado de las citas

## 🛠️ Stack Tecnológico

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS + Shadcn/UI
- **Calendario:** react-day-picker
- **Validación:** Zod

### Backend
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **API Routes:** Next.js API Routes
- **Seguridad:** Row Level Security (RLS)

### Integraciones
- **Telegram:** Telegram Bot API (Webhooks)
- **MCP:** Model Context Protocol (para interacción con BD)

## 📁 Estructura del Proyecto

```
barberking/
├── app/
│   ├── (public)/              # Rutas públicas
│   │   ├── components/        # Hero, ServiceCard, BookingForm
│   │   ├── login/            # Página de autenticación
│   │   ├── layout.tsx
│   │   └── page.tsx          # Página principal
│   ├── (dashboard)/          # Rutas protegidas
│   │   ├── admin/            # Dashboard admin
│   │   │   └── components/   # StatsCards
│   │   ├── customer/         # Dashboard cliente
│   │   │   └── components/   # AppointmentList
│   │   └── layout.tsx
│   ├── api/
│   │   ├── booking/
│   │   │   └── create/       # Endpoint para crear citas
│   │   ├── telegram-webhook/  # Webhook de Telegram
│   │   └── auth/
│   │       └── [...supabase]/ # Callbacks de auth
│   └── layout.tsx
├── components/
│   └── ui/                   # Componentes Shadcn/UI
├── lib/
│   ├── supabase/             # Clientes Supabase (server/client)
│   ├── telegram.ts            # Helpers de Telegram
│   ├── validation.ts          # Schemas Zod
│   ├── utils.ts              # Utilidades generales
│   └── mcp.ts                # Helpers MCP
├── styles/
│   ├── globals.css            # Estilos globales
│   └── shadcn.css            # Estilos Shadcn
├── public/                    # Assets estáticos
├── docs/                      # Documentación
│   ├── PENDIENTES.md         # Lista de tareas pendientes
│   └── SETUP_DATABASE.md     # Guía de configuración BD
├── .env.example              # Variables de entorno de ejemplo
├── mcp_config.json           # Configuración MCP
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js 18+ y npm
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

### Paso 4: Configurar Webhook de Telegram

1. Obtén la URL de tu webhook (una vez desplegado):
   ```
   https://tu-dominio.com/api/telegram-webhook
   ```

2. Configura el webhook:
   ```bash
   curl -X POST "https://api.telegram.org/bot<TU_BOT_TOKEN>/setWebhook" \
     -d "url=https://tu-dominio.com/api/telegram-webhook"
   ```

### Paso 5: Ejecutar en Desarrollo

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
4. **Dashboard:** Accede a `/dashboard/customer` para ver tus citas

### Para Administradores

1. **Login:** Inicia sesión con una cuenta de rol `admin`
2. **Dashboard:** Visita `/dashboard/admin` para ver:
   - Citas pendientes del día
   - Ingresos del día
   - Estadísticas generales
3. **Telegram:** Recibirás notificaciones cuando se cree una nueva cita
   - Usa los botones inline para aceptar/rechazar

## 🔒 Seguridad

- **Row Level Security (RLS):** Implementado en todas las tablas
- **Autenticación:** Supabase Auth con soporte para Email/Password y OAuth
- **Validación:** Zod schemas para validar todas las entradas
- **Service Role Key:** Solo usado en el servidor, nunca expuesto al cliente

## 🗄️ Esquema de Base de Datos

### Tablas Principales

- **profiles:** Información de usuarios (roles, telegram_chat_id)
- **services:** Servicios ofrecidos (nombre, precio, duración)
- **appointments:** Citas reservadas (cliente, servicio, fecha, estado)

Ver `docs/SETUP_DATABASE.md` para el esquema completo y políticas RLS.

## 📚 Documentación Adicional

- **[PENDIENTES.md](docs/PENDIENTES.md):** Lista de tareas y mejoras futuras
- **[SETUP_DATABASE.md](docs/SETUP_DATABASE.md):** Guía detallada de configuración de BD

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Scripts Disponibles

```bash
npm run dev      # Servidor de desarrollo
npm run build    # Build de producción
npm run start    # Servidor de producción
npm run lint     # Ejecutar ESLint
```

## 🐛 Troubleshooting

### Error: "No autorizado"
- Verifica que estés autenticado
- Revisa las políticas RLS en Supabase

### Telegram no envía mensajes
- Verifica que `TELEGRAM_BOT_TOKEN` sea correcto
- Asegúrate de que el webhook esté configurado

### Error de conexión a Supabase
- Verifica las variables de entorno
- Confirma que la URL y keys sean correctas

## 📄 Licencia

Este proyecto es privado y de uso interno.

## 👨‍💻 Autor

Desarrollado para BarberKing - Sistema de Agendamiento Premium

---

**¿Necesitas ayuda?** Revisa la documentación en `docs/` o abre un issue.

#   a g e n d a _ d e _ c i t a s  
 #   a g e n d a _ d e _ c i t a s  
 