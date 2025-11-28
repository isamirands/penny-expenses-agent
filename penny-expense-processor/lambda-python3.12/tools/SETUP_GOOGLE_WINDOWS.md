# 🪟 Configurar Google Sheets en Windows (10 minutos)

Guía paso a paso para Windows con comandos de PowerShell.

## 📋 Requisitos

- ✅ Windows 10/11
- ✅ Python 3.8+ instalado ([Descargar](https://www.python.org/downloads/))
- ✅ PowerShell (ya viene con Windows)
- ✅ Cuenta de Google

---

## 🚀 Pasos Rápidos

### Paso 1: Crear Proyecto en Google Cloud (2 min)

1. **Abre tu navegador** y ve a: https://console.cloud.google.com/

2. **Inicia sesión** con tu cuenta de Google

3. **Crea un proyecto nuevo**:
   - Haz clic en el selector de proyectos (arriba a la izquierda, junto a "Google Cloud")
   - Clic en **"NEW PROJECT"**
   - Nombre del proyecto: `penny-expenses`
   - Haz clic en **"CREATE"**
   - Espera unos segundos

4. **Selecciona tu proyecto**:
   - Haz clic de nuevo en el selector de proyectos
   - Selecciona `penny-expenses`

✅ **Listo!** Proyecto creado.

---

### Paso 2: Habilitar Google Sheets API (1 min)

1. En Google Cloud Console, menú ☰ (hamburguesa) → **APIs & Services** → **Library**

2. En el buscador, escribe: `Google Sheets API`

3. Haz clic en **"Google Sheets API"**

4. Haz clic en **"ENABLE"**

5. Espera unos segundos hasta que se active

✅ **Listo!** API habilitada.

---

### Paso 3: Crear Service Account (3 min)

1. Menú ☰ → **IAM & Admin** → **Service Accounts**

2. Haz clic en **"+ CREATE SERVICE ACCOUNT"** (botón azul arriba)

3. **Paso 1 - Service account details**:
   ```
   Service account name: penny-expense-processor
   Service account ID: (se genera automáticamente)
   Description: Service account for Penny Expense Processor
   ```
   Haz clic en **"CREATE AND CONTINUE"**

4. **Paso 2 - Grant access** (Opcional):
   - No agregues ningún rol
   - Haz clic en **"CONTINUE"**

5. **Paso 3 - Grant users access** (Opcional):
   - Déjalo vacío
   - Haz clic en **"DONE"**

✅ **Listo!** Service Account creado.

---

### Paso 4: Descargar Credenciales JSON (2 min)

1. En la lista de Service Accounts, **haz clic** en el que acabas de crear
   - `penny-expense-processor@penny-expenses.iam.gserviceaccount.com`

2. Ve a la pestaña **"KEYS"**

3. Haz clic en **"ADD KEY"** → **"Create new key"**

4. Selecciona **"JSON"**

5. Haz clic en **"CREATE"**

6. **Se descarga automáticamente** un archivo JSON a tu carpeta de descargas

7. **Mueve el archivo** a una ubicación segura:

```powershell
# Abre PowerShell y ejecuta:
cd C:\repos\penny-expense-processor\lambda-python3.12\tools

# Mueve el archivo desde Descargas
Move-Item "$env:USERPROFILE\Downloads\penny-expenses-*.json" .\service-account.json

# Verifica que esté ahí
Get-ChildItem *.json
```

✅ **Listo!** Credenciales descargadas.

---

### Paso 5: Anotar el Email del Service Account (1 min)

Abre el archivo JSON para ver el email:

```powershell
# Ver el contenido
Get-Content .\service-account.json | Select-String "client_email"
```

Deberías ver algo como:
```
"client_email": "penny-expense-processor@penny-expenses.iam.gserviceaccount.com"
```

📋 **Copia ese email** (lo necesitarás en el siguiente paso)

---

### Paso 6: Crear Google Sheet (2 min)

1. **Abre** https://sheets.google.com/ en tu navegador

2. **Crea nueva hoja**:
   - Haz clic en el botón **"+"** (Blank spreadsheet)

3. **Nombra la hoja**:
   - Haz clic en "Untitled spreadsheet" (arriba a la izquierda)
   - Escribe: `Penny Expenses`
   - Presiona Enter

4. **Crea los encabezados** en la primera fila:
   ```
   A1: Fecha
   B1: Método de Pago
   C1: Descripción
   D1: Categoría
   E1: Moneda
   F1: Monto
   ```

5. **Opcional**: Formatea los encabezados (negrita, color de fondo)

6. **Copia el ID del Sheet** desde la URL:
   ```
   https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P/edit
                                          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                          Este es el Sheet ID
   ```

📋 **Anota ese ID** en un lugar seguro.

✅ **Listo!** Sheet creado.

---

### Paso 7: Compartir Sheet con Service Account ⭐ (1 min)

**Este es el paso MÁS IMPORTANTE:**

1. En tu Google Sheet, haz clic en **"Compartir"** (botón azul arriba a la derecha)

2. En el campo **"Agregar personas y grupos"**, pega el email del Service Account:
   ```
   penny-expense-processor@penny-expenses.iam.gserviceaccount.com
   ```

3. Cambia el permiso a **"Editor"** (en el dropdown a la derecha)

4. **MUY IMPORTANTE**: **DESACTIVA** la casilla "Notificar a las personas"

5. Haz clic en **"Compartir"** o **"Enviar"**

✅ **Listo!** Sheet compartido correctamente.

---

### Paso 8: Probar la Conexión 🧪 (2 min)

Ahora vamos a probar que todo funciona:

```powershell
# 1. Abre PowerShell como Administrador
# (Click derecho en el menú inicio → PowerShell (Admin))

# 2. Navega al directorio de tools
cd C:\repos\penny-expense-processor\lambda-python3.12\tools

# 3. Instala las librerías de Google (si no las tienes)
pip install google-api-python-client google-auth google-auth-httplib2 google-auth-oauthlib

# 4. Ejecuta el script de prueba
python test_google_connection.py
```

**El script te pedirá:**
1. ✅ Seleccionar el archivo JSON (automáticamente si solo hay uno)
2. ✅ Ingresar el Sheet ID
3. ✅ Confirmar si quieres escribir datos de prueba

**Salida esperada:**
```
🔍 Verificando configuración de Google Sheets...

1️⃣ Verificando librerías de Google...
   ✅ Librerías de Google instaladas correctamente

2️⃣ Cargando credenciales del Service Account...
   📁 Archivos JSON encontrados:
      1. service-account.json
   ✅ Usando: service-account.json

3️⃣ Validando credenciales...
   ✅ Service Account válido
   📧 Email: penny-expense-processor@penny-expenses.iam.gserviceaccount.com
   🏗️  Proyecto: penny-expenses

[... más pasos ...]

🎉 ¡ÉXITO! La conexión a Google Sheets funciona correctamente
```

---

## 🐛 Solución de Problemas (Windows)

### Error: "Python no se reconoce como comando"

**Causa**: Python no está en el PATH

**Solución**:
```powershell
# Opción 1: Reinstala Python y marca "Add Python to PATH"

# Opción 2: Agrega Python al PATH manualmente
$env:Path += ";C:\Python312;C:\Python312\Scripts"

# Verifica
python --version
```

### Error: "pip no se reconoce como comando"

**Solución**:
```powershell
# Usa python -m pip en lugar de pip
python -m pip install google-api-python-client google-auth
```

### Error: "Access Denied" al instalar librerías

**Solución**:
```powershell
# Opción 1: Ejecuta PowerShell como Administrador

# Opción 2: Instala solo para tu usuario
pip install --user google-api-python-client google-auth
```

### Error: "The caller does not have permission"

**Causa**: No compartiste el Sheet con el Service Account

**Solución**:
1. Ve a tu Google Sheet
2. Click en "Compartir"
3. Verifica que el email del Service Account esté ahí
4. Verifica que tenga permisos de "Editor"
5. Si no está, agrégalo de nuevo

### Error: "Sheet not found (404)"

**Causa**: Sheet ID incorrecto

**Solución**:
1. Ve a tu Google Sheet
2. Copia la URL completa
3. Extrae el ID (la parte entre `/d/` y `/edit`)
   ```
   https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit
   ```

### Error: "SSL Certificate verification failed"

**Solución**:
```powershell
# Actualiza pip y certifi
python -m pip install --upgrade pip certifi
```

---

## 📝 Guardar Credenciales en AWS (PowerShell)

Una vez que la prueba sea exitosa, guarda las credenciales en AWS Secrets Manager:

```powershell
# 1. Asegúrate de tener AWS CLI configurado
aws configure list

# 2. Crea el secreto
aws secretsmanager create-secret `
  --name penny-expense-google-service-account `
  --description "Google Service Account for Penny Expenses" `
  --secret-string (Get-Content .\service-account.json -Raw) `
  --region us-east-1

# 3. Verifica que se creó
aws secretsmanager list-secrets --region us-east-1 | Select-String "penny-expense"
```

---

## ⚙️ Configurar samconfig.toml (PowerShell)

```powershell
# 1. Navega al directorio principal
cd C:\repos\penny-expense-processor\lambda-python3.12

# 2. Copia el archivo de ejemplo
Copy-Item samconfig.toml.example samconfig.toml

# 3. Edita el archivo
notepad samconfig.toml

# O con VSCode
code samconfig.toml
```

**Actualiza estos valores**:
```toml
parameter_overrides = [
    "ProcessingQueueArn=arn:aws:sqs:us-east-1:123456789012:penny-expense-processing-queue",
    "TelegramBotToken=TU_BOT_TOKEN",
    "GoogleSheetId=TU_SHEET_ID_AQUI",
    "GoogleServiceAccountSecret=penny-expense-google-service-account",
    "BedrockModelId=anthropic.claude-3-haiku-20240307-v1:0"
]
```

---

## ✅ Checklist Final (Windows)

Verifica que hayas completado todo:

- [ ] Python instalado y funcionando
- [ ] Proyecto creado en Google Cloud
- [ ] Google Sheets API habilitada
- [ ] Service Account creado
- [ ] Archivo JSON descargado y guardado en `tools/`
- [ ] Google Sheet creado con headers
- [ ] Sheet compartido con Service Account (con permisos de Editor)
- [ ] Script de prueba ejecutado exitosamente
- [ ] Credenciales guardadas en AWS Secrets Manager
- [ ] `samconfig.toml` configurado con el Sheet ID

---

## 🚀 Siguiente Paso: Deploy

```powershell
# Navega al directorio
cd C:\repos\penny-expense-processor\lambda-python3.12

# Build
sam build

# Deploy
sam deploy

# O usa el script de PowerShell
.\scripts\deploy.ps1
```

---

## 📺 Video Tutorial (Recomendado)

Si prefieres seguir un video, busca en YouTube:
- "Google Sheets API Python Tutorial"
- "Service Account Google Cloud"

---

## 💡 Consejos para Windows

### 1. Usa PowerShell 7 (Recomendado)

```powershell
# Instalar PowerShell 7
winget install Microsoft.PowerShell
```

### 2. Configura la Ejecución de Scripts

```powershell
# Si tienes error de "execution policy"
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### 3. Usa Windows Terminal (Opcional pero mejor)

```powershell
# Instalar Windows Terminal
winget install Microsoft.WindowsTerminal
```

### 4. Alias útiles

```powershell
# Agregar a tu perfil de PowerShell
notepad $PROFILE

# Agrega estas líneas:
Set-Alias python3 python
Set-Alias pip3 pip
```

---

## 🎉 ¡Listo!

Si seguiste todos los pasos, tu Google Sheets está configurado y probado en Windows.

**Tiempo total**: ~10-15 minutos

**¿Problemas?** Revisa la sección de troubleshooting arriba.

**¿Siguiente paso?** Configura AWS Bedrock y despliega tu Lambda.

---

## 📞 Referencias Útiles

- [Python para Windows](https://www.python.org/downloads/windows/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [AWS CLI para Windows](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- [SAM CLI para Windows](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html)

