# 🛠️ Tools - Herramientas de Utilidad

Este directorio contiene scripts y herramientas para facilitar la configuración y testing del sistema.

## 🪟 Para Usuarios de Windows

**⭐ EMPIEZA AQUÍ:** `INICIO_WINDOWS.md` - Guía completa para Windows

```powershell
# Abre la guía de inicio rápido
notepad INICIO_WINDOWS.md
```

## 📁 Archivos

### 📄 `INICIO_WINDOWS.md` ⭐
Guía de inicio rápido para Windows. **Empieza aquí si usas Windows.**

### 📄 `SETUP_GOOGLE_WINDOWS.md`
Guía detallada para configurar Google Sheets en Windows (10 minutos).

### 🐍 `test_google_connection.py`
Script interactivo para probar la conexión a Google Sheets.

**Uso en Windows:**
```powershell
# 1. Instalar dependencias
pip install google-api-python-client google-auth

# 2. Ejecutar script
python test_google_connection.py
```

### 🪟 `test_google_connection.ps1`
Wrapper de PowerShell para Windows que ejecuta el test automáticamente.

**Uso:**
```powershell
.\test_google_connection.ps1
```

**Qué hace:**
- ✅ Verifica que las librerías estén instaladas
- ✅ Valida el archivo JSON del Service Account
- ✅ Prueba la conexión a Google Sheets API
- ✅ Verifica permisos de acceso al Sheet
- ✅ Opcionalmente escribe datos de prueba

**Ejemplo de salida:**
```
🔍 Verificando configuración de Google Sheets...

1️⃣ Verificando librerías de Google...
   ✅ Librerías de Google instaladas correctamente

2️⃣ Cargando credenciales del Service Account...
   📁 Archivos JSON encontrados:
      1. penny-expenses-123456.json
   ✅ Usando: penny-expenses-123456.json

3️⃣ Validando credenciales...
   ✅ Service Account válido
   📧 Email: penny-expense-processor@penny-expenses.iam.gserviceaccount.com
   🏗️  Proyecto: penny-expenses

4️⃣ Creando credenciales de autenticación...
   ✅ Credenciales creadas correctamente

5️⃣ Configurando Google Sheet...
   Ingresa el ID de tu Google Sheet: 1A2B3C4D5E6F7G8H

6️⃣ Conectando a Google Sheets API...
   ✅ Conexión establecida

7️⃣ Probando acceso al Sheet...
   ✅ Acceso exitoso!
   📊 Título: Penny Expenses
   📑 Pestañas (1):
      - Gastos

8️⃣ ¿Quieres probar escribir datos de prueba? (s/n): s
   ✅ Escritura exitosa! (12 celdas actualizadas)

🎉 ¡ÉXITO! La conexión a Google Sheets funciona correctamente
```

### 📄 `setup_google.md`
Guía simplificada de 10 minutos para configurar Google Sheets (multi-plataforma).

**Incluye:**
- Paso a paso para crear Service Account
- Cómo compartir el Sheet correctamente
- Troubleshooting de errores comunes
- Checklist de verificación

**Para Windows:** Usa `SETUP_GOOGLE_WINDOWS.md` en su lugar (tiene comandos de PowerShell)

## 🚀 Flujo Recomendado

### Para Windows:
1. **Lee la guía**: `INICIO_WINDOWS.md` ⭐
2. **Configura Google Cloud**: `SETUP_GOOGLE_WINDOWS.md`
3. **Prueba la conexión**: `.\test_google_connection.ps1` o `python test_google_connection.py`
4. **Si la prueba es exitosa**: Procede al deployment

### Para Linux/Mac:
1. **Lee la guía**: `setup_google.md`
2. **Configura Google Cloud** (sigue los pasos de la guía)
3. **Prueba la conexión**: `python test_google_connection.py`
4. **Si la prueba es exitosa**: Procede al deployment

## ❓ FAQs

### ¿Qué archivo JSON necesito?

El archivo JSON del Service Account que descargas desde Google Cloud Console. Se ve así:

```json
{
  "type": "service_account",
  "project_id": "penny-expenses",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "penny-expense-processor@penny-expenses.iam.gserviceaccount.com",
  ...
}
```

### ¿Dónde encuentro el Sheet ID?

En la URL de tu Google Sheet:
```
https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit
```

### El script dice "Permission denied"

Significa que no compartiste el Sheet con el Service Account. Solución:

1. Ve a tu Google Sheet
2. Haz clic en "Compartir"
3. Agrega el email del Service Account (del JSON: `client_email`)
4. Dale permisos de "Editor"
5. Desactiva "Notificar a las personas"
6. Haz clic en "Compartir"

### ¿Puedo usar mi Google Account personal?

No, debes usar un Service Account. Los Service Accounts son cuentas especiales para aplicaciones, no para personas.

## 🔐 Seguridad

**⚠️ IMPORTANTE:**
- NUNCA subas el archivo JSON a GitHub
- NUNCA compartas el archivo JSON públicamente
- Guárdalo en un lugar seguro
- Considera rotarlo cada 90 días

El `.gitignore` ya está configurado para ignorar archivos `.json` en este directorio.

## 📚 Referencias

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Service Accounts Documentation](https://cloud.google.com/iam/docs/service-accounts)
- [Python Quickstart](https://developers.google.com/sheets/api/quickstart/python)

