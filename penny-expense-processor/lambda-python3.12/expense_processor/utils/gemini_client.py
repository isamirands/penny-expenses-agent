"""
Gemini Client for extracting expense data from images
"""
import os
import json
import logging
import google.generativeai as genai
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

class GeminiClient:
    """Client for interacting with Gemini 2.0 Flash"""
    
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
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # Generation config for JSON response
        self.generation_config = genai.types.GenerationConfig(
            temperature=0.0,
            response_mime_type="application/json"
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
            
            # Prompt defined by user requirements
            prompt = """
Eres un asistente experto en leer estados de cuenta bancarios a partir de una IMAGEN.

Vas a recibir:
- Una IMAGEN del estado de cuenta.
- El método de pago ya lo conoce el sistema y NO debe ser inferido.

Tu tarea es devolver SOLO un JSON válido:

{
   "moneda": "<moneda>",
  "transacciones": [
    {
      "fecha": "YYYY-MM-DD",
      "descripcion": "<texto>",
      "categoria": "Comida | Transporte | Servicios | Otros",
      "monto": -123.45
    }
  ]
}

Reglas:
- Monto negativo = gasto, positivo = ingreso.
- Formato de fecha: YYYY-MM-DD.
- Separador decimal: punto.
- Si no puedes determinar un valor, pon null.
- No inventes datos.
- NO incluyas encabezados, saldos, totales ni mensajes ajenos a movimientos.
- Devuelve SOLO el JSON sin texto adicional.
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
                raise
                
        except Exception as e:
            logger.error(f"Error calling Gemini: {e}", exc_info=True)
            logger.error(f"Exception type: {type(e).__name__}")
            if hasattr(e, 'args'):
                logger.error(f"Exception args: {e.args}")
            raise
