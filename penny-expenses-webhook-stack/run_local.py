"""
Script para probar la Lambda localmente
"""
import json
import os
import sys

# Agregar el directorio de la función al path
lambda_dir = os.path.join(os.path.dirname(__file__), "src", "LambdaFunctionTelegramWebhook")
sys.path.insert(0, lambda_dir)

# Configurar variables de entorno (usar valores de prueba)
os.environ["TELEGRAM_BOT_TOKEN"] = os.environ.get("TELEGRAM_BOT_TOKEN", "test_token")
os.environ["IMAGES_TABLE_NAME"] = os.environ.get("IMAGES_TABLE_NAME", "test_table")

# Importar el handler
import lambda_function
lambda_handler = lambda_function.lambda_handler

def test_event(event_file):
    """
    Prueba un evento desde un archivo JSON
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
    
    try:
        result = lambda_handler(event, None)
        print(f"\nResult:")
        print(json.dumps(result, indent=2))
        print(f"\n{'='*60}\n")
    except Exception as e:
        print(f"\nError: {e}")
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

