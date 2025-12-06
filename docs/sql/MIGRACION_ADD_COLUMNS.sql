-- ========================================
-- MIGRACIÓN: Agregar columnas faltantes a appointments_history
-- ========================================
-- Este script agrega las columnas que faltan SIN borrar datos existentes
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar columnas de servicio si no existen
DO $$
BEGIN
    -- service_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments_history' 
        AND column_name = 'service_name'
    ) THEN
        ALTER TABLE public.appointments_history 
        ADD COLUMN service_name TEXT;
        
        -- Rellenar con datos del servicio si es posible
        UPDATE public.appointments_history ah
        SET service_name = s.name
        FROM public.services s
        WHERE ah.service_id = s.id
        AND ah.service_name IS NULL;
        
        -- Hacer NOT NULL después de rellenar
        ALTER TABLE public.appointments_history 
        ALTER COLUMN service_name SET NOT NULL;
        
        RAISE NOTICE 'Columna service_name agregada';
    END IF;

    -- service_price
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments_history' 
        AND column_name = 'service_price'
    ) THEN
        ALTER TABLE public.appointments_history 
        ADD COLUMN service_price NUMERIC(10,2);
        
        -- Rellenar con datos del servicio
        UPDATE public.appointments_history ah
        SET service_price = s.price
        FROM public.services s
        WHERE ah.service_id = s.id
        AND ah.service_price IS NULL;
        
        -- Hacer NOT NULL después de rellenar
        ALTER TABLE public.appointments_history 
        ALTER COLUMN service_price SET NOT NULL;
        
        RAISE NOTICE 'Columna service_price agregada';
    END IF;

    -- service_duration_minutes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments_history' 
        AND column_name = 'service_duration_minutes'
    ) THEN
        ALTER TABLE public.appointments_history 
        ADD COLUMN service_duration_minutes INTEGER;
        
        -- Rellenar con datos del servicio
        UPDATE public.appointments_history ah
        SET service_duration_minutes = s.duration_minutes
        FROM public.services s
        WHERE ah.service_id = s.id
        AND ah.service_duration_minutes IS NULL;
        
        -- Hacer NOT NULL después de rellenar
        ALTER TABLE public.appointments_history 
        ALTER COLUMN service_duration_minutes SET NOT NULL;
        
        RAISE NOTICE 'Columna service_duration_minutes agregada';
    END IF;

    -- client_name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments_history' 
        AND column_name = 'client_name'
    ) THEN
        ALTER TABLE public.appointments_history 
        ADD COLUMN client_name TEXT;
        
        -- Rellenar con datos del perfil
        UPDATE public.appointments_history ah
        SET client_name = p.full_name
        FROM public.profiles p
        WHERE ah.client_id = p.id
        AND ah.client_name IS NULL;
        
        RAISE NOTICE 'Columna client_name agregada';
    END IF;

    -- client_phone
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments_history' 
        AND column_name = 'client_phone'
    ) THEN
        ALTER TABLE public.appointments_history 
        ADD COLUMN client_phone TEXT;
        
        RAISE NOTICE 'Columna client_phone agregada';
    END IF;

    -- client_email
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'appointments_history' 
        AND column_name = 'client_email'
    ) THEN
        ALTER TABLE public.appointments_history 
        ADD COLUMN client_email TEXT;
        
        RAISE NOTICE 'Columna client_email agregada';
    END IF;

END $$;

-- 2. Verificar que todas las columnas existan ahora
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'appointments_history'
ORDER BY ordinal_position;

-- 3. Mostrar registros existentes
SELECT 
    COUNT(*) as total_registros,
    COUNT(service_name) as con_service_name,
    COUNT(client_name) as con_client_name
FROM public.appointments_history;
