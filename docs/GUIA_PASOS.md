# 🚀 GUÍA DE PASOS PARA COMPLETAR EL PROYECTO

**Proyecto:** BarberKing - Sistema de Agendamiento  
**Estado actual:** ✅ Build exitoso, listo para configuración  
**Tiempo estimado total:** 1.5 horas

---

## 📋 PASO 1: CONFIGURAR BASE DE DATOS EN SUPABASE
**Tiempo:** 30 minutos  
**Prioridad:** 🔴 CRÍTICA

### 1.1 Acceder a Supabase
1. Abre tu navegador
2. Ve a [https://supabase.com](https://supabase.com)
3. Inicia sesión con tu cuenta
4. Abre tu proyecto o crea uno nuevo

### 1.2 Ejecutar Script SQL
1. En el panel izquierdo, haz clic en **SQL Editor**
2. Haz clic en **New Query**
3. Abre el archivo `docs/SETUP_DATABASE.md` en tu editor
4. Copia TODO el contenido del script SQL
5. Pégalo en el SQL Editor de Supabase
6. Haz clic en **Run** (o presiona Ctrl+Enter)
7. Verifica que aparezca: ✅ "Success. No rows returned"

### 1.3 Verificar Tablas Creadas
1. En el panel izquierdo, haz clic en **Table Editor**
2. Deberías ver estas tablas:
   - ✅ `profiles`
   - ✅ `services`
   - ✅ `appointments`

### 1.4 Insertar Servicios de Ejemplo
1. Vuelve al **SQL Editor**
2. Crea una nueva query
3. Copia y pega este script:

```sql
-- Insertar servicios de ejemplo
INSERT INTO services (name, description, price, duration_minutes) VALUES
  ('Corte Clásico', 'Corte tradicional con tijera y máquina', 25.00, 30),
  ('Corte + Barba', 'Corte completo más arreglo de barba', 40.00, 45),
  ('Afeitado Premium', 'Afeitado con navaja y toalla caliente', 30.00, 30),
  ('Corte Niño', 'Corte especial para niños', 18.00, 25),
  ('Diseño de Barba', 'Diseño y perfilado de barba', 20.00, 25),
  ('Tratamiento Capilar', 'Tratamiento premium para el cabello', 35.00, 40);
```

4. Haz clic en **Run**
5. Verifica que se insertaron correctamente:

```sql
SELECT * FROM services;
```

**✅ Checkpoint:** Deberías ver 6 servicios en la tabla.

---

## 📋 PASO 2: OBTENER Y CONFIGURAR CREDENCIALES
**Tiempo:** 15 minutos  
**Prioridad:** 🔴 CRÍTICA

### 2.1 Obtener Credenciales de Supabase
1. En Supabase, haz clic en el ícono de **Settings** (⚙️)
2. Haz clic en **API**
3. Copia los siguientes valores:

**Project URL:**
```
https://xxxxxxxxxx.supabase.co
```
→ Esta es tu `NEXT_PUBLIC_SUPABASE_URL`

**anon/public key:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
→ Esta es tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**service_role key:** (⚠️ Haz clic en "Reveal" para verla)
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
→ Esta es tu `SUPABASE_SERVICE_ROLE_KEY`

### 2.2 Actualizar .env.local
1. Abre el archivo `.env.local` en tu proyecto
2. Actualiza los valores:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Telegram (dejar por ahora, configuraremos después)
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
```

3. Guarda el archivo

**✅ Checkpoint:** Archivo `.env.local` actualizado con credenciales de Supabase.

---

## 📋 PASO 3: PROBAR LA APLICACIÓN EN DESARROLLO
**Tiempo:** 10 minutos  
**Prioridad:** 🟡 ALTA

### 3.1 Iniciar Servidor de Desarrollo
1. Abre PowerShell en la carpeta del proyecto
2. Ejecuta:

```bash
pnpm run dev
```

3. Espera a que aparezca:
```
✓ Ready in 2.5s
○ Local:   http://localhost:3000
```

### 3.2 Probar Página Principal
1. Abre tu navegador
2. Ve a [http://localhost:3000](http://localhost:3000)
3. Deberías ver:
   - ✅ Página principal con diseño oscuro
   - ✅ Sección de servicios
   - ✅ Botón "Reservar Cita"

### 3.3 Verificar Servicios
1. En la página principal, desplázate hacia abajo
2. Deberías ver los 6 servicios que insertaste
3. Cada servicio debe mostrar:
   - Nombre
   - Descripción
   - Precio
   - Duración

**✅ Checkpoint:** La aplicación corre sin errores y muestra los servicios.

---

## 📋 PASO 4: CREAR CUENTA Y PERFIL DE ADMIN
**Tiempo:** 10 minutos  
**Prioridad:** 🟡 ALTA

### 4.1 Registrar Usuario
1. En la aplicación, haz clic en **Login** o ve a [http://localhost:3000/login](http://localhost:3000/login)
2. Haz clic en **Registrarse**
3. Completa el formulario:
   - Email: tu-email@ejemplo.com
   - Contraseña: (mínimo 6 caracteres)
   - Nombre completo: Tu Nombre
4. Haz clic en **Registrarse**

### 4.2 Verificar Email (si está habilitado)
1. Revisa tu correo
2. Si recibiste un email de confirmación, haz clic en el enlace
3. Si no, continúa (la verificación puede estar deshabilitada)

### 4.3 Obtener tu User ID
1. Ve a Supabase Dashboard
2. Haz clic en **Authentication** → **Users**
3. Busca tu email en la lista
4. Copia el **ID** (UUID largo)

Ejemplo:
```
a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

### 4.4 Convertir Usuario en Admin
1. Ve al **SQL Editor** en Supabase
2. Ejecuta esta query (reemplaza con tu ID):

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

3. Verifica que se actualizó:

```sql
SELECT id, full_name, role FROM profiles;
```

**✅ Checkpoint:** Tu usuario ahora tiene rol de 'admin'.

---

## 📋 PASO 5: PROBAR DASHBOARDS
**Tiempo:** 10 minutos  
**Prioridad:** 🟡 ALTA

### 5.1 Probar Dashboard de Admin
1. En la aplicación, inicia sesión con tu cuenta
2. Ve a [http://localhost:3000/admin](http://localhost:3000/admin)
3. Deberías ver:
   - ✅ Panel del Administrador
   - ✅ Estadísticas (Ingresos, Citas pendientes, Confirmadas)
   - ✅ Listado de citas (vacío por ahora)

### 5.2 Crear una Cita de Prueba
1. Cierra sesión (o abre una ventana de incógnito)
2. Registra otro usuario (será un cliente)
3. En la página principal, haz clic en **Reservar Cita**
4. Selecciona:
   - Servicio: Corte Clásico
   - Fecha: Mañana
   - Hora: 10:00 AM
5. Haz clic en **Confirmar Reserva**

### 5.3 Verificar en Dashboard Admin
1. Vuelve a tu cuenta de admin
2. Recarga el dashboard de admin
3. Deberías ver:
   - ✅ La cita aparece en "Listado de Citas"
   - ✅ Estado: "Pendiente"
   - ✅ Información del cliente y servicio

**✅ Checkpoint:** El sistema de citas funciona correctamente.

---

## 📋 PASO 6: CONFIGURAR TELEGRAM BOT (OPCIONAL)
**Tiempo:** 15 minutos  
**Prioridad:** 🟢 MEDIA

### 6.1 Crear Bot de Telegram
1. Abre Telegram
2. Busca **@BotFather**
3. Envía: `/newbot`
4. Sigue las instrucciones:
   - Nombre del bot: BarberKing Bot
   - Username: barberking_tu_nombre_bot
5. Copia el **token** que te da

Ejemplo:
```
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
```

### 6.2 Obtener tu Chat ID
1. Busca **@userinfobot** en Telegram
2. Envía: `/start`
3. Copia tu **ID**

Ejemplo:
```
123456789
```

### 6.3 Actualizar .env.local
1. Abre `.env.local`
2. Actualiza:

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
TELEGRAM_ADMIN_CHAT_ID=123456789
```

3. Guarda el archivo
4. Reinicia el servidor de desarrollo (Ctrl+C y luego `pnpm run dev`)

### 6.4 Probar Notificaciones
1. Como cliente, crea una nueva cita
2. Deberías recibir un mensaje en Telegram con:
   - ✅ Información de la cita
   - ✅ Botones para Aceptar/Rechazar

**✅ Checkpoint:** Telegram bot funciona y envía notificaciones.

---

## 📋 PASO 7: DEPLOY A PRODUCCIÓN (VERCEL)
**Tiempo:** 20 minutos  
**Prioridad:** 🟢 MEDIA

### 7.1 Preparar Repositorio Git
1. Si no tienes Git inicializado:

```bash
git init
git add .
git commit -m "Initial commit - BarberKing"
```

2. Crea un repositorio en GitHub
3. Sube el código:

```bash
git remote add origin https://github.com/tu-usuario/barberking.git
git branch -M main
git push -u origin main
```

### 7.2 Deploy en Vercel
1. Ve a [https://vercel.com](https://vercel.com)
2. Inicia sesión con GitHub
3. Haz clic en **New Project**
4. Selecciona tu repositorio `barberking`
5. Haz clic en **Import**

### 7.3 Configurar Variables de Entorno
1. En la sección **Environment Variables**, agrega:

```
NEXT_PUBLIC_SUPABASE_URL = https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
TELEGRAM_BOT_TOKEN = 1234567890:ABCdefGHIjklMNOpqrsTUVwxyz1234567890
TELEGRAM_ADMIN_CHAT_ID = 123456789
```

2. Haz clic en **Deploy**
3. Espera 2-3 minutos

### 7.4 Configurar Webhook de Telegram
1. Copia la URL de tu proyecto en Vercel:
```
https://barberking-tu-proyecto.vercel.app
```

2. En PowerShell, ejecuta (reemplaza con tus valores):

```bash
curl -X POST "https://api.telegram.org/bot<TU_BOT_TOKEN>/setWebhook" -d "url=https://barberking-tu-proyecto.vercel.app/api/telegram-webhook"
```

3. Deberías recibir:
```json
{"ok":true,"result":true,"description":"Webhook was set"}
```

**✅ Checkpoint:** Aplicación desplegada y funcionando en producción.

---

## 🎊 VERIFICACIÓN FINAL

### Checklist Completo
- [ ] ✅ Base de datos configurada en Supabase
- [ ] ✅ Servicios insertados
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Aplicación corre en desarrollo
- [ ] ✅ Perfil de admin creado
- [ ] ✅ Dashboard admin funciona
- [ ] ✅ Sistema de citas funciona
- [ ] ✅ Telegram bot configurado (opcional)
- [ ] ✅ Aplicación desplegada en Vercel (opcional)
- [ ] ✅ Webhook de Telegram configurado (opcional)

### Pruebas Finales
1. **Como Cliente:**
   - [ ] Registrarse
   - [ ] Ver servicios
   - [ ] Crear cita
   - [ ] Ver mis citas

2. **Como Admin:**
   - [ ] Ver dashboard
   - [ ] Ver estadísticas
   - [ ] Ver lista de citas
   - [ ] Aprobar/rechazar citas
   - [ ] Recibir notificaciones en Telegram

---

## 🆘 SOLUCIÓN DE PROBLEMAS

### Error: "No autorizado"
**Solución:** Verifica que las credenciales de Supabase en `.env.local` sean correctas.

### Error: "Cannot connect to database"
**Solución:** 
1. Verifica que ejecutaste el script SQL completo
2. Verifica las políticas RLS en Supabase

### Telegram no envía mensajes
**Solución:**
1. Verifica que `TELEGRAM_BOT_TOKEN` sea correcto
2. Verifica que el webhook esté configurado
3. Ejecuta: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`

### Build falla en Vercel
**Solución:**
1. Verifica que todas las variables de entorno estén configuradas
2. Revisa los logs de build en Vercel
3. Asegúrate de que el código esté en la rama `main`

---

## 📞 RECURSOS ADICIONALES

### Documentación
- [README.md](../README.md) - Guía completa
- [ANALISIS_Y_PLAN.md](ANALISIS_Y_PLAN.md) - Análisis detallado
- [RESUMEN_EJECUTIVO.md](RESUMEN_EJECUTIVO.md) - Estado actual

### Enlaces Útiles
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Vercel Docs](https://vercel.com/docs)

---

## ✅ CONCLUSIÓN

Siguiendo estos pasos en orden, tendrás el sistema **BarberKing** completamente funcional en aproximadamente **1.5 horas**.

**¡Éxito con tu proyecto!** 🎉

---

**Última actualización:** 27 de Noviembre, 2025
