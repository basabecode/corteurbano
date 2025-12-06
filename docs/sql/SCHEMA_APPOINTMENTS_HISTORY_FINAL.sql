-- ========================================
-- ESQUEMA DEFINITIVO: appointments_history
-- ========================================
-- Este es el esquema correcto y completo para la tabla de historial
-- Compatible con las APIs de cliente y administrador
-- Ejecutar en Supabase SQL Editor

-- 1. Crear función is_admin (si no existe)
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

-- 2. Eliminar tabla si existe (CUIDADO: esto borra datos existentes)
-- Comentar esta línea si ya tienes datos que quieres conservar
-- DROP TABLE IF EXISTS public.appointments_history CASCADE;

-- 3. Crear tabla appointments_history
CREATE TABLE IF NOT EXISTS public.appointments_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_appointment_id UUID NOT NULL,
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('completed', 'cancelled')),
    cancellation_reason TEXT,
    archived_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    created_at TIMESTAMPTZ NOT NULL,
    
    -- Datos del servicio guardados (para historial y estadísticas)
    service_name TEXT NOT NULL,
    service_price NUMERIC(10,2) NOT NULL,
    service_duration_minutes INTEGER NOT NULL,
    
    -- Datos del cliente guardados (para referencia)
    client_name TEXT,
    client_phone TEXT,
    client_email TEXT
);

-- 4. Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_appointments_history_client_id 
    ON public.appointments_history(client_id);
    
CREATE INDEX IF NOT EXISTS idx_appointments_history_service_id 
    ON public.appointments_history(service_id);
    
CREATE INDEX IF NOT EXISTS idx_appointments_history_status 
    ON public.appointments_history(status);
    
CREATE INDEX IF NOT EXISTS idx_appointments_history_archived_at 
    ON public.appointments_history(archived_at);
    
CREATE INDEX IF NOT EXISTS idx_appointments_history_start_time 
    ON public.appointments_history(start_time);

-- 5. Activar Row Level Security (RLS)
ALTER TABLE public.appointments_history ENABLE ROW LEVEL SECURITY;

-- 6. Eliminar políticas existentes (si las hay)
DROP POLICY IF EXISTS "admin_ve_historial" ON public.appointments_history;
DROP POLICY IF EXISTS "admin_gestiona_historial" ON public.appointments_history;
DROP POLICY IF EXISTS "cliente_ve_su_historial" ON public.appointments_history;

-- 7. Crear políticas RLS

-- Los administradores pueden ver todo el historial
CREATE POLICY "admin_ve_historial"
    ON public.appointments_history
    FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Los administradores pueden gestionar (INSERT, UPDATE, DELETE) todo el historial
CREATE POLICY "admin_gestiona_historial"
    ON public.appointments_history
    FOR ALL
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

-- Los cliente puede ver solo su propio historial
CREATE POLICY "cliente_ve_su_historial"
    ON public.appointments_history
    FOR SELECT
    USING (client_id = auth.uid());

-- 8. Agregar comentarios descriptivos
COMMENT ON TABLE public.appointments_history IS 
    'Historial de citas archivadas para mantener estadísticas y permitir consulta de historial';

COMMENT ON COLUMN public.appointments_history.original_appointment_id IS 
    'ID de la cita original antes de ser archivada';

COMMENT ON COLUMN public.appointments_history.service_name IS 
    'Nombre del servicio guardado en el momento del archivo';

COMMENT ON COLUMN public.appointments_history.service_price IS 
    'Precio del servicio guardado en el momento del archivo';

COMMENT ON COLUMN public.appointments_history.archived_at IS 
    'Fecha y hora en que se archivó la cita';

COMMENT ON COLUMN public.appointments_history.client_name IS 
    'Nombre del cliente guardado en el momento del archivo';

-- 9. Verificación final
SELECT 
    'appointments_history' as tabla,
    COUNT(*) as registros_existentes,
    MAX(archived_at) as ultima_archivada
FROM public.appointments_history;

-- 10. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    cmd
FROM pg_policies
WHERE tablename = 'appointments_history'
ORDER BY policyname;
