-- 📞 Actualización para agregar teléfono a perfiles

-- 1. Agregar columna 'phone' a la tabla profiles si no existe
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text;

-- 2. Agregar columna 'email' a la tabla profiles si no existe (opcional, para caché)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;

-- 3. Actualizar políticas de seguridad (RLS) para permitir que el usuario actualice su propio perfil
-- (Esto generalmente ya está cubierto, pero aseguramos permisos de UPDATE)
CREATE POLICY "Users can update own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- 4. Comentario para documentación
COMMENT ON COLUMN public.profiles.phone IS 'Número de teléfono de contacto del cliente';
