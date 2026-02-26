-- Migración: Rol Barbero
-- Fecha: 2026-02-25
-- Ejecutar en: Supabase Dashboard → SQL Editor

-- 1. Ampliar CHECK constraint de profiles.role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'customer', 'barber'));

-- 2. Agregar profile_id a barbers (admin vincula manualmente)
ALTER TABLE public.barbers ADD COLUMN IF NOT EXISTS profile_id UUID
  REFERENCES public.profiles(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_barbers_profile_id ON public.barbers(profile_id);

-- 3. RLS: barbero puede leer su propio row en barbers
DROP POLICY IF EXISTS "barber_reads_own_row" ON public.barbers;
CREATE POLICY "barber_reads_own_row" ON public.barbers
  FOR SELECT USING (profile_id = auth.uid());

-- 4. Helper function para RLS en appointments
CREATE OR REPLACE FUNCTION public.get_barber_id_for_user(user_id UUID)
RETURNS UUID LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id FROM public.barbers WHERE profile_id = user_id LIMIT 1;
$$;

-- 5. RLS: barbero puede ver sus propias citas
DROP POLICY IF EXISTS "barber_reads_own_appointments" ON public.appointments;
CREATE POLICY "barber_reads_own_appointments" ON public.appointments
  FOR SELECT USING (barber_id = public.get_barber_id_for_user(auth.uid()));

-- Verificación (ejecutar por separado para confirmar)
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'barbers' AND column_name = 'profile_id';
-- SELECT conname, consrc FROM pg_constraint WHERE conname = 'profiles_role_check';
