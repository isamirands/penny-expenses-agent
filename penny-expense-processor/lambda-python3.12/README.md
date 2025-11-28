# Penny Expense Processor (Lambda #2)

Lambda #2 del sistema Penny Expenses: Procesa imágenes de estados de cuenta, extrae transacciones con OCR, clasifica con IA y guarda en Google Sheets.

## 🏗️ Arquitectura

```
SQS Queue → Lambda #2 → [Telegram + Textract + Bedrock + Google Sheets]
```

### Flujo de procesamiento:

1. **Recibe mensaje de SQS** (enviado por Lambda #1)
   - chat_id
   - message_id
   - card_type (Visa, Master, Débito)
   - file_ids (imágenes de Telegram)

2. **Descarga imágenes** desde Telegram Bot API

3. **Extrae texto** con AWS Textract (OCR)

4. **Parsea transacciones** con regex avanzados
   - Fecha
   - Descripción
   - Monto
   - Moneda

5. **Clasifica con IA** usando AWS Bedrock (Claude)
   - Comida, Transporte, Servicios, etc.

6. **Guarda en Google Sheets** vía Service Account

7. **Notifica al usuario** vía Telegram

## 📋 Pre-requisitos

### 1. AWS Services

- **AWS Textract**: Activado en tu cuenta
- **AWS Bedrock**: Acceso al modelo Claude (Haiku o Sonnet)
- **AWS Secrets Manager**: Para credenciales de Google
- **AWS S3**: Bucket para imágenes temporales (se crea automáticamente)
- **AWS SQS**: Cola creada por Lambda #1

### 2. Google Cloud

#### Crear Service Account:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita **Google Sheets API**
4. Ve a **IAM & Admin → Service Accounts**
5. Crea un Service Account:
   - Nombre: `penny-expense-processor`
   - Rol: Sin rol (no necesita permisos de proyecto)
6. Crea una clave JSON:
   - Haz clic en el Service Account
   - Ve a **Keys → Add Key → Create new key**
   - Selecciona **JSON**
   - Descarga el archivo

#### Compartir Google Sheet:

1. Abre tu Google Sheet de gastos
2. Haz clic en **Compartir**
3. Agrega el email del Service Account (ejemplo: `penny-expense-processor@proyecto.iam.gserviceaccount.com`)
4. Dale permisos de **Editor**
5. Copia el ID del Sheet (está en la URL):
   ```
   https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit
   ```

### 3. AWS Secrets Manager

Guarda las credenciales del Service Account en Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name penny-expense-google-service-account \
  --description "Google Service Account credentials for Penny Expense Processor" \
  --secret-string file://path/to/service-account-key.json
```

O desde la consola de AWS:
1. Ve a **Secrets Manager**
2. Crea un nuevo secreto
3. Tipo: **Other type of secret**
4. Pega el contenido completo del JSON del Service Account
5. Nombre: `penny-expense-google-service-account`

## 🚀 Deployment

### 1. Configurar variables

Crea un archivo `samconfig.toml` (si no existe):

```toml
version = 0.1
[default]
[default.deploy]
[default.deploy.parameters]
stack_name = "penny-expense-processor"
region = "us-east-1"
capabilities = "CAPABILITY_IAM"
parameter_overrides = "ParameterKey=ProcessingQueueArn,ParameterValue=arn:aws:sqs:REGION:ACCOUNT_ID:penny-expense-processing-queue ParameterKey=TelegramBotToken,ParameterValue=YOUR_BOT_TOKEN ParameterKey=GoogleSheetId,ParameterValue=YOUR_SHEET_ID"
```

### 2. Build y Deploy

```bash
# Build Docker image
sam build

# Deploy
sam deploy \
  --parameter-overrides \
  ProcessingQueueArn="arn:aws:sqs:us-east-1:123456789012:penny-expense-processing-queue" \
  TelegramBotToken="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz" \
  GoogleSheetId="1A2B3C4D5E6F7G8H9I0J" \
  GoogleServiceAccountSecret="penny-expense-google-service-account" \
  BedrockModelId="anthropic.claude-3-haiku-20240307-v1:0"
```

### 3. Verificar deployment

```bash
# Ver logs
sam logs --stack-name penny-expense-processor --tail

# Ver métricas en CloudWatch
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=penny-expense-processor \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum
```

## 🧪 Testing

### Test Local

```bash
# Crear evento de prueba
cat > event.json << EOF
{
  "chat_id": "123456789",
  "message_id": "1",
  "card_type": "Visa",
  "file_ids": ["AgACAgEAAxkBAAIBYl..."]
}
EOF

# Ejecutar localmente
sam local invoke \
  -e event.json \
  --parameter-overrides \
  TelegramBotToken="YOUR_TOKEN" \
  GoogleSheetId="YOUR_SHEET_ID"
```

### Test en AWS

```bash
# Enviar mensaje de prueba a SQS
aws sqs send-message \
  --queue-url https://sqs.us-east-1.amazonaws.com/123456789012/penny-expense-processing-queue \
  --message-body '{
    "chat_id": "123456789",
    "message_id": "1",
    "card_type": "Visa",
    "file_ids": ["AgACAgEAAxkBAAIBYl..."]
  }'
```

## 📊 Monitoreo

### CloudWatch Logs

```bash
# Ver logs en tiempo real
aws logs tail /aws/lambda/penny-expense-processor --follow

# Filtrar errores
aws logs filter-log-events \
  --log-group-name /aws/lambda/penny-expense-processor \
  --filter-pattern "ERROR"
```

### Métricas importantes:

- **Invocations**: Número de ejecuciones
- **Duration**: Tiempo de ejecución (debería ser < 60s)
- **Errors**: Errores durante ejecución
- **Throttles**: Si hay límite de concurrencia

### Alarmas recomendadas:

```bash
# Crear alarma de errores
aws cloudwatch put-metric-alarm \
  --alarm-name penny-processor-errors \
  --alarm-description "Alert on Lambda errors" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=FunctionName,Value=penny-expense-processor
```

## 🔧 Configuración Avanzada

### Aumentar timeout (para muchas imágenes)

En `template.yaml`:
```yaml
Globals:
  Function:
    Timeout: 600  # 10 minutos
    MemorySize: 2048  # 2 GB
```

### Cambiar modelo de Bedrock

Modelos disponibles:
- `anthropic.claude-3-haiku-20240307-v1:0` (rápido, barato)
- `anthropic.claude-3-sonnet-20240229-v1:0` (balanceado)
- `anthropic.claude-3-opus-20240229-v1:0` (más preciso, más caro)

### Procesamiento por lotes

Si procesas muchas imágenes, considera:
1. Aumentar `BatchSize` en el evento SQS (default: 1)
2. Procesar imágenes en paralelo con `concurrent.futures`

## 📁 Estructura del Proyecto

```
expense_processor/
├── app.py                          # Handler principal
├── utils/
│   ├── __init__.py
│   ├── telegram_client.py          # Cliente Telegram
│   ├── textract_client.py          # Cliente Textract (OCR)
│   ├── transaction_parser.py       # Parser de transacciones (regex)
│   ├── bedrock_classifier.py       # Clasificador LLM
│   ├── sheets_client.py            # Cliente Google Sheets
│   └── s3_client.py                # Cliente S3
├── requirements.txt
└── Dockerfile
```

## 🐛 Troubleshooting

### Error: "No module named 'google'"

Rebuild la imagen:
```bash
sam build --use-container
```

### Error: "Textract: InvalidParameterException"

Verifica que las imágenes sean válidas y < 5 MB.

### Error: "Bedrock: AccessDeniedException"

Solicita acceso a Bedrock en tu región:
1. Ve a AWS Console → Bedrock
2. Sección **Model access**
3. Solicita acceso a Claude models

### No se encontraron transacciones

Revisa los logs para ver el texto extraído:
```bash
aws logs tail /aws/lambda/penny-expense-processor --follow | grep "Extracted text"
```

### Google Sheets: "Permission denied"

Verifica que:
1. El Service Account tenga acceso al Sheet
2. El secreto en Secrets Manager sea válido
3. Google Sheets API esté habilitado

## 💰 Costos Estimados

Para **100 transacciones/mes** (~10 imágenes):

| Servicio | Costo mensual |
|----------|---------------|
| Lambda (2 GB, 60s) | $0.50 |
| Textract | $1.50 |
| Bedrock (Haiku) | $0.25 |
| S3 | $0.10 |
| SQS | $0.00 (free tier) |
| **Total** | **~$2.35/mes** |

Para reducir costos:
- Usa Textract solo cuando sea necesario
- Usa modelo Haiku en lugar de Sonnet
- Configura lifecycle en S3 para borrar imágenes rápido

## 📝 Formato de Google Sheet

El sheet debe tener estas columnas:

| Fecha | Método de Pago | Descripción | Categoría | Moneda | Monto |
|-------|----------------|-------------|-----------|--------|-------|
| 2024-01-15 | Visa | UBER TRIP | Transporte | PEN | 15.50 |
| 2024-01-16 | Master | RAPPI RESTAURANT | Comida | PEN | 45.00 |

## 🔐 Seguridad

1. **Credenciales**: NUNCA hardcodees tokens o secretos
2. **IAM Policies**: Usa el principio de mínimo privilegio
3. **Secrets Manager**: Rota las credenciales periódicamente
4. **S3**: Las imágenes se borran automáticamente después de 7 días
5. **VPC**: Considera desplegar en VPC para mayor seguridad

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs de CloudWatch
2. Verifica la configuración de variables de entorno
3. Prueba localmente con `sam local invoke`
4. Revisa las políticas de IAM

## 🚀 Próximas Mejoras

- [ ] Soporte para múltiples bancos (BCP, BBVA, etc.)
- [ ] Detección automática de tipo de banco
- [ ] Procesamiento de PDFs
- [ ] Dashboard de estadísticas
- [ ] Notificaciones por email
- [ ] Exportar a Excel
- [ ] Integración con sistemas contables
