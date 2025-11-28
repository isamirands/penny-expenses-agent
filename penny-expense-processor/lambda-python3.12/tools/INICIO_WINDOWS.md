# 🪟 INICIO RÁPIDO - Windows

Guía ultrarrápida para configurar todo en Windows.

## 🎯 ¿Qué necesitas hacer?

1. ✅ Configurar Google Sheets (10 min)
2. ✅ Configurar AWS Bedrock (5 min)
3. ✅ Hacer deploy (5 min)

**Total: 20 minutos**

---

## 📦 PASO 0: Requisitos

Abre PowerShell y verifica:

```powershell
# Verifica Python
python --version
# Debe mostrar: Python 3.8 o superior

# Verifica AWS CLI
aws --version
# Debe mostrar: aws-cli/2.x.x

# Verifica SAM CLI
sam --version
# Debe mostrar: SAM CLI, version 1.x.x

# Navega al proyecto
cd C:\repos\penny-expense-processor\lambda-python3.12
```

### Si falta algo:

```powershell
# Instalar Python
# Descarga desde: https://www.python.org/downloads/
# IMPORTANTE: Marca "Add Python to PATH"

# Instalar AWS CLI
# Descarga desde: https://awscli.amazonaws.com/AWSCLIV2.msi

# Instalar SAM CLI
# Descarga desde: https://github.com/aws/aws-sam-cli/releases/latest

# Configurar AWS
aws configure
# Ingresa: Access Key ID, Secret Access Key, Region (us-east-1)
```

---

## 🚀 PASO 1: Configurar Google Sheets (10 min)

### Opción A: Guía Completa (Recomendada)

```powershell
# Abre la guía
notepad tools\SETUP_GOOGLE_WINDOWS.md

# O en tu navegador
start tools\SETUP_GOOGLE_WINDOWS.md
```

Sigue los 8 pasos en la guía.

### Opción B: Video Tutorial

1. Ve a YouTube
2. Busca: "Google Sheets API Service Account Python"
3. Sigue el video

### Resumen Ultra-Rápido:

1. **Google Cloud Console** → Crear proyecto `penny-expenses`
2. **Habilitar** Google Sheets API
3. **Crear** Service Account
4. **Descargar** JSON key
5. **Crear** Google Sheet
6. **Compartir** Sheet con Service Account email
7. **Probar** conexión

### Probar Conexión:

```powershell
# Navega a tools
cd tools

# Ejecuta el test
python test_google_connection.py

# O usa PowerShell
.\test_google_connection.ps1
```

---

## 🤖 PASO 2: Configurar AWS Bedrock (5 min)

### 2.1 Habilitar Bedrock en AWS Console

1. **Abre**: https://console.aws.amazon.com/bedrock/
2. **Región**: Cambia a `us-east-1` (arriba a la derecha)
3. **Menu lateral** → **Model access**
4. **Botón** "Manage model access"
5. **Marca** ☑️ Claude 3 Haiku
6. **Botón** "Request model access"
7. **Espera** (usualmente instantáneo)

### 2.2 Verificar Acceso

```powershell
# Verifica que tienes acceso
aws bedrock list-foundation-models `
  --region us-east-1 `
  --by-provider Anthropic `
  --query 'modelSummaries[*].[modelId,modelName]' `
  --output table
```

Deberías ver:
```
---------------------------------------------------------
|              ListFoundationModels                     |
+---------------------------------------+---------------+
| anthropic.claude-3-haiku-...         | Claude 3 Haiku|
+---------------------------------------+---------------+
```

✅ **Listo!** Bedrock configurado.

---

## ⚙️ PASO 3: Configurar Parámetros (3 min)

```powershell
# Vuelve al directorio principal
cd C:\repos\penny-expense-processor\lambda-python3.12

# Copia el archivo de ejemplo
Copy-Item samconfig.toml.example samconfig.toml

# Edita con Notepad
notepad samconfig.toml

# O con VSCode
code samconfig.toml
```

### Actualiza estos valores:

```toml
parameter_overrides = [
    # 1. ARN de la cola SQS (del output de Lambda #1)
    "ProcessingQueueArn=arn:aws:sqs:us-east-1:123456789012:penny-expense-processing-queue",
    
    # 2. Token del bot de Telegram (de BotFather)
    "TelegramBotToken=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz",
    
    # 3. ID de tu Google Sheet (de la URL)
    "GoogleSheetId=1A2B3C4D5E6F7G8H9I0J1K2L3M4N5O6P",
    
    # 4. Nombre del secreto (ya configurado)
    "GoogleServiceAccountSecret=penny-expense-google-service-account",
    
    # 5. Modelo de IA (ya configurado)
    "BedrockModelId=anthropic.claude-3-haiku-20240307-v1:0"
]
```

### ¿Dónde encuentro cada valor?

| Parámetro | Dónde encontrarlo |
|-----------|-------------------|
| `ProcessingQueueArn` | AWS Console → CloudFormation → Stack `penny-expenses-webhook-stack` → Outputs |
| `TelegramBotToken` | Telegram → BotFather → `/token` |
| `GoogleSheetId` | URL del Sheet: `https://docs.google.com/spreadsheets/d/[ID]/edit` |

---

## 🚀 PASO 4: Guardar Credenciales en AWS (2 min)

```powershell
# Navega a tools (donde está el JSON)
cd tools

# Guarda en Secrets Manager
aws secretsmanager create-secret `
  --name penny-expense-google-service-account `
  --description "Google Service Account for Penny Expenses" `
  --secret-string (Get-Content .\service-account.json -Raw) `
  --region us-east-1

# Verifica
aws secretsmanager describe-secret `
  --secret-id penny-expense-google-service-account `
  --region us-east-1
```

✅ Deberías ver la información del secreto.

---

## 🏗️ PASO 5: Deploy! (5 min)

```powershell
# Vuelve al directorio principal
cd C:\repos\penny-expense-processor\lambda-python3.12

# Build (puede tomar 2-3 minutos la primera vez)
sam build

# Deploy
sam deploy

# O usa el script de PowerShell
.\scripts\deploy.ps1
```

### Durante el deploy:

SAM te preguntará:
- **Confirm changes before deploy?** → `Y` (recomendado)
- **Allow SAM CLI IAM role creation?** → `Y`
- **Save arguments to samconfig.toml?** → `Y`

**Espera** unos 3-5 minutos...

### Salida esperada:

```
Successfully created/updated stack - penny-expense-processor in us-east-1

Stack outputs:
PennyExpenseProcessorFunction: arn:aws:lambda:...
ImagesBucketName: penny-expense-images-123456789012
```

✅ **¡Deploy exitoso!**

---

## 🧪 PASO 6: Probar el Sistema (2 min)

### Prueba End-to-End:

1. **Abre Telegram** en tu teléfono
2. **Busca** tu bot
3. **Envía** una imagen de un estado de cuenta
4. **Selecciona** tipo de tarjeta (Visa/Master/Débito)
5. **Espera** mensaje de confirmación
6. **Abre** tu Google Sheet
7. **Verifica** que aparezcan las transacciones

### Ver logs en tiempo real:

```powershell
# En PowerShell, ejecuta:
aws logs tail /aws/lambda/penny-expense-processor --follow
```

---

## 🎉 ¡LISTO!

Si todo funcionó:
- ✅ Lambda #2 está desplegada
- ✅ Google Sheets está configurado
- ✅ Bedrock está habilitado
- ✅ El sistema está funcionando

---

## 🐛 Problemas Comunes (Windows)

### "sam: command not found"

```powershell
# Reinstala SAM CLI o agrega al PATH
$env:Path += ";C:\Program Files\Amazon\AWSSAMCLI\bin"
```

### "Docker is not running"

```powershell
# Instala Docker Desktop para Windows
# Descarga: https://www.docker.com/products/docker-desktop

# O usa --use-container
sam build --use-container
```

### Error al ejecutar scripts .sh

```powershell
# Usa las versiones .ps1 en su lugar
.\scripts\deploy.ps1        # En lugar de deploy.sh
.\scripts\test-local.ps1    # En lugar de test-local.sh
```

### "Execution policy" error

```powershell
# Ejecuta PowerShell como Admin y ejecuta:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Build muy lento

```powershell
# Primera vez es lento (descarga Python + dependencias)
# Las siguientes serán más rápidas (usa cache)

# Para forzar rebuild:
sam build --use-container --cached
```

---

## 📊 Monitoreo (PowerShell)

```powershell
# Ver logs
aws logs tail /aws/lambda/penny-expense-processor --follow

# Ver stack
aws cloudformation describe-stacks `
  --stack-name penny-expense-processor `
  --query 'Stacks[0].Outputs' `
  --output table

# Ver métricas
aws cloudwatch get-metric-statistics `
  --namespace AWS/Lambda `
  --metric-name Invocations `
  --dimensions Name=FunctionName,Value=penny-expense-processor `
  --start-time (Get-Date).AddHours(-1).ToString("yyyy-MM-ddTHH:mm:ss") `
  --end-time (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss") `
  --period 3600 `
  --statistics Sum
```

---

## 📁 Estructura de Archivos (Windows)

```
C:\repos\penny-expense-processor\lambda-python3.12\
│
├── INICIO_WINDOWS.md ⭐ (Este archivo)
├── QUICKSTART.md
├── README.md
│
├── tools\
│   ├── SETUP_GOOGLE_WINDOWS.md ⭐
│   ├── test_google_connection.py ⭐
│   └── test_google_connection.ps1 ⭐
│
├── scripts\
│   ├── deploy.ps1 ⭐
│   └── test-local.ps1
│
└── expense_processor\
    ├── app.py
    └── utils\
```

---

## 💡 Tips para Windows

1. **Usa Windows Terminal** (mejor que CMD/PowerShell clásico)
2. **Usa VSCode** como editor (mejor integración)
3. **Activa WSL2** si quieres usar comandos Linux
4. **Ejecuta PowerShell como Admin** para instalar cosas

---

## 🎯 Comandos Rápidos de Referencia

```powershell
# Test Google
cd tools
python test_google_connection.py

# Build & Deploy
cd ..
sam build
sam deploy

# Ver logs
aws logs tail /aws/lambda/penny-expense-processor --follow

# Ver costos
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 --granularity MONTHLY --metrics UnblendedCost

# Eliminar todo (si quieres empezar de nuevo)
sam delete --stack-name penny-expense-processor
```

---

## 📞 ¿Necesitas Ayuda?

1. **Revisa los logs**: `aws logs tail /aws/lambda/penny-expense-processor`
2. **Revisa la documentación completa**: `README.md`
3. **Revisa troubleshooting**: `tools\SETUP_GOOGLE_WINDOWS.md`

---

## ✨ ¡Disfruta tu sistema de gastos automatizado!

Cada vez que envíes una imagen a tu bot:
- 🤖 Se procesará automáticamente
- 📊 Se extraerán las transacciones
- 🎯 Se clasificarán con IA
- 📝 Se guardarán en Google Sheets

**¡Sin entrada manual de datos!** 🎉

