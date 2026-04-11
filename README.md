# Penny Expenses Agent

A Telegram bot that reads photos of bank statements, extracts transactions using AI, and saves them automatically to a Google Sheet — no manual data entry needed.

## Tech Stack

**AWS:** Lambda · SQS · DynamoDB · Secrets Manager · SAM

**Other:** Python 3.12 · Google Gemini AI · Google Sheets API · Telegram Bot API

## How It Works

1. You send a photo of your bank statement to the Telegram bot
2. It shows you inline buttons to select the card type (Visa / Mastercard / Debit)
3. Once you confirm, the photo is sent to a processing queue (**AWS SQS**)
4. A second service picks it up, classifies each transaction with **Gemini AI**, and writes the results to your **Google Sheet**
5. You get a Telegram notification when it's done

## Architecture

```
User (Telegram photo)
        │
        ▼
┌─────────────────────────────┐
│  penny-expenses-webhook-    │  AWS Lambda + Function URL
│  stack                      │  Receives photo, stores metadata
│                             │  in DynamoDB, shows card buttons,
│                             │  sends message to SQS queue
└─────────────┬───────────────┘
              │
        SQS Queue
              │
              ▼
┌─────────────────────────────┐
│  penny-expense-processor    │  AWS Lambda (Docker container)
│                             │  Classifies transactions with Gemini AI,
│                             │  writes rows to Google Sheets,
│                             │  notifies user via Telegram
└─────────────────────────────┘
```

## AWS Services

| Service | Purpose |
|---------|---------|
| **Lambda** | Runs the application code without managing servers |
| **SQS** | Queue that decouples the two Lambdas — the webhook enqueues work, the processor consumes it |
| **DynamoDB** | Stores image metadata between the two processing steps |
| **Secrets Manager** | Stores Google Service Account credentials securely |
| **SAM** | Infrastructure-as-code framework to build and deploy both stacks |

## Repository Structure

```
penny-expenses-agent/
├── penny-expenses-webhook-stack/     # Lambda #1 — Telegram webhook
│   ├── src/
│   │   └── LambdaFunctionTelegramWebhook/
│   │       ├── lambda_function.py
│   │       └── utils/               # Telegram, DynamoDB, Textract helpers
│   ├── event_examples/               # Sample events for local testing
│   ├── template.yaml                 # SAM infrastructure definition
│   ├── samconfig.toml                # (gitignored — copy from .example)
│   ├── samconfig.toml.example
│   └── run_local.py
│
└── penny-expense-processor/
    └── lambda-python3.12/            # Lambda #2 — transaction processor
        ├── expense_processor/
        │   ├── app.py
        │   └── utils/               # Gemini, Sheets, Telegram, S3 helpers
        ├── template.yaml
        ├── samconfig.toml            # (gitignored — copy from .example)
        └── samconfig.toml.example
```

## Prerequisites

- AWS CLI and SAM CLI installed, credentials configured (`aws configure`)
- Python 3.12
- Docker Desktop (required to build the processor Lambda)
- Telegram Bot Token — create one with [@BotFather](https://t.me/BotFather)
- Google Service Account with access to the target Google Sheet
- Google Gemini API key

## Deploy

The two stacks are deployed independently. **Deploy the webhook first** — the processor needs the SQS queue ARN that the webhook stack creates.

### 1. Webhook Stack

```bash
cd penny-expenses-webhook-stack
cp samconfig.toml.example samconfig.toml
# Edit samconfig.toml and set your TelegramBotToken
sam build
sam deploy
```

After deploying, get the Function URL and register it as a Telegram webhook:

```bash
# Get the Function URL
aws lambda get-function-url-config \
  --function-name penny-expenses-webhook \
  --query FunctionUrl --output text

# Register with Telegram
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook?url=<FUNCTION_URL>"
```

### 2. Expense Processor

First, store your Google Service Account credentials in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name penny-expense-google-service-account \
  --secret-string file://service-account-key.json \
  --region us-east-2
```

Then deploy:

```bash
cd penny-expense-processor/lambda-python3.12
cp samconfig.toml.example samconfig.toml
# Edit samconfig.toml with your values (SQS ARN, tokens, Sheet ID, Gemini key)
sam build --use-container
sam deploy
```

## Local Testing

```bash
cd penny-expenses-webhook-stack

# Set required env vars
export TELEGRAM_BOT_TOKEN="your_token"
export IMAGES_TABLE_NAME="test_table"

# Run with SAM
sam local invoke TelegramWebhookFunction -e event_examples/message_text.json

# Or with the local script
python run_local.py event_examples/message_photo.json
```

## Logs

```bash
# Webhook
sam logs -n TelegramWebhookFunction --stack-name penny-expenses-webhook-stack --tail

# Processor
aws logs tail /aws/lambda/penny-expense-processor --follow --region us-east-2
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| `No module named 'google'` | Run `sam build --use-container` |
| `Google Sheets: Permission denied` | Make sure the Service Account has Editor access to the Sheet |
| `TABLE_NAME not set` | Check that `IMAGES_TABLE_NAME` environment variable is configured |
