# 📦 Guía de Instalación - BarberKing

Esta guía te ayudará a instalar todas las dependencias necesarias para BarberKing.

## 🔧 Prerrequisitos

### 1. Instalar Node.js

BarberKing requiere **Node.js 18 o superior**.

1. Ve a [nodejs.org](https://nodejs.org/)
2. Descarga la versión LTS (Long Term Support)
3. Ejecuta el instalador
4. **Reinicia tu terminal/PowerShell** después de instalar

**Verificar instalación:**
```bash
node --version
npm --version
```

Deberías ver algo como:
```
v20.10.0
10.2.3
```

## 📥 Instalación de Dependencias

### Opción 1: Con pnpm (Recomendado) ⭐

`pnpm` es más rápido y eficiente que npm.

#### Instalar pnpm globalmente:
```bash
npm install -g pnpm
```

#### Instalar dependencias del proyecto:
```bash
pnpm install
```

### Opción 2: Con npm

Si prefieres usar npm (viene con Node.js):

```bash
npm install
```

### Opción 3: Scripts Automáticos

He creado scripts que automatizan el proceso:

**En PowerShell:**
```powershell
.\install.ps1
```

**En CMD (Windows):**
```cmd
install.bat
```

Estos scripts:
- ✅ Verifican que Node.js esté instalado
- ✅ Instalan pnpm si no está disponible
- ✅ Instalan todas las dependencias del proyecto

## ✅ Verificación

Después de instalar, verifica que todo esté correcto:

```bash
# Verificar que las dependencias estén instaladas
ls node_modules  # Debería mostrar muchas carpetas

# Verificar scripts disponibles
pnpm run        # o npm run
```

Deberías ver:
- `dev` - Servidor de desarrollo
- `build` - Build de producción
- `start` - Servidor de producción
- `lint` - Ejecutar linter

## 🐛 Problemas Comunes

### Error: "npm no se reconoce"

**Causa:** Node.js no está instalado o no está en el PATH.

**Solución:**
1. Instala Node.js desde [nodejs.org](https://nodejs.org/)
2. Reinicia completamente tu terminal/PowerShell
3. Verifica con `node --version`

### Error: "pnpm no se reconoce"

**Causa:** pnpm no está instalado globalmente.

**Solución:**
```bash
npm install -g pnpm
```

O usa npm directamente:
```bash
npm install
```

### Error: "EACCES: permission denied"

**Causa:** Problemas de permisos al instalar paquetes globales.

**Solución (Windows):**
- Ejecuta PowerShell/CMD como Administrador
- O instala pnpm sin `-g` (solo para este proyecto)

### Error: "ERR_PNPM_NO_MATCHING_VERSION"

**Causa:** Versión de Node.js incompatible.

**Solución:**
- Actualiza Node.js a la versión 18 o superior
- Usa `nvm` (Node Version Manager) para gestionar versiones

### Error: "Cannot find module"

**Causa:** Dependencias no instaladas correctamente.

**Solución:**
```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules  # Linux/Mac
rmdir /s node_modules  # Windows CMD
Remove-Item -Recurse -Force node_modules  # PowerShell

# Reinstalar
pnpm install  # o npm install
```

## 📊 Tiempo Estimado

- Instalación de Node.js: 5-10 minutos
- Instalación de pnpm: 1 minuto
- Instalación de dependencias: 2-5 minutos (depende de tu conexión)

**Total: ~10-15 minutos**

## 🎯 Próximos Pasos

Una vez instaladas las dependencias:

1. ✅ Configura las variables de entorno (`.env.local`)
2. ✅ Configura la base de datos en Supabase
3. ✅ Ejecuta `pnpm run dev` o `npm run dev`
4. ✅ Visita `http://localhost:3000`

---

**¿Tienes problemas?** Revisa la sección de Troubleshooting o abre un issue.






