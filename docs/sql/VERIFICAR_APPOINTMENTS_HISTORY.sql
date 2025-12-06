-- ========================================
-- VERIFICACIÓN Y CREACIÓN DE TABLA appointments_history
-- ========================================
-- Este script verifica si la tabla existe y la crea si es necesario
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si la tabla existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments_history'
    ) THEN
        RAISE NOTICE 'La tabla appointments_history NO existe. Se creará ahora...';
        
        -- Crear tabla appointments_history
        CREATE TABLE public.appointments_history (
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
            
            -- Datos del servicio al momento del archivo (para estadísticas)
            service_name TEXT NOT NULL,
            service_price DECIMAL(10,2) NOT NULL,
            service_duration_minutes INTEGER NOT NULL,
            
            -- Datos del cliente al momento del archivo
            client_name TEXT,
            client_phone TEXT,
            client_email TEXT
        );

        -- Índices para mejorar consultas de estadísticas
        CREATE INDEX idx_appointments_history_client ON public.appointments_history(client_id);
        CREATE INDEX idx_appointments_history_service ON public.appointments_history(service_id);
        CREATE INDEX idx_appointments_history_status ON public.appointments_history(status);
        CREATE INDEX idx_appointments_history_archived_at ON public.appointments_history(archived_at);
        CREATE INDEX idx_appointments_history_start_time ON public.appointments_history(start_time);

        -- Activar RLS
        ALTER TABLE public.appointments_history ENABLE ROW LEVEL SECURITY;

        -- Políticas RLS
        CREATE POLICY "admin_ve_historial"
            ON public.appointments_history
            FOR SELECT
            USING (public.is_admin(auth.uid()));

        CREATE POLICY "admin_gestiona_historial"
            ON public.appointments_history
            FOR ALL
            USING (public.is_admin(auth.uid()))
            WITH CHECK (public.is_admin(auth.uid()));

        CREATE POLICY "cliente_ve_su_historial"
            ON public.appointments_history
            FOR SELECT
            USING (client_id = auth.uid());

        -- Comentarios
        COMMENT ON TABLE public.appointments_history IS 'Historial de citas archivadas para mantener estadísticas y reportes';
        COMMENT ON COLUMN public.appointments_history.original_appointment_id IS 'ID de la cita original antes de ser archivada';
        COMMENT ON COLUMN public.appointments_history.service_name IS 'Nombre del servicio guardado en el momento del archivo';
        COMMENT ON COLUMN public.appointments_history.archived_at IS 'Fecha y hora en que se archivó la cita';

        RAISE NOTICE '✅ Tabla appointments_history creada exitosamente con políticas RLS';
    ELSE
        RAISE NOTICE '✅ La tabla appointments_history ya existe';
    END IF;
END $$;

-- 2. Crear/verificar función is_admin
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

-- 3. Verificación final
SELECT 
    'appointments_history' as tabla,
    COUNT(*) as registros_existentes
FROM public.appointments_history;

-- 4. Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'appointments_history'
ORDER BY policyname;
