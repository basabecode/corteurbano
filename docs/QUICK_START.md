# 🚀 Guía de Inicio Rápido - BarberKing

Esta guía te ayudará a poner en marcha BarberKing en menos de 10 minutos.

## ⚡ Pasos Rápidos

### 1. Instalar Dependencias

```bash
npm install
```

**Nota:** Si `npm` no está disponible, asegúrate de tener Node.js instalado. Descarga desde [nodejs.org](https://nodejs.org).

### 2. Configurar Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```bash
# Copia el ejemplo
cp .env.example .env.local
```

Luego edita `.env.local` con tus credenciales reales.

### 3. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor**
3. Ejecuta el script completo de `docs/SETUP_DATABASE.md`
4. Inserta servicios de ejemplo (incluido en el script)

### 4. Configurar Telegram Bot

1. Abre Telegram y busca [@BotFather](https://t.me/BotFather)
2. Envía `/newbot` y sigue las instrucciones
3. Copia el token que te da
4. Busca [@userinfobot](https://t.me/userinfobot) para obtener tu Chat ID
5. Agrega ambos valores a `.env.local`

### 5. Ejecutar el Proyecto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## ✅ Verificación Rápida

### ¿Funciona la página principal?
- Deberías ver el Hero con diseño Dark Luxury
- Los servicios deberían aparecer (aunque sean mocks si no configuraste BD)

### ¿Funciona la autenticación?
- Visita `/login`
- Intenta registrarte con un email
- Deberías poder iniciar sesión

### ¿Funciona el dashboard?
- Después de login, visita `/dashboard/customer`
- Deberías ver tu dashboard (vacío si no hay citas)

## 🐛 Problemas Comunes

### "npm no se reconoce"
- Instala Node.js desde [nodejs.org](https://nodejs.org)
- Reinicia tu terminal después de instalar

### Error de conexión a Supabase
- Verifica que las variables de entorno estén correctas
- Asegúrate de que el proyecto de Supabase esté activo

### No aparecen servicios
- Ejecuta el script SQL de `docs/SETUP_DATABASE.md`
- Verifica que hayas insertado servicios de ejemplo

### Telegram no funciona
- Verifica que el bot token sea correcto
- Asegúrate de que el webhook esté configurado (solo necesario en producción)

## 📚 Próximos Pasos

1. Lee el [README.md](../README.md) completo
2. Revisa [PENDIENTES.md](PENDIENTES.md) para mejoras futuras
3. Personaliza los servicios y precios en Supabase
4. Configura el webhook de Telegram para producción

---

**¿Todo funcionando?** ¡Excelente! Ahora puedes personalizar y desplegar tu aplicación.






