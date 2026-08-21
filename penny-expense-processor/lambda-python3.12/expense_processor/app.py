"""
Penny Expense Processor Lambda Function
Lambda #2: Procesa imágenes usando Gemini 2.0 Flash y guarda en Google Sheets
"""
import os
import json
import logging
from typing import List, Dict, Any
from datetime import datetime

# Import utility modules
from utils.telegram_client import TelegramClient
from utils.gemini_client import GeminiClient
from utils.sheets_client import SheetsClient
from utils.s3_client import S3Client

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
GOOGLE_SERVICE_ACCOUNT_SECRET = os.environ.get("GOOGLE_SERVICE_ACCOUNT_SECRET", "")
GOOGLE_SHEET_ID = os.environ.get("GOOGLE_SHEET_ID", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
# Fixed dashboard user id (email) stamped on every row this bot writes —
# Penny has no per-user auth, so all bot-authored expenses share one owner.
DASHBOARD_USER_ID = os.environ.get("DASHBOARD_USER_ID", "")

# Get S3 bucket name from environment or construct from account ID
IMAGES_BUCKET: str = os.environ.get("IMAGES_BUCKET_NAME", "")
if not IMAGES_BUCKET:
    # Will be set dynamically if needed
    import boto3
    sts = boto3.client('sts')
    account_id = sts.get_caller_identity()['Account']
    IMAGES_BUCKET = f"penny-expense-images-{account_id}"


def lambda_handler(event, context):
    """
    Lambda handler for processing expense images from SQS
    
    Parameters
    ----------
    event: dict, required
        SQS event containing message from Lambda #1
        
    context: object, required
        Lambda Context runtime methods and attributes
        
    Returns
    ------
    dict: Processing result
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Validate environment variables
        if not all([BOT_TOKEN, GOOGLE_SERVICE_ACCOUNT_SECRET, GOOGLE_SHEET_ID, GEMINI_API_KEY, DASHBOARD_USER_ID]):
            logger.error("Missing required environment variables")
            return {
                "statusCode": 500,
                "body": json.dumps({
                    "error": "Missing configuration"
                })
            }
        
        # Process SQS records
        for record in event.get('Records', []):
            try:
                process_expense_message(record)
            except Exception as e:
                logger.error(f"Error processing record: {e}", exc_info=True)
                # Continue with next record
        
        return {
            "statusCode": 200,
            "body": json.dumps({
                "message": "Processing completed"
            })
        }
        
    except Exception as e:
        logger.error(f"Error in lambda_handler: {e}", exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e)
            })
        }


def process_expense_message(record: Dict[str, Any]):
    """
    Process a single SQS message containing expense data
    
    Args:
        record: SQS record
    """
    try:
        # Parse message body
        message_body = json.loads(record['body'])
        
        chat_id = message_body.get('chat_id')
        message_id = message_body.get('message_id')
        card_type = message_body.get('card_type')
        file_ids = message_body.get('file_ids', [])
        
        logger.info(f"Processing expense: chat_id={chat_id}, card_type={card_type}, images={len(file_ids)}")
        
        if not all([chat_id, card_type, file_ids]):
            raise ValueError("Missing required fields in message")
        
        # Initialize clients
        telegram_client = TelegramClient(BOT_TOKEN)
        gemini_client = GeminiClient(GEMINI_API_KEY)
        sheets_client = SheetsClient(GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_SECRET, DASHBOARD_USER_ID)
        s3_client = S3Client(IMAGES_BUCKET)
        
        # Process each image
        all_transactions = []
        
        for idx, file_id in enumerate(file_ids):
            try:
                logger.info(f"Processing image {idx + 1}/{len(file_ids)}: {file_id}")
                
                # Step 1: Download image from Telegram
                image_bytes = telegram_client.download_image(file_id)
                
                # Step 2: Optionally save to S3 for debugging/archival
                s3_key = f"expenses/{chat_id}/{message_id}/{idx}_{file_id}.jpg"
                s3_client.upload_image(s3_key, image_bytes)
                
                # Step 3: Extract expenses with Gemini
                logger.info(f"About to call Gemini extract_expenses for image {idx + 1}")
                logger.info(f"Image bytes size: {len(image_bytes)} bytes")
                extracted_data = gemini_client.extract_expenses(image_bytes)
                
                logger.info(f"Gemini returned data: {extracted_data}")
                logger.info(f"Extracted data type: {type(extracted_data)}")
                logger.info(f"Extracted data keys: {list(extracted_data.keys()) if isinstance(extracted_data, dict) else 'Not a dict'}")
                
                transactions = extracted_data.get('transacciones', [])
                
                logger.info(f"Gemini extracted {len(transactions)} transactions from image {idx + 1}")
                if transactions:
                    logger.info(f"Sample transaction: {transactions[0]}")
                else:
                    logger.warning(f"No transactions found in extracted_data for image {idx + 1}")
                
                # Transform Gemini response (Spanish field names) to expected format (English field names)
                normalized_transactions = []
                for i, tx in enumerate(transactions):
                    # Get values, ensuring we don't have None
                    fecha = tx.get('fecha')
                    descripcion = tx.get('descripcion')
                    categoria = tx.get('categoria', 'Otros')
                    moneda_raw = tx.get('moneda', 'PEN')  # Get currency from each transaction
                    # Gemini is prompted to return "SOL" for soles, but the dashboard's
                    # Currency type only knows "PEN" — normalize here.
                    moneda = 'PEN' if str(moneda_raw).upper() == 'SOL' else str(moneda_raw)
                    monto = tx.get('monto')
                    
                    # Skip transactions with missing critical fields
                    if not fecha or not descripcion or monto is None:
                        logger.warning(f"Skipping incomplete transaction {i+1}: fecha={fecha}, descripcion={descripcion}, monto={monto}")
                        continue
                    
                    normalized_tx = {
                        'date': str(fecha) if fecha else '',
                        'description': str(descripcion) if descripcion else '',
                        'category': str(categoria) if categoria else 'Otros',
                        'currency': moneda or 'PEN',  # Use per-transaction currency
                        'amount': abs(float(monto)) if monto is not None else 0.0
                    }
                    normalized_transactions.append(normalized_tx)
                    logger.info(f"Normalized transaction {i+1}: date={normalized_tx['date']}, description={normalized_tx['description']}, currency={normalized_tx['currency']}, amount={normalized_tx['amount']}")
                
                logger.info(f"Normalized {len(normalized_transactions)} transactions from image {idx + 1}")
                
                # Add to all transactions
                all_transactions.extend(normalized_transactions)
                
            except Exception as e:
                logger.error(f"Error processing image {file_id}: {e}", exc_info=True)
                # Continue with next image
        
        if not all_transactions:
            logger.warning("No transactions found in any image")
            telegram_client.send_error_message(
                chat_id,
                "No se encontraron transacciones en las imágenes. Verifica que sean capturas de estado de cuenta."
            )
            return
        
        logger.info(f"Total transactions found: {len(all_transactions)}")
        
        # Filter out incomplete transactions (missing date, description, or amount)
        valid_transactions = []
        for i, tx in enumerate(all_transactions):
            if not tx.get('date') or not tx.get('description') or tx.get('amount') is None:
                logger.warning(f"Skipping invalid transaction {i+1}: {json.dumps(tx, indent=2, ensure_ascii=False)}")
                continue
            valid_transactions.append(tx)
        
        logger.info(f"Total valid transactions to write: {len(valid_transactions)}")
        
        if not valid_transactions:
            logger.warning("No valid transactions to write after validation")
            telegram_client.send_error_message(
                chat_id,
                "No se encontraron transacciones válidas en las imágenes."
            )
            return
        
        # Step 4: Write to Google Sheets ("Expenses" tab — the dashboard's schema)
        sheets_client.create_expenses_sheet_if_not_exists()
        rows_added = sheets_client.append_expenses(
            valid_transactions,
            card_type
        )
        
        logger.info(f"Added {rows_added} rows to Google Sheets")
        
        # Step 5: Send success message to user
        telegram_client.send_success_message(
            chat_id,
            len(valid_transactions),
            card_type
        )
        
        logger.info("Expense processing completed successfully")
        
    except Exception as e:
        logger.error(f"Error processing expense message: {e}", exc_info=True)
        
        # Try to send error message to user
        try:
            message_body = json.loads(record['body'])
            chat_id = message_body.get('chat_id')
            if chat_id:
                telegram_client = TelegramClient(BOT_TOKEN)
                telegram_client.send_error_message(
                    chat_id,
                    f"Error: {str(e)}"
                )
        except:
            pass
        
        raise

