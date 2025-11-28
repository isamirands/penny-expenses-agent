# Penny Expense Processor

Lambda function que procesa imágenes de estados de cuenta bancarios, extrae transacciones con OCR (Tesseract), las clasifica con IA (AWS Bedrock) y las guarda en Google Sheets.

## Arquitectura

```
SQS Queue → Lambda → [Telegram + Tesseract OCR + Bedrock + Google Sheets]
```

## Pre-requisitos

### AWS
- AWS CLI y SAM CLI instalados
- Credenciales de AWS configuradas (`aws configure`)
- Acceso a AWS Bedrock (solicitar acceso a modelos Claude)
- Docker Desktop corriendo

### Google Cloud
1. Crear Service Account en Google Cloud Console
2. Habilitar Google Sheets API
3. Descargar credenciales JSON del Service Account
4. Compartir Google Sheet con el email del Service Account (permisos de Editor)
5. Guardar credenciales en AWS Secrets Manager:
   ```bash
   aws secretsmanager create-secret \
     --name penny-expense-google-service-account \
     --secret-string file://service-account-key.json \
     --region us-east-2
   ```

## Configuración

1. Copia `samconfig.toml.example` a `samconfig.toml`
2. Edita `samconfig.toml` con tus valores:
   - `ProcessingQueueArn`: ARN de la cola SQS de Lambda #1
   - `TelegramBotToken`: Token de tu bot de Telegram
   - `GoogleSheetId`: ID de tu Google Sheet
   - `GoogleServiceAccountSecret`: Nombre del secreto en Secrets Manager
   - `BedrockModelId`: Modelo de Bedrock (default: `anthropic.claude-3-haiku-20240307-v1:0`)

## Deploy

### Opción 1: Script PowerShell (Windows)
```powershell
.\scripts\deploy.ps1
```

### Opción 2: Manual
```bash
# Build
sam build --use-container

# Deploy
sam deploy
```

## Estructura

```
expense_processor/
├── app.py                    # Handler principal
├── Dockerfile                # Imagen con Tesseract OCR
├── requirements.txt          # Dependencias Python
└── utils/
    ├── telegram_client.py    # Cliente Telegram
    ├── tesseract_client.py   # OCR con Tesseract
    ├── transaction_parser.py # Parser de transacciones
    ├── bedrock_classifier.py # Clasificación con IA
    ├── sheets_client.py      # Cliente Google Sheets
    └── s3_client.py          # Cliente S3
```

## Monitoreo

```bash
# Ver logs en tiempo real
aws logs tail /aws/lambda/penny-expense-processor --follow --region us-east-2
```

## Troubleshooting

**Error: "No module named 'google'"**
- Rebuild: `sam build --use-container`

**Error: "Bedrock: AccessDeniedException"**
- Solicita acceso a modelos Claude en AWS Bedrock Console

**No se detectan transacciones**
- Revisa logs para ver el texto extraído por OCR
- El parser soporta múltiples formatos de apps bancarias

**Google Sheets: "Permission denied"**
- Verifica que el Service Account tenga acceso al Sheet
- Verifica que el secreto en Secrets Manager sea válido

## Costos Estimados

Para ~100 transacciones/mes:
- Lambda: ~$0.50
- Bedrock (Haiku): ~$0.25
- S3: ~$0.10
- **Total: ~$0.85/mes**
