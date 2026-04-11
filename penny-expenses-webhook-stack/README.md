# Telegram Webhook Lambda - Penny Expenses

Aplicación AWS SAM para desplegar una Lambda que funciona como webhook de Telegram para procesar recibos de gastos.

## 📁 Estructura del Proyecto

```
project-root/
│
├── template.yaml          # Template principal de SAM
├── src/
│   ├── LambdaFunctionTelegramWebhook/
│   │   ├── __init__.py
│   │   ├── lambda_function.py   # Código principal del webhook
│   │   └── utils/
│   │       ├── telegram.py      # Funciones auxiliares de Telegram
│   │       ├── dynamodb.py      # Funciones auxiliares para DynamoDB
│   │       └── __init__.py
│   └── requirements.txt
│
├── event_examples/
│   ├── message_text.json
│   ├── message_photo.json
│   └── callback.json
│
├── run_local.py           # Script para pruebas locales
└── README.md
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- **AWS CLI**: Necesario para interactuar con AWS desde la línea de comandos
- **AWS SAM CLI**: Versión 1.98+ requerida para construir y desplegar
- **Python 3.12**: Runtime de la Lambda
- **Docker**: Opcional, requerido para `sam local invoke`

### Instalación de Dependencias Locales

Para instalar las dependencias localmente (útil para desarrollo y pruebas):

```bash
pip install -r src/LambdaFunctionTelegramWebhook/requirements.txt -t src/LambdaFunctionTelegramWebhook/
```

O usando un entorno virtual:

```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
pip install -r src/requirements.txt
```

## 🏗️ Construcción y Despliegue

### Construir la aplicación

```bash
sam build
```

### Desplegar la aplicación

Primera vez (modo guiado):

```bash
sam deploy --guided
```

Este comando te pedirá:
- Stack Name: `penny-expenses-webhook-stack` (o el que prefieras)
- AWS Region: `us-east-2` (o tu región preferida)
- Parameter TelegramBotToken: Tu token del bot de Telegram
- Confirm changes before deploy: `Y`
- Allow SAM CLI IAM role creation: `Y`
- Disable rollback: `N`
- Save arguments to configuration file: `Y`

Despliegues posteriores:

```bash
sam deploy
```

### Obtener la URL del Function URL

Después del despliegue, obtén la URL del Function URL usando AWS CLI:

```bash
aws lambda get-function-url-config \
  --function-name penny-expenses-webhook \
  --query FunctionUrl \
  --output text
```

O desde la consola de AWS Lambda, ve a la función `penny-expenses-webhook` y busca la sección "Function URL".

## 🔗 Registrar el Webhook en Telegram

Una vez desplegada la función, registra la URL como webhook en Telegram:

```bash
curl -X POST "https://api.telegram.org/bot<TU_BOT_TOKEN>/setWebhook?url=<FUNCTION_URL>"
```

Reemplaza:
- `<TU_BOT_TOKEN>`: Tu token del bot de Telegram
- `<FUNCTION_URL>`: La URL del Function URL obtenida del despliegue

Ejemplo:

```bash
curl -X POST "https://api.telegram.org/bot123456:ABC-DEF/setWebhook?url=https://abc123xyz.lambda-url.us-east-2.on.aws/"
```

Para verificar que el webhook está configurado:

```bash
curl "https://api.telegram.org/bot<TU_BOT_TOKEN>/getWebhookInfo"
```

## 🧪 Pruebas Locales

### Usando SAM Local Invoke

```bash
sam local invoke TelegramWebhookFunction -e event_examples/message_text.json
```

### Usando el script run_local.py

```bash
# Probar con mensaje de texto
python run_local.py event_examples/message_text.json

# Probar con mensaje con foto
python run_local.py event_examples/message_photo.json

# Probar con callback query
python run_local.py event_examples/callback.json
```

**Nota**: Para pruebas locales, asegúrate de tener configuradas las variables de entorno:

```bash
export TELEGRAM_BOT_TOKEN="tu_token_aqui"
export IMAGES_TABLE_NAME="test_table"
```

O en Windows PowerShell:

```powershell
$env:TELEGRAM_BOT_TOKEN="tu_token_aqui"
$env:IMAGES_TABLE_NAME="test_table"
```

## 📋 Funcionalidades

La Lambda maneja los siguientes tipos de updates de Telegram:

### 1. Mensajes de Texto (`message.text`)

Cuando el usuario envía un mensaje de texto, el bot responde con:
- El número de imágenes registradas en ese chat
- Instrucciones para enviar una foto

### 2. Mensajes con Foto (`message.photo`)

Cuando el usuario envía una foto:
1. Envía mensaje de "⏳ Procesando imagen con Textract..."
2. Extrae los `file_id` de las imágenes
3. **Procesa la imagen con AWS Textract** para extraer:
   - 📅 Fecha de la transacción
   - 💰 Moneda (PEN/USD)
   - 📝 Descripción del comercio
   - 💵 Monto
4. Muestra los datos extraídos al usuario
5. Guarda los metadatos y datos extraídos en DynamoDB
6. Envía botones inline para seleccionar el tipo de tarjeta:
   - Visa
   - Master
   - Débito

### 3. Callback Queries (`callback_query`)

Cuando el usuario selecciona un botón:
1. Parsea el `callback_data` (formato: `CARD_<TYPE>|<chat_id>|<message_id>`)
2. Recupera los metadatos de las imágenes desde DynamoDB
3. Responde a la callback query
4. Envía confirmación al chat con:
   - Tipo de tarjeta seleccionada
   - Número de imágenes procesadas
   - ID del mensaje

## 🗄️ DynamoDB

La tabla `telegram-images-table` almacena:

- **Partition Key**: `chat_id` (String)
- **Sort Key**: `message_id` (String)
- **Atributos**:
  - `file_ids`: Lista de file_ids de las imágenes
  - `timestamp`: Timestamp de cuando se guardó
  - `extracted_text`: Texto completo extraído por Textract
  - `transactions`: Lista de transacciones detectadas con:
    - `description`: Descripción del comercio
    - `date`: Fecha de la transacción (YYYY-MM-DD)
    - `currency`: Moneda (PEN/USD)
    - `amount`: Monto de la transacción
  - `transaction_count`: Número de transacciones detectadas

## 🔧 Configuración

### Variables de Entorno

- `TELEGRAM_BOT_TOKEN`: Token del bot de Telegram (requerido)
- `IMAGES_TABLE_NAME`: Nombre de la tabla DynamoDB (configurado automáticamente)

### Permisos IAM

La función Lambda tiene los siguientes permisos:
- **CloudWatch Logs**: Para logging
- **DynamoDB**: Operaciones CRUD en la tabla de imágenes
- **Textract**: Para extracción de texto de imágenes (`DetectDocumentText`, `AnalyzeDocument`)

### Parámetros del Template

- `TelegramBotToken`: Token del bot (se pasa durante el despliegue)
- `ImagesTableName`: Nombre de la tabla DynamoDB (por defecto: `telegram-images-table`)

## 📝 Próximas Etapas

Este proyecto ya incluye extracción de texto con **AWS Textract** ✅

Las siguientes etapas incluirán:

1. ~~**Textract**: Extracción de texto de las imágenes~~ ✅ **COMPLETADO**
2. **LLM Classification**: Clasificación inteligente de gastos usando Claude/GPT
3. **Google Sheets Integration**: Guardar gastos automáticamente en una hoja de cálculo
4. **Reportes mensuales**: Resumen automático de gastos por mes/categoría

## 🐛 Troubleshooting

### Error: "TABLE_NAME no está configurada"

Asegúrate de que la variable de entorno `IMAGES_TABLE_NAME` esté configurada correctamente.

### Error: "Invalid request body"

Verifica que el webhook esté enviando los datos correctamente. Puedes revisar los logs de CloudWatch.

### Ver logs de la Lambda

```bash
sam logs -n TelegramWebhookFunction --stack-name penny-expenses-webhook-stack --tail
```

O desde la consola de AWS CloudWatch Logs.

## 📚 Recursos

- [AWS SAM Developer Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [AWS Lambda Function URLs](https://docs.aws.amazon.com/lambda/latest/dg/lambda-urls.html)
- [AWS DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/)
