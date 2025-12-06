-- 🔍 Script para limpiar servicios duplicados
-- Este script:
-- 1. Identifica servicios con el mismo nombre
-- 2. Mantiene el servicio más antiguo (original)
-- 3. Mueve las citas de los duplicados al servicio original
-- 4. Elimina los servicios duplicados

DO $$
DECLARE
    r RECORD;
    keep_id UUID;
    deleted_count INTEGER;
BEGIN
    -- Recorrer cada nombre de servicio que tenga duplicados
    FOR r IN 
        SELECT name 
        FROM public.services 
        GROUP BY name 
        HAVING count(*) > 1
    LOOP
        -- 1. Seleccionar el ID que se quedará (el más antiguo)
        SELECT id INTO keep_id
        FROM public.services
        WHERE name = r.name
        ORDER BY created_at ASC, id ASC
        LIMIT 1;

        RAISE NOTICE 'Procesando servicio: %. ID principal: %', r.name, keep_id;

        -- 2. Actualizar citas que apunten a los duplicados para que apunten al original
        -- Esto evita errores de Foreign Key y no pierde datos de citas
        UPDATE public.appointments
        SET service_id = keep_id
        WHERE service_id IN (
            SELECT id FROM public.services 
            WHERE name = r.name AND id != keep_id
        );

        -- 3. Eliminar los duplicados
        DELETE FROM public.services
        WHERE name = r.name AND id != keep_id;
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        RAISE NOTICE 'Eliminados % duplicados para: %', deleted_count, r.name;
    END LOOP;
END $$;

-- 4. Agregar restricción para evitar futuros duplicados
ALTER TABLE public.services ADD CONSTRAINT services_name_key UNIQUE (name);

-- Verificación final
SELECT name, price, id FROM public.services ORDER BY name;
