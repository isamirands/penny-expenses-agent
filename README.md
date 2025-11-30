# Penny Expenses Agent

**Version 1** – A serverless solution that processes images of bank statements, extracts transaction data using an AWS Lambda function powered by Gemini AI, and stores the results in a Google Sheet. Users interact with the system via a Telegram bot that sends a photo of a bank statement; the bot forwards the image to the Lambda, which parses the receipt and appends a row to the sheet.

## Features (v1)
- Telegram bot receives a single image of a bank statement.
- AWS Lambda (Python 3.12) processes the image using Gemini 2.0 Flash.
- Extracted transaction data is written to a Google Sheet via the Google Sheets API.
- Fully server‑less – deployable with AWS SAM.

## Planned Enhancements (v2)
- Budget categorisation and consumption analytics.
- Batch processing of multiple statements.
- Automated alerts for overspending.

## Prerequisites
- **AWS CLI** and **AWS SAM CLI** installed.
- **Python 3.12** (or later).
- A **Telegram Bot Token** (create via @BotFather).
- A **Google Service Account** JSON key with access to the target Google Sheet.
- The target Google Sheet must be shared with the service account email.

## Setup Instructions
1. **Clone the repository**
   ```bash
   git clone https://github.com/isamirands/penny-expenses-agent.git
   cd penny-expenses-agent/penny-expense-processor/lambda-python3.12
   ```
2. **Create a virtual environment & install dependencies**
   ```bash
   python -m venv .venv
   .venv\Scripts\activate  # Windows
   pip install -r requirements.txt
   ```
3. **Configure environment variables**
   Create a file named `.env` (or set them in your SAM template) with the following keys:
   ```
   TELEGRAM_BOT_TOKEN=your_telegram_bot_token
   GOOGLE_SERVICE_ACCOUNT_JSON=path/to/your/service_account.json
   GOOGLE_SHEET_ID=your_google_sheet_id
   ```
4. **Deploy the Lambda with SAM**
   ```bash
   sam build
   sam deploy --guided
   ```
   The guided deployment will prompt for stack name, AWS region, and will create the required IAM roles.
5. **Set up the Telegram webhook**
   After deployment, obtain the API Gateway endpoint URL from the SAM output (e.g., `ApiUrl`). Then run:
   ```bash
   curl -F "url=YOUR_API_GATEWAY_ENDPOINT" https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook
   ```
   Replace `YOUR_API_GATEWAY_ENDPOINT` with the URL printed by SAM.
6. **Test the bot**
   - Open Telegram, start a chat with your bot, and send a photo of a bank statement.
   - The bot should reply with a confirmation and the transaction should appear as a new row in the Google Sheet.

## Development Workflow
- **Local testing**: Use `sam local invoke` to invoke the Lambda function with a test event JSON.
- **Debugging**: Logs are available via `sam logs -n ExpenseProcessorFunction --stack-name <your-stack>`.


