# Script para probar la conexión a Google Sheets (PowerShell)
# Ejecuta: .\test_google_connection.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "🔍 Verificando configuración de Google Sheets..." -ForegroundColor Cyan
Write-Host ""

# Paso 1: Verificar Python
Write-Host "1️⃣ Verificando Python..." -ForegroundColor Yellow
try {
    $pythonVersion = python --version 2>&1
    Write-Host "   ✅ $pythonVersion instalado" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "   ❌ Error: Python no está instalado" -ForegroundColor Red
    Write-Host "   Descarga Python desde: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Paso 2: Verificar librerías
Write-Host "2️⃣ Verificando librerías de Google..." -ForegroundColor Yellow
$needsInstall = $false

try {
    python -c "from google.oauth2 import service_account" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { $needsInstall = $true }
} catch {
    $needsInstall = $true
}

if ($needsInstall) {
    Write-Host "   ⚠️  Faltan librerías de Google" -ForegroundColor Yellow
    Write-Host "   📦 Instalando librerías necesarias..." -ForegroundColor Yellow
    Write-Host ""
    
    pip install google-api-python-client google-auth google-auth-httplib2 google-auth-oauthlib
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "   ❌ Error al instalar librerías" -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
    Write-Host "   ✅ Librerías instaladas correctamente" -ForegroundColor Green
} else {
    Write-Host "   ✅ Librerías ya instaladas" -ForegroundColor Green
}
Write-Host ""

# Paso 3: Ejecutar el script Python
Write-Host "3️⃣ Ejecutando prueba de conexión..." -ForegroundColor Yellow
Write-Host ""

# Verificar si existe el script Python
$scriptPath = Join-Path $PSScriptRoot "test_google_connection.py"

if (-not (Test-Path $scriptPath)) {
    Write-Host "   ❌ Error: No se encontró test_google_connection.py" -ForegroundColor Red
    Write-Host "   Ruta esperada: $scriptPath" -ForegroundColor Yellow
    exit 1
}

# Ejecutar el script Python
python $scriptPath

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "="*70 -ForegroundColor Green
    Write-Host "🎉 ¡Prueba completada exitosamente!" -ForegroundColor Green
    Write-Host "="*70 -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "❌ La prueba falló. Revisa los errores arriba." -ForegroundColor Red
    Write-Host ""
    exit 1
}

