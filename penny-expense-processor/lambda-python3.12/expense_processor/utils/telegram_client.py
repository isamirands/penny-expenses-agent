"""
Telegram API client for downloading images and sending messages
"""
import os
import logging
import requests
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class TelegramClient:
    """Client for interacting with Telegram Bot API"""
    
    def __init__(self, bot_token: str):
        """
        Initialize Telegram client
        
        Args:
            bot_token: Telegram Bot API token
        """
        self.bot_token = bot_token
        self.api_url = f"https://api.telegram.org/bot{bot_token}"
    
    def get_file_info(self, file_id: str) -> Dict[str, Any]:
        """
        Get file information from Telegram
        
        Args:
            file_id: Telegram file_id
            
        Returns:
            Dictionary with file information including file_path
        """
        url = f"{self.api_url}/getFile"
        payload = {"file_id": file_id}
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()
            result = response.json()
            
            if not result.get("ok"):
                raise Exception(f"Telegram API error: {result.get('description')}")
            
            return result.get("result", {})
        except Exception as e:
            logger.error(f"Error getting file info for {file_id}: {e}")
            raise
    
    def download_file(self, file_path: str) -> bytes:
        """
        Download file from Telegram servers
        
        Args:
            file_path: File path returned by getFile API
            
        Returns:
            File content as bytes
        """
        url = f"https://api.telegram.org/file/bot{self.bot_token}/{file_path}"
        
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            return response.content
        except Exception as e:
            logger.error(f"Error downloading file from {file_path}: {e}")
            raise
    
    def download_image(self, file_id: str) -> bytes:
        """
        Download image from Telegram using file_id
        
        Args:
            file_id: Telegram file_id
            
        Returns:
            Image content as bytes
        """
        logger.info(f"Downloading image with file_id: {file_id}")
        
        # Get file info
        file_info = self.get_file_info(file_id)
        file_path = file_info.get("file_path")
        
        if not file_path:
            raise Exception(f"No file_path in response for file_id: {file_id}")
        
        # Download file
        file_content = self.download_file(file_path)
        logger.info(f"Downloaded {len(file_content)} bytes")
        
        return file_content
    
    def send_message(self, chat_id: str, text: str, parse_mode: str = "HTML") -> Dict[str, Any]:
        """
        Send message to Telegram chat
        
        Args:
            chat_id: Chat ID to send message to
            text: Message text
            parse_mode: Parse mode (HTML or Markdown)
            
        Returns:
            API response
        """
        url = f"{self.api_url}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode
        }
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()
            result = response.json()
            
            if not result.get("ok"):
                raise Exception(f"Telegram API error: {result.get('description')}")
            
            return result.get("result", {})
        except Exception as e:
            logger.error(f"Error sending message to {chat_id}: {e}")
            raise
    
    def send_error_message(self, chat_id: str, error_message: str):
        """
        Send error message to user
        
        Args:
            chat_id: Chat ID
            error_message: Error description
        """
        text = f"❌ <b>Error al procesar imágenes</b>\n\n{error_message}\n\nPor favor, intenta nuevamente."
        self.send_message(chat_id, text)
    
    def send_success_message(self, chat_id: str, transactions_count: int, card_type: str):
        """
        Send success message to user
        
        Args:
            chat_id: Chat ID
            transactions_count: Number of transactions processed
            card_type: Type of card used
        """
        text = (
            f"✅ <b>Procesamiento completado</b>\n\n"
            f"🔹 Tarjeta: <b>{card_type}</b>\n"
            f"🔹 Transacciones registradas: <b>{transactions_count}</b>\n\n"
            f"Los gastos han sido guardados en Google Sheets."
        )
        self.send_message(chat_id, text)

