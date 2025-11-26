# 🔧 Corrección de Políticas RLS - Recursión Infinita

## ❌ Problema Detectado

El test de conexión reveló un error crítico:

```
infinite recursion detected in policy for relation "profiles"
```

### Causa del Problema

Las políticas RLS originales tenían una **recursión infinita**:

```sql
-- ❌ POLÍTICA PROBLEMÁTICA
CREATE POLICY "perfil propio o admin"
ON public.profiles
FOR SELECT USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.role = 'admin'  -- ⚠️ Esto causa recursión
  )
);
```

**¿Por qué es recursión?**
- Para leer `profiles`, necesita pasar la política
- La política verifica si el usuario es admin consultando `profiles`
- Para consultar `profiles`, necesita pasar la política...
- **Bucle infinito** 🔄

## ✅ Solución

Se creó una **función helper con `SECURITY DEFINER`** que evita la recursión:

```sql
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER  -- ⚠️ Clave: ejecuta con permisos del creador, no del usuario
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = user_id 
    AND role = 'admin'
  );
$$;
```

**¿Por qué funciona?**
- `SECURITY DEFINER` ejecuta la función con permisos del creador (superusuario)
- Bypasea las políticas RLS dentro de la función
- Evita la recursión infinita

## 🚀 Cómo Aplicar la Corrección

### Paso 1: Ejecutar Script de Corrección

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Navega a **SQL Editor**
3. Copia y pega el contenido de `docs/FIX_RLS_POLICIES.sql`
4. Haz clic en **Run** o presiona `Ctrl+Enter`
5. Verifica que no haya errores

### Paso 2: Verificar Corrección

Ejecuta el test nuevamente:

```bash
node test-supabase.js
```

Deberías ver:
```
✅ Conexión exitosa
✅ Tabla 'profiles' existe
✅ Tabla 'services' existe
✅ Tabla 'appointments' existe
✅ Políticas RLS configuradas correctamente
```

## 📋 Políticas Corregidas

### Profiles
- ✅ `perfil_propio_visible` - Usuario ve su propio perfil
- ✅ `admin_ve_todos_perfiles` - Admin ve todos los perfiles (usando función helper)
- ✅ `usuario_actualiza_perfil_propio` - Usuario actualiza su perfil

### Services
- ✅ `servicios_visibles` - Lectura pública (sin cambios)
- ✅ `admin_gestiona_servicios` - Admin gestiona servicios (usando función helper)

### Appointments
- ✅ `cliente_crea_cita_propia` - Cliente crea su cita (sin cambios)
- ✅ `cliente_ve_sus_citas` - Cliente ve sus citas (sin cambios)
- ✅ `cliente_actualiza_su_cita` - Cliente actualiza su cita (sin cambios)
- ✅ `admin_acceso_total_citas` - Admin acceso total (usando función helper)

## 🔍 Verificación Manual

Puedes verificar las políticas ejecutando:

```sql
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
```

## ⚠️ Notas Importantes

1. **SECURITY DEFINER es poderoso:**
   - La función `is_admin()` se ejecuta con permisos de superusuario
   - Solo debe usarse para verificaciones simples
   - No debe exponer datos sensibles

2. **Performance:**
   - La función es `STABLE`, lo que permite optimizaciones
   - PostgreSQL puede cachear resultados dentro de una transacción

3. **Seguridad:**
   - Las políticas siguen siendo seguras
   - Solo los admins pueden ver todos los perfiles
   - Los clientes solo ven sus propios datos

---

**¿Sigue fallando?** 
- Verifica que ejecutaste el script completo
- Revisa los logs de Supabase para más detalles
- Asegúrate de que la función `is_admin` se creó correctamente



