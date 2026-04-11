"""
Funciones auxiliares para interactuar con la API de Telegram
"""
import os
import json
import requests

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN")
TELEGRAM_API_URL = f"https://api.telegram.org/bot{BOT_TOKEN}"


def telegram_request(method, payload):
    """
    Realiza una petición a la API de Telegram
    
    Args:
        method: Método de la API (ej: 'sendMessage', 'answerCallbackQuery')
        payload: Diccionario con los parámetros de la petición
    
    Returns:
        Response de la API de Telegram
    """
    url = f"{TELEGRAM_API_URL}/{method}"
    response = requests.post(url, json=payload, timeout=10)
    response.raise_for_status()
    return response.json()


def send_message(chat_id, text, reply_markup=None):
    """
    Envía un mensaje a un chat de Telegram
    
    Args:
        chat_id: ID del chat destino
        text: Texto del mensaje
        reply_markup: Opcional, teclado inline o reply keyboard
    
    Returns:
        Response de la API
    """
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    
    if reply_markup:
        payload["reply_markup"] = reply_markup
    
    return telegram_request("sendMessage", payload)


def build_card_keyboard(chat_id, message_id):
    """
    Genera un teclado inline con botones para seleccionar tipo de tarjeta
    
    Args:
        chat_id: ID del chat
        message_id: ID del mensaje original
    
    Returns:
        Diccionario con la estructura del teclado inline
    """
    keyboard = {
        "inline_keyboard": [
            [
                {
                    "text": "Visa Oro",
                    "callback_data": f"CARD_Visa Oro|{chat_id}|{message_id}"
                },
                {
                    "text": "IO",
                    "callback_data": f"CARD_IO|{chat_id}|{message_id}"
                }
            ],
            [
                {
                    "text": "Débito",
                    "callback_data": f"CARD_Débito|{chat_id}|{message_id}"
                }
            ]
        ]
    }
    
    return keyboard


def answer_callback_query(callback_query_id, text=None, show_alert=False):
    """
    Responde a una callback query de Telegram
    
    Args:
        callback_query_id: ID de la callback query
        text: Texto opcional a mostrar
        show_alert: Si True, muestra una alerta en lugar de una notificación
    """
    payload = {
        "callback_query_id": callback_query_id
    }
    
    if text:
        payload["text"] = text
    
    if show_alert:
        payload["show_alert"] = True
    
    return telegram_request("answerCallbackQuery", payload)

