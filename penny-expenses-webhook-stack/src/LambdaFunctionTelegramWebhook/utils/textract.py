"""
Funciones auxiliares para AWS Textract
"""
import os
import boto3
import re
from datetime import datetime

textract_client = boto3.client('textract')
s3_client = boto3.client('s3')

# Bucket temporal para procesar imágenes (lo crearemos)
TEMP_BUCKET = os.environ.get("TEMP_BUCKET", "penny-expenses-temp-images")


def download_telegram_image(file_id, bot_token):
    """
    Descarga una imagen de Telegram usando su file_id
    
    Args:
        file_id: File ID de la imagen en Telegram
        bot_token: Token del bot de Telegram
    
    Returns:
        bytes: Contenido de la imagen
    """
    import requests
    
    # Obtener la ruta del archivo
    file_info_url = f"https://api.telegram.org/bot{bot_token}/getFile?file_id={file_id}"
    response = requests.get(file_info_url, timeout=10)
    response.raise_for_status()
    
    file_path = response.json()['result']['file_path']
    
    # Descargar el archivo
    file_url = f"https://api.telegram.org/file/bot{bot_token}/{file_path}"
    image_response = requests.get(file_url, timeout=30)
    image_response.raise_for_status()
    
    return image_response.content


def extract_text_from_image(image_bytes):
    """
    Extrae texto de una imagen usando AWS Textract
    
    Args:
        image_bytes: Bytes de la imagen
    
    Returns:
        dict: Texto extraído y metadatos
    """
    response = textract_client.detect_document_text(
        Document={'Bytes': image_bytes}
    )
    
    # Extraer todas las líneas de texto
    lines = []
    for block in response.get('Blocks', []):
        if block['BlockType'] == 'LINE':
            lines.append(block['Text'])
    
    return {
        'raw_text': '\n'.join(lines),
        'lines': lines,
        'blocks': response.get('Blocks', [])
    }


def parse_transaction_data(text_lines):
    """
    Parsea las líneas de texto para extraer fecha, moneda, descripción y monto
    
    Args:
        text_lines: Lista de líneas de texto extraídas
    
    Returns:
        list: Lista de transacciones encontradas
    """
    transactions = []
    
    # Patrones para detectar montos
    # Ejemplos: S/ -60.61, $ -190.71, S/ 150.00
    amount_pattern = r'([S$/\$])\s*(-?\d+[,.]?\d*\.?\d+)'
    
    # Patrones para fechas
    # Ejemplos: 27 Noviembre, 26 Noviembre, 24/11/2024
    date_pattern = r'(\d{1,2})\s+(Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre|ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)'
    date_pattern_numeric = r'(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})'
    
    meses = {
        'enero': 1, 'febrero': 2, 'marzo': 3, 'abril': 4, 'mayo': 5, 'junio': 6,
        'julio': 7, 'agosto': 8, 'septiembre': 9, 'octubre': 10, 'noviembre': 11, 'diciembre': 12,
        'ene': 1, 'feb': 2, 'mar': 3, 'abr': 4, 'may': 5, 'jun': 6,
        'jul': 7, 'ago': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dic': 12
    }
    
    # Procesar líneas de texto
    i = 0
    while i < len(text_lines):
        line = text_lines[i]
        
        # Buscar montos en la línea
        amount_matches = re.findall(amount_pattern, line, re.IGNORECASE)
        
        if amount_matches:
            # Encontramos un monto, buscar descripción y fecha en líneas cercanas
            transaction = {
                'description': '',
                'date': '',
                'currency': '',
                'amount': '',
                'raw_line': line
            }
            
            # Extraer moneda y monto del primer match
            currency_symbol, amount_value = amount_matches[0]
            transaction['currency'] = 'PEN' if 'S/' in currency_symbol else 'USD'
            transaction['amount'] = amount_value.replace(',', '')
            
            # Buscar fecha en la línea actual o líneas cercanas
            date_match = re.search(date_pattern, line, re.IGNORECASE)
            if date_match:
                day = date_match.group(1)
                month_name = date_match.group(2).lower()
                month = meses.get(month_name, 0)
                if month:
                    current_year = datetime.now().year
                    transaction['date'] = f"{current_year}-{month:02d}-{int(day):02d}"
            else:
                # Buscar formato numérico
                date_match_numeric = re.search(date_pattern_numeric, line)
                if date_match_numeric:
                    day, month, year = date_match_numeric.groups()
                    if len(year) == 2:
                        year = f"20{year}"
                    transaction['date'] = f"{year}-{int(month):02d}-{int(day):02d}"
            
            # Extraer descripción (texto antes del monto)
            amount_start = line.find(currency_symbol)
            if amount_start > 0:
                description = line[:amount_start].strip()
                # Limpiar la fecha de la descripción si está presente
                description = re.sub(date_pattern, '', description, flags=re.IGNORECASE)
                description = re.sub(date_pattern_numeric, '', description)
                transaction['description'] = description.strip()
            
            # Si no hay descripción, buscar en línea anterior
            if not transaction['description'] and i > 0:
                transaction['description'] = text_lines[i-1].strip()
            
            # Si no hay fecha, buscar en líneas cercanas
            if not transaction['date']:
                for j in range(max(0, i-2), min(len(text_lines), i+3)):
                    if j != i:
                        date_match = re.search(date_pattern, text_lines[j], re.IGNORECASE)
                        if date_match:
                            day = date_match.group(1)
                            month_name = date_match.group(2).lower()
                            month = meses.get(month_name, 0)
                            if month:
                                current_year = datetime.now().year
                                transaction['date'] = f"{current_year}-{month:02d}-{int(day):02d}"
                                break
            
            if transaction['description'] or transaction['amount']:
                transactions.append(transaction)
        
        i += 1
    
    return transactions


def process_receipt_image(file_id, bot_token):
    """
    Procesa una imagen de recibo: descarga, extrae texto y parsea datos
    
    Args:
        file_id: File ID de Telegram
        bot_token: Token del bot
    
    Returns:
        dict: Datos extraídos de la imagen
    """
    # Descargar imagen
    image_bytes = download_telegram_image(file_id, bot_token)
    
    # Extraer texto
    extracted = extract_text_from_image(image_bytes)
    
    # Parsear transacciones
    transactions = parse_transaction_data(extracted['lines'])
    
    return {
        'raw_text': extracted['raw_text'],
        'lines': extracted['lines'],
        'transactions': transactions,
        'transaction_count': len(transactions)
    }

