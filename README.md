# Penny Expenses Agent

A Telegram bot that reads photos of bank statements, extracts transactions using AI, and saves them automatically to a Google Sheet — no manual data entry needed.
<p align="center">
  <img src="https://github.com/user-attachments/assets/e8bddd6f-7a8d-4ed6-a56d-a5468e29dd18" width="45%" />
  <img src="https://github.com/user-attachments/assets/c775ac04-1f59-441e-b9dc-c203ab850fd4" width="45%" />
</p>

## Tech Stack

**AWS:** Lambda · SQS · DynamoDB · Secrets Manager · SAM

**Other:** Python 3.12 · Google Gemini AI · Google Sheets API · Telegram Bot API

## How It Works

1. You send a photo of your bank statement to the Telegram bot
2. It shows you inline buttons to select the card type (Visa / Mastercard / Debit)
3. Once you confirm, the photo is sent to a processing queue (**AWS SQS**)
4. A second service picks it up, classifies each transaction with **Gemini AI**, and writes the results to your **Google Sheet**
5. You get a Telegram notification when it's done

## Dashboard

A web dashboard (`penny-expenses-ui-stack/`) lets you browse, filter, chart, and
fully edit your expenses (create/edit/delete, not just read-only) without opening
the Google Sheet. It's a React + TanStack Start app backed by a small Google Apps
Script Web App instead of AWS — see the "3. Dashboard" section below to run it.

It currently manages its **own** `"Expenses"` tab (with its own schema: per-row
ID, user, and reimbursable-amount fields) rather than the bot's `"Gastos"` tab —
the two are not yet unified, so the dashboard's data is separate from what the
bot writes. Reconciling them is a future step.

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
└─────────────┬───────────────┘
              │
       Google Sheet ("Gastos")

┌─────────────────────────────┐
│  penny-expenses-ui-stack    │  React + TanStack Start (runs locally)
│                             │  Talks to a Google Apps Script Web App,
│                             │  reads/writes its own "Expenses" tab
│                             │  (separate sheet/tab from "Gastos" for now,
│                             │  not connected to the bot's flow above)
└─────────────────────────────┘
```

## AWS Services

| Service | Purpose |
|---------|---------|
| **Lambda** | Runs the application code without managing servers |
| **SQS** | Queue that decouples the two Lambdas — the webhook enqueues work, the processor consumes it |
| **DynamoDB** | Stores image metadata between the two processing steps |
| **Secrets Manager** | Stores Google Service Account credentials securely |
| **SAM** | Infrastructure-as-code framework to build and deploy the webhook and processor stacks |

The dashboard (`penny-expenses-ui-stack/`) doesn't use AWS — it's a Node app backed by Google Apps Script instead (see [Dashboard](#dashboard)).

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
├── penny-expense-processor/
│   └── lambda-python3.12/            # Lambda #2 — transaction processor
│       ├── expense_processor/
│       │   ├── app.py
│       │   └── utils/               # Gemini, Sheets, Telegram, S3 helpers
│       ├── template.yaml
│       ├── samconfig.toml            # (gitignored — copy from .example)
│       └── samconfig.toml.example
│
└── penny-expenses-ui-stack/          # Dashboard — React + TanStack Start
    ├── src/
    │   ├── routes/                   # index (home), gastos, insights, perfil
    │   ├── components/               # dashboard/expenses/charts/navigation/ui
    │   ├── services/                 # expensesService.ts (repository selection),
    │   │                             # googleSheetsService.ts, mockExpenseRepository.ts
    │   └── lib/expenses.functions.ts # server function proxying to Apps Script
    ├── apps-script/Code.gs           # Google Apps Script Web App backend
    ├── .env.example                  # APPS_SCRIPT_URL / APPS_SCRIPT_TOKEN
    └── package.json
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

### 3. Dashboard

The dashboard's backend is a Google Apps Script Web App, deployed by hand (no
AWS/SAM involved):

1. Create a Google Sheet with a tab named `Expenses` (or let the script create
   it on first request).
2. Open **Extensions > Apps Script** on that sheet, paste in the contents of
   `penny-expenses-ui-stack/apps-script/Code.gs`, and change `SHARED_TOKEN` to
   a long random secret.
3. **Deploy > New deployment > Web app**, execute as yourself, access "Anyone".
4. Copy the resulting `/exec` URL and your token.

Then run the app locally:

```bash
cd penny-expenses-ui-stack
cp .env.example .env
# Fill in APPS_SCRIPT_URL and APPS_SCRIPT_TOKEN from step 4 above
bun install   # or: npm install
bun run dev   # or: npm run dev
```

Open the printed local URL, enter a name/email to identify yourself, and start
tracking expenses. (Optional: run `seedDemoData()` once from the Apps Script
editor to populate sample rows.)

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
