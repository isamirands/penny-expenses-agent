# 📁 Estructura del Proyecto (Limpia)

## Directorio Principal

```
lambda-python3.12/
│
├── 📄 EMPIEZA_AQUI_WINDOWS.md ⭐ - Guía de inicio rápido
├── 📄 README.md - Documentación completa
├── 📄 template.yaml - Infraestructura AWS (SAM)
├── 📄 samconfig.toml - Configuración activa (NO subir a Git)
├── 📄 samconfig.toml.example - Plantilla de configuración
├── 📄 .gitignore - Protege archivos sensibles
│
├── 📂 expense_processor/ - Código de la Lambda
│   ├── app.py - Handler principal
│   ├── Dockerfile - Container image
│   ├── requirements.txt - Dependencias Python
│   └── utils/ - Módulos auxiliares
│       ├── telegram_client.py - Descargar imágenes
│       ├── textract_client.py - OCR (AWS Textract)
│       ├── transaction_parser.py - Parser de transacciones
│       ├── bedrock_classifier.py - Clasificación IA
│       ├── sheets_client.py - Google Sheets
│       └── s3_client.py - Almacenamiento S3
│
├── 📂 scripts/ - Scripts de deploy
│   ├── deploy.ps1 - Deploy automatizado (Windows)
│   └── test-local.ps1 - Test local (Windows)
│
├── 📂 tools/ - Herramientas de configuración
│   ├── INICIO_WINDOWS.md - Guía de configuración
│   ├── SETUP_GOOGLE_WINDOWS.md - Setup de Google Sheets
│   ├── test_google_connection.py - Test de conexión
│   ├── test_google_connection.ps1 - Wrapper PowerShell
│   └── test_google_connection.bat - Ejecutable (doble-click)
│
├── 📂 docs/ - Documentación detallada
│   ├── SETUP_GOOGLE_SHEETS.md - Configurar Google Sheets
│   └── SETUP_AWS_BEDROCK.md - Configurar AWS Bedrock
│
└── 📂 events/ - Eventos de prueba
    ├── sqs-event.json - Evento SQS completo
    └── test-event.json - Evento simple
```

## 🗑️ Archivos Eliminados

Se eliminaron carpetas y archivos innecesarios:
- ❌ `hello_world/` - Directorio de ejemplo
- ❌ `tests/` - Tests no implementados
- ❌ `.aws-sam/` - Build artifacts (se regeneran)
- ❌ `__pycache__/` - Cache de Python
- ❌ `README.TOOLKIT.md` - Documentación redundante
- ❌ `IMPLEMENTATION_SUMMARY.md` - Redundante
- ❌ `ARCHITECTURE.md` - Redundante
- ❌ `QUICKSTART.md` - Redundante
- ❌ `scripts/*.sh` - Scripts para Linux
- ❌ `tools/service-account.json` - Credenciales (ya en AWS)
- ❌ `.vscode/` - Configuración del editor

## ✅ Archivos Esenciales (Mantener)

### Código:
- `expense_processor/` - Todo el código de la Lambda
- `template.yaml` - Infraestructura
- `samconfig.toml` - Configuración

### Documentación:
- `EMPIEZA_AQUI_WINDOWS.md` - Punto de inicio
- `README.md` - Documentación principal
- `docs/` - Guías de configuración

### Scripts:
- `scripts/deploy.ps1` - Deploy
- `tools/test_google_connection.*` - Test de Google Sheets

### Eventos de prueba:
- `events/` - Para testing

## 🎯 Próximos Pasos

Ahora que está limpio:

1. ✅ **Deploy completado** - Lambda actualizada con nuevo parser
2. 📱 **Prueba con imagen real** - Envía una captura de tu app bancaria
3. 📊 **Verifica Google Sheet** - Las transacciones aparecerán automáticamente

## 💡 Comandos Útiles

```powershell
# Ver estructura
cd C:\repos\penny-expense-processor\lambda-python3.12
tree /F /A

# Deploy
.\scripts\deploy.ps1

# Ver logs
aws logs tail /aws/lambda/penny-expense-processor --region us-east-2 --follow

# Limpiar build
Remove-Item -Recurse -Force .aws-sam
```

