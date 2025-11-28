"""
Bedrock LLM client for expense classification
"""
import json
import logging
import boto3
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class BedrockClassifier:
    """Client for classifying expenses using AWS Bedrock"""
    
    CATEGORIES = [
        "Comida",
        "Transporte",
        "Servicios",
        "Compras",
        "Entretenimiento",
        "Salud",
        "Educación",
        "Otros"
    ]
    
    def __init__(self, model_id: str = "anthropic.claude-3-haiku-20240307-v1:0"):
        """
        Initialize Bedrock classifier
        
        Args:
            model_id: Bedrock model ID to use
        """
        self.model_id = model_id
        self.client = boto3.client('bedrock-runtime')
    
    def classify_transaction(self, description: str) -> str:
        """
        Classify a single transaction using LLM
        
        Args:
            description: Transaction description
            
        Returns:
            Category name
        """
        try:
            logger.info(f"Classifying transaction: {description[:50]}...")
            
            prompt = self._build_classification_prompt(description)
            
            # Prepare request body based on model
            if "claude" in self.model_id.lower():
                body = {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 100,
                    "temperature": 0.0,
                    "messages": [
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ]
                }
            else:
                # Generic format for other models
                body = {
                    "prompt": prompt,
                    "max_tokens": 100,
                    "temperature": 0.0
                }
            
            # Invoke model
            response = self.client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(body)
            )
            
            # Parse response
            response_body = json.loads(response['body'].read())
            
            if "claude" in self.model_id.lower():
                category = response_body['content'][0]['text'].strip()
            else:
                category = response_body.get('completion', 'Otros').strip()
            
            # Validate category
            category = self._validate_category(category)
            
            logger.info(f"Classified as: {category}")
            return category
            
        except Exception as e:
            logger.error(f"Error classifying transaction: {e}")
            return "Otros"
    
    def classify_transactions_batch(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Classify multiple transactions
        
        Args:
            transactions: List of transaction dictionaries
            
        Returns:
            Transactions with added 'category' field
        """
        logger.info(f"Classifying {len(transactions)} transactions")
        
        classified = []
        for transaction in transactions:
            description = transaction.get('description', '')
            category = self.classify_transaction(description)
            
            transaction_copy = transaction.copy()
            transaction_copy['category'] = category
            classified.append(transaction_copy)
        
        return classified
    
    def _build_classification_prompt(self, description: str) -> str:
        """
        Build prompt for classification
        
        Args:
            description: Transaction description
            
        Returns:
            Prompt string
        """
        categories_str = ", ".join(self.CATEGORIES)
        
        prompt = f"""Clasifica la siguiente transacción en una de estas categorías: {categories_str}

Transacción: {description}

Responde ÚNICAMENTE con el nombre de la categoría, sin explicación adicional.

Ejemplos:
- "UBER TRIP" -> Transporte
- "RAPPI RESTAURANT" -> Comida
- "NETFLIX SUSCRIPCION" -> Entretenimiento
- "FARMACIA UNIVERSAL" -> Salud
- "SAGA FALABELLA ROPA" -> Compras
- "LUZ DEL SUR RECIBO" -> Servicios

Categoría:"""
        
        return prompt
    
    def _validate_category(self, category: str) -> str:
        """
        Validate and normalize category
        
        Args:
            category: Category from LLM
            
        Returns:
            Valid category name
        """
        category = category.strip()
        
        # Direct match
        if category in self.CATEGORIES:
            return category
        
        # Case-insensitive match
        for valid_cat in self.CATEGORIES:
            if category.lower() == valid_cat.lower():
                return valid_cat
        
        # Partial match
        for valid_cat in self.CATEGORIES:
            if category.lower() in valid_cat.lower() or valid_cat.lower() in category.lower():
                return valid_cat
        
        # Default
        return "Otros"
    
    def classify_with_confidence(self, description: str) -> Dict[str, Any]:
        """
        Classify transaction with confidence score
        
        Args:
            description: Transaction description
            
        Returns:
            Dictionary with category and confidence
        """
        try:
            category = self.classify_transaction(description)
            
            # Simple confidence heuristic
            confidence = self._estimate_confidence(description, category)
            
            return {
                'category': category,
                'confidence': confidence
            }
            
        except Exception as e:
            logger.error(f"Error in classification with confidence: {e}")
            return {
                'category': 'Otros',
                'confidence': 0.0
            }
    
    def _estimate_confidence(self, description: str, category: str) -> float:
        """
        Estimate confidence of classification
        
        Args:
            description: Transaction description
            category: Classified category
            
        Returns:
            Confidence score (0.0 to 1.0)
        """
        # Simple keyword-based confidence
        keywords = {
            'Comida': ['restaurant', 'comida', 'food', 'rappi', 'uber eats', 'mcdonalds', 'kfc', 'pizza'],
            'Transporte': ['uber', 'taxi', 'gasolina', 'grifo', 'peaje', 'bus', 'metro'],
            'Servicios': ['luz', 'agua', 'internet', 'telefono', 'gas', 'recibo'],
            'Compras': ['tienda', 'store', 'falabella', 'ripley', 'plaza vea', 'wong'],
            'Entretenimiento': ['netflix', 'spotify', 'cine', 'movie', 'juego', 'game'],
            'Salud': ['farmacia', 'hospital', 'clinica', 'doctor', 'medic'],
            'Educación': ['universidad', 'colegio', 'curso', 'libro', 'school'],
        }
        
        description_lower = description.lower()
        
        if category in keywords:
            for keyword in keywords[category]:
                if keyword in description_lower:
                    return 0.9
        
        # Default medium confidence
        return 0.6

