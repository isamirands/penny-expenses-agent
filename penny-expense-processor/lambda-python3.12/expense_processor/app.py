"""
Penny Expense Processor Lambda Function
Lambda #2: Procesa imágenes, extrae texto, clasifica y guarda en Google Sheets
"""
import os
import json
import logging
from typing import List, Dict, Any
from datetime import datetime

# Import utility modules
from utils.telegram_client import TelegramClient
from utils.tesseract_client import TesseractClient
from utils.transaction_parser import TransactionParser
from utils.bedrock_classifier import BedrockClassifier
from utils.sheets_client import SheetsClient
from utils.s3_client import S3Client

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Environment variables
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
GOOGLE_SERVICE_ACCOUNT_SECRET = os.environ.get("GOOGLE_SERVICE_ACCOUNT_SECRET", "")
GOOGLE_SHEET_ID = os.environ.get("GOOGLE_SHEET_ID", "")
BEDROCK_MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "anthropic.claude-3-haiku-20240307-v1:0")

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
        if not all([BOT_TOKEN, GOOGLE_SERVICE_ACCOUNT_SECRET, GOOGLE_SHEET_ID]):
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
        tesseract_client = TesseractClient()
        parser = TransactionParser()
        classifier = BedrockClassifier(BEDROCK_MODEL_ID)
        sheets_client = SheetsClient(GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_SECRET)
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
                
                # Step 3: Extract text with Tesseract OCR
                extracted_data = tesseract_client.extract_text_with_tables(image_bytes)
                extracted_text = extracted_data['text']
                
                logger.info(f"Extracted text length: {len(extracted_text)} characters")
                logger.info(f"Extracted text: {repr(extracted_text)}")
                
                # Step 4: Parse transactions from text
                transactions = parser.parse_transactions(extracted_text)
                
                logger.info(f"Parsed {len(transactions)} transactions from image {idx + 1}")
                
                # Add to all transactions
                all_transactions.extend(transactions)
                
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
        
        # Step 5: Classify transactions with LLM
        classified_transactions = classifier.classify_transactions_batch(all_transactions)
        
        # Step 6: Write to Google Sheets
        sheets_client.create_sheet_if_not_exists("Gastos")
        rows_added = sheets_client.append_transactions(
            classified_transactions,
            card_type,
            "Gastos"
        )
        
        logger.info(f"Added {rows_added} rows to Google Sheets")
        
        # Step 7: Send success message to user
        telegram_client.send_success_message(
            chat_id,
            len(classified_transactions),
            card_type
        )
        
        # Cleanup: Delete images from S3 (optional, lifecycle policy will handle it)
        # for idx, file_id in enumerate(file_ids):
        #     s3_key = f"expenses/{chat_id}/{message_id}/{idx}_{file_id}.jpg"
        #     s3_client.delete_image(s3_key)
        
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


def test_handler(event, context):
    """
    Test handler for local testing
    
    Example event:
    {
        "chat_id": "123456789",
        "message_id": "1",
        "card_type": "Visa Oro 1",
        "file_ids": ["AgACAgEAAxkBAAIBYl..."]
    }
    """
    # Create SQS-like event structure
    sqs_event = {
        "Records": [
            {
                "body": json.dumps(event)
            }
        ]
    }
    
    return lambda_handler(sqs_event, context)

