@echo off
echo 🚀 Instalando dependencias para Corte Urbano...

REM Verificar si Node.js está instalado
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado o no está en el PATH
    echo Por favor, instala Node.js desde: https://nodejs.org/
    echo Después de instalar, reinicia la terminal y ejecuta este script nuevamente.
    pause
    exit /b 1
)

echo ✅ Node.js encontrado

REM Verificar si pnpm está instalado
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo 📦 Instalando pnpm globalmente...
    call npm install -g pnpm
    if %errorlevel% neq 0 (
        echo ❌ Error al instalar pnpm. Intentando con npm...
        echo Instalando dependencias con npm...
        call npm install
        pause
        exit /b 0
    )
    echo ✅ pnpm instalado correctamente
)

REM Instalar dependencias del proyecto
echo 📦 Instalando dependencias del proyecto con pnpm...
call pnpm install
if %errorlevel% neq 0 (
    echo ❌ Error al instalar dependencias
    echo Intenta ejecutar manualmente: pnpm install
    pause
    exit /b 1
)

echo.
echo ✅ Dependencias instaladas correctamente!
echo.
echo 🎉 ¡Instalación completada!
echo Ejecuta 'pnpm run dev' para iniciar el servidor de desarrollo
pause






