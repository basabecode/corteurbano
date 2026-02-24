-- ============================================================
-- MEJORAS: Tabla barbers + columnas services + barber_id en appointments
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Tabla de barberos
CREATE TABLE IF NOT EXISTS public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_url TEXT,
  bio TEXT,
  specialty TEXT,
  instagram_handle TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS para barbers
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_active_barbers" ON public.barbers;
CREATE POLICY "public_read_active_barbers" ON public.barbers
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "admin_manages_barbers" ON public.barbers;
CREATE POLICY "admin_manages_barbers" ON public.barbers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. barber_id en appointments (nullable, no rompe datos existentes)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL;

-- 3. Nuevas columnas en services
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS slug TEXT;

-- 4. Generar slugs para servicios existentes (sin tilde, sin espacios)
UPDATE public.services
SET slug = lower(
  replace(replace(replace(replace(replace(replace(replace(replace(
    name,
    ' ', '-'),
    'á', 'a'),
    'é', 'e'),
    'í', 'i'),
    'ó', 'o'),
    'ú', 'u'),
    'ñ', 'n'),
    '+', 'mas'))
WHERE slug IS NULL;

-- Añadir restricción unique en slug (después de generarlos)
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_slug_unique;
ALTER TABLE public.services ADD CONSTRAINT services_slug_unique UNIQUE (slug);

-- 5. Seed inicial de barberos (ajustar nombres reales del negocio)
INSERT INTO public.barbers (name, specialty, bio) VALUES
  ('Carlos', 'Fade clásico', 'Experto en degradados y cortes modernos con 5 años de experiencia.'),
  ('Miguel', 'Diseño de barba', 'Especialista en barba y estilos vintage.')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6. DESCRIPCIONES DE SERVICIOS
-- Inspiradas en el estilo aspiracional de Barber & Co Miami.
-- Edita los textos según la info real del negocio.
-- ============================================================

UPDATE public.services
SET description = 'El punto de partida perfecto para el hombre que valora lo esencial. Nuestro Corte Básico combina técnica precisa con un acabado limpio y profesional. Incluye lavado de cabello, corte a máquina o tijera según tu estilo, y secado final. El servicio ideal para mantener tu look fresco semana a semana sin complicaciones. Cada línea, cada ángulo, trabajado con la misma atención que ponemos en nuestros cortes más elaborados.'
WHERE name = 'Corte Básico' AND (description IS NULL OR description = '');

UPDATE public.services
SET description = 'Una experiencia de afeitado que eleva lo cotidiano a lo extraordinario. Comenzamos con una preparación con toalla tibia para abrir los poros, aplicamos crema de afeitado de alta calidad y trabajamos con navaja o máquina para lograr un acabado impecable. Finaliza con suero hidratante que calma y protege la piel. El Afeitado Express no es solo un servicio, es el ritual de cuidado que todo hombre moderno merece.'
WHERE name = 'Afeitado Express' AND (description IS NULL OR description = '');

UPDATE public.services
SET description = 'Lleva tu look al siguiente nivel. El Corte con Estilo es la elección de quienes no se conforman con lo básico. Nuestros barberos analizan la forma de tu rostro y la textura de tu cabello para diseñar un corte que potencie tu personalidad. Degradados precisos, transiciones suaves, líneas definidas y un estilizado final con productos premium. Sales de la silla con el look que domina cualquier ambiente.'
WHERE name = 'Corte con Estilo' AND (description IS NULL OR description = '');

UPDATE public.services
SET description = 'El combo más completo para el hombre que cuida cada detalle. Combinamos nuestro corte de cabello signature con un completo trabajo de barba: diseño de líneas, delineado, recorte y perfilado a la medida de tu rostro. El resultado es una imagen integrada y trabajada desde la raíz hasta la mandíbula. Incluye lavado, estilizado y productos de acabado. Todo lo que necesitas en una sola visita.'
WHERE name = 'Corte + Barba' AND (description IS NULL OR description = '');

UPDATE public.services
SET description = 'El primer corte de un niño merece un espacio pensado para ellos. Nuestros barberos tienen la paciencia y la técnica para trabajar con los más pequeños, logrando cortes prolijos y modernos adaptados a su edad y personalidad. Un ambiente tranquilo, manos expertas y el resultado que los papás esperan ver. Porque el buen estilo comienza desde temprano.'
WHERE name = 'Corte Niño' AND (description IS NULL OR description = '');

UPDATE public.services
SET description = 'La barba perfecta no es cuestión de suerte, es artesanía. En el Diseño de Barba trabajamos con precisión milimétrica para definir contornos, simetrías y estilos que se adapten a la forma de tu rostro y a tu estilo de vida. Ya sea una barba corta y afilada o una barba larga con carácter, nuestros barberos tienen el ojo y la mano para convertirla en tu mejor accesorio.'
WHERE name = 'Diseño de Barba' AND (description IS NULL OR description = '');

UPDATE public.services
SET description = 'Devuélvele vida, fuerza y brillo a tu cabello con nuestro Tratamiento Capilar especializado. Aplicamos productos de alta concentración que nutren el cuero cabelludo, fortalecen la fibra capilar y combaten el exceso de grasa o resequedad. Un proceso diseñado para quienes tienen cabello debilitado, con caída o simplemente quieren un cabello más saludable. Resultados visibles desde la primera sesión, cuidado real desde adentro.'
WHERE name = 'Tratamiento Capilar' AND (description IS NULL OR description = '');

UPDATE public.services
SET description = 'La experiencia de grooming más completa de BarberKing. Este servicio reúne corte de cabello premium, diseño y recorte de barba, y perfilado de bigote en una sola sesión. Pensado para el hombre que exige precisión en cada detalle de su imagen. Tres servicios, un solo objetivo: que salgas con una presentación impecable de la cabeza al cuello. El estándar más alto que ofrecemos.'
WHERE name = 'Corte + Barba + Bigote' AND (description IS NULL OR description = '');

UPDATE public.services
SET description = 'Transforma tu imagen y da un paso más allá del corte convencional. El pigmento capilar es la solución ideal para disimular entradas, zonas con poca densidad o simplemente para dar un aspecto más uniforme y renovado al cabello. Aplicamos pigmentos de calidad que se integran naturalmente con tu color de cabello, generando una apariencia más joven y definida. Resultados naturales, discreción total, impacto inmediato.'
WHERE name = 'Pigmento en Cabello' AND (description IS NULL OR description = '');

-- Verificación
SELECT 'barbers table' AS check, COUNT(*) AS rows FROM public.barbers;
SELECT 'services with slug' AS check, COUNT(*) AS rows FROM public.services WHERE slug IS NOT NULL;
SELECT 'services with description' AS check, COUNT(*) AS rows FROM public.services WHERE description IS NOT NULL;
SELECT 'appointments barber_id col' AS check, column_name FROM information_schema.columns
  WHERE table_name = 'appointments' AND column_name = 'barber_id';
