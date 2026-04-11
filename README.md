# Penny Expenses Agent

Sistema serverless que procesa fotos de estados de cuenta bancarios enviadas por Telegram, extrae las transacciones con IA y las guarda en Google Sheets.

## Arquitectura

```
Usuario (Telegram foto)
        │
        ▼
penny-expenses-webhook-stack   ← Lambda #1: recibe la foto, extrae texto con Textract,
        │                         guarda en DynamoDB, muestra botones de tarjeta
        ▼
    SQS Queue
        │
        ▼
penny-expense-processor        ← Lambda #2: clasifica transacciones con Gemini,
                                  guarda resultados en Google Sheets, notifica por Telegram
```

## Estructura del Repo

```
penny-expenses-agent/
├── penny-expenses-webhook-stack/     # Lambda #1 – webhook de Telegram
│   ├── src/
│   │   └── LambdaFunctionTelegramWebhook/
│   │       ├── lambda_function.py
│   │       └── utils/
│   ├── event_examples/               # Eventos de prueba para sam local invoke
│   ├── template.yaml
│   ├── samconfig.toml                # (gitignored – copiar desde .example)
│   ├── samconfig.toml.example
│   └── run_local.py
│
└── penny-expense-processor/
    └── lambda-python3.12/            # Lambda #2 – procesamiento de gastos
        ├── expense_processor/
        │   ├── app.py
        │   └── utils/
        ├── template.yaml
        └── samconfig.toml            # (gitignored – crear con sam deploy --guided)
```

## Pre-requisitos

- AWS CLI y SAM CLI instalados, credenciales configuradas (`aws configure`)
- Python 3.12
- Docker Desktop (para build del procesador)
- Token de Telegram bot (crear con @BotFather)
- Google Service Account con acceso al Sheet destino

## Deploy

Cada stack se despliega de forma independiente. **Primero el webhook, luego el procesador** (el procesador necesita el ARN de la SQS que crea el webhook).

### 1. Webhook Stack

```bash
cd penny-expenses-webhook-stack
cp samconfig.toml.example samconfig.toml
# Editar samconfig.toml con tu TelegramBotToken
sam build
sam deploy
```

Después del deploy, obtener la Function URL:
```bash
aws lambda get-function-url-config \
  --function-name penny-expenses-webhook \
  --query FunctionUrl --output text
```

Registrar el webhook en Telegram:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<FUNCTION_URL>"
```

### 2. Expense Processor

```bash
cd penny-expense-processor/lambda-python3.12
sam deploy --guided
# Parámetros requeridos:
#   ProcessingQueueArn: ARN de la SQS creada por el webhook stack
#   TelegramBotToken: Token del bot
#   GoogleSheetId: ID del Google Sheet
#   GoogleServiceAccountSecret: Nombre del secreto en AWS Secrets Manager
#   GeminiApiKey: API key de Google Gemini
```

#### Secreto de Google en AWS Secrets Manager

```bash
aws secretsmanager create-secret \
  --name penny-expense-google-service-account \
  --secret-string file://service-account-key.json \
  --region us-east-2
```

## Pruebas Locales

```bash
# Webhook stack
cd penny-expenses-webhook-stack
sam local invoke TelegramWebhookFunction -e event_examples/message_text.json
python run_local.py event_examples/message_photo.json

# Variables de entorno necesarias
export TELEGRAM_BOT_TOKEN="tu_token"
export IMAGES_TABLE_NAME="test_table"
```

## Logs

```bash
# Webhook
sam logs -n TelegramWebhookFunction --stack-name penny-expenses-webhook-stack --tail

# Procesador
aws logs tail /aws/lambda/penny-expense-processor --follow --region us-east-2
```

## Troubleshooting

| Error | Solución |
|-------|----------|
| `No module named 'google'` | `sam build --use-container` |
| `Bedrock: AccessDeniedException` | Solicitar acceso a modelos en AWS Bedrock Console |
| `Google Sheets: Permission denied` | Verificar que el Service Account tenga acceso al Sheet |
| `TABLE_NAME no configurada` | Verificar variable de entorno `IMAGES_TABLE_NAME` |
