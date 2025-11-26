-- Script para corregir políticas RLS con recursión infinita
-- Ejecuta este script en Supabase SQL Editor

-- Primero, eliminar las políticas problemáticas
DROP POLICY IF EXISTS "perfil propio o admin" ON public.profiles;
DROP POLICY IF EXISTS "admin acceso total citas" ON public.appointments;
DROP POLICY IF EXISTS "admin gestiona servicios" ON public.services;

-- Crear función helper para verificar si un usuario es admin
-- Esta función evita la recursión infinita
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

-- PERFIL: Política corregida sin recursión
CREATE POLICY "perfil_propio_visible"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- PERFIL: Admins pueden ver todos los perfiles (usando función helper)
CREATE POLICY "admin_ve_todos_perfiles"
ON public.profiles
FOR SELECT
USING (public.is_admin(auth.uid()));

-- PERFIL: Usuario puede actualizar su propio perfil
CREATE POLICY "usuario_actualiza_perfil_propio"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- SERVICES: Lectura pública (sin cambios)
-- La política ya existe y está bien

-- SERVICES: Admin puede gestionar servicios (usando función helper)
CREATE POLICY "admin_gestiona_servicios"
ON public.services
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- APPOINTMENTS: Cliente crea su propia cita (sin cambios)
-- La política ya existe y está bien

-- APPOINTMENTS: Cliente ve sus citas (sin cambios)
-- La política ya existe y está bien

-- APPOINTMENTS: Cliente actualiza su cita (sin cambios)
-- La política ya existe y está bien

-- APPOINTMENTS: Admin acceso total (usando función helper)
CREATE POLICY "admin_acceso_total_citas"
ON public.appointments
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Verificar que las políticas estén creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;



