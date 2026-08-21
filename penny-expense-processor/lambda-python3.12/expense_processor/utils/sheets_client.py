"""
Google Sheets client for writing expense data
"""
import os
import json
import logging
import time
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

    # Matches the "Expenses" tab schema read/written by penny-expenses-ui-stack's
    # Google Apps Script backend (see penny-expenses-ui-stack/apps-script/Code.gs).
    EXPENSES_SHEET_NAME = "Expenses"
    EXPENSES_HEADERS = [
        'ID', 'User ID', 'Fecha', 'Método de pago', 'ID Categoría', 'Moneda',
        'Descripción', 'Monto', 'Reembolsable', 'Created At', 'Updated At', 'Monto PEN',
    ]

    # "Categorias" tab (ID | Nombre | ID Presupuesto), seeded by Code.gs —
    # used to resolve Gemini's Spanish category name to its row ID.
    CATEGORIAS_SHEET_NAME = "Categorias"
    DEFAULT_CATEGORY_NAME = "Otros"

    # Fixed conversion rate — kept in sync by hand with Code.gs's USD_TO_PEN_RATE.
    USD_TO_PEN_RATE = 3.4

    def __init__(self, sheet_id: str, secret_name: str, user_id: str):
        """
        Initialize Google Sheets client

        Args:
            sheet_id: Google Sheet ID
            secret_name: Name of Secrets Manager secret containing service account credentials
            user_id: Fixed dashboard user id (email) to stamp on rows this bot writes
        """
        self.sheet_id = sheet_id
        self.secret_name = secret_name
        self.user_id = user_id
        self.service = None
        self._category_lookup = None
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
    
    def _load_category_lookup(self) -> Dict[str, str]:
        """Read the "Categorias" tab once per invocation and build a
        {normalized_name: id} lookup used to resolve Gemini's category name."""
        if self._category_lookup is not None:
            return self._category_lookup

        result = self.service.spreadsheets().values().get(
            spreadsheetId=self.sheet_id,
            range=f"{self.CATEGORIAS_SHEET_NAME}!A:B",
        ).execute()

        lookup = {}
        for row in result.get('values', [])[1:]:  # skip header row
            if len(row) < 2:
                continue
            category_id, name = row[0], row[1]
            lookup[str(name).strip().lower()] = category_id

        self._category_lookup = lookup
        return lookup

    def resolve_category_id(self, category_name: str) -> str:
        """Resolve a Spanish category name (from Gemini) to its Categorias.ID,
        falling back to the "Otros" row's ID if the name doesn't match."""
        lookup = self._load_category_lookup()
        category_id = lookup.get(str(category_name).strip().lower())
        if category_id:
            return category_id

        fallback = lookup.get(self.DEFAULT_CATEGORY_NAME.lower())
        if fallback:
            logger.warning(f"Category '{category_name}' not found in Categorias tab, falling back to Otros")
            return fallback

        logger.error(f"Category '{category_name}' not found and no 'Otros' fallback in Categorias tab")
        return str(category_name)

    def compute_monto_pen(self, amount: float, currency: str) -> float:
        """Convert an amount to PEN using a fixed rate (kept in sync with Code.gs)."""
        amount = float(amount or 0.0)
        if str(currency).upper() == 'USD':
            return round(amount * self.USD_TO_PEN_RATE, 2)
        return round(amount, 2)

    def append_expenses(
        self,
        transactions: List[Dict[str, Any]],
        card_type: str,
    ) -> int:
        """
        Append transactions to the "Expenses" tab, in the schema the dashboard
        (penny-expenses-ui-stack) reads via its Apps Script backend.

        Args:
            transactions: List of transaction dictionaries
            card_type: Type of card ("Visa Oro", "IO", "Débito")

        Returns:
            Number of rows added
        """
        if not transactions:
            logger.warning("No transactions to append")
            return 0

        try:
            logger.info(f"=== SHEETS CLIENT: APPENDING EXPENSES ===")
            logger.info(f"Number of transactions: {len(transactions)}")
            logger.info(f"Card type: {card_type}")

            now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
            # "BOT-" prefix keeps bot-generated IDs out of Code.gs's nextId()
            # scan (it only matches "EXP-<digits>"), so the two ID sequences
            # can never collide even with concurrent writes.
            batch_stamp = int(time.time() * 1000)

            rows = []
            for i, trans in enumerate(transactions):
                logger.info(f"Processing transaction {i+1} for sheets: {json.dumps(trans, indent=2, ensure_ascii=False)}")
                # Prefix date with single quote to force Google Sheets to treat it as text
                # This prevents auto-conversion to serial number format
                date_value = trans.get('date', '')
                if date_value:
                    date_value = f"'{date_value}"

                expense_id = f"BOT-{batch_stamp}-{i}"
                currency = trans.get('currency', 'PEN')
                amount = trans.get('amount', 0.0)
                row = [
                    expense_id,
                    self.user_id,
                    date_value,
                    card_type,
                    self.resolve_category_id(trans.get('category', 'Otros')),
                    currency,
                    trans.get('description', ''),
                    amount,
                    False,  # Reembolsable — the bot has no way to know this
                    now,
                    now,
                    self.compute_monto_pen(amount, currency),
                ]
                logger.info(f"Row {i+1} prepared: {row}")
                rows.append(row)

            logger.info(f"Total rows prepared: {len(rows)}")

            range_name = f"{self.EXPENSES_SHEET_NAME}!A:L"

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

    def create_expenses_sheet_if_not_exists(self):
        """Create the "Expenses" tab (dashboard schema) if it doesn't exist yet."""
        try:
            spreadsheet = self.service.spreadsheets().get(
                spreadsheetId=self.sheet_id
            ).execute()

            sheets = spreadsheet.get('sheets', [])
            sheet_names = [sheet['properties']['title'] for sheet in sheets]

            if self.EXPENSES_SHEET_NAME in sheet_names:
                logger.info(f"Sheet '{self.EXPENSES_SHEET_NAME}' already exists")
                return

            requests = [{
                'addSheet': {
                    'properties': {
                        'title': self.EXPENSES_SHEET_NAME
                    }
                }
            }]

            body = {'requests': requests}

            self.service.spreadsheets().batchUpdate(
                spreadsheetId=self.sheet_id,
                body=body
            ).execute()

            logger.info(f"Created new sheet: {self.EXPENSES_SHEET_NAME}")

            self._add_expenses_header_row()

        except HttpError as e:
            logger.error(f"Error creating sheet: {e}")
            raise

    def _add_expenses_header_row(self):
        """Write the "Expenses" tab header row (dashboard schema)."""
        try:
            range_name = f"{self.EXPENSES_SHEET_NAME}!A1:L1"

            body = {
                'values': [self.EXPENSES_HEADERS]
            }

            self.service.spreadsheets().values().update(
                spreadsheetId=self.sheet_id,
                range=range_name,
                valueInputOption='USER_ENTERED',
                body=body
            ).execute()

            self._format_header_row(self.EXPENSES_SHEET_NAME)

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

