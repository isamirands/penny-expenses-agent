"""
Script para probar la Lambda localmente con mocks
"""
import json
import os
import sys
from unittest.mock import patch, MagicMock

# Agregar el directorio de la función al path
lambda_dir = os.path.join(os.path.dirname(__file__), "src", "LambdaFunctionTelegramWebhook")
sys.path.insert(0, lambda_dir)

# Configurar variables de entorno (usar valores de prueba)
os.environ["TELEGRAM_BOT_TOKEN"] = os.environ.get("TELEGRAM_BOT_TOKEN", "test_token_12345")
os.environ["IMAGES_TABLE_NAME"] = os.environ.get("IMAGES_TABLE_NAME", "test_table")
os.environ["PROCESSING_QUEUE_URL"] = os.environ.get("PROCESSING_QUEUE_URL", "https://sqs.us-east-2.amazonaws.com/test/test-queue")

def test_event(event_file):
    """
    Prueba un evento desde un archivo JSON con mocks
    """
    print(f"\n{'='*60}")
    print(f"Testing event from: {event_file}")
    print(f"{'='*60}\n")
    
    with open(event_file, "r", encoding="utf-8") as f:
        event_data = json.load(f)
    
    # Simular el formato de evento de Function URL
    event = {
        "body": json.dumps(event_data),
        "headers": {
            "Content-Type": "application/json"
        },
        "requestContext": {
            "requestId": "test-request-id"
        }
    }
    
    # Mock de las funciones de Telegram
    mock_telegram_response = {"ok": True, "result": {"message_id": 123}}
    
    # Mock de las funciones de DynamoDB
    mock_dynamodb_count = 5
    mock_dynamodb_metadata = {
        "chat_id": "123456789",
        "message_id": "2",
        "file_ids": ["file_id_1", "file_id_2"],
        "timestamp": 1234567890,
        "transactions": [
            {
                "description": "SUPERMERCADO CANDY S",
                "date": "2024-11-27",
                "currency": "PEN",
                "amount": "60.61"
            },
            {
                "description": "PAGO WEB DESACOPLADO",
                "date": "2024-11-27",
                "currency": "USD",
                "amount": "190.71"
            }
        ]
    }
    
    # Mock de Textract
    mock_textract_result = {
        "raw_text": "SUPERMERCADO CANDY S\n27 Noviembre\nS/ -60.61\nPAGO WEB DESACOPLADO\n27 Noviembre\n$ -190.71",
        "lines": [
            "SUPERMERCADO CANDY S",
            "27 Noviembre",
            "S/ -60.61",
            "PAGO WEB DESACOPLADO",
            "27 Noviembre",
            "$ -190.71"
        ],
        "transactions": [
            {
                "description": "SUPERMERCADO CANDY S",
                "date": "2024-11-27",
                "currency": "PEN",
                "amount": "60.61",
                "raw_line": "SUPERMERCADO CANDY S 27 Noviembre S/ -60.61"
            },
            {
                "description": "PAGO WEB DESACOPLADO",
                "date": "2024-11-27",
                "currency": "USD",
                "amount": "190.71",
                "raw_line": "PAGO WEB DESACOPLADO 27 Noviembre $ -190.71"
            }
        ],
        "transaction_count": 2
    }
    
    with patch('utils.telegram.telegram_request') as mock_telegram, \
         patch('utils.dynamodb.table') as mock_table, \
         patch('lambda_function.sqs_client') as mock_sqs:
        
        # Configurar el mock de Telegram
        mock_telegram.return_value = mock_telegram_response
        
        # Configurar el mock de DynamoDB
        mock_table.query.return_value = {"Count": mock_dynamodb_count}
        mock_table.put_item.return_value = {"ResponseMetadata": {"HTTPStatusCode": 200}}
        mock_table.get_item.return_value = {"Item": mock_dynamodb_metadata}
        
        # Configurar el mock de SQS
        mock_sqs.send_message.return_value = {"MessageId": "test-message-id-12345"}
        
        try:
            # Importar el handler después de configurar los mocks
            import lambda_function
            lambda_handler = lambda_function.lambda_handler
            
            result = lambda_handler(event, None)
            
            print(f"[SUCCESS] Lambda ejecutada exitosamente!\n")
            print(f"Result:")
            print(json.dumps(result, indent=2))
            
            # Mostrar llamadas realizadas
            print(f"\n{'='*60}")
            print("Llamadas realizadas:")
            print(f"{'='*60}")
            
            if mock_telegram.called:
                print(f"\n[TELEGRAM API] - {mock_telegram.call_count} llamada(s):")
                for i, call in enumerate(mock_telegram.call_args_list, 1):
                    method, payload = call[0]
                    print(f"  {i}. Metodo: {method}")
                    print(f"     Payload: {json.dumps(payload, indent=6)}")
            
            if mock_table.query.called:
                print(f"\n[DYNAMODB QUERY] - {mock_table.query.call_count} llamada(s)")
                print(f"     Retorno: {mock_dynamodb_count} imagen(es)")
            
            if mock_table.put_item.called:
                print(f"\n[DYNAMODB PUT] - {mock_table.put_item.call_count} llamada(s)")
                for i, call in enumerate(mock_table.put_item.call_args_list, 1):
                    item = call[1].get('Item', {})
                    print(f"  {i}. Item guardado:")
                    print(f"     chat_id: {item.get('chat_id')}")
                    print(f"     message_id: {item.get('message_id')}")
                    print(f"     file_ids: {item.get('file_ids')}")
            
            if mock_table.get_item.called:
                print(f"\n[DYNAMODB GET] - {mock_table.get_item.call_count} llamada(s)")
                print(f"     Retorno: {len(mock_dynamodb_metadata.get('file_ids', []))} file_id(s)")
            
            if mock_sqs.send_message.called:
                print(f"\n[SQS PUBLISH] - {mock_sqs.send_message.call_count} llamada(s)")
                for i, call in enumerate(mock_sqs.send_message.call_args_list, 1):
                    message_body = json.loads(call[1]['MessageBody'])
                    print(f"  {i}. Mensaje enviado a SQS:")
                    print(f"     Card Type: {message_body.get('card_type')}")
                    print(f"     Chat ID: {message_body.get('chat_id')}")
                    print(f"     Images: {message_body.get('image_count')}")
                    print(f"     File IDs: {len(message_body.get('file_ids', []))} archivo(s)")
            
            print(f"\n{'='*60}\n")
            
        except Exception as e:
            print(f"\n[ERROR] {e}")
            import traceback
            traceback.print_exc()
            print(f"\n{'='*60}\n")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        event_file = sys.argv[1]
    else:
        # Por defecto, usar message_text.json
        event_file = "event_examples/message_text.json"
    
    if not os.path.exists(event_file):
        print(f"Error: File not found: {event_file}")
        sys.exit(1)
    
    test_event(event_file)

