# 🪟 ¡EMPIEZA AQUÍ! - Guía para Windows

## 👋 Bienvenido

Has recibido la implementación completa de **Lambda #2 (Penny Expense Processor)**.

Esta Lambda procesa automáticamente imágenes de estados de cuenta, extrae transacciones con OCR, clasifica con IA y las guarda en Google Sheets.

---

## 🎯 ¿Qué necesitas hacer?

Solo 3 cosas:

1. ✅ **Configurar Google Sheets** (10 min)
2. ✅ **Configurar AWS Bedrock** (5 min)  
3. ✅ **Hacer deploy** (5 min)

**Total: 20 minutos** ⏱️

---

## 📂 Archivos Importantes para Windows

### Para Empezar:
- 📄 **`tools\INICIO_WINDOWS.md`** ⭐ - Guía de inicio rápido
- 📄 **`tools\SETUP_GOOGLE_WINDOWS.md`** - Configurar Google Sheets paso a paso

### Para Testing:
- 🐍 **`tools\test_google_connection.py`** - Script de prueba
- 🪟 **`tools\test_google_connection.ps1`** - Ejecuta el test (PowerShell)

### Para Deploy:
- 🪟 **`scripts\deploy.ps1`** - Deploy automatizado
- ⚙️ **`samconfig.toml.example`** - Plantilla de configuración

### Documentación Completa:
- 📄 **`README.md`** - Documentación principal
- 📄 **`ARCHITECTURE.md`** - Arquitectura del sistema
- 📄 **`QUICKSTART.md`** - Guía rápida (multi-plataforma)

---

## 🚀 Inicio Rápido (Resumen)

### 1. Abre PowerShell

```powershell
# Navega al proyecto
cd C:\repos\penny-expense-processor\lambda-python3.12
```

### 2. Configura Google Sheets

```powershell
# Abre la guía completa
notepad tools\SETUP_GOOGLE_WINDOWS.md

# Después de configurar, prueba la conexión
cd tools
python test_google_connection.py
```

**Necesitarás:**
- Crear Service Account en Google Cloud
- Descargar archivo JSON
- Compartir tu Google Sheet con el Service Account

### 3. Configura AWS Bedrock

1. Ve a: https://console.aws.amazon.com/bedrock/
2. Región: `us-east-1`
3. Menu: **Model access**
4. Solicita acceso a: **Claude 3 Haiku**

### 4. Guarda Credenciales

```powershell
# Guardar JSON en AWS Secrets Manager
cd tools
aws secretsmanager create-secret `
  --name penny-expense-google-service-account `
  --secret-string (Get-Content .\service-account.json -Raw) `
  --region us-east-1
```

### 5. Configura Parámetros

```powershell
cd C:\repos\penny-expense-processor\lambda-python3.12

# Copia la plantilla
Copy-Item samconfig.toml.example samconfig.toml

# Edita con tus valores
notepad samconfig.toml
```

**Actualiza:**
- `ProcessingQueueArn` - Del output de Lambda #1
- `TelegramBotToken` - De BotFather
- `GoogleSheetId` - De la URL de tu Sheet

### 6. Deploy!

```powershell
# Build
sam build

# Deploy
sam deploy

# O usa el script
.\scripts\deploy.ps1
```

### 7. Prueba

1. Envía una imagen a tu bot de Telegram
2. Selecciona tipo de tarjeta
3. ¡Verifica tu Google Sheet!

---

## 📋 Requisitos Previos

### Software que necesitas tener instalado:

```powershell
# Verifica que tengas todo:

# Python 3.8+
python --version

# AWS CLI
aws --version

# SAM CLI
sam --version

# Docker Desktop (opcional pero recomendado)
docker --version
```

### Si falta algo:

| Software | Descarga |
|----------|----------|
| Python | https://www.python.org/downloads/ |
| AWS CLI | https://awscli.amazonaws.com/AWSCLIV2.msi |
| SAM CLI | https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html |
| Docker Desktop | https://www.docker.com/products/docker-desktop |

### Configura AWS CLI:

```powershell
aws configure
```

Ingresa:
- Access Key ID
- Secret Access Key  
- Default region: `us-east-1`
- Default output format: `json`

---

## 🗂️ Estructura del Proyecto

```
C:\repos\penny-expense-processor\lambda-python3.12\
│
├── 📄 EMPIEZA_AQUI_WINDOWS.md ⭐ (Este archivo)
│
├── 📂 tools\                    ← Para configurar Google
│   ├── INICIO_WINDOWS.md ⭐
│   ├── SETUP_GOOGLE_WINDOWS.md
│   ├── test_google_connection.py
│   └── test_google_connection.ps1
│
├── 📂 scripts\                  ← Para deploy
│   ├── deploy.ps1
│   └── test-local.ps1
│
├── 📂 expense_processor\        ← Código de la Lambda
│   ├── app.py
│   └── utils\
│       ├── telegram_client.py
│       ├── textract_client.py
│       ├── transaction_parser.py
│       ├── bedrock_classifier.py
│       ├── sheets_client.py
│       └── s3_client.py
│
├── 📂 docs\                     ← Documentación
│   ├── SETUP_GOOGLE_SHEETS.md
│   └── SETUP_AWS_BEDROCK.md
│
├── 📄 template.yaml             ← Infraestructura AWS
├── 📄 samconfig.toml.example    ← Configuración
└── 📄 README.md                 ← Docs principal
```

---

## 💡 Guía Visual de Pasos

```
1️⃣ Configurar Google Sheets (10 min)
   │
   ├─ Crear proyecto en Google Cloud
   ├─ Habilitar Google Sheets API
   ├─ Crear Service Account
   ├─ Descargar JSON
   ├─ Crear Google Sheet
   └─ Compartir Sheet con Service Account ⭐
   
2️⃣ Probar Conexión (2 min)
   │
   └─ python test_google_connection.py
   
3️⃣ Configurar AWS Bedrock (5 min)
   │
   └─ Solicitar acceso a Claude 3 Haiku
   
4️⃣ Guardar Credenciales (2 min)
   │
   └─ aws secretsmanager create-secret
   
5️⃣ Configurar samconfig.toml (3 min)
   │
   └─ Editar con tus valores
   
6️⃣ Deploy (5 min)
   │
   ├─ sam build
   └─ sam deploy
   
7️⃣ ¡Probar! (2 min)
   │
   └─ Enviar imagen al bot
```

---

## 🐛 Problemas Comunes

### "python no se reconoce como comando"
```powershell
# Reinstala Python y marca "Add Python to PATH"
# O agrega manualmente:
$env:Path += ";C:\Python312;C:\Python312\Scripts"
```

### "sam no se reconoce como comando"
```powershell
# Reinstala SAM CLI o agrega al PATH:
$env:Path += ";C:\Program Files\Amazon\AWSSAMCLI\bin"
```

### "Access Denied" en Google Sheets
```
Solución: Compartiste el Sheet con el Service Account?
1. Abre tu Google Sheet
2. Click en "Compartir"
3. Agrega: el email del Service Account (del JSON)
4. Permisos: "Editor"
```

### "Docker is not running"
```powershell
# Instala Docker Desktop:
# https://www.docker.com/products/docker-desktop

# O usa: sam build --use-container
```

---

## 📞 ¿Necesitas Ayuda?

### Documentación Completa:
```powershell
# Abre el README principal
notepad README.md
```

### Ver Logs:
```powershell
# Logs en tiempo real
aws logs tail /aws/lambda/penny-expense-processor --follow
```

### Verificar Deploy:
```powershell
# Ver stack
aws cloudformation describe-stacks `
  --stack-name penny-expense-processor `
  --output table
```

---

## 🎯 Comandos Útiles (Referencia Rápida)

```powershell
# Navegar al proyecto
cd C:\repos\penny-expense-processor\lambda-python3.12

# Test Google
cd tools
python test_google_connection.py

# Configurar
Copy-Item samconfig.toml.example samconfig.toml
notepad samconfig.toml

# Deploy
sam build
sam deploy

# Ver logs
aws logs tail /aws/lambda/penny-expense-processor --follow

# Ver stack
aws cloudformation describe-stacks --stack-name penny-expense-processor

# Eliminar (si necesitas empezar de nuevo)
sam delete --stack-name penny-expense-processor
```

---

## 📚 Siguientes Pasos

Una vez que hayas desplegado exitosamente:

1. **Prueba el sistema** - Envía una imagen a tu bot
2. **Monitorea los logs** - Verifica que todo funcione
3. **Personaliza** - Ajusta categorías, regex, etc.
4. **Optimiza** - Ajusta memoria y timeout según necesidad

---

## ✨ ¿Qué hace esta Lambda?

```python
# Pseudo-código simplificado
def procesar_gasto(imagen):
    # 1. Descargar imagen de Telegram
    imagen_bytes = telegram.descargar(imagen)
    
    # 2. Extraer texto (OCR)
    texto = textract.extraer_texto(imagen_bytes)
    
    # 3. Parsear transacciones
    transacciones = parser.parsear(texto)
    # Ejemplo: "15/01/2024 UBER PEN 15.50"
    #       → {fecha: "2024-01-15", desc: "UBER", monto: 15.50}
    
    # 4. Clasificar con IA
    for t in transacciones:
        t.categoria = bedrock.clasificar(t.descripcion)
        # "UBER" → "Transporte"
    
    # 5. Guardar en Google Sheets
    sheets.agregar(transacciones)
    
    # 6. Notificar usuario
    telegram.enviar("✅ Procesadas 3 transacciones")
```

---

## 💰 Costos Estimados

Para **100 imágenes/mes** (~500 transacciones):

| Servicio | Costo |
|----------|-------|
| Lambda | $0.50 |
| Textract | $1.50 |
| Bedrock (Haiku) | $0.25 |
| S3 | $0.10 |
| Otros | $1.00 |
| **Total** | **~$3.35/mes** |

---

## 🎉 ¡Listo para Empezar!

**Próximo paso:**

```powershell
# Abre la guía completa
notepad tools\INICIO_WINDOWS.md
```

¡Éxito con tu sistema de gastos automatizado! 🚀📊💰

