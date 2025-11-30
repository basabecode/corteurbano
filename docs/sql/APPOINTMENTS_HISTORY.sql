-- =========================================================
-- SOLUCIÓN AL ERROR 42P17: Definición de función IMMUTABLE
-- =========================================================

-- Creamos una función auxiliar que envuelve DATE_TRUNC y la marcamos explícitamente como IMMUTABLE.
-- Esto le dice a PostgreSQL que confíe en nosotros y permita su uso en índices.
CREATE OR REPLACE FUNCTION public.immutable_month_trunc(timestamp with time zone)
RETURNS timestamp with time zone
LANGUAGE sql
IMMUTABLE -- ¡Clave para solucionar el error!
AS $$
  SELECT DATE_TRUNC('month', $1);
$$;

COMMENT ON FUNCTION public.immutable_month_trunc(timestamp with time zone) IS 
'Función inmutable auxiliar para redondear una marca de tiempo al inicio del mes, permitiendo su uso en índices funcionales.';

-- =========================================================
-- SCRIPT PRINCIPAL DEL ESQUEMA
-- =========================================================

-- 1. Crear tabla de historial de citas
CREATE TABLE IF NOT EXISTS public.appointments_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_appointment_id uuid NOT NULL,
  client_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  status text NOT NULL CHECK (status IN ('completed', 'cancelled')),
  price numeric(10,2) NOT NULL,
  cancellation_reason text,
  archived_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL
  -- Asegúrate de que NO existe una columna 'start_month' generada del intento anterior.
);

-- 2. Índices para mejorar rendimiento de reportes
CREATE INDEX IF NOT EXISTS idx_appointments_history_archived_at 
  ON public.appointments_history(archived_at);
CREATE INDEX IF NOT EXISTS idx_appointments_history_status 
  ON public.appointments_history(status);

-- MODIFICADO: Ahora usamos la función IMMUTABLE personalizada 'immutable_month_trunc'
CREATE INDEX IF NOT EXISTS idx_appointments_history_month 
  ON public.appointments_history(public.immutable_month_trunc(start_time));

-- 3. Activar RLS
ALTER TABLE public.appointments_history ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
-- NOTA: Asumo que tienes una función 'public.is_admin(uuid)' definida en otro lugar.
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'appointments_history' 
    AND policyname = 'admin_ve_historial'
  ) THEN
    CREATE POLICY "admin_ve_historial"
      ON public.appointments_history
      FOR SELECT
      USING (public.is_admin(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'appointments_history' 
    AND policyname = 'admin_gestiona_historial'
  ) THEN
    CREATE POLICY "admin_gestiona_historial"
      ON public.appointments_history
      FOR ALL
      USING (public.is_admin(auth.uid()))
      WITH CHECK (public.is_admin(auth.uid()));
  END IF;
END $$;

-- 5. Función para archivar citas antiguas (sin cambios necesarios aquí)
CREATE OR REPLACE FUNCTION public.archive_old_appointments()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  archived_count INTEGER;
BEGIN
  WITH moved_appointments AS (
    INSERT INTO public.appointments_history (
      original_appointment_id,
      client_id,
      service_id,
      start_time,
      status,
      price,
      cancellation_reason,
      created_at
    )
    SELECT 
      a.id,
      a.client_id,
      a.service_id,
      a.start_time,
      a.status,
      s.price,
      a.cancellation_reason,
      a.created_at
    FROM public.appointments a
    JOIN public.services s ON a.service_id = s.id
    WHERE a.status IN ('completed', 'cancelled')
    RETURNING id
  ),
  deleted_appointments AS (
    DELETE FROM public.appointments
    WHERE id IN (
      SELECT original_appointment_id FROM moved_appointments
    )
    RETURNING id
  )
  SELECT COUNT(*) INTO archived_count FROM deleted_appointments;
  
  RETURN archived_count;
END;
$$;

COMMENT ON FUNCTION public.archive_old_appointments() IS 
'Archiva citas completadas o canceladas al historial y las elimina de la tabla principal';
