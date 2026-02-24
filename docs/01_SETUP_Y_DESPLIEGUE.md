# 01 SETUP Y DESPLIEGUE

Este archivo consolida la documentación relacionada con la instalación, configuración de base de datos y despliegue en Vercel.

---

## 8. INSTALLATION (Guía de Instalación)

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

Para configurar las tablas y políticas de seguridad, consulta la sección de Configuración de Base de Datos más abajo.

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
*   **Solución:** Ejecuta los scripts de base de datos.

### Error: "Recursión infinita" en políticas
*   **Solución:** Asegúrate de usar la función `is_admin` con `SECURITY DEFINER` como se explica en los scripts de base de datos.

---
---

## 5. DATABASE SETUP (Configuración de Base de Datos)

# 🗄️ Configuración de Base de Datos - Corte Urbano

Esta guía detalla cómo configurar la base de datos PostgreSQL en Supabase, incluyendo tablas, seguridad (RLS) y datos iniciales.

## 📋 Instrucciones

1.  Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard).
2.  Abre el **SQL Editor**.
3.  Ejecuta los siguientes scripts en orden.

### 1. Esquema Principal y Seguridad

Este script crea las tablas `profiles`, `services`, `appointments` y configura las políticas de seguridad (RLS). Incluye la corrección para evitar recursión infinita en las políticas de admin.

```sql
-- Perfiles enlazados a auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','customer')),
  telegram_chat_id text,
  full_name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  duration_minutes int not null check (duration_minutes > 0),
  image_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  start_time timestamptz not null,
  status text not null check (status in ('pending','confirmed','completed','cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Triggers para timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.handle_updated_at();

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute procedure public.handle_updated_at();

-- Activar RLS
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;

-- Función helper para verificar admin (SECURITY DEFINER para evitar recursión)
create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 
    from public.profiles 
    where id = user_id 
    and role = 'admin'
  );
$$;

-- POLÍTICAS RLS

-- Profiles
create policy "perfil_propio_visible" on public.profiles for select using (auth.uid() = id);
create policy "admin_ve_todos_perfiles" on public.profiles for select using (public.is_admin(auth.uid()));
create policy "usuario_actualiza_perfil_propio" on public.profiles for update using (auth.uid() = id);

-- Services
create policy "servicios_visibles" on public.services for select using (true);
create policy "admin_gestiona_servicios" on public.services for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Appointments
create policy "cliente_crea_cita_propia" on public.appointments for insert with check (client_id = auth.uid());
create policy "cliente_ve_sus_citas" on public.appointments for select using (client_id = auth.uid());
create policy "cliente_actualiza_su_cita" on public.appointments for update using (client_id = auth.uid());
create policy "admin_acceso_total_citas" on public.appointments for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
```

### 2. Automatización de Perfiles

Este script crea automáticamente un perfil cuando un usuario se registra.

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 3. Datos Iniciales (Seed)

Inserta servicios de ejemplo.

```sql
insert into public.services (name, price, duration_minutes) values
  ('Corte Básico', 50000.00, 30),
  ('Corte con Estilo', 60000.00, 60),
  ('Afeitado Express', 35000.00, 30),
  ('Corte Niño', 25000.00, 25),
  ('Diseño de Barba', 20000.00, 25),
  ('Tratamiento Capilar', 50000.00, 40),
  ('Pigmento en Cabello', 80000.00, 60)
on conflict do nothing;
```

---

## 🔍 Verificación

Para verificar que todo está correcto, puedes ejecutar:

```sql
-- Verificar tablas
select table_name from information_schema.tables 
where table_schema = 'public' 
and table_name in ('profiles', 'services', 'appointments');

-- Verificar servicios
select * from public.services;
```

### Script de Prueba (Node.js)

Puedes usar el script `scripts/test-supabase.js` (si existe) o crear uno simple para verificar la conexión desde tu código.

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

supabase.from('services').select('count').then(({ data, error }) => {
  if (error) console.error('❌ Error:', error.message);
  else console.log('✅ Conexión exitosa');
});
```

---
---

## 9. INSTRUCCIONES EJECUTAR SCHEMA (Historial)

# 🗄️ Instrucciones para Configurar appointments_history en Supabase

## ⚠️ IMPORTANTE: Leer antes de ejecutar

Este es el esquema SQL **definitivo y correcto** para la tabla `appointments_history`.

---

## 📋 Pasos a Seguir

### **Paso 1: Abrir Supabase SQL Editor**

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. En el menú izquierdo, haz clic en **"SQL Editor"**
3. Haz clic en **"New Query"**

### **Paso 2: Copiar y Pegar el Script**

1. Abre el archivo: `docs/sql/SCHEMA_APPOINTMENTS_HISTORY_FINAL.sql`
2. **Copia TODO el contenido** del archivo
3. **Pégalo** en el SQL Editor de Supabase

### **Paso 3: Ejecutar el Script**

1. Presiona el botón **"Run"** (o Ctrl+Enter)
2. Espera a que termine la ejecución
3. Deberías ver mensajes de éxito

### **Paso 4: Verificar la Tabla**

El mismo script mostrará al final:
- Cantidad de registros existentes
- Últi cita archivada
- Políticas RLS configuradas

---

## ✅ Resultado Esperado

Deberías ver algo como:

```
Success. No rows returned
```

Y al final, dos tablas de resultados:
1. **Verificación de tabla** con columnas: `tabla`, `registros_existentes`, `ultima_archivada`
2. **Políticas RLS** mostrando 3 políticas:
   - `admin_gestiona_historial`
   - `admin_ve_historial`
   - `cliente_ve_su_historial`

---

## 🔧 Estructura de la Tabla Creada

```sql
appointments_history
├── id (UUID)
├── original_appointment_id (UUID)
├── client_id (UUID) → references profiles
├── service_id (UUID) → references services
├── start_time (TIMESTAMPTZ)
├── end_time (TIMESTAMPTZ)
├── status (TEXT) → 'completed' | 'cancelled'
├── cancellation_reason (TEXT)
├── archived_at (TIMESTAMPTZ)
├── created_at (TIMESTAMPTZ)
├── service_name (TEXT)
├── service_price (NUMERIC)
├── service_duration_minutes (INTEGER)
├── client_name (TEXT)
├── client_phone (TEXT)
└── client_email (TEXT)
```

---

## 🔒 Políticas de Seguridad (RLS)

### Para Administradores:
- ✅ Pueden **ver** todo el historial
- ✅ Pueden **insertar, actualizar, eliminar** registros

### Para Clientes:
- ✅ Solo pueden **ver** su propio historial (`client_id = auth.uid()`)
- ❌ **NO** pueden insertar directamente (solo a través de la API)

---

## 🚨 Notas IMPORTANTES

### **Si la tabla YA EXISTE:**

El script tiene esta línea comentada (línea 25-26):
```sql
-- DROP TABLE IF EXISTS public.appointments_history CASCADE;
```

**Si quieres eliminar la tabla existente y empezar de cero:**
1. Descomenta esa línea (quita los `--`)
2. ⚠️ **ADVERTENCIA**: Esto borrará TODOS los datos existentes
3. Ejecuta el script

**Si quieres mantener los datos existentes:**
1. **NO** descomentes esa línea
2. El script usará `CREATE TABLE IF NOT EXISTS` (no la recreará)
3. Solo agregará las políticas RLS si no existen

---

## 🧪 Probar Después de Ejecutar

Una vez ejecutado el script:

1. **Desde el panel del cliente:**
   - Selecciona citas completadas
   - Presiona "Archivar"
   - Confirma en el modal
   - ✅ **NO debería aparecer error 500**
   - ✅ Las citas deben desaparecer del dashboard
   - ✅ Deben aparecer en `/dashboard/customer/historial`

2. **Verificar en Supabase:**
   - Ve a **"Table Editor"** → **"appointments_history"**
   - Deberías ver las citas archivadas

---

## ❓ Solución de Problemas

### Error: "relation already exists"
**Causa:** La tabla ya existe  
**Solución:** El script continuará sin problemas (usa `IF NOT EXISTS`)

### Error: "column does not exist"
**Causa:** Intentaste ejecutar un script antiguo  
**Solución:** Ejecuta `SCHEMA_APPOINTMENTS_HISTORY_FINAL.sql` completo

### Error: "function is_admin does not exist"
**Causa:** La función auxiliar no existe  
**Solución:** El script la crea automáticamente (líneas 11-21)

---

## 📞 Después de Ejecutar

**Avísame cuando hayas ejecutado el script y te diré si hubo algún problema o si todo está correcto.**

Luego podremos probar el archivado de citas en el navegador.

---
---

## 6. DEPLOY TO VERCEL

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

---
---

## 12. PASOS FINALES VERCEL (Webhook Confirmación)

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

