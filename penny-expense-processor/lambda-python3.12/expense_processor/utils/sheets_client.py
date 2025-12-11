"""
Google Sheets client for writing expense data
"""
import os
import json
import logging
import boto3
from typing import List, Dict, Any
from datetime import datetime

# Google Sheets API imports
try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
except ImportError:
    # Will be handled at runtime
    pass

logger = logging.getLogger(__name__)

class SheetsClient:
    """Client for writing data to Google Sheets"""
    
    SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
    
    def __init__(self, sheet_id: str, secret_name: str):
        """
        Initialize Google Sheets client
        
        Args:
            sheet_id: Google Sheet ID
            secret_name: Name of Secrets Manager secret containing service account credentials
        """
        self.sheet_id = sheet_id
        self.secret_name = secret_name
        self.service = None
        self._initialize_service()
    
    def _initialize_service(self):
        """Initialize Google Sheets API service"""
        try:
            # Get service account credentials from Secrets Manager
            credentials_json = self._get_service_account_credentials()
            
            # Create credentials object
            credentials = service_account.Credentials.from_service_account_info(
                credentials_json,
                scopes=self.SCOPES
            )
            
            # Build service
            self.service = build('sheets', 'v4', credentials=credentials)
            logger.info("Google Sheets service initialized successfully")
            
        except Exception as e:
            logger.error(f"Error initializing Google Sheets service: {e}")
            raise
    
    def _get_service_account_credentials(self) -> Dict[str, Any]:
        """
        Get service account credentials from AWS Secrets Manager
        
        Returns:
            Service account credentials as dictionary
        """
        try:
            secrets_client = boto3.client('secretsmanager')
            response = secrets_client.get_secret_value(SecretId=self.secret_name)
            
            # Parse secret
            secret_string = response['SecretString']
            credentials = json.loads(secret_string)
            
            logger.info(f"Retrieved service account credentials from {self.secret_name}")
            return credentials
            
        except Exception as e:
            logger.error(f"Error retrieving service account credentials: {e}")
            raise
    
    def append_transactions(
        self,
        transactions: List[Dict[str, Any]],
        card_type: str,
        sheet_name: str = "Gastos"
    ) -> int:
        """
        Append transactions to Google Sheet
        
        Args:
            transactions: List of transaction dictionaries
            card_type: Type of card (Visa, Master, Débito)
            sheet_name: Name of the sheet tab
            
        Returns:
            Number of rows added
        """
        if not transactions:
            logger.warning("No transactions to append")
            return 0
        
        try:
            logger.info(f"=== SHEETS CLIENT: APPENDING TRANSACTIONS ===")
            logger.info(f"Number of transactions: {len(transactions)}")
            logger.info(f"Card type: {card_type}")
            logger.info(f"Sheet name: {sheet_name}")
            
            # Prepare rows
            rows = []
            for i, trans in enumerate(transactions):
                logger.info(f"Processing transaction {i+1} for sheets: {json.dumps(trans, indent=2, ensure_ascii=False)}")
                # Prefix date with single quote to force Google Sheets to treat it as text
                # This prevents auto-conversion to serial number format
                date_value = trans.get('date', '')
                if date_value:
                    date_value = f"'{date_value}"
                
                row = [
                    date_value,
                    card_type,
                    trans.get('category', 'Otros'),
                    trans.get('currency', 'PEN'),
                    trans.get('description', ''),
                    trans.get('amount', 0.0)
                ]
                logger.info(f"Row {i+1} prepared: {row}")
                rows.append(row)
            
            logger.info(f"Total rows prepared: {len(rows)}")
            logger.info(f"First row: {rows[0] if rows else 'No rows'}")
            
            # Append to sheet
            range_name = f"{sheet_name}!A:F"  # Columns: Fecha, Método de pago, Categoría, Moneda, Descripción, Monto
            
            body = {
                'values': rows
            }
            
            result = self.service.spreadsheets().values().append(
                spreadsheetId=self.sheet_id,
                range=range_name,
                valueInputOption='USER_ENTERED',
                insertDataOption='INSERT_ROWS',
                body=body
            ).execute()
            
            updated_rows = result.get('updates', {}).get('updatedRows', 0)
            logger.info(f"Successfully appended {updated_rows} rows")
            
            return updated_rows
            
        except HttpError as e:
            logger.error(f"Google Sheets API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Error appending transactions: {e}")
            raise
    
    def create_sheet_if_not_exists(self, sheet_name: str = "Gastos"):
        """
        Create sheet tab if it doesn't exist
        
        Args:
            sheet_name: Name of the sheet tab
        """
        try:
            # Get existing sheets
            spreadsheet = self.service.spreadsheets().get(
                spreadsheetId=self.sheet_id
            ).execute()
            
            sheets = spreadsheet.get('sheets', [])
            sheet_names = [sheet['properties']['title'] for sheet in sheets]
            
            if sheet_name in sheet_names:
                logger.info(f"Sheet '{sheet_name}' already exists")
                return
            
            # Create new sheet
            requests = [{
                'addSheet': {
                    'properties': {
                        'title': sheet_name
                    }
                }
            }]
            
            body = {'requests': requests}
            
            self.service.spreadsheets().batchUpdate(
                spreadsheetId=self.sheet_id,
                body=body
            ).execute()
            
            logger.info(f"Created new sheet: {sheet_name}")
            
            # Add header row
            self._add_header_row(sheet_name)
            
        except HttpError as e:
            logger.error(f"Error creating sheet: {e}")
            raise
    
    def _add_header_row(self, sheet_name: str):
        """
        Add header row to new sheet
        
        Args:
            sheet_name: Name of the sheet tab
        """
        try:
            headers = [
                ['Fecha', 'Método de pago', 'Categoría', 'Moneda', 'Descripción', 'Monto']
            ]
            
            range_name = f"{sheet_name}!A1:F1"
            
            body = {
                'values': headers
            }
            
            self.service.spreadsheets().values().update(
                spreadsheetId=self.sheet_id,
                range=range_name,
                valueInputOption='USER_ENTERED',
                body=body
            ).execute()
            
            # Format header row (bold)
            self._format_header_row(sheet_name)
            
            logger.info("Added header row")
            
        except Exception as e:
            logger.error(f"Error adding header row: {e}")
    
    def _format_header_row(self, sheet_name: str):
        """
        Format header row (make it bold)
        
        Args:
            sheet_name: Name of the sheet tab
        """
        try:
            # Get sheet ID
            spreadsheet = self.service.spreadsheets().get(
                spreadsheetId=self.sheet_id
            ).execute()
            
            sheet_id = None
            for sheet in spreadsheet.get('sheets', []):
                if sheet['properties']['title'] == sheet_name:
                    sheet_id = sheet['properties']['sheetId']
                    break
            
            if not sheet_id:
                return
            
            # Format request
            requests = [{
                'repeatCell': {
                    'range': {
                        'sheetId': sheet_id,
                        'startRowIndex': 0,
                        'endRowIndex': 1
                    },
                    'cell': {
                        'userEnteredFormat': {
                            'textFormat': {
                                'bold': True
                            }
                        }
                    },
                    'fields': 'userEnteredFormat.textFormat.bold'
                }
            }]
            
            body = {'requests': requests}
            
            self.service.spreadsheets().batchUpdate(
                spreadsheetId=self.sheet_id,
                body=body
            ).execute()
            
        except Exception as e:
            logger.error(f"Error formatting header row: {e}")
    
    def get_sheet_url(self) -> str:
        """
        Get URL to the Google Sheet
        
        Returns:
            Sheet URL
        """
        return f"https://docs.google.com/spreadsheets/d/{self.sheet_id}"
    
    def test_connection(self) -> bool:
        """
        Test connection to Google Sheets
        
        Returns:
            True if connection successful
        """
        try:
            # Try to get spreadsheet metadata
            spreadsheet = self.service.spreadsheets().get(
                spreadsheetId=self.sheet_id
            ).execute()
            
            title = spreadsheet.get('properties', {}).get('title', 'Unknown')
            logger.info(f"Connected to sheet: {title}")
            
            return True
            
        except HttpError as e:
            logger.error(f"Connection test failed: {e}")
            return False
        except Exception as e:
            logger.error(f"Connection test error: {e}")
            return False

