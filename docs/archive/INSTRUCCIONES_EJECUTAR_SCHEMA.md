# 🗄️ Instrucciones para Configurar appointments_history en Supabase

## ⚠️ IMPORTANTE: Leer antes de ejecutar

Este es el esquema SQL **definitivo y correcto** para la tabla `appointments_history`.

---

## 📋 Pasos a Seguir

### **Paso 1: Abrir Supabase SQL Editor**

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. En el menú izquierdo, haz clic en **"SQL Editor"**
3. Haz clic en **"New Query"**

### **Paso 2: Copiar y Pegar el Script**

1. Abre el archivo: `docs/sql/SCHEMA_APPOINTMENTS_HISTORY_FINAL.sql`
2. **Copia TODO el contenido** del archivo
3. **Pégalo** en el SQL Editor de Supabase

### **Paso 3: Ejecutar el Script**

1. Presiona el botón **"Run"** (o Ctrl+Enter)
2. Espera a que termine la ejecución
3. Deberías ver mensajes de éxito

### **Paso 4: Verificar la Tabla**

El mismo script mostrará al final:
- Cantidad de registros existentes
- Últi cita archivada
- Políticas RLS configuradas

---

## ✅ Resultado Esperado

Deberías ver algo como:

```
Success. No rows returned
```

Y al final, dos tablas de resultados:
1. **Verificación de tabla** con columnas: `tabla`, `registros_existentes`, `ultima_archivada`
2. **Políticas RLS** mostrando 3 políticas:
   - `admin_gestiona_historial`
   - `admin_ve_historial`
   - `cliente_ve_su_historial`

---

## 🔧 Estructura de la Tabla Creada

```sql
appointments_history
├── id (UUID)
├── original_appointment_id (UUID)
├── client_id (UUID) → references profiles
├── service_id (UUID) → references services
├── start_time (TIMESTAMPTZ)
├── end_time (TIMESTAMPTZ)
├── status (TEXT) → 'completed' | 'cancelled'
├── cancellation_reason (TEXT)
├── archived_at (TIMESTAMPTZ)
├── created_at (TIMESTAMPTZ)
├── service_name (TEXT)
├── service_price (NUMERIC)
├── service_duration_minutes (INTEGER)
├── client_name (TEXT)
├── client_phone (TEXT)
└── client_email (TEXT)
```

---

## 🔒 Políticas de Seguridad (RLS)

### Para Administradores:
- ✅ Pueden **ver** todo el historial
- ✅ Pueden **insertar, actualizar, eliminar** registros

### Para Clientes:
- ✅ Solo pueden **ver** su propio historial (`client_id = auth.uid()`)
- ❌ **NO** pueden insertar directamente (solo a través de la API)

---

## 🚨 Notas IMPORTANTES

### **Si la tabla YA EXISTE:**

El script tiene esta línea comentada (línea 25-26):
```sql
-- DROP TABLE IF EXISTS public.appointments_history CASCADE;
```

**Si quieres eliminar la tabla existente y empezar de cero:**
1. Descomenta esa línea (quita los `--`)
2. ⚠️ **ADVERTENCIA**: Esto borrará TODOS los datos existentes
3. Ejecuta el script

**Si quieres mantener los datos existentes:**
1. **NO** descomentes esa línea
2. El script usará `CREATE TABLE IF NOT EXISTS` (no la recreará)
3. Solo agregará las políticas RLS si no existen

---

## 🧪 Probar Después de Ejecutar

Una vez ejecutado el script:

1. **Desde el panel del cliente:**
   - Selecciona citas completadas
   - Presiona "Archivar"
   - Confirma en el modal
   - ✅ **NO debería aparecer error 500**
   - ✅ Las citas deben desaparecer del dashboard
   - ✅ Deben aparecer en `/dashboard/customer/historial`

2. **Verificar en Supabase:**
   - Ve a **"Table Editor"** → **"appointments_history"**
   - Deberías ver las citas archivadas

---

## ❓ Solución de Problemas

### Error: "relation already exists"
**Causa:** La tabla ya existe  
**Solución:** El script continuará sin problemas (usa `IF NOT EXISTS`)

### Error: "column does not exist"
**Causa:** Intentaste ejecutar un script antiguo  
**Solución:** Ejecuta `SCHEMA_APPOINTMENTS_HISTORY_FINAL.sql` completo

### Error: "function is_admin does not exist"
**Causa:** La función auxiliar no existe  
**Solución:** El script la crea automáticamente (líneas 11-21)

---

## 📞 Después de Ejecutar

**Avísame cuando hayas ejecutado el script y te diré si hubo algún problema o si todo está correcto.**

Luego podremos probar el archivado de citas en el navegador.

---

**Archivo SQL a ejecutar:** `docs/sql/SCHEMA_APPOINTMENTS_HISTORY_FINAL.sql`  
**Versión:** Final - 5 de Diciembre 2024  
**Estado:** ✅ Listo para ejecutar
