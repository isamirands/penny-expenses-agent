"""
Gemini Client for extracting expense data from images
"""
import os
import json
import logging
from datetime import datetime
import google.generativeai as genai
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class GeminiClient:
    """Client for interacting with Gemini Flash"""
    
    def __init__(self, api_key: str):
        """
        Initialize Gemini client
        
        Args:
            api_key: Google AI Studio API Key
        """
        if not api_key:
            raise ValueError("Gemini API Key is required")
            
        genai.configure(api_key=api_key)
        
        # Configure model
        self.model = genai.GenerativeModel('gemini-flash-latest')
        
        # Generation config for JSON response
        self.generation_config = genai.types.GenerationConfig(
            temperature=0.0,
            response_mime_type="application/json",
            max_output_tokens=65536
        )

    def extract_expenses(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Extract expense data from image using Gemini
        
        Args:
            image_bytes: Image content as bytes
            
        Returns:
            Dictionary with extracted transaction data
        """
        try:
            logger.info(f"Sending image ({len(image_bytes)} bytes) to Gemini...")
            logger.info(f"Using model: {self.model.model_name}")
            logger.info(f"Generation config: temperature={self.generation_config.temperature}, mime_type={self.generation_config.response_mime_type}")
            
            # Create image part
            image_part = {
                "mime_type": "image/jpeg",
                "data": image_bytes
            }
            
            # Get current year for context
            current_year = datetime.now().year
            current_date = datetime.now().strftime("%Y-%m-%d")
            
            # Prompt defined by user requirements
            prompt = f"""
Eres un asistente experto en leer estados de cuenta bancarios a partir de una IMAGEN.

Vas a recibir:
- Una IMAGEN del estado de cuenta.
- El método de pago ya lo conoce el sistema y NO debe ser inferido.

CONTEXTO TEMPORAL:
- La fecha actual es {current_date}
- El año actual es {current_year}
- Al interpretar fechas en el estado de cuenta, usa el año {current_year} a menos que la imagen muestre claramente un año diferente.

Tu tarea es devolver SOLO un JSON válido:

{{
  "transacciones": [
    {{
      "fecha": "YYYY-MM-DD",
      "descripcion": "<texto>",
      "categoria": "Ocio | Belleza | Comidas | Viajes | Compras | Salud | Regalos | Víveres | Otros | Transporte | Suscripciones | Junta | Menu | Cuenta de ahorros | Divisas | Wardaditos | S&P",
      "moneda": "SOL | USD",
      "monto": -123.45
    }}
  ]
}}

Reglas:
- Monto negativo = gasto, positivo = ingreso.
- Formato de fecha: YYYY-MM-DD (año-mes-día con 4 dígitos para el año, 2 para mes y 2 para día).
- Moneda: Usa "SOL" para soles peruanos y "USD" para dólares americanos. Cada transacción debe incluir su propia moneda.
- Separador decimal: punto.
- Si no puedes determinar un valor, pon null.
- No inventes datos.
- NO incluyas encabezados, saldos, totales ni mensajes ajenos a movimientos.
- Devuelve SOLO el JSON sin texto adicional.
- Para la fecha, usa el año {current_year} a menos que la imagen muestre explícitamente un año diferente.
"""

            logger.info(f"Prompt length: {len(prompt)} characters")
            logger.info("Calling Gemini API...")
            
            # Generate content
            response = self.model.generate_content(
                [prompt, image_part],
                generation_config=self.generation_config
            )
            
            logger.info(f"Gemini API call completed. Response object type: {type(response)}")
            logger.info(f"Response object: {response}")
            
            # Check if response has candidates
            if hasattr(response, 'candidates'):
                logger.info(f"Response has {len(response.candidates)} candidates")
                for idx, candidate in enumerate(response.candidates):
                    logger.info(f"Candidate {idx}: finish_reason={getattr(candidate, 'finish_reason', 'N/A')}, "
                              f"safety_ratings={getattr(candidate, 'safety_ratings', 'N/A')}")
                    if hasattr(candidate, 'content'):
                        logger.info(f"Candidate {idx} content parts: {len(getattr(candidate.content, 'parts', []))}")
            
            # Check if response has prompt_feedback
            if hasattr(response, 'prompt_feedback'):
                logger.info(f"Prompt feedback: {response.prompt_feedback}")
            
            # Parse response
            if not hasattr(response, 'text'):
                logger.error("Response object does not have 'text' attribute")
                logger.error(f"Response attributes: {dir(response)}")
                raise ValueError("Gemini response does not contain text attribute")
            
            response_text = response.text
            logger.info(f"Response text length: {len(response_text) if response_text else 0} characters")
            
            if not response_text:
                logger.error("Gemini returned empty response text")
                logger.error(f"Full response object: {response}")
                if hasattr(response, 'candidates') and response.candidates:
                    candidate = response.candidates[0]
                    logger.error(f"First candidate finish_reason: {getattr(candidate, 'finish_reason', 'N/A')}")
                    logger.error(f"First candidate safety_ratings: {getattr(candidate, 'safety_ratings', 'N/A')}")
                raise ValueError("Gemini returned empty response")
            
            logger.info(f"Gemini response text: {response_text}")
            
            try:
                data = json.loads(response_text)
                logger.info(f"Successfully parsed JSON. Keys: {list(data.keys()) if isinstance(data, dict) else 'Not a dict'}")
                if isinstance(data, dict):
                    transactions_count = len(data.get('transacciones', []))
                    logger.info(f"Found {transactions_count} transactions in response")
                return data
            except json.JSONDecodeError as json_err:
                logger.error(f"Failed to parse Gemini response as JSON: {json_err}")
                logger.error(f"Response text that failed to parse: {response_text[:500]}...")  # First 500 chars
                # Try to clean markdown code blocks if present (though response_mime_type should prevent this)
                if "```json" in response_text:
                    logger.info("Attempting to extract JSON from markdown code block")
                    clean_text = response_text.split("```json")[1].split("```")[0].strip()
                    logger.info(f"Cleaned text: {clean_text[:500]}...")
                    return json.loads(clean_text)
                # Gemini sometimes stops generating one token early and omits the
                # final closing bracket/brace even though the content is otherwise
                # complete (reproducible at temperature=0.0 for certain images).
                # Try auto-closing any unbalanced brackets/braces before giving up.
                repaired_text = self._close_unbalanced_json(response_text)
                if repaired_text is not None:
                    data = json.loads(repaired_text)
                    logger.warning("Recovered Gemini response by auto-closing unbalanced JSON brackets")
                    return data
                raise

        except Exception as e:
            logger.error(f"Error calling Gemini: {e}", exc_info=True)
            logger.error(f"Exception type: {type(e).__name__}")
            if hasattr(e, 'args'):
                logger.error(f"Exception args: {e.args}")
            raise

    @staticmethod
    def _close_unbalanced_json(text: str) -> Optional[str]:
        """Append closing brackets/braces for any left open, ignoring string contents."""
        stack = []
        in_string = False
        escape = False
        for ch in text:
            if in_string:
                if escape:
                    escape = False
                elif ch == '\\':
                    escape = True
                elif ch == '"':
                    in_string = False
                continue
            if ch == '"':
                in_string = True
            elif ch in '{[':
                stack.append(ch)
            elif ch in '}]':
                if stack:
                    stack.pop()
        if not stack:
            return None
        closers = {'{': '}', '[': ']'}
        return text + ''.join(closers[c] for c in reversed(stack))
