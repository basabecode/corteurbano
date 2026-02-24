# Script de instalación para Corte Urbano
# Este script instala pnpm y luego las dependencias del proyecto

Write-Host "🚀 Instalando dependencias para Corte Urbano..." -ForegroundColor Cyan

# Verificar si Node.js está instalado
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js no está instalado o no está en el PATH" -ForegroundColor Red
    Write-Host "Por favor, instala Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Después de instalar, reinicia PowerShell y ejecuta este script nuevamente." -ForegroundColor Yellow
    exit 1
}

# Verificar si pnpm está instalado
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm encontrado: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "📦 Instalando pnpm globalmente..." -ForegroundColor Yellow
    try {
        npm install -g pnpm
        Write-Host "✅ pnpm instalado correctamente" -ForegroundColor Green
    } catch {
        Write-Host "❌ Error al instalar pnpm. Intentando con npm..." -ForegroundColor Red
        Write-Host "Instalando dependencias con npm..." -ForegroundColor Yellow
        npm install
        exit 0
    }
}

# Instalar dependencias del proyecto
Write-Host "📦 Instalando dependencias del proyecto con pnpm..." -ForegroundColor Yellow
try {
    pnpm install
    Write-Host "✅ Dependencias instaladas correctamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎉 ¡Instalación completada!" -ForegroundColor Cyan
    Write-Host "Ejecuta 'pnpm run dev' para iniciar el servidor de desarrollo" -ForegroundColor Yellow
} catch {
    Write-Host "❌ Error al instalar dependencias" -ForegroundColor Red
    Write-Host "Intenta ejecutar manualmente: pnpm install" -ForegroundColor Yellow
    exit 1
}






