"""
Lambda function para manejar webhooks de Telegram
"""
import os
import json
import base64
import logging
from utils.telegram import send_message, build_card_keyboard, answer_callback_query
from utils.dynamodb import save_images_metadata, get_images_metadata, count_images_by_chat
import boto3

sqs_client = boto3.client('sqs')

# Configurar logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Variables de entorno
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
TABLE_NAME = os.environ.get("IMAGES_TABLE_NAME", "")
QUEUE_URL = os.environ.get("PROCESSING_QUEUE_URL", "")


def parse_event(event):
    """
    Parsea el evento que llega desde Function URL
    Maneja diferentes formatos: string, JSON, base64
    """
    body = event.get("body")
    
    if not body:
        return None
    
    # Si viene como string JSON
    if isinstance(body, str):
        try:
            # Intentar parsear como JSON
            body = json.loads(body)
        except json.JSONDecodeError:
            # Si falla, podría venir codificado en base64
            try:
                body = base64.b64decode(body).decode("utf-8")
                body = json.loads(body)
            except Exception as e:
                logger.error(f"Error parsing body: {e}")
                return None
    
    return body


def handle_message_text(update):
    """
    Maneja mensajes de texto
    """
    message = update.get("message", {})
    chat_id = message.get("chat", {}).get("id")
    text = message.get("text", "").strip()
    message_id = message.get("message_id")
    
    if not chat_id:
        return
    
    logger.info(f"Received text message from chat {chat_id}: {text}")
    
    # Detectar saludos
    greetings = ["hola", "hi", "hello", "hey", "buenas", "buenos dias", "buenas tardes", "buenas noches", "/start"]
    text_lower = text.lower()
    
    if any(greeting in text_lower for greeting in greetings):
        # Mensaje de bienvenida
        welcome_text = (
            "👋 ¡Hola! Bienvenido a <b>Penny Expenses</b>\n\n"
            "Soy tu asistente para gestionar gastos de forma fácil y rápida.\n\n"
            "📸 <b>¿Cómo funciono?</b>\n"
            "1. Envíame una foto de tu recibo o ticket\n"
            "2. Selecciona el tipo de tarjeta usada\n"
            "3. ¡Listo! Guardaré la información\n\n"
            "💡 <b>Próximamente:</b>\n"
            "• Extracción automática de datos del recibo\n"
            "• Clasificación inteligente de gastos\n"
            "• Integración con Google Sheets\n\n"
            "¿Listo para comenzar? ¡Envía tu primer recibo! 📷"
        )
        send_message(chat_id, welcome_text)
        
        return {
            "statusCode": 200,
            "body": json.dumps({"ok": True})
        }
    
    # Para otros mensajes, mostrar estadísticas
    image_count = count_images_by_chat(chat_id)
    
    response_text = f"📊 Tienes {image_count} imagen(es) registrada(s) en este chat.\n\n"
    response_text += "Envía una foto de tu recibo para comenzar."
    
    send_message(chat_id, response_text)
    
    return {
        "statusCode": 200,
        "body": json.dumps({"ok": True})
    }


def handle_message_photo(update):
    """
    Lambda #1: Recibe foto, guarda metadata y muestra botones
    NO procesa la imagen aquí (eso lo hará Lambda #2)
    """
    message = update.get("message", {})
    chat_id = message.get("chat", {}).get("id")
    message_id = message.get("message_id")
    photos = message.get("photo", [])
    
    if not chat_id or not photos:
        return
    
    logger.info(f"Received photo message from chat {chat_id}, message_id: {message_id}")
    
    # Obtener TODOS los file_ids (varias resoluciones)
    file_ids = [photo.get("file_id") for photo in photos if photo.get("file_id")]
    
    if not file_ids:
        send_message(chat_id, "❌ No se pudo procesar la imagen.")
        return {
            "statusCode": 200,
            "body": json.dumps({"ok": False, "error": "No file_ids found"})
        }
    
    logger.info(f"Extracted {len(file_ids)} file_ids from photos")
    
    # Guardar metadata en DynamoDB
    try:
        save_images_metadata(chat_id, message_id, file_ids)
        logger.info(f"Saved metadata for chat {chat_id}, message {message_id}")
    except Exception as e:
        logger.error(f"Error saving metadata: {e}")
        send_message(chat_id, "❌ Error al guardar la imagen. Intenta nuevamente.")
        return {
            "statusCode": 500,
            "body": json.dumps({"ok": False, "error": str(e)})
        }
    
    # Enviar mensaje con botones para seleccionar tarjeta
    keyboard = build_card_keyboard(chat_id, message_id)
    response_text = "✅ Imagen recibida.\n\n👇 Selecciona el tipo de tarjeta:"
    
    send_message(chat_id, response_text, reply_markup=keyboard)
    
    return {
        "statusCode": 200,
        "body": json.dumps({"ok": True})
    }


def handle_callback_query(update):
    """
    Maneja callback queries (botones inline)
    """
    callback_query = update.get("callback_query", {})
    callback_query_id = callback_query.get("id")
    data = callback_query.get("data", "")
    chat_id = callback_query.get("message", {}).get("chat", {}).get("id")
    message_id = callback_query.get("message", {}).get("message_id")
    
    if not callback_query_id or not data:
        return
    
    logger.info(f"Received callback query: {data}")
    
    # Parsear callback_data: CARD_<TYPE>|<chat_id>|<message_id>
    parts = data.split("|")
    if len(parts) != 3 or not parts[0].startswith("CARD_"):
        answer_callback_query(callback_query_id, "❌ Error en los datos recibidos.")
        return {
            "statusCode": 200,
            "body": json.dumps({"ok": False, "error": "Invalid callback data"})
        }
    
    card_type = parts[0].replace("CARD_", "")
    callback_chat_id = parts[1]
    callback_message_id = parts[2]
    
    # Verificar que el chat_id coincida
    if str(chat_id) != str(callback_chat_id):
        answer_callback_query(callback_query_id, "❌ Error: chat_id no coincide.")
        return {
            "statusCode": 200,
            "body": json.dumps({"ok": False, "error": "Chat ID mismatch"})
        }
    
    # Obtener metadata de las imágenes desde DynamoDB
    try:
        # Verificar que QUEUE_URL esté configurada
        if not QUEUE_URL:
            logger.error("PROCESSING_QUEUE_URL environment variable is not set")
            answer_callback_query(callback_query_id, "❌ Error de configuración del sistema.")
            send_message(chat_id, "❌ Error de configuración. Por favor, contacta al administrador.")
            return {
                "statusCode": 500,
                "body": json.dumps({"ok": False, "error": "Queue URL not configured"})
            }
        
        metadata = get_images_metadata(callback_chat_id, callback_message_id)
        if not metadata:
            answer_callback_query(callback_query_id, "❌ No se encontraron imágenes para este mensaje.")
            return {
                "statusCode": 200,
                "body": json.dumps({"ok": False, "error": "Metadata not found"})
            }
        
        file_ids = metadata.get("file_ids", [])
        image_count = len(file_ids)
        
        # Responder a la callback query
        answer_callback_query(
            callback_query_id,
            f"✅ Procesando {image_count} imagen(es)..."
        )
        
        # Preparar mensaje para SQS (Lambda #2)
        sqs_message = {
            "chat_id": callback_chat_id,
            "message_id": callback_message_id,
            "card_type": card_type,
            "file_ids": file_ids,
            "bot_token": BOT_TOKEN,
            "image_count": image_count
        }
        
        # Publicar a SQS para que Lambda #2 lo procese
        sqs_response = sqs_client.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps(sqs_message),
            MessageAttributes={
                'card_type': {
                    'StringValue': card_type,
                    'DataType': 'String'
                },
                'chat_id': {
                    'StringValue': str(callback_chat_id),
                    'DataType': 'String'
                }
            }
        )
        
        logger.info(f"Published to SQS: MessageId={sqs_response['MessageId']}, card_type={card_type}, images={image_count}")
        
        # Enviar mensaje al usuario confirmando que está procesando
        confirmation_text = (
            f"✅ <b>Has seleccionado: {card_type}</b>\n\n"
            f"⏳ Procesando {image_count} imagen(es)...\n\n"
            f"Te notificaré cuando termine el procesamiento."
        )
        
        send_message(chat_id, confirmation_text)
        
        logger.info(f"Callback processed: card_type={card_type}, chat_id={callback_chat_id}, message_id={callback_message_id}")
        
    except Exception as e:
        logger.error(f"Error processing callback: {e}", exc_info=True)
        answer_callback_query(callback_query_id, "❌ Error al procesar la selección.")
        send_message(chat_id, "❌ Ocurrió un error. Por favor, intenta nuevamente.")
        return {
            "statusCode": 500,
            "body": json.dumps({"ok": False, "error": str(e)})
        }
    
    return {
        "statusCode": 200,
        "body": json.dumps({"ok": True})
    }


def lambda_handler(event, context):
    """
    Handler principal de la Lambda
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Parsear el evento
        body = parse_event(event)
        
        if not body:
            logger.error("Could not parse event body")
            return {
                "statusCode": 400,
                "body": json.dumps({"ok": False, "error": "Invalid request body"})
            }
        
        # Verificar que sea un update de Telegram
        if "update_id" not in body:
            logger.warning("Event is not a Telegram update")
            return {
                "statusCode": 200,
                "body": json.dumps({"ok": True, "message": "Not a Telegram update"})
            }
        
        update = body
        
        # Manejar diferentes tipos de updates
        if "callback_query" in update:
            return handle_callback_query(update)
        elif "message" in update:
            message = update.get("message", {})
            
            # Mensaje con foto
            if "photo" in message:
                return handle_message_photo(update)
            # Mensaje de texto
            elif "text" in message:
                return handle_message_text(update)
        
        # Update no reconocido
        logger.info("Unhandled update type")
        return {
            "statusCode": 200,
            "body": json.dumps({"ok": True, "message": "Unhandled update type"})
        }
        
    except Exception as e:
        logger.error(f"Error in lambda_handler: {e}", exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps({"ok": False, "error": str(e)})
        }

