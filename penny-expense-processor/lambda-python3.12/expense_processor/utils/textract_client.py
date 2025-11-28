"""
AWS Textract client for extracting text from images
"""
import logging
import boto3
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

class TextractClient:
    """Client for AWS Textract service"""
    
    def __init__(self):
        """Initialize Textract client"""
        self.client = boto3.client('textract')
    
    def extract_text_from_bytes(self, image_bytes: bytes) -> str:
        """
        Extract text from image bytes using Textract
        
        Args:
            image_bytes: Image content as bytes
            
        Returns:
            Extracted text as a single string
        """
        try:
            logger.info(f"Extracting text from image ({len(image_bytes)} bytes)")
            
            # Call Textract
            response = self.client.detect_document_text(
                Document={'Bytes': image_bytes}
            )
            
            # Extract text from blocks
            text_lines = []
            for block in response.get('Blocks', []):
                if block['BlockType'] == 'LINE':
                    text_lines.append(block.get('Text', ''))
            
            full_text = '\n'.join(text_lines)
            logger.info(f"Extracted {len(text_lines)} lines of text")
            
            return full_text
            
        except Exception as e:
            logger.error(f"Error extracting text with Textract: {e}")
            raise
    
    def extract_text_with_tables(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Extract text and tables from image using Textract AnalyzeDocument
        
        Args:
            image_bytes: Image content as bytes
            
        Returns:
            Dictionary with extracted text and table data
        """
        try:
            logger.info(f"Analyzing document from image ({len(image_bytes)} bytes)")
            
            # Call Textract with table detection
            response = self.client.analyze_document(
                Document={'Bytes': image_bytes},
                FeatureTypes=['TABLES']
            )
            
            # Extract text lines
            text_lines = []
            tables = []
            
            # Process blocks
            blocks = response.get('Blocks', [])
            block_map = {block['Id']: block for block in blocks}
            
            # Extract lines
            for block in blocks:
                if block['BlockType'] == 'LINE':
                    text_lines.append(block.get('Text', ''))
                elif block['BlockType'] == 'TABLE':
                    table_data = self._parse_table(block, block_map)
                    if table_data:
                        tables.append(table_data)
            
            full_text = '\n'.join(text_lines)
            logger.info(f"Extracted {len(text_lines)} lines and {len(tables)} tables")
            
            return {
                'text': full_text,
                'lines': text_lines,
                'tables': tables
            }
            
        except Exception as e:
            logger.error(f"Error analyzing document with Textract: {e}")
            raise
    
    def _parse_table(self, table_block: Dict, block_map: Dict) -> List[List[str]]:
        """
        Parse table block into a 2D list
        
        Args:
            table_block: Table block from Textract
            block_map: Map of block IDs to blocks
            
        Returns:
            2D list representing the table
        """
        table = []
        
        if 'Relationships' not in table_block:
            return table
        
        # Find cells
        for relationship in table_block['Relationships']:
            if relationship['Type'] == 'CHILD':
                cells = []
                for cell_id in relationship['Ids']:
                    cell_block = block_map.get(cell_id)
                    if cell_block and cell_block['BlockType'] == 'CELL':
                        cells.append(cell_block)
                
                # Sort cells by row and column
                cells.sort(key=lambda x: (x.get('RowIndex', 0), x.get('ColumnIndex', 0)))
                
                # Build table structure
                current_row = []
                current_row_index = 1
                
                for cell in cells:
                    row_index = cell.get('RowIndex', 0)
                    
                    # New row
                    if row_index != current_row_index:
                        if current_row:
                            table.append(current_row)
                        current_row = []
                        current_row_index = row_index
                    
                    # Get cell text
                    cell_text = self._get_cell_text(cell, block_map)
                    current_row.append(cell_text)
                
                # Add last row
                if current_row:
                    table.append(current_row)
        
        return table
    
    def _get_cell_text(self, cell_block: Dict, block_map: Dict) -> str:
        """
        Get text content of a cell
        
        Args:
            cell_block: Cell block from Textract
            block_map: Map of block IDs to blocks
            
        Returns:
            Cell text
        """
        text = ""
        
        if 'Relationships' in cell_block:
            for relationship in cell_block['Relationships']:
                if relationship['Type'] == 'CHILD':
                    for word_id in relationship['Ids']:
                        word_block = block_map.get(word_id)
                        if word_block and word_block['BlockType'] == 'WORD':
                            text += word_block.get('Text', '') + " "
        
        return text.strip()

