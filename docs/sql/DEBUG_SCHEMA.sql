-- Script para verificar la estructura exacta de appointments_history
-- Ejecutar en Supabase SQL Editor

-- 1. Ver todas las columnas y sus tipos
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'appointments_history'
ORDER BY ordinal_position;

-- 2. Ver restricciones NOT NULL
SELECT
    ccu.column_name,
    tc.constraint_name,
    tc.constraint_type
FROM information_schema.constraint_column_usage ccu
JOIN information_schema.table_constraints tc 
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'appointments_history'
AND tc.table_schema = 'public'
ORDER BY ccu.column_name;

-- 3. Intentar insertar un registro de prueba (comentado por seguridad)
/*
INSERT INTO public.appointments_history (
    original_appointment_id,
    client_id,
    service_id,
    start_time,
    end_time,
    status,
    created_at,
    service_name,
    service_price,
    service_duration_minutes
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000000',
    NOW(),
    NOW() + INTERVAL '30 minutes',
    'completed',
    NOW(),
    'Test Service',
    100.00,
    30
);
*/
