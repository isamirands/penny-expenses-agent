# Script para instalar Tesseract OCR en Windows
# Ejecutar como: .\install_tesseract_windows.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Tesseract OCR - Instalador para Windows" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar si ya está instalado
Write-Host "Verificando si Tesseract ya está instalado..." -ForegroundColor Yellow
try {
    $tesseractVersion = tesseract --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Tesseract ya está instalado:" -ForegroundColor Green
        Write-Host $tesseractVersion[0]
        Write-Host ""
        
        $response = Read-Host "¿Deseas continuar con la reinstalación? (s/N)"
        if ($response -ne "s" -and $response -ne "S") {
            Write-Host "Instalación cancelada." -ForegroundColor Yellow
            exit 0
        }
    }
} catch {
    Write-Host "❌ Tesseract no está instalado." -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Opciones de Instalación" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Descargar manualmente desde GitHub" -ForegroundColor White
Write-Host "   URL: https://github.com/UB-Mannheim/tesseract/wiki" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Instalar con Chocolatey (recomendado si tienes Choco)" -ForegroundColor White
Write-Host "   Comando: choco install tesseract" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Instalar con Scoop" -ForegroundColor White
Write-Host "   Comando: scoop install tesseract" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Selecciona una opción (1/2/3) o Enter para cancelar"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "Abriendo navegador..." -ForegroundColor Yellow
        Start-Process "https://github.com/UB-Mannheim/tesseract/wiki"
        Write-Host ""
        Write-Host "📋 Instrucciones:" -ForegroundColor Cyan
        Write-Host "1. Descarga el instalador (recomendado: tesseract-ocr-w64-setup-5.3.3.20231005.exe)"
        Write-Host "2. Ejecuta el instalador"
        Write-Host "3. Durante la instalación, selecciona 'Additional language data' → Spanish"
        Write-Host "4. Agrega al PATH: C:\Program Files\Tesseract-OCR"
        Write-Host ""
        Write-Host "Después de instalar, cierra y vuelve a abrir PowerShell, y ejecuta:" -ForegroundColor Yellow
        Write-Host "  tesseract --version" -ForegroundColor Green
    }
    
    "2" {
        Write-Host ""
        Write-Host "Verificando Chocolatey..." -ForegroundColor Yellow
        
        try {
            $chocoVersion = choco --version 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Chocolatey encontrado" -ForegroundColor Green
                Write-Host ""
                Write-Host "Instalando Tesseract con Chocolatey..." -ForegroundColor Yellow
                
                choco install tesseract -y
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host ""
                    Write-Host "✅ Tesseract instalado correctamente!" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "Verifica la instalación con:" -ForegroundColor Cyan
                    Write-Host "  tesseract --version" -ForegroundColor Green
                } else {
                    Write-Host "❌ Error durante la instalación" -ForegroundColor Red
                }
            }
        } catch {
            Write-Host "❌ Chocolatey no está instalado" -ForegroundColor Red
            Write-Host ""
            Write-Host "Para instalar Chocolatey, visita: https://chocolatey.org/install" -ForegroundColor Yellow
        }
    }
    
    "3" {
        Write-Host ""
        Write-Host "Verificando Scoop..." -ForegroundColor Yellow
        
        try {
            $scoopVersion = scoop --version 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ Scoop encontrado" -ForegroundColor Green
                Write-Host ""
                Write-Host "Instalando Tesseract con Scoop..." -ForegroundColor Yellow
                
                scoop install tesseract
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host ""
                    Write-Host "✅ Tesseract instalado correctamente!" -ForegroundColor Green
                    Write-Host ""
                    Write-Host "Verifica la instalación con:" -ForegroundColor Cyan
                    Write-Host "  tesseract --version" -ForegroundColor Green
                } else {
                    Write-Host "❌ Error durante la instalación" -ForegroundColor Red
                }
            }
        } catch {
            Write-Host "❌ Scoop no está instalado" -ForegroundColor Red
            Write-Host ""
            Write-Host "Para instalar Scoop, ejecuta:" -ForegroundColor Yellow
            Write-Host "  irm get.scoop.sh | iex" -ForegroundColor Green
        }
    }
    
    default {
        Write-Host "Instalación cancelada." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Siguiente Paso: Instalar Dependencias Python" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Ejecuta:" -ForegroundColor Yellow
Write-Host "  pip install pytesseract Pillow" -ForegroundColor Green
Write-Host ""
Write-Host "Luego prueba el OCR con:" -ForegroundColor Yellow
Write-Host "  python test_tesseract_local.py" -ForegroundColor Green
Write-Host ""


