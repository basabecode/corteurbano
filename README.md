# Corte Urbano — Sistema de Agendamiento para Barbería

Sistema web completo de agendamiento de citas para barberías con actualización en tiempo real, integración de Telegram y tres roles de usuario diferenciados. Diseñado con estética **Dark Luxury** — fondos oscuros, acentos dorados.

![Next.js](https://img.shields.io/badge/Next.js-14_App_Router-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178c6?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_+_RLS-3ecf8e?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.3-38bdf8?style=flat-square&logo=tailwind-css)
![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?style=flat-square&logo=vercel)

---

## Tabla de Contenidos

1. [Resumen del Proyecto](#resumen-del-proyecto)
2. [Funcionalidades por Rol](#funcionalidades-por-rol)
3. [Stack Tecnológico](#stack-tecnológico)
4. [Arquitectura](#arquitectura)
5. [Estructura de Carpetas](#estructura-de-carpetas)
6. [Esquema de Base de Datos](#esquema-de-base-de-datos)
7. [Rutas API](#rutas-api)
8. [Flujos Principales](#flujos-principales)
9. [Variables de Entorno](#variables-de-entorno)
10. [Instalación y Configuración](#instalación-y-configuración)
11. [Migraciones SQL](#migraciones-sql)
12. [Tests](#tests)
13. [Despliegue](#despliegue)
14. [Troubleshooting](#troubleshooting)

---

## Resumen del Proyecto

**Corte Urbano** es una plataforma SaaS para gestión de citas de barbería construida sobre Next.js 14 App Router. Soporta:

- **3 roles de usuario:** cliente, administrador y barbero
- **3 modos de reserva:** presencial, con barbero conocido, y a domicilio
- **Tiempo real:** dashboards sincronizados vía Supabase Realtime
- **Telegram bot:** notificaciones bidireccionales y gestión operativa
- **Geolocalización:** distancia entre cliente y barberos para modo domicilio

---

## Funcionalidades por Rol

### Cliente

- Registro con email/contraseña o Google OAuth
- Selección de modo de reserva (presencial / con barbero / domicilio)
- Selector de barbero con geolocalización y mapa (modo presencial)
- Calendario interactivo con slots disponibles por barbero
- Dashboard personal con citas próximas, completadas y canceladas
- Cancelación de citas con motivo registrado
- Archivado y eliminación masiva de citas del historial
- Actualización en tiempo real (sin recargar)
- Vinculación de cuenta con Telegram para notificaciones
- Notificaciones Telegram: confirmación, cancelación, agradecimiento

### Administrador

- Dashboard con estadísticas del día (ingresos, pendientes, confirmadas)
- Listado completo de citas con filtros por fecha y estado
- Confirmación / cancelación de citas
- Reportes mensuales de ingresos y tasa de éxito
- CRUD completo de barberos (con campos de geolocalización y domicilio)
- CRUD completo de servicios
- Historial de citas archivadas con estadísticas por mes
- Archivado y eliminación masiva de citas completadas/canceladas
- Auto-completado de citas pasadas al cargar el panel
- Notificaciones Telegram con botones inline (confirmar/cancelar/completar)
- Actualización en tiempo real

### Barbero

- Panel de solo lectura con citas asignadas
- Vista separada: citas de hoy, próximas, completadas
- Información del cliente con teléfono clickeable (`tel:`)
- Badge de tipo de cita (presencial / domicilio) con dirección si aplica
- Indicador visual (pulsante) para citas pendientes de confirmación
- Actualización en tiempo real vía Supabase Realtime
- Notificaciones Telegram al recibir una nueva asignación y al confirmar el admin

---

## Stack Tecnológico

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 14.x (App Router) | Framework principal |
| React | 19.x | UI library |
| TypeScript | 5.4 | Tipado estático |
| Tailwind CSS | 3.3 | Estilos |
| Shadcn/UI | 0.8 | Componentes base |
| Framer Motion | 12.x | Animaciones |
| react-day-picker | 9.x | Calendario |
| Leaflet + react-leaflet | 1.9 / 5.0 | Mapa geolocalización |
| lucide-react | 0.432 | Iconos |

### Backend / Infraestructura
| Tecnología | Uso |
|---|---|
| Supabase (PostgreSQL) | Base de datos principal |
| Supabase Auth | Autenticación (email + Google OAuth) |
| Supabase Realtime | Suscripciones en tiempo real |
| Row Level Security (RLS) | Seguridad a nivel de fila |
| Next.js API Routes | Backend serverless |
| Vercel | Plataforma de despliegue |

### Librerías de soporte
| Librería | Uso |
|---|---|
| Zod | Validación de esquemas en API |
| date-fns | Manipulación de fechas |
| clsx + tailwind-merge | Utilidades de clases |
| class-variance-authority | Variantes de componentes |

### Testing
| Herramienta | Uso |
|---|---|
| Jest + ts-jest | Tests unitarios e integración |
| Playwright | Tests E2E en navegador |
| Testing Library | Utilidades de testing React |
| axe-playwright | Tests de accesibilidad |
| Supertest | Tests de API HTTP |

---

## Arquitectura

### Patrón de Clientes Supabase (crítico — no mezclar)

```
lib/supabase/
├── client.ts   → createSupabaseBrowserClient()  — 'use client' + Realtime
├── server.ts   → createSupabaseServerClient()   — Server Components, layouts, Server Actions
└── service.ts  → createSupabaseServiceClient()  — API Routes ÚNICAMENTE (bypass RLS)
```

`createSupabaseServiceClient()` usa `SUPABASE_SERVICE_ROLE_KEY` que **jamás debe exponerse al browser**.

### Route Groups

```
app/
├── (public)/     → Rutas públicas sin autenticación requerida
└── dashboard/    → Rutas protegidas — el layout.tsx verifica auth + rol
    ├── admin/    → Solo role='admin'
    ├── customer/ → role='customer' (también redirige barbers)
    └── barber/   → Solo role='barber'
```

### Hub de Redirección de Roles

`/dashboard` (app/dashboard/page.tsx) detecta el rol y redirige automáticamente:

```
/dashboard → admin  → /dashboard/admin
           → barber → /dashboard/barber
           → otro   → /dashboard/customer
```

Esto evita que el link "Mi Panel" lleve al rol incorrecto.

### Navegación

- **Desktop:** `DashboardNav` sticky con logo, "Inicio", usuario + badge de rol, "Salir"
- **Mobile:** `BottomNav` fijo en parte inferior con items específicos por rol
- **Breadcrumbs:** En todas las sub-páginas del dashboard (`Breadcrumb.tsx`)

---

## Estructura de Carpetas

```
corteurbano/
├── app/
│   ├── (public)/                          # Rutas públicas
│   │   ├── components/
│   │   │   ├── Header.tsx                 # Navegación pública
│   │   │   ├── Hero.tsx                   # Sección hero con video
│   │   │   ├── BookingForm.tsx            # Máquina de estados (3 modos de reserva)
│   │   │   ├── ModeSelectionStep.tsx      # Paso 1: selección de modo
│   │   │   ├── LocationMapStep.tsx        # Paso: geolocalización + distancia
│   │   │   ├── BarberSearchStep.tsx       # Paso: búsqueda y filtro de barberos
│   │   │   ├── ServicesBookingSection.tsx # Grid de servicios + inicio de reserva
│   │   │   ├── ServiceCard.tsx            # Tarjeta de servicio individual
│   │   │   ├── BarberCTA.tsx              # CTA para registro de barberos
│   │   │   └── ConnectTelegramButton.tsx  # Vinculación con Telegram
│   │   ├── estilos/page.tsx               # Catálogo de estilos
│   │   ├── login/page.tsx                 # Login + OAuth
│   │   ├── registro/page.tsx              # Registro con selección de rol
│   │   ├── servicios/page.tsx             # Lista de servicios
│   │   ├── servicios/[slug]/page.tsx      # Detalle de servicio
│   │   ├── tracker/[id]/page.tsx          # Seguimiento de cita
│   │   └── page.tsx                       # Home — fetches servicios + barberos
│   │
│   ├── dashboard/                         # Rutas protegidas
│   │   ├── layout.tsx                     # Guard de auth + rol, renders nav
│   │   ├── page.tsx                       # Hub redirect → panel correcto por rol
│   │   ├── components/
│   │   │   ├── DashboardNav.tsx           # Header del dashboard (branding unificado)
│   │   │   ├── Breadcrumb.tsx             # Navegación de migas de pan
│   │   │   └── AutoCompletePastAppointments.tsx
│   │   ├── admin/
│   │   │   ├── page.tsx                   # Dashboard admin: stats + citas
│   │   │   ├── components/
│   │   │   │   ├── StatsCards.tsx
│   │   │   │   ├── AppointmentsList.tsx   # Realtime + filtros + acciones masivas
│   │   │   │   ├── AppointmentsTable.tsx  # Tabla desktop / cards mobile
│   │   │   │   ├── AppointmentsFilters.tsx
│   │   │   │   └── AdminActions.tsx       # Reportes + archivado
│   │   │   ├── barberos/
│   │   │   │   ├── page.tsx               # Con breadcrumb: Panel Admin > Barberos
│   │   │   │   └── components/BarberosContent.tsx   # CRUD completo
│   │   │   ├── servicios/
│   │   │   │   ├── page.tsx               # Con breadcrumb: Panel Admin > Servicios
│   │   │   │   └── components/ServiciosContent.tsx  # CRUD completo
│   │   │   └── historial/
│   │   │       ├── page.tsx               # Con breadcrumb: Panel Admin > Historial
│   │   │       └── components/HistorialAdminContent.tsx
│   │   ├── customer/
│   │   │   ├── page.tsx                   # Dashboard cliente
│   │   │   ├── components/
│   │   │   │   └── CustomerDashboardContent.tsx  # Realtime + cancelación + masivo
│   │   │   └── historial/
│   │   │       ├── page.tsx               # Con breadcrumb: Mi Cuenta > Historial
│   │   │       └── components/HistorialContent.tsx
│   │   └── barber/
│   │       ├── page.tsx                   # Dashboard barbero
│   │       └── components/BarberDashboardContent.tsx  # Read-only + realtime
│   │
│   ├── api/
│   │   ├── booking/create/route.ts        # POST — crea cita + notifica admin y barbero
│   │   ├── appointments/
│   │   │   ├── update-status/route.ts     # POST — confirmar/cancelar/completar
│   │   │   ├── delete/route.ts            # POST — eliminación masiva
│   │   │   ├── complete-past/route.ts     # POST — auto-completar citas pasadas
│   │   │   └── archive/route.ts           # POST — archivar completadas
│   │   ├── admin/
│   │   │   ├── barbers/route.ts           # GET + POST barberos
│   │   │   ├── barbers/[id]/route.ts      # PUT + DELETE + PATCH barbero
│   │   │   ├── services/route.ts          # GET + POST servicios
│   │   │   ├── services/[id]/route.ts     # PUT + DELETE + PATCH servicio
│   │   │   ├── archive-appointments/route.ts
│   │   │   ├── delete-appointments/route.ts
│   │   │   └── reports/route.ts           # GET — reportes mensuales
│   │   ├── availability/route.ts          # GET — slots ocupados por barbero
│   │   ├── auth/[...supabase]/route.ts    # Callback OAuth (soporta intended_role)
│   │   └── telegram-webhook/route.ts      # POST — webhook Telegram
│   │
│   ├── globals.css
│   └── layout.tsx                         # Root layout
│
├── components/ui/                         # Shadcn/UI customizados
│   ├── bottom-nav.tsx                     # Nav móvil por rol
│   ├── button.tsx
│   ├── calendar.tsx
│   ├── modal.tsx
│   └── toast.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                      # Browser client (Realtime)
│   │   ├── server.ts                      # Server component client
│   │   └── service.ts                     # Service role — solo API Routes
│   ├── validation.ts                      # Schemas Zod: createBookingSchema
│   ├── telegram.ts                        # sendTelegramMessage, editMessageText
│   ├── format-currency.ts                 # formatCOP()
│   ├── geo-utils.ts                       # haversineDistance(), getUserLocation()
│   ├── location-data.ts                   # ZONAS_CALI (fallback zonas Cali)
│   └── utils.ts                           # cn() y utilidades generales
│
├── supabase/
│   ├── add_telegram_fields.sql            # Campos Telegram en profiles
│   └── migrations/
│       ├── 20260225_add_barber_role.sql   # Rol barbero + profile_id en barbers
│       └── 20260226_booking_modes.sql     # booking_type + client_address
│
├── tests/
│   ├── setup/                             # jest.config.js, playwright.config.ts
│   ├── unit/                              # Lógica pura y validación
│   ├── integration/api/                   # Tests de rutas API
│   ├── security/                          # Tests de auth y RLS
│   ├── e2e/                               # Playwright browser tests
│   └── usability/                         # Accesibilidad con axe
│
├── scripts/                               # Scripts de diagnóstico y setup
├── docs/                                  # Documentación técnica extendida
├── public/                                # Imágenes, íconos, manifest PWA
├── CLAUDE.md                              # Instrucciones para agentes AI
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

---

## Esquema de Base de Datos

### Tabla: `profiles`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | Referencia a `auth.users.id` |
| `role` | TEXT | `'admin'` \| `'customer'` \| `'barber'` |
| `full_name` | TEXT | Nombre completo |
| `phone` | TEXT | Teléfono (usado para vincular Telegram) |
| `telegram_chat_id` | TEXT | Chat ID de Telegram (opcional) |
| `telegram_username` | TEXT | Username de Telegram (opcional) |
| `telegram_vinculado_at` | TIMESTAMPTZ | Fecha de vinculación |
| `email` | TEXT | Email (opcional) |
| `created_at` | TIMESTAMPTZ | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | Última actualización |

### Tabla: `services`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | Identificador |
| `name` | TEXT | Nombre del servicio |
| `slug` | TEXT | URL amigable |
| `price` | NUMERIC | Precio en COP |
| `duration_minutes` | INTEGER | Duración en minutos |
| `description` | TEXT | Descripción (opcional) |
| `image_url` | TEXT | URL de imagen (opcional) |
| `is_active` | BOOLEAN | Activo/inactivo |

### Tabla: `barbers`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | Identificador |
| `name` | TEXT | Nombre del barbero |
| `specialty` | TEXT | Especialidad (opcional) |
| `bio` | TEXT | Biografía (opcional) |
| `photo_url` | TEXT | Foto de perfil (opcional) |
| `instagram_handle` | TEXT | Instagram (opcional) |
| `is_active` | BOOLEAN | Disponible para citas |
| `profile_id` | UUID FK | Referencia a `profiles.id` (para rol barbero) |
| `lat` | DECIMAL(9,6) | Latitud (para modo domicilio) |
| `lng` | DECIMAL(9,6) | Longitud (para modo domicilio) |
| `address_label` | TEXT | Etiqueta de zona/dirección |
| `offers_domicilio` | BOOLEAN | Ofrece servicio a domicilio |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

### Tabla: `appointments`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | Identificador |
| `client_id` | UUID FK | Referencia a `profiles.id` |
| `barber_id` | UUID FK | Referencia a `barbers.id` |
| `service_id` | UUID FK | Referencia a `services.id` |
| `start_time` | TIMESTAMPTZ | Fecha y hora de inicio |
| `status` | TEXT | `pending` \| `confirmed` \| `completed` \| `cancelled` |
| `cancellation_reason` | TEXT | Motivo de cancelación (opcional) |
| `booking_type` | TEXT | `'presencial'` \| `'domicilio'` |
| `client_address` | TEXT | Dirección del cliente (domicilio) |
| `created_at` | TIMESTAMPTZ | Fecha de creación |

### Tabla: `appointments_history`

Citas archivadas — estructura desnormalizada para historial permanente.

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | ID original de la cita |
| `client_id` | UUID | ID del cliente |
| `service_name` | TEXT | Nombre del servicio (snapshot) |
| `service_price` | NUMERIC | Precio (snapshot) |
| `service_duration_minutes` | INTEGER | Duración (snapshot) |
| `status` | TEXT | Estado final |
| `start_time` | TIMESTAMPTZ | Fecha original |
| `cancellation_reason` | TEXT | Motivo si fue cancelada |
| `archived_at` | TIMESTAMPTZ | Fecha de archivado |

---

## Rutas API

### Reservas

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/booking/create` | Crea cita — valida con Zod, asigna barbero domicilio automático, notifica admin y barbero por Telegram |
| `POST` | `/api/appointments/update-status` | Cambia estado de cita (admin o cliente propio) |
| `POST` | `/api/appointments/delete` | Eliminación masiva de citas canceladas |
| `POST` | `/api/appointments/complete-past` | Auto-completa citas confirmadas pasadas |
| `POST` | `/api/appointments/archive` | Archiva citas completadas |
| `GET`  | `/api/availability` | Slots ocupados `?barberId=X&date=Y` |

### Admin

| Método | Ruta | Descripción |
|---|---|---|
| `GET/POST` | `/api/admin/barbers` | Listar / crear barberos |
| `PUT/PATCH/DELETE` | `/api/admin/barbers/[id]` | Editar / toggle activo / eliminar barbero |
| `GET/POST` | `/api/admin/services` | Listar / crear servicios |
| `PUT/PATCH/DELETE` | `/api/admin/services/[id]` | Editar / toggle activo / eliminar servicio |
| `POST` | `/api/admin/archive-appointments` | Archivar citas completadas/canceladas |
| `POST` | `/api/admin/delete-appointments` | Eliminar citas archivadas |
| `GET` | `/api/admin/reports` | Reportes mensuales `?months=12` |

### Telegram

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/api/telegram-webhook` | Recibe callbacks de botones y mensajes de texto |

### Auth

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/auth/[...supabase]` | Callback OAuth (soporta `intended_role` param) |

---

## Flujos Principales

### Flujo de Reserva (3 modos)

#### Modo Presencial
```
Selección de modo → Zona/mapa → Barbero → Servicio → Fecha → Hora → Confirmación
```

#### Modo "Mi Barbero" (Conocido)
```
Selección de modo → Barbero → Servicio → Fecha → Hora → Confirmación
```

#### Modo Domicilio
```
Selección de modo → Servicio → Fecha → Hora → Confirmación (con dirección)
→ API auto-asigna primer barbero disponible con offers_domicilio=true
```

### Flujo Completo de Notificaciones (Telegram)

```
1. Cliente crea cita (web)
   → Admin recibe mensaje Telegram + botones [✅ Confirmar] [❌ Rechazar]
   → Barbero recibe notificación de nueva asignación (si tiene Telegram vinculado)
   → Cliente recibe "solicitud recibida" (si tiene Telegram vinculado)

2. Admin presiona [✅ Confirmar]
   → Webhook actualiza DB: status = 'confirmed'
   → Mensaje del admin se edita (quita botones, muestra estado)
   → Cliente notificado: "¡Tu cita fue confirmada!" con detalles
   → Barbero notificado: "Cita confirmada — debes atenderla" con info del cliente

3. Admin presiona [❌ Rechazar]
   → Webhook actualiza DB: status = 'cancelled'
   → Cliente notificado: motivo de cancelación
   → Barbero notificado: aviso de cancelación

4. Admin marca [✅ Completada] desde el panel web
   → status = 'completed'
   → Realtime actualiza dashboards
```

### Vinculación Telegram (clientes/barberos)

```
Opción A: Desde la web → "Conectar Telegram" → abre t.me/bot?start=TELEFONO_XXXXX
Opción B: En Telegram → enviar número de 10 dígitos directamente al bot
Opción C: /start TELEFONO_3XXXXXXXXX

El webhook busca el teléfono en profiles.phone → guarda telegram_chat_id
```

---

## Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
# ── Supabase ──────────────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...          # ⚠️ Solo servidor — nunca al cliente

# ── Telegram ──────────────────────────────────────────────────────
TELEGRAM_BOT_TOKEN=123456789:AAF...       # Obtenido de @BotFather
TELEGRAM_ADMIN_CHAT_ID=123456789          # Tu Chat ID (obtenido de @userinfobot)

# ── Sitio ─────────────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=https://tu-dominio.vercel.app
```

> **Importante:** `SUPABASE_SERVICE_ROLE_KEY` bypassa RLS. Usar **únicamente** en API Routes con `createSupabaseServiceClient()`.

---

## Instalación y Configuración

### Prerrequisitos

- **Node.js** 18+
- **pnpm** (recomendado) — `npm install -g pnpm`
- Cuenta en [Supabase](https://supabase.com)
- Bot de Telegram (crear con [@BotFather](https://t.me/BotFather))

### Paso 1 — Clonar e instalar

```bash
git clone <url-del-repo>
cd CorteUrbano
pnpm install
```

### Paso 2 — Variables de entorno

```bash
cp .env.example .env.local
# Editar .env.local con las credenciales reales
```

### Paso 3 — Configurar Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Ir a **Dashboard → SQL Editor**
3. Ejecutar las migraciones en orden (ver sección [Migraciones SQL](#migraciones-sql))
4. Habilitar Realtime: **Database → Replication → appointments** ✓

### Paso 4 — Iniciar en desarrollo

```bash
pnpm dev
# → http://localhost:3000
```

### Paso 5 — Configurar webhook Telegram (para producción)

```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -d "url=https://tu-dominio.vercel.app/api/telegram-webhook"

# Verificar:
curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
```

---

## Migraciones SQL

Ejecutar en **Supabase Dashboard → SQL Editor**, en este orden:

### 1. Campos Telegram en profiles

```sql
-- supabase/add_telegram_fields.sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255),
  ADD COLUMN IF NOT EXISTS telegram_vinculado_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_telegram_chat_id ON profiles(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_phone ON profiles(phone);
```

### 2. Rol Barbero

```sql
-- supabase/migrations/20260225_add_barber_role.sql

-- Ampliar constraint de rol
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'customer', 'barber'));

-- Vincular barbero con cuenta de usuario
ALTER TABLE public.barbers ADD COLUMN IF NOT EXISTS profile_id UUID
  REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_barbers_profile_id ON public.barbers(profile_id);

-- RLS: barbero puede leer su propio row en barbers
DROP POLICY IF EXISTS "barber_reads_own_row" ON public.barbers;
CREATE POLICY "barber_reads_own_row" ON public.barbers
  FOR SELECT USING (profile_id = auth.uid());

-- Función helper para RLS en appointments
CREATE OR REPLACE FUNCTION public.get_barber_id_for_user(user_id UUID)
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id FROM public.barbers WHERE profile_id = user_id LIMIT 1;
$$;

-- RLS: barbero puede ver sus propias citas
DROP POLICY IF EXISTS "barber_reads_own_appointments" ON public.appointments;
CREATE POLICY "barber_reads_own_appointments" ON public.appointments
  FOR SELECT USING (barber_id = public.get_barber_id_for_user(auth.uid()));
```

### 3. Modos de Reserva (Presencial / Domicilio)

```sql
-- supabase/migrations/20260226_booking_modes.sql

-- Campos de geolocalización en barbers
ALTER TABLE public.barbers
  ADD COLUMN IF NOT EXISTS lat              DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS lng              DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS address_label    TEXT,
  ADD COLUMN IF NOT EXISTS offers_domicilio BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_barbers_domicilio
  ON public.barbers(offers_domicilio) WHERE is_active = true;

-- Campos de tipo de reserva en appointments
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS booking_type TEXT NOT NULL DEFAULT 'presencial'
    CHECK (booking_type IN ('presencial', 'domicilio')),
  ADD COLUMN IF NOT EXISTS client_address TEXT;

CREATE INDEX IF NOT EXISTS idx_appointments_booking_type
  ON public.appointments(booking_type);
```

### Verificación (ejecutar por separado)

```sql
-- Confirmar constraint de rol:
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint WHERE conname = 'profiles_role_check';

-- Confirmar columna profile_id en barbers:
SELECT column_name FROM information_schema.columns
WHERE table_name = 'barbers' AND column_name = 'profile_id';

-- Confirmar columna booking_type:
SELECT column_name FROM information_schema.columns
WHERE table_name = 'appointments' AND column_name IN ('booking_type', 'client_address');
```

---

## Tests

### Estructura

```
tests/
├── setup/             # jest.config.js, playwright.config.ts, seed-test-data.ts
├── unit/              # Lógica pura (validación, utilidades, Telegram helpers)
├── integration/api/   # Tests de rutas API contra Supabase de test
├── security/          # Auth, RLS, validación de inputs
├── e2e/               # Playwright: flujo completo de reserva y gestión
└── usability/         # Accesibilidad con axe-playwright
```

### Comandos

```bash
pnpm test              # Todos los tests (unit + integración + security)
pnpm test:unit         # Solo unitarios
pnpm test:integration  # Solo integración
pnpm test:security     # Solo seguridad
pnpm test:watch        # Modo watch (desarrollo)
pnpm test:coverage     # Reporte de cobertura (umbral: 70%)
pnpm test:e2e          # Playwright E2E
pnpm test:e2e:ui       # Playwright con UI mode
pnpm test:a11y         # Tests de accesibilidad
pnpm test:seed         # Sembrar datos de prueba en Supabase
```

### Variables de test

Los tests de integración y E2E requieren variables adicionales en `.env.local`:

```env
TEST_SUPABASE_URL=...
TEST_SUPABASE_ANON_KEY=...
TEST_SUPABASE_SERVICE_KEY=...
TEST_CUSTOMER_EMAIL=...
TEST_CUSTOMER_PASSWORD=...
TEST_ADMIN_EMAIL=...
TEST_ADMIN_PASSWORD=...
PLAYWRIGHT_BASE_URL=http://localhost:3000
```

### Cuenta de prueba Barbero

Para probar el panel barbero, existe una cuenta precreada:

```
Email:    barbero@test.com
Password: CorteUrbano2026!
Panel:    /dashboard/barber
```

Esta cuenta está vinculada al barbero "Miguel" en la base de datos.

---

## Comandos Disponibles

```bash
pnpm dev          # Servidor de desarrollo (localhost:3000)
pnpm build        # Build de producción
pnpm start        # Servidor de producción
pnpm lint         # ESLint

# Tests
pnpm test                  # Todos los tests
pnpm test:unit             # Tests unitarios
pnpm test:integration      # Tests de integración API
pnpm test:security         # Tests de seguridad
pnpm test:watch            # Watch mode
pnpm test:coverage         # Cobertura (umbral 70%)
pnpm test:e2e              # Playwright
pnpm test:e2e:ui           # Playwright UI mode
pnpm test:a11y             # Accesibilidad
pnpm test:seed             # Sembrar datos de prueba
pnpm test:supabase         # Verificar conexión Supabase
```

---

## Despliegue

### Vercel (configuración incluida en `vercel.json`)

1. **Conectar repositorio:** Vercel Dashboard → Import Project → GitHub
2. **Variables de entorno:** Settings → Environment Variables (todas las de `.env.local`)
3. **Deploy automático:** cada push a `main` dispara un build
4. **Post-deploy:** registrar webhook Telegram (ver Paso 5 de instalación)

```json
// vercel.json — configuración incluida
{
  "framework": "nextjs",
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install",
  "regions": ["iad1"]
}
```

---

## Troubleshooting

### "No autorizado" en API Routes
- Verifica que el usuario esté autenticado (token válido)
- Revisa políticas RLS en Supabase para la tabla involucrada
- Asegúrate de que `createSupabaseServiceClient()` se usa en API Routes, no en componentes

### Panel admin muestra dashboard de cliente
- Este bug fue corregido: el link "Mi Panel" ahora apunta a `/dashboard`
- El hub `/dashboard/page.tsx` redirige según el rol del usuario
- Si persiste, verifica que `profiles.role = 'admin'` en Supabase

### Supabase client en browser — error de Service Role Key
```
Error: "Supabase URL or Service Role Key is missing"
```
Estás usando `createSupabaseServiceClient()` en un componente `'use client'`.
Usa `createSupabaseBrowserClient()` en componentes del cliente.

### Telegram no envía mensajes
1. Verifica `TELEGRAM_BOT_TOKEN` correcto
2. Confirma que el webhook esté registrado: `curl .../getWebhookInfo`
3. Revisa los logs de Vercel para errores del webhook
4. Asegúrate que `TELEGRAM_ADMIN_CHAT_ID` sea tu chat ID numérico

### Realtime no actualiza el dashboard
1. Verifica Supabase → Database → Replication → `appointments` habilitado
2. Usa `createSupabaseBrowserClient()` en el componente de suscripción
3. Revisa la consola del navegador para errores de conexión WebSocket

### Barbero no ve sus citas
1. Verifica que `barbers.profile_id` esté vinculado al `profiles.id` del barbero
2. Ejecuta la migración `20260225_add_barber_role.sql` si no se ha aplicado
3. Confirma que la función `get_barber_id_for_user()` existe en Supabase

### Modo domicilio no asigna barbero
1. Verifica que existan barberos con `is_active=true` y `offers_domicilio=true`
2. Confirma que la migración `20260226_booking_modes.sql` se aplicó
3. El horario seleccionado no debe estar ocupado por todos los barberos domicilio

---

## Convenciones de Código

- **Componentes servidor:** no llevan `'use client'`, usan `createSupabaseServerClient()`
- **Componentes cliente:** llevan `'use client'`, usan `createSupabaseBrowserClient()`
- **API Routes:** usan `createSupabaseServiceClient()` para writes, `createSupabaseServerClient()` para reads autenticados
- **Validación:** todos los endpoints de API validan con Zod antes de procesar
- **Tipos:** TypeScript estricto, no usar `any` salvo en conversiones de queries Supabase
- **Estilos:** Tailwind con clases utilitarias, `cn()` para clases condicionales

---

## Licencia

Proyecto privado — uso interno de Corte Urbano.
