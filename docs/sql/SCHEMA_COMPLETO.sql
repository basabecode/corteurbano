-- =============================================================================
-- CORTE URBANO — ESQUEMA COMPLETO DE BASE DE DATOS
-- =============================================================================
-- Este archivo consolida TODAS las migraciones aplicadas en Supabase.
-- Es la referencia autoritativa del estado actual del schema.
-- Última actualización: 2026-02-27
--
-- CÓMO USAR:
--   Si construyes la base de datos desde cero, ejecuta cada sección en orden.
--   Si la base de datos ya existe, usa este archivo como referencia
--   y ejecuta solo las secciones que aún no se han aplicado.
--
-- MIGRACIONES INDIVIDUALES (en supabase/migrations/) siguen siendo válidas
-- para aplicar cambios incrementales al schema.
-- =============================================================================


-- =============================================================================
-- SECCIÓN 1: FUNCIONES HELPER
-- =============================================================================

-- Función: verificar si un usuario es admin
-- Evita recursión infinita en RLS (no consulta auth.uid() directamente en policy)
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = user_id
    AND role = 'admin'
  );
$$;

-- Función: obtener el barber.id para un usuario con rol barbero
-- Usada en RLS de appointments para que el barbero solo vea sus citas
CREATE OR REPLACE FUNCTION public.get_barber_id_for_user(user_id UUID)
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM public.barbers WHERE profile_id = user_id LIMIT 1;
$$;


-- =============================================================================
-- SECCIÓN 2: TABLA profiles
-- =============================================================================
-- Extiende la tabla profiles creada automáticamente por Supabase Auth.
-- auth.users → profiles (1:1)

-- Constraint de roles (admin | customer | barber)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'customer', 'barber'));

-- Columnas adicionales al perfil base
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS full_name    TEXT,
  ADD COLUMN IF NOT EXISTS phone        TEXT,
  ADD COLUMN IF NOT EXISTS email        TEXT,
  ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT timezone('utc', now());

-- Campos de integración Telegram
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS telegram_chat_id       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS telegram_username      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS telegram_vinculado_at  TIMESTAMPTZ;

-- Índices en profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role         ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_phone        ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_telegram_chat_id      ON public.profiles(telegram_chat_id);

-- RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "perfil_propio_visible"        ON public.profiles;
DROP POLICY IF EXISTS "admin_ve_todos_perfiles"      ON public.profiles;
DROP POLICY IF EXISTS "usuario_actualiza_perfil_propio" ON public.profiles;

-- Cada usuario ve su propio perfil
CREATE POLICY "perfil_propio_visible"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins ven todos los perfiles (usa función helper para evitar recursión)
CREATE POLICY "admin_ve_todos_perfiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Cada usuario actualiza solo su perfil
CREATE POLICY "usuario_actualiza_perfil_propio"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);


-- =============================================================================
-- SECCIÓN 3: TABLA services
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.services (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE,
  price            NUMERIC(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  description      TEXT,
  image_url        TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Columnas que se agregaron después del schema inicial
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_active   BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS slug        TEXT;

-- Índices en services
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_services_slug      ON public.services(slug);

-- RLS en services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "servicios_publicos"      ON public.services;
DROP POLICY IF EXISTS "admin_gestiona_servicios" ON public.services;

-- Servicios activos son visibles para todos (incluidos no autenticados)
CREATE POLICY "servicios_publicos"
  ON public.services FOR SELECT
  USING (is_active = true);

-- Admins gestionan servicios (CRUD completo)
CREATE POLICY "admin_gestiona_servicios"
  ON public.services FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- =============================================================================
-- SECCIÓN 4: TABLA barbers
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.barbers (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  specialty        TEXT,
  bio              TEXT,
  photo_url        TEXT,
  instagram_handle TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),

  -- Vinculación con cuenta de usuario (rol barbero)
  profile_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Geolocalización y servicio a domicilio
  lat              DECIMAL(9,6),
  lng              DECIMAL(9,6),
  address_label    TEXT,
  offers_domicilio BOOLEAN NOT NULL DEFAULT false
);

-- Columnas que se agregaron en migraciones posteriores
ALTER TABLE public.barbers
  ADD COLUMN IF NOT EXISTS profile_id       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS lat              DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS lng              DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS address_label    TEXT,
  ADD COLUMN IF NOT EXISTS offers_domicilio BOOLEAN NOT NULL DEFAULT false;

-- Índices en barbers
CREATE INDEX IF NOT EXISTS idx_barbers_is_active    ON public.barbers(is_active);
CREATE INDEX IF NOT EXISTS idx_barbers_profile_id   ON public.barbers(profile_id);
CREATE INDEX IF NOT EXISTS idx_barbers_domicilio    ON public.barbers(offers_domicilio) WHERE is_active = true;

-- RLS en barbers
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "barberos_publicos"       ON public.barbers;
DROP POLICY IF EXISTS "admin_gestiona_barberos" ON public.barbers;
DROP POLICY IF EXISTS "barber_reads_own_row"    ON public.barbers;

-- Barberos activos visibles para todos
CREATE POLICY "barberos_publicos"
  ON public.barbers FOR SELECT
  USING (is_active = true);

-- Admins gestionan barberos (CRUD completo)
CREATE POLICY "admin_gestiona_barberos"
  ON public.barbers FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Barbero puede ver su propio row (aunque esté inactivo)
CREATE POLICY "barber_reads_own_row"
  ON public.barbers FOR SELECT
  USING (profile_id = auth.uid());


-- =============================================================================
-- SECCIÓN 5: TABLA appointments
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  barber_id           UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
  service_id          UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  start_time          TIMESTAMPTZ NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  cancellation_reason TEXT,

  -- Modo de reserva (presencial / domicilio)
  booking_type        TEXT NOT NULL DEFAULT 'presencial'
                        CHECK (booking_type IN ('presencial', 'domicilio')),
  client_address      TEXT,  -- Dirección del cliente (solo para domicilio)

  created_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Columnas agregadas en migraciones
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS booking_type TEXT NOT NULL DEFAULT 'presencial'
    CHECK (booking_type IN ('presencial', 'domicilio')),
  ADD COLUMN IF NOT EXISTS client_address TEXT;

-- Índices en appointments
CREATE INDEX IF NOT EXISTS idx_appointments_client_id     ON public.appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_barber_id     ON public.appointments(barber_id);
CREATE INDEX IF NOT EXISTS idx_appointments_service_id    ON public.appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status        ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time    ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_appointments_booking_type  ON public.appointments(booking_type);

-- RLS en appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cliente_crea_cita"          ON public.appointments;
DROP POLICY IF EXISTS "cliente_ve_sus_citas"        ON public.appointments;
DROP POLICY IF EXISTS "cliente_actualiza_su_cita"   ON public.appointments;
DROP POLICY IF EXISTS "admin_acceso_total_citas"    ON public.appointments;
DROP POLICY IF EXISTS "barber_reads_own_appointments" ON public.appointments;

-- Cliente crea su propia cita
CREATE POLICY "cliente_crea_cita"
  ON public.appointments FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- Cliente ve sus propias citas
CREATE POLICY "cliente_ve_sus_citas"
  ON public.appointments FOR SELECT
  USING (auth.uid() = client_id);

-- Cliente actualiza (cancela) su propia cita
CREATE POLICY "cliente_actualiza_su_cita"
  ON public.appointments FOR UPDATE
  USING (auth.uid() = client_id);

-- Admin tiene acceso completo a todas las citas
CREATE POLICY "admin_acceso_total_citas"
  ON public.appointments FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Barbero ve las citas asignadas a él (vía función helper)
CREATE POLICY "barber_reads_own_appointments"
  ON public.appointments FOR SELECT
  USING (barber_id = public.get_barber_id_for_user(auth.uid()));


-- =============================================================================
-- SECCIÓN 6: TABLA appointments_history
-- =============================================================================
-- Citas archivadas: snapshot desnormalizado para historial permanente.
-- Se puebla cuando admin/cliente archiva citas completadas o canceladas.

CREATE TABLE IF NOT EXISTS public.appointments_history (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_appointment_id UUID NOT NULL,
  client_id               UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id              UUID REFERENCES public.services(id) ON DELETE SET NULL,
  start_time              TIMESTAMPTZ NOT NULL,
  end_time                TIMESTAMPTZ,
  status                  TEXT NOT NULL CHECK (status IN ('completed', 'cancelled')),
  cancellation_reason     TEXT,
  archived_at             TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  created_at              TIMESTAMPTZ NOT NULL,

  -- Snapshot del servicio en el momento del archivado
  service_name            TEXT NOT NULL,
  service_price           NUMERIC(10,2) NOT NULL,
  service_duration_minutes INTEGER NOT NULL,

  -- Snapshot del cliente en el momento del archivado
  client_name             TEXT,
  client_phone            TEXT,
  client_email            TEXT
);

-- Índices en appointments_history
CREATE INDEX IF NOT EXISTS idx_appointments_history_client_id
  ON public.appointments_history(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_history_status
  ON public.appointments_history(status);
CREATE INDEX IF NOT EXISTS idx_appointments_history_archived_at
  ON public.appointments_history(archived_at);
CREATE INDEX IF NOT EXISTS idx_appointments_history_start_time
  ON public.appointments_history(start_time);

-- RLS en appointments_history
ALTER TABLE public.appointments_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_ve_historial"      ON public.appointments_history;
DROP POLICY IF EXISTS "admin_gestiona_historial" ON public.appointments_history;
DROP POLICY IF EXISTS "cliente_ve_su_historial"  ON public.appointments_history;

-- Admin ve todo el historial
CREATE POLICY "admin_ve_historial"
  ON public.appointments_history FOR SELECT
  USING (public.is_admin(auth.uid()));

-- Admin gestiona el historial (INSERT, UPDATE, DELETE)
CREATE POLICY "admin_gestiona_historial"
  ON public.appointments_history FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Cliente ve solo su historial
CREATE POLICY "cliente_ve_su_historial"
  ON public.appointments_history FOR SELECT
  USING (client_id = auth.uid());


-- =============================================================================
-- SECCIÓN 7: HABILITAR REALTIME
-- =============================================================================
-- Ejecutar en Supabase Dashboard → Database → Replication
-- O con el siguiente SQL si tienes acceso a la configuración:
--
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
--
-- IMPORTANTE: Esto debe hacerse desde el Dashboard de Supabase:
--   Database → Replication → appointments ✓


-- =============================================================================
-- SECCIÓN 8: VERIFICACIÓN FINAL
-- =============================================================================
-- Ejecutar estas queries por separado para confirmar que todo está aplicado:

-- Verificar constraint de rol en profiles:
-- SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'profiles_role_check';

-- Verificar columnas en barbers:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'barbers' ORDER BY column_name;

-- Verificar columnas en appointments:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'appointments' ORDER BY column_name;

-- Verificar políticas RLS activas:
-- SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;

-- Verificar funciones helper:
-- SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
