"""
Funciones auxiliares para interactuar con DynamoDB
"""
import os
import boto3
from boto3.dynamodb.conditions import Key
from decimal import Decimal

TABLE_NAME = os.environ.get("IMAGES_TABLE_NAME")
dynamodb = boto3.resource("dynamodb")
table = dynamodb.Table(TABLE_NAME) if TABLE_NAME else None


def save_images_metadata(chat_id, message_id, file_ids):
    """
    Guarda los metadatos de las imágenes en DynamoDB
    Lambda #1 solo guarda los file_ids, Lambda #2 agregará los datos procesados
    
    Args:
        chat_id: ID del chat
        message_id: ID del mensaje
        file_ids: Lista de file_ids de las imágenes
    
    Returns:
        Response de DynamoDB
    """
    if not table:
        raise ValueError("TABLE_NAME no está configurada")
    
    item = {
        "chat_id": str(chat_id),
        "message_id": str(message_id),
        "file_ids": file_ids,
        "timestamp": Decimal(str(int(__import__("time").time()))),
        "status": "pending"  # pending -> processing -> completed
    }
    
    return table.put_item(Item=item)


def get_images_metadata(chat_id, message_id):
    """
    Recupera los metadatos de las imágenes desde DynamoDB
    
    Args:
        chat_id: ID del chat
        message_id: ID del mensaje
    
    Returns:
        Item de DynamoDB o None si no existe
    """
    if not table:
        raise ValueError("TABLE_NAME no está configurada")
    
    response = table.get_item(
        Key={
            "chat_id": str(chat_id),
            "message_id": str(message_id)
        }
    )
    
    return response.get("Item")


def count_images_by_chat(chat_id):
    """
    Cuenta cuántas imágenes tiene registradas un chat
    
    Args:
        chat_id: ID del chat
    
    Returns:
        Número de imágenes registradas
    """
    if not table:
        raise ValueError("TABLE_NAME no está configurada")
    
    response = table.query(
        KeyConditionExpression=Key("chat_id").eq(str(chat_id))
    )
    
    return response.get("Count", 0)

