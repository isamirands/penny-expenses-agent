@echo off
REM Script para probar la conexion a Google Sheets (Windows Batch)
REM Doble-click en este archivo para ejecutar

echo.
echo ========================================
echo   Test de Conexion a Google Sheets
echo ========================================
echo.

REM Verificar Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no esta instalado
    echo.
    echo Descarga Python desde: https://www.python.org/downloads/
    echo IMPORTANTE: Marca "Add Python to PATH" durante la instalacion
    pause
    exit /b 1
)

echo [OK] Python instalado
echo.

REM Instalar librerias si no estan
echo Verificando librerias de Google...
python -c "from google.oauth2 import service_account" 2>nul
if errorlevel 1 (
    echo.
    echo [INFO] Instalando librerias de Google...
    echo.
    pip install google-api-python-client google-auth google-auth-httplib2 google-auth-oauthlib
    if errorlevel 1 (
        echo.
        echo [ERROR] Fallo la instalacion de librerias
        pause
        exit /b 1
    )
)

echo [OK] Librerias instaladas
echo.
echo.

REM Ejecutar el script de prueba
python test_google_connection.py

echo.
echo.
echo ========================================
echo   Test completado
echo ========================================
echo.
pause

