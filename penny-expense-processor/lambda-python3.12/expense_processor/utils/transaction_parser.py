"""
Transaction parser for extracting transactions from OCR text
"""
import re
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class TransactionParser:
    """Parser for extracting transactions from bank statement text"""
    
    # Common date patterns
    DATE_PATTERNS = [
        r'\b(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})\b',  # DD/MM/YYYY or DD-MM-YY
        r'\b(\d{2,4}[-/]\d{1,2}[-/]\d{1,2})\b',  # YYYY/MM/DD
        r'\b(\d{1,2}\s+(?:ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)[A-Z]*\.?\s+\d{2,4})\b',  # DD MMM YYYY
        r'\b(\d{1,2}\s+(?:Enero|Febrero|Marzo|Abril|Mayo|Junio|Julio|Agosto|Septiembre|Octubre|Noviembre|Diciembre))\b',  # DD Mes (sin año)
    ]
    
    # Amount patterns (handles different formats)
    AMOUNT_PATTERNS = [
        r'(?:S/\.?|PEN|USD|\$)\s*[-]?\s*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2}))',  # S/ 1,234.56
        r'([-]?\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2}))\s*(?:S/\.?|PEN|USD|\$)',  # 1,234.56 S/
        r'\b([-]?\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2}))\b',  # 1,234.56
    ]
    
    # Currency patterns
    CURRENCY_PATTERNS = {
        'PEN': r'\b(?:S/\.?|PEN|SOLES?)\b',
        'USD': r'\b(?:\$|USD|DOLAR(?:ES)?)\b',
    }
    
    def __init__(self):
        """Initialize transaction parser"""
        pass
    
    def parse_transactions(self, text: str) -> List[Dict[str, Any]]:
        """
        Parse transactions from OCR text
        
        Args:
            text: Raw text from OCR
            
        Returns:
            List of transaction dictionaries
        """
        logger.info("Parsing transactions from text")
        
        transactions = []
        lines = text.split('\n')
        
        # Primero intentar parsear formato app bancaria (multi-línea)
        app_transactions = self._parse_app_format(lines)
        if app_transactions:
            transactions.extend(app_transactions)
            logger.info(f"Parsed {len(app_transactions)} transactions from app format")
        
        # Si no encontró transacciones en formato app, usar parser tradicional
        if not transactions:
            for i, line in enumerate(lines):
                line = line.strip()
                if not line or len(line) < 10:  # Skip short lines
                    continue
                
                transaction = self._parse_line(line, lines, i)
                if transaction:
                    transactions.append(transaction)
        
        logger.info(f"Parsed {len(transactions)} transactions total")
        return transactions
    
    def _parse_separated_format(self, lines: List[str]) -> List[Dict[str, Any]]:
        """
        Parse transactions where descriptions/dates are separated from amounts.
        
        Format:
            DESCRIPCIÓN 1
            DD Mes
            DESCRIPCIÓN 2
            DD Mes
            ...
            MONEDA MONTO_1
            MONEDA MONTO_2
            ...
        
        Args:
            lines: List of text lines from OCR
            
        Returns:
            List of parsed transactions or empty list if format doesn't match
        """
        current_year = datetime.now().year
        # Incluir variantes truncadas de meses
        month_map = {
            'enero': '01', 'ene': '01',
            'febrero': '02', 'feb': '02',
            'marzo': '03', 'mar': '03',
            'abril': '04', 'abr': '04',
            'mayo': '05', 'may': '05',
            'junio': '06', 'jun': '06',
            'julio': '07', 'jul': '07',
            'agosto': '08', 'ago': '08',
            'septiembre': '09', 'sep': '09', 'septi': '09',
            'octubre': '10', 'oct': '10',
            'noviembre': '11', 'nov': '11', 'noviem': '11',
            'diciembre': '12', 'dic': '12'
        }
        
        # Paso 1: Extraer descripciones + fechas
        descriptions_with_dates = []
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # Limpiar caracteres extraños
            line = re.sub(r'^[^\w\s]+\s*', '', line)
            
            # Saltar líneas vacías, muy cortas, o headers conocidos
            if (not line or len(line) < 3 or 
                'tarjeta' in line.lower() or 'cuotas' in line.lower() or 
                'este mes' in line.lower() or line.endswith('NM')):
                i += 1
                continue
            
            # Verificar si esta línea es una fecha (DD Mes) - incluyendo versiones truncadas
            # También maneja fechas con hora: "3 Noviembre, 12:30 p.m."
            date_match = re.search(r'^(\d{1,2})\s+(enero|ene|febrero|feb|marzo|mar|abril|abr|mayo|may|junio|jun|julio|jul|agosto|ago|septiembre|septi|sep|octubre|oct|noviembre|noviem|nov|diciembre|dic)(?:,\s*[\d:]+(?:\s*[ap]\.m\.)?)?$', 
                                  line, re.IGNORECASE)
            if date_match:
                # La fecha pertenece a la descripción anterior
                if descriptions_with_dates and descriptions_with_dates[-1].get('date') is None:
                    day = date_match.group(1).zfill(2)
                    month_name = date_match.group(2).lower()
                    month = month_map.get(month_name, '01')
                    date_str = f"{current_year}-{month}-{day}"
                    descriptions_with_dates[-1]['date'] = date_str
                i += 1
                continue
            
            # Manejar fechas fragmentadas: "2 Noviem" seguido de "bre," en la siguiente línea
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                # Buscar patrón: "DD Noviem" seguido de "bre," o "bre, HH:MM"
                date_frag_match = re.search(r'^(\d{1,2})\s+(noviem|nov)$', line, re.IGNORECASE)
                if date_frag_match and re.search(r'^bre,', next_line, re.IGNORECASE):
                    # Es una fecha fragmentada
                    if descriptions_with_dates and descriptions_with_dates[-1].get('date') is None:
                        day = date_frag_match.group(1).zfill(2)
                        month = '11'  # Noviembre
                        date_str = f"{current_year}-{month}-{day}"
                        descriptions_with_dates[-1]['date'] = date_str
                    i += 2  # Saltar ambas líneas
                    continue
            
            # Verificar si esta línea es un monto (detener extracción de descripciones)
            # También maneja "s/" (minúscula) y "/" solo
            amount_match = re.search(r'^(S/|s/|[$§¢]|/)\s*[-]?\s*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2}))$', line, re.IGNORECASE)
            if amount_match:
                # Llegamos a la sección de montos
                break
            
            # Es una descripción (filtrar líneas que son solo horas o fragmentos)
            # También filtrar líneas que son solo números de teléfono o IDs
            if (not re.search(r'^[\d:]+(?:\s*[ap]\.m\.)?$', line, re.IGNORECASE) and
                not re.search(r'^bre,', line, re.IGNORECASE) and
                not re.search(r'^ISA\.BM$', line, re.IGNORECASE) and
                len(line) >= 3):
                
                description = line.strip()
                description = re.sub(r'\.{3,}$', '', description)  # Remover puntos suspensivos
                
                # Filtrar descripciones que son solo fragmentos de fecha
                if not re.search(r'^\d{1,2}\s+', description):  # No empieza con número seguido de espacio
                    descriptions_with_dates.append({
                        'description': description,
                        'date': None  # Se llenará con la siguiente línea de fecha
                    })
            
            i += 1
        
        # Paso 2: Extraer montos
        amounts_with_currency = []
        while i < len(lines):
            line = lines[i].strip()
            
            if not line:
                i += 1
                continue
            
            # Buscar montos (también maneja "s/" y "/" solo)
            amount_match = re.search(r'(S/|s/|[$§¢]|/)\s*[-]?\s*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2}))', line, re.IGNORECASE)
            if amount_match:
                currency_symbol = amount_match.group(1)
                amount_str = amount_match.group(2)
                
                # Limpiar monto
                amount_str = amount_str.replace(',', '').replace('.', '')
                if len(amount_str) >= 3:
                    amount_str = amount_str[:-2] + '.' + amount_str[-2:]
                
                try:
                    amount = float(amount_str)
                    # Determinar moneda (normalizar símbolos mal leídos por OCR)
                    if currency_symbol.lower() in ('s/', '/') or currency_symbol == '/':
                        currency = 'PEN'
                    else:
                        currency = 'USD'
                    
                    amounts_with_currency.append({
                        'amount': abs(amount),
                        'currency': currency
                    })
                except ValueError:
                    pass
            
            i += 1
        
        # Paso 3: Validar que hay descripciones y montos
        # Filtrar descripciones sin fecha
        valid_descriptions = [d for d in descriptions_with_dates if d.get('date')]
        
        logger.info(f"Separated format: found {len(valid_descriptions)} descriptions and {len(amounts_with_currency)} amounts")
        
        # Solo usar este formato si:
        # 1. Hay al menos 1 descripción válida con fecha (reducido de 2 para casos difíciles)
        # 2. Hay al menos 1 monto (reducido de 2 para casos difíciles)
        # 3. El número de descripciones y montos es similar (diferencia <= 3, aumentado para casos fragmentados)
        if len(valid_descriptions) < 1 or len(amounts_with_currency) < 1:
            return []
        
        diff = abs(len(valid_descriptions) - len(amounts_with_currency))
        if diff > 3:
            logger.info(f"Separated format mismatch: {len(valid_descriptions)} descriptions vs {len(amounts_with_currency)} amounts")
            return []
        
        # Paso 4: Emparejar descripciones con montos
        transactions = []
        num_transactions = min(len(valid_descriptions), len(amounts_with_currency))
        
        for idx in range(num_transactions):
            desc_data = valid_descriptions[idx]
            amount_data = amounts_with_currency[idx]
            
            transaction = {
                'date': desc_data['date'],
                'description': desc_data['description'],
                'amount': amount_data['amount'],
                'currency': amount_data['currency'],
                'raw_line': f"{desc_data['description']}\n{desc_data['date']}"
            }
            
            transactions.append(transaction)
            logger.info(f"Paired transaction: {desc_data['description']} - {desc_data['date']} - {amount_data['currency']} {amount_data['amount']}")
        
        return transactions
    
    def _parse_date_time_format(self, lines: List[str]) -> List[Dict[str, Any]]:
        """
        Parse transactions with date and time format:
        Format:
            DESCRIPCIÓN
            DD Mes, HH:MM [a.m./p.m.]
            ...
            MONEDA MONTO_1
            MONEDA MONTO_2
            ...
        
        Or with fragmented dates:
            DESCRIPCIÓN
            DD Noviem
            bre, HH:MM [a.m./p.m.]
            ...
        
        Args:
            lines: List of text lines from OCR
            
        Returns:
            List of parsed transactions or empty list if format doesn't match
        """
        current_year = datetime.now().year
        month_map = {
            'enero': '01', 'ene': '01',
            'febrero': '02', 'feb': '02',
            'marzo': '03', 'mar': '03',
            'abril': '04', 'abr': '04',
            'mayo': '05', 'may': '05',
            'junio': '06', 'jun': '06',
            'julio': '07', 'jul': '07',
            'agosto': '08', 'ago': '08',
            'septiembre': '09', 'sep': '09', 'septi': '09',
            'octubre': '10', 'oct': '10',
            'noviembre': '11', 'nov': '11', 'noviem': '11',
            'diciembre': '12', 'dic': '12'
        }
        
        descriptions_with_dates = []
        i = 0
        
        while i < len(lines):
            line = lines[i].strip()
            
            # Limpiar caracteres extraños
            line = re.sub(r'^[^\w\s]+\s*', '', line)
            
            # Saltar headers
            if (not line or len(line) < 3 or 
                'tarjeta' in line.lower() or 'cuotas' in line.lower() or 
                'este mes' in line.lower() or 'buscador' in line.lower() or
                'movimientos' in line.lower() or line.endswith('NM')):
                i += 1
                continue
            
            # Buscar fecha con hora: "3 Noviembre, 12:30 p.m."
            date_time_match = re.search(r'^(\d{1,2})\s+(enero|ene|febrero|feb|marzo|mar|abril|abr|mayo|may|junio|jun|julio|jul|agosto|ago|septiembre|septi|sep|octubre|oct|noviembre|noviem|nov|diciembre|dic),?\s*[\d:]+(?:\s*[ap]\.m\.)?$', 
                                      line, re.IGNORECASE)
            
            if date_time_match:
                # La fecha pertenece a la descripción anterior
                if descriptions_with_dates and descriptions_with_dates[-1].get('date') is None:
                    day = date_time_match.group(1).zfill(2)
                    month_name = date_time_match.group(2).lower()
                    month = month_map.get(month_name, '01')
                    date_str = f"{current_year}-{month}-{day}"
                    descriptions_with_dates[-1]['date'] = date_str
                i += 1
                continue
            
            # Manejar fechas fragmentadas: "2 Noviem" seguido de "bre, HH:MM"
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                date_frag_match = re.search(r'^(\d{1,2})\s+(noviem|nov)$', line, re.IGNORECASE)
                if date_frag_match and re.search(r'^bre,', next_line, re.IGNORECASE):
                    # Es una fecha fragmentada
                    if descriptions_with_dates and descriptions_with_dates[-1].get('date') is None:
                        day = date_frag_match.group(1).zfill(2)
                        month = '11'  # Noviembre
                        date_str = f"{current_year}-{month}-{day}"
                        descriptions_with_dates[-1]['date'] = date_str
                    i += 2  # Saltar ambas líneas
                    continue
            
            # Verificar si es un monto (detener extracción)
            amount_match = re.search(r'^(S/|s/|[$§¢]|/)\s*[-]?\s*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2}))$', line, re.IGNORECASE)
            if amount_match:
                break
            
            # Es una descripción válida
            if len(line) >= 3 and not re.search(r'^\d{1,2}\s+', line):  # No es solo una fecha
                description = line.strip()
                description = re.sub(r'\.{3,}$', '', description)
                
                # Filtrar líneas que son solo horas o fragmentos
                if not re.search(r'^[\d:]+(?:\s*[ap]\.m\.)?$', description, re.IGNORECASE):
                    descriptions_with_dates.append({
                        'description': description,
                        'date': None
                    })
            
            i += 1
        
        # Extraer montos
        amounts_with_currency = []
        while i < len(lines):
            line = lines[i].strip()
            if not line:
                i += 1
                continue
            
            amount_match = re.search(r'(S/|s/|[$§¢]|/)\s*[-]?\s*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2}))', line, re.IGNORECASE)
            if amount_match:
                currency_symbol = amount_match.group(1)
                amount_str = amount_match.group(2)
                
                amount_str = amount_str.replace(',', '').replace('.', '')
                if len(amount_str) >= 3:
                    amount_str = amount_str[:-2] + '.' + amount_str[-2:]
                
                try:
                    amount = float(amount_str)
                    if currency_symbol.lower() in ('s/', '/') or currency_symbol == '/':
                        currency = 'PEN'
                    else:
                        currency = 'USD'
                    
                    amounts_with_currency.append({
                        'amount': abs(amount),
                        'currency': currency
                    })
                except ValueError:
                    pass
            
            i += 1
        
        # Validar y emparejar
        valid_descriptions = [d for d in descriptions_with_dates if d.get('date')]
        
        logger.info(f"Date-time format: found {len(valid_descriptions)} descriptions and {len(amounts_with_currency)} amounts")
        
        if len(valid_descriptions) < 1 or len(amounts_with_currency) < 1:
            return []
        
        diff = abs(len(valid_descriptions) - len(amounts_with_currency))
        if diff > 3:
            return []
        
        # Emparejar
        transactions = []
        num_transactions = min(len(valid_descriptions), len(amounts_with_currency))
        
        for idx in range(num_transactions):
            desc_data = valid_descriptions[idx]
            amount_data = amounts_with_currency[idx]
            
            transaction = {
                'date': desc_data['date'],
                'description': desc_data['description'],
                'amount': amount_data['amount'],
                'currency': amount_data['currency'],
                'raw_line': f"{desc_data['description']}\n{desc_data['date']}"
            }
            
            transactions.append(transaction)
            logger.info(f"Paired date-time transaction: {desc_data['description']} - {desc_data['date']} - {amount_data['currency']} {amount_data['amount']}")
        
        return transactions
    
    def _parse_fragmented_format(self, lines: List[str]) -> List[Dict[str, Any]]:
        """
        Parse extremely fragmented transactions (like image 4).
        Tries to match descriptions with amounts when they're completely separated.
        
        Args:
            lines: List of text lines from OCR
            
        Returns:
            List of parsed transactions or empty list if format doesn't match
        """
        current_year = datetime.now().year
        
        # Extraer todas las descripciones válidas
        descriptions = []
        dates_found = []
        i = 0
        
        while i < len(lines):
            line = lines[i].strip()
            line = re.sub(r'^[^\w\s]+\s*', '', line)
            
            # Saltar headers
            if (not line or len(line) < 3 or 
                'tarjeta' in line.lower() or 'cuotas' in line.lower() or 
                'este mes' in line.lower() or 'buscador' in line.lower() or
                'movimientos' in line.lower()):
                i += 1
                continue
            
            # Buscar fechas fragmentadas: "2 Noviem" seguido de "bre,"
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                date_frag_match = re.search(r'^(\d{1,2})\s+(noviem|nov)$', line, re.IGNORECASE)
                if date_frag_match and re.search(r'^bre,', next_line, re.IGNORECASE):
                    day = date_frag_match.group(1).zfill(2)
                    dates_found.append(f"{current_year}-11-{day}")
                    i += 2
                    continue
            
            # Buscar descripciones válidas (no fechas, no horas, no fragmentos)
            if (not re.search(r'^\d{1,2}\s+', line) and  # No empieza con fecha
                not re.search(r'^[\d:]+(?:\s*[ap]\.m\.)?$', line, re.IGNORECASE) and  # No es solo hora
                not re.search(r'^bre,', line, re.IGNORECASE) and  # No es fragmento de fecha
                not re.search(r'^ISA\.BM$', line, re.IGNORECASE) and  # No es fragmento
                len(line) >= 3):
                descriptions.append(line)
            
            i += 1
        
        # Extraer todos los montos
        amounts = []
        for line in lines:
            line = line.strip()
            amount_match = re.search(r'(S/|s/|[$§¢]|/)\s*[-]?\s*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2}))', line, re.IGNORECASE)
            if amount_match:
                amount_str = amount_match.group(2)
                amount_str = amount_str.replace(',', '').replace('.', '')
                if len(amount_str) >= 3:
                    amount_str = amount_str[:-2] + '.' + amount_str[-2:]
                try:
                    amount = float(amount_str)
                    if amount_match.group(1).lower() in ('s/', '/') or amount_match.group(1) == '/':
                        currency = 'PEN'
                    else:
                        currency = 'USD'
                    amounts.append({'amount': abs(amount), 'currency': currency})
                except ValueError:
                    pass
        
        logger.info(f"Fragmented format: found {len(descriptions)} descriptions, {len(dates_found)} dates, {len(amounts)} amounts")
        
        # Si tenemos descripciones y montos pero no fechas, intentar emparejar
        if len(descriptions) >= 2 and len(amounts) >= 2 and len(dates_found) == 0:
            # No hay fechas detectadas, usar fechas encontradas en el texto completo
            # Buscar todas las fechas posibles en el texto
            all_dates = []
            for line in lines:
                # Buscar "DD Noviem" o "DD Noviembre"
                date_match = re.search(r'(\d{1,2})\s+(noviem|noviembre|nov)', line, re.IGNORECASE)
                if date_match:
                    day = date_match.group(1).zfill(2)
                    all_dates.append(f"{current_year}-11-{day}")
            
            # Usar las fechas encontradas o crear fechas por defecto
            if len(all_dates) > 0:
                dates_found = all_dates[:len(descriptions)]
            else:
                # Si no hay fechas, usar fecha actual para todas
                today = datetime.now()
                dates_found = [today.strftime('%Y-%m-%d')] * len(descriptions)
        
        # Emparejar descripciones con montos y fechas
        transactions = []
        num_pairs = min(len(descriptions), len(amounts), len(dates_found) if dates_found else len(descriptions))
        
        for idx in range(num_pairs):
            date = dates_found[idx] if idx < len(dates_found) else dates_found[-1] if dates_found else datetime.now().strftime('%Y-%m-%d')
            description = descriptions[idx]
            amount_data = amounts[idx]
            
            transaction = {
                'date': date,
                'description': description,
                'amount': amount_data['amount'],
                'currency': amount_data['currency'],
                'raw_line': f"{description}\n{date}"
            }
            
            transactions.append(transaction)
            logger.info(f"Fragmented transaction: {description} - {date} - {amount_data['currency']} {amount_data['amount']}")
        
        # Solo retornar si encontramos al menos 2 transacciones válidas
        if len(transactions) >= 2:
            return transactions
        
        return []
    
    def _parse_app_format(self, lines: List[str]) -> List[Dict[str, Any]]:
        """
        Parse transactions from banking app format (multi-line format):
        Format 1 (3 lines):
            Line 1: DESCRIPCIÓN
            Line 2: DD Mes
            Line 3: MONEDA MONTO
        
        Format 2 (2 lines, descripción + monto juntos):
            Line 1: DESCRIPCIÓN MONEDA MONTO
            Line 2: DD Mes
        
        Format 3 (separated descriptions and amounts):
            All descriptions + dates first, then all amounts at the end
        
        Format 4 (3 lines with amount in middle):
            Line 1: DESCRIPCIÓN
            Line 2: . MONEDA MONTO >
            Line 3: DD Mes
        
        Format 5 (2 lines, descripción + fecha, monto en línea siguiente o misma):
            Line 1: DESCRIPCIÓN [LIMA PE] [MONEDA MONTO]
            Line 2: DD Mes [MONEDA MONTO]
        
        Example:
        SUPERMERCADO CANDY S
        27 Noviembre
        S/ -60.61
        
        Or:
        PYU*DIDI LIMA PE S/ -15.40
        20 Noviembre
        
        Args:
            lines: List of text lines from OCR
            
        Returns:
            List of parsed transactions
        """
        transactions = []
        current_year = datetime.now().year
        
        # Intentar primero formato con fechas y hora (nuevo formato)
        date_time_format_transactions = self._parse_date_time_format(lines)
        if date_time_format_transactions:
            logger.info(f"Using date-time format parser, found {len(date_time_format_transactions)} transactions")
            return date_time_format_transactions
        
        # Intentar formato fragmentado extremo (para imagen 4)
        fragmented_format_transactions = self._parse_fragmented_format(lines)
        if fragmented_format_transactions:
            logger.info(f"Using fragmented format parser, found {len(fragmented_format_transactions)} transactions")
            return fragmented_format_transactions
        
        # Intentar formato 3 (descripciones separadas de montos)
        separated_format_transactions = self._parse_separated_format(lines)
        if separated_format_transactions:
            logger.info(f"Using separated format parser, found {len(separated_format_transactions)} transactions")
            return separated_format_transactions
        
        # Mapa de meses en español (incluyendo truncados por OCR)
        month_map = {
            'enero': '01', 'ene': '01',
            'febrero': '02', 'feb': '02',
            'marzo': '03', 'mar': '03',
            'abril': '04', 'abr': '04',
            'mayo': '05', 'may': '05',
            'junio': '06', 'jun': '06',
            'julio': '07', 'jul': '07',
            'agosto': '08', 'ago': '08',
            'septiembre': '09', 'sep': '09', 'septi': '09',
            'octubre': '10', 'oct': '10',
            'noviembre': '11', 'nov': '11', 'noviem': '11',
            'diciembre': '12', 'dic': '12'
        }
        
        i = 0
        while i < len(lines):
            line = lines[i].strip()
            
            # Limpiar caracteres extraños al inicio (emojis/íconos del OCR)
            line = re.sub(r'^[^\w\s]+\s*', '', line)
            
            # Saltar líneas vacías o muy cortas
            if not line or len(line) < 3:
                i += 1
                continue
            
            # FORMATO 5: Descripción + [LIMA PE] + [monto opcional], seguida por fecha + [monto opcional]
            # Ejemplo: "PYU*DIDI LIMA PE S/ -15.40"
            #          "20 Noviembre"
            # O: "PYU*DIDI LIMA PE"
            #    "20 Noviembre S/ -15.40"
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                
                # Buscar fecha en la siguiente línea
                date_match_format5 = re.search(r'(\d{1,2})\s+(enero|ene|febrero|feb|marzo|mar|abril|abr|mayo|may|junio|jun|julio|jul|agosto|ago|septiembre|septi|sep|octubre|oct|noviembre|noviem|nov|diciembre|dic)', 
                                             next_line, re.IGNORECASE)
                
                if date_match_format5:
                    # Buscar monto en la línea actual o en la siguiente
                    # Manejar casos donde OCR lee "/" o "s/" en lugar de "S/"
                    amount_match_line = re.search(r'(S/|s/|[$§¢]|/)\s*[-]?\s*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2}))', line, re.IGNORECASE)
                    amount_match_next = re.search(r'(S/|s/|[$§¢]|/)\s*[-]?\s*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2}))', next_line, re.IGNORECASE)
                    
                    amount_match = amount_match_line or amount_match_next
                    
                    if amount_match:
                        # Extraer descripción (remover LIMA, PE, y monto si están presentes)
                        description = line
                        # Remover monto si está en la línea actual
                        if amount_match_line:
                            description = line[:amount_match_line.start()].strip()
                        # Remover LIMA y PE
                        description = re.sub(r'\bLIMA\b', '', description, flags=re.IGNORECASE)
                        description = re.sub(r'\bPE\b', '', description, flags=re.IGNORECASE)
                        description = description.strip()
                        
                        # Extraer día y mes
                        day = date_match_format5.group(1).zfill(2)
                        month_name = date_match_format5.group(2).lower()
                        month = month_map.get(month_name, '01')
                        date_str = f"{current_year}-{month}-{day}"
                        
                        # Extraer moneda y monto
                        currency_symbol = amount_match.group(1)
                        amount_str = amount_match.group(2)
                        
                        # Limpiar monto
                        amount_str = amount_str.replace(',', '').replace('.', '')
                        if len(amount_str) >= 3:
                            amount_str = amount_str[:-2] + '.' + amount_str[-2:]
                        
                        try:
                            amount = float(amount_str)
                        except ValueError:
                            i += 1
                            continue
                        
                        # Determinar moneda (normalizar símbolos mal leídos por OCR)
                        if currency_symbol.lower() in ('s/', '/') or currency_symbol == '/':
                            currency = 'PEN'
                        else:
                            currency = 'USD'
                        
                        # Limpiar descripción
                        description = re.sub(r'^[^\w\s]+\s*', '', description)  # Remover símbolos al inicio
                        description = re.sub(r'\.{3,}$', '', description)  # Remover puntos suspensivos
                        # Remover LIMA y PE de la descripción
                        description = re.sub(r'\bLIMA\b', '', description, flags=re.IGNORECASE)
                        description = re.sub(r'\bPE\b', '', description, flags=re.IGNORECASE)
                        description = description.strip()
                        
                        # Filtrar descripciones que contengan patrones de monto
                        if re.search(r'S/\s*[-]?\s*\d+', description) or re.search(r'[$]\s*[-]?\s*\d+', description):
                            i += 1
                            continue
                        
                        if description and len(description) >= 3:
                            transaction = {
                                'date': date_str,
                                'description': description,
                                'amount': abs(amount),
                                'currency': currency,
                                'raw_line': f"{line}\n{next_line}"
                            }
                            
                            transactions.append(transaction)
                            logger.info(f"Parsed app transaction (format 5): {description} - {date_str} - {currency} {amount}")
                            
                            # Saltar las 2 líneas procesadas
                            i += 2
                            continue
            
            # FORMATO 2: Descripción + monto en la misma línea, seguida por fecha
            # Ejemplo: "SUPERMERCADO CANDY S S/ -60.61"
            #          "27 Noviembre"
            # El OCR a veces confunde $ con § o ¢, o lee "/" en lugar de "S/"
            # También maneja "s/" (minúscula)
            amount_match_inline = re.search(r'(S/|s/|[$§¢]|/)\s*[-]?\s*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2}))', line, re.IGNORECASE)
            if amount_match_inline and i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                date_match = re.search(r'(\d{1,2})\s+(enero|ene|febrero|feb|marzo|mar|abril|abr|mayo|may|junio|jun|julio|jul|agosto|ago|septiembre|septi|sep|octubre|oct|noviembre|noviem|nov|diciembre|dic)', 
                                      next_line, re.IGNORECASE)
                
                if date_match:
                    # Extraer descripción (antes del monto)
                    desc_end = amount_match_inline.start()
                    description = line[:desc_end].strip()
                    
                    # Extraer día y mes
                    day = date_match.group(1).zfill(2)
                    month_name = date_match.group(2).lower()
                    month = month_map.get(month_name, '01')
                    date_str = f"{current_year}-{month}-{day}"
                    
                    # Extraer moneda y monto
                    currency_symbol = amount_match_inline.group(1)
                    amount_str = amount_match_inline.group(2)
                    
                    # Limpiar monto
                    amount_str = amount_str.replace(',', '').replace('.', '')
                    if len(amount_str) >= 3:
                        amount_str = amount_str[:-2] + '.' + amount_str[-2:]
                    
                    try:
                        amount = float(amount_str)
                    except ValueError:
                        i += 1
                        continue
                    
                    # Determinar moneda (normalizar símbolos mal leídos por OCR)
                    if currency_symbol.lower() in ('s/', '/') or currency_symbol == '/':
                        currency = 'PEN'
                    else:
                        currency = 'USD'
                    
                    # Limpiar descripción
                    description = re.sub(r'\.{3,}$', '', description)
                    # Remover LIMA y PE de la descripción
                    description = re.sub(r'\bLIMA\b', '', description, flags=re.IGNORECASE)
                    description = re.sub(r'\bPE\b', '', description, flags=re.IGNORECASE)
                    # Limpiar caracteres extraños pero mantener * y espacios
                    description = re.sub(r'[^\w\s*\-]', '', description).strip()  # Mantener * y - para PYU*DIDI
                    
                    if description and len(description) >= 3:
                        transaction = {
                            'date': date_str,
                            'description': description,
                            'amount': abs(amount),
                            'currency': currency,
                            'raw_line': f"{line}\n{next_line}"
                        }
                        
                        transactions.append(transaction)
                        logger.info(f"Parsed app transaction (inline format): {description} - {date_str} - {currency} {amount}")
                        
                        # Saltar las 2 líneas procesadas
                        i += 2
                        continue
            
            # FORMATO 4: Descripción + Monto con símbolos extra + Fecha (3 líneas)
            # Ejemplo:
            # DEPOSITO EFECTIVO
            # @) . S/1,200.00 >
            # 19 Noviembre
            if i + 2 < len(lines):
                desc_candidate = line
                amount_candidate = lines[i + 1].strip()
                date_candidate = lines[i + 2].strip()
                
                # Buscar monto con símbolos extra (puntos, flechas, etc.)
                # Patrón: [símbolos opcionales] . [S/ o $ o /] monto [> opcional]
                # También maneja casos donde OCR lee "/" en lugar de "S/"
                amount_match_extra = re.search(r'[^\w]*[\.\s]*(S/|s/|[$§¢]|/)\s*[-]?\s*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2}))\s*[>]?', amount_candidate, re.IGNORECASE)
                
                # Buscar fecha en formato "DD Mes" o "DD Mes, HH:MM" (incluyendo versiones truncadas)
                date_match_extra = re.search(r'(\d{1,2})\s+(enero|ene|febrero|feb|marzo|mar|abril|abr|mayo|may|junio|jun|julio|jul|agosto|ago|septiembre|septi|sep|octubre|oct|noviembre|noviem|nov|diciembre|dic)', 
                                            date_candidate, re.IGNORECASE)
                
                if amount_match_extra and date_match_extra and len(desc_candidate) >= 3:
                    # Extraer día y mes
                    day = date_match_extra.group(1).zfill(2)
                    month_name = date_match_extra.group(2).lower()
                    month = month_map.get(month_name, '01')
                    date_str = f"{current_year}-{month}-{day}"
                    
                    # Extraer moneda y monto
                    currency_symbol = amount_match_extra.group(1)
                    amount_str = amount_match_extra.group(2)
                    
                    # Limpiar monto
                    amount_str = amount_str.replace(',', '').replace('.', '')
                    if len(amount_str) >= 3:
                        amount_str = amount_str[:-2] + '.' + amount_str[-2:]
                    
                    try:
                        amount = float(amount_str)
                    except ValueError:
                        i += 1
                        continue
                    
                    # Determinar moneda (normalizar símbolos mal leídos por OCR)
                    if currency_symbol.lower() in ('s/', '/') or currency_symbol == '/':
                        currency = 'PEN'
                    else:
                        currency = 'USD'
                    
                    # Limpiar descripción
                    description = desc_candidate.strip()
                    description = re.sub(r'^[^\w\s]+\s*', '', description)  # Remover símbolos al inicio
                    description = re.sub(r'\.{3,}$', '', description)  # Remover puntos suspensivos
                    # Remover LIMA y PE de la descripción
                    description = re.sub(r'\bLIMA\b', '', description, flags=re.IGNORECASE)
                    description = re.sub(r'\bPE\b', '', description, flags=re.IGNORECASE)
                    description = description.strip()
                    
                    # Filtrar descripciones que contengan patrones de monto (para evitar falsos positivos)
                    if re.search(r'S/\s*[-]?\s*\d+', description) or re.search(r'[$]\s*[-]?\s*\d+', description):
                        i += 1
                        continue
                    
                    if description and len(description) >= 3:
                        transaction = {
                            'date': date_str,
                            'description': description,
                            'amount': abs(amount),
                            'currency': currency,
                            'raw_line': f"{desc_candidate}\n{amount_candidate}\n{date_candidate}"
                        }
                        
                        transactions.append(transaction)
                        logger.info(f"Parsed app transaction (format 4): {description} - {date_str} - {currency} {amount}")
                        
                        # Saltar las 3 líneas procesadas
                        i += 3
                        continue
            
            # FORMATO 1: Verificar si las siguientes 2 líneas forman una transacción (3 líneas)
            if i + 2 < len(lines):
                desc_line = line
                date_line = lines[i + 1].strip()
                amount_line = lines[i + 2].strip()
                
                # Intentar parsear fecha en formato "DD Mes" (incluyendo versiones truncadas)
                date_match = re.search(r'(\d{1,2})\s+(enero|ene|febrero|feb|marzo|mar|abril|abr|mayo|may|junio|jun|julio|jul|agosto|ago|septiembre|septi|sep|octubre|oct|noviembre|noviem|nov|diciembre|dic)', 
                                      date_line, re.IGNORECASE)
                
                # Intentar parsear monto con moneda (incluir variantes de $ que OCR puede confundir)
                # También maneja "/" y "s/" (minúscula)
                amount_match = re.search(r'(S/|s/|[$§¢]|/)\s*[-]?\s*(\d{1,3}(?:[,\.]\d{3})*(?:[,\.]\d{2}))', amount_line, re.IGNORECASE)
                
                if date_match and amount_match:
                    # Extraer día y mes
                    day = date_match.group(1).zfill(2)
                    month_name = date_match.group(2).lower()
                    month = month_map.get(month_name, '01')
                    
                    # Construir fecha
                    date_str = f"{current_year}-{month}-{day}"
                    
                    # Extraer moneda y monto
                    currency_symbol = amount_match.group(1)
                    amount_str = amount_match.group(2)
                    
                    # Limpiar monto
                    amount_str = amount_str.replace(',', '').replace('.', '')
                    # Insertar punto decimal
                    if len(amount_str) >= 3:
                        amount_str = amount_str[:-2] + '.' + amount_str[-2:]
                    
                    try:
                        amount = float(amount_str)
                    except ValueError:
                        i += 1
                        continue
                    
                    # Determinar moneda (normalizar símbolos mal leídos por OCR)
                    if currency_symbol.lower() in ('s/', '/') or currency_symbol == '/':
                        currency = 'PEN'
                    else:
                        currency = 'USD'
                    
                    # Limpiar descripción (remover caracteres extraños)
                    description = desc_line.strip()
                    # Remover puntos suspensivos al final
                    description = re.sub(r'\.{3,}$', '', description)
                    
                    transaction = {
                        'date': date_str,
                        'description': description,
                        'amount': abs(amount),  # Usar valor absoluto
                        'currency': currency,
                        'raw_line': f"{desc_line}\n{date_line}\n{amount_line}"
                    }
                    
                    transactions.append(transaction)
                    logger.info(f"Parsed app transaction: {description} - {date_str} - {currency} {amount}")
                    
                    # Saltar las 3 líneas procesadas
                    i += 3
                    continue
            
            i += 1
        
        return transactions
    
    def _parse_line(self, line: str, all_lines: List[str], index: int) -> Optional[Dict[str, Any]]:
        """
        Parse a single line for transaction data
        
        Args:
            line: Line to parse
            all_lines: All lines for context
            index: Current line index
            
        Returns:
            Transaction dictionary or None
        """
        # Extract date
        date = self._extract_date(line)
        if not date:
            return None
        
        # Extract amount
        amount_data = self._extract_amount(line)
        if not amount_data:
            return None
        
        amount = amount_data['amount']
        currency = amount_data['currency']
        
        # Extract description (everything between date and amount)
        description = self._extract_description(line, date, amount)
        
        if not description or len(description.strip()) < 3:
            return None
        
        transaction = {
            'date': date,
            'description': description.strip(),
            'amount': amount,
            'currency': currency,
            'raw_line': line
        }
        
        return transaction
    
    def _extract_date(self, text: str) -> Optional[str]:
        """
        Extract date from text
        
        Args:
            text: Text to search
            
        Returns:
            Date string or None
        """
        for pattern in self.DATE_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                date_str = match.group(1)
                # Normalize date format
                return self._normalize_date(date_str)
        
        return None
    
    def _normalize_date(self, date_str: str) -> str:
        """
        Normalize date to YYYY-MM-DD format
        
        Args:
            date_str: Date string in various formats
            
        Returns:
            Normalized date string
        """
        # Try different date formats
        date_formats = [
            '%d/%m/%Y', '%d-%m-%Y',
            '%d/%m/%y', '%d-%m-%y',
            '%Y/%m/%d', '%Y-%m-%d',
        ]
        
        for fmt in date_formats:
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime('%Y-%m-%d')
            except ValueError:
                continue
        
        # Handle month names (Spanish - abbreviated)
        month_map_abbr = {
            'ENE': '01', 'FEB': '02', 'MAR': '03', 'ABR': '04',
            'MAY': '05', 'JUN': '06', 'JUL': '07', 'AGO': '08',
            'SEP': '09', 'OCT': '10', 'NOV': '11', 'DIC': '12'
        }
        
        for month_abbr, month_num in month_map_abbr.items():
            if month_abbr in date_str.upper():
                # Extract day and year
                parts = re.findall(r'\d+', date_str)
                if len(parts) >= 2:
                    day = parts[0].zfill(2)
                    year = parts[1]
                    if len(year) == 2:
                        year = '20' + year
                    return f"{year}-{month_num}-{day}"
                elif len(parts) == 1:
                    # Solo día, sin año - usar año actual
                    day = parts[0].zfill(2)
                    current_year = datetime.now().year
                    return f"{current_year}-{month_num}-{day}"
        
        # Handle month names (Spanish - full)
        month_map_full = {
            'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
            'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
            'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
        }
        
        for month_name, month_num in month_map_full.items():
            if month_name in date_str.lower():
                # Extract day
                parts = re.findall(r'\d+', date_str)
                if len(parts) >= 1:
                    day = parts[0].zfill(2)
                    current_year = datetime.now().year
                    return f"{current_year}-{month_num}-{day}"
        
        # Return as-is if can't normalize
        return date_str
    
    def _extract_amount(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Extract amount and currency from text
        
        Args:
            text: Text to search
            
        Returns:
            Dictionary with amount and currency or None
        """
        for pattern in self.AMOUNT_PATTERNS:
            match = re.search(pattern, text)
            if match:
                amount_str = match.group(1)
                
                # Clean amount string
                amount_str = amount_str.replace(',', '')
                amount_str = amount_str.replace(' ', '')
                
                # Handle both . and , as decimal separator
                # If there are multiple dots/commas, the last one is the decimal
                if '.' in amount_str:
                    parts = amount_str.split('.')
                    if len(parts) == 2 and len(parts[1]) == 2:
                        # Last dot is decimal separator
                        amount_str = parts[0] + '.' + parts[1]
                
                try:
                    amount = float(amount_str)
                    
                    # Detect currency
                    currency = self._detect_currency(text)
                    
                    return {
                        'amount': abs(amount),  # Use absolute value
                        'currency': currency
                    }
                except ValueError:
                    continue
        
        return None
    
    def _detect_currency(self, text: str) -> str:
        """
        Detect currency from text
        
        Args:
            text: Text to search
            
        Returns:
            Currency code (PEN, USD, etc.)
        """
        for currency, pattern in self.CURRENCY_PATTERNS.items():
            if re.search(pattern, text, re.IGNORECASE):
                return currency
        
        # Default to PEN
        return 'PEN'
    
    def _extract_description(self, line: str, date: str, amount: float) -> str:
        """
        Extract description from line (text between date and amount)
        
        Args:
            line: Full line text
            date: Extracted date
            amount: Extracted amount
            
        Returns:
            Description string
        """
        # Remove date pattern
        temp = line
        for pattern in self.DATE_PATTERNS:
            temp = re.sub(pattern, '', temp, count=1)
        
        # Remove amount pattern
        for pattern in self.AMOUNT_PATTERNS:
            temp = re.sub(pattern, '', temp, count=1)
        
        # Remove currency symbols
        temp = re.sub(r'S/\.?|PEN|USD|\$|SOLES?|DOLAR(?:ES)?', '', temp, flags=re.IGNORECASE)
        
        # Clean up
        temp = temp.strip()
        temp = re.sub(r'\s+', ' ', temp)  # Remove multiple spaces
        
        return temp
    
    def merge_multiline_transactions(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Merge transactions that span multiple lines
        
        Args:
            transactions: List of parsed transactions
            
        Returns:
            Merged transactions
        """
        if not transactions:
            return []
        
        merged = []
        current = transactions[0].copy()
        
        for i in range(1, len(transactions)):
            next_trans = transactions[i]
            
            # Check if descriptions should be merged (e.g., continuation of previous)
            if self._should_merge(current, next_trans):
                current['description'] += ' ' + next_trans['description']
                current['raw_line'] += '\n' + next_trans['raw_line']
            else:
                merged.append(current)
                current = next_trans.copy()
        
        # Add last transaction
        merged.append(current)
        
        return merged
    
    def _should_merge(self, trans1: Dict, trans2: Dict) -> bool:
        """
        Determine if two transactions should be merged
        
        Args:
            trans1: First transaction
            trans2: Second transaction
            
        Returns:
            True if should merge
        """
        # Simple heuristic: merge if second transaction has same date
        # and description is very short (likely a continuation)
        if trans1['date'] == trans2['date'] and len(trans2['description']) < 20:
            return True
        
        return False

