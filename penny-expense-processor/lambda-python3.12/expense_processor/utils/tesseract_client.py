"""
Tesseract OCR client for extracting text from images
"""
import io
import logging
from typing import Dict, Any
from PIL import Image, ImageEnhance, ImageFilter
import pytesseract

logger = logging.getLogger(__name__)

class TesseractClient:
    """Client for Tesseract OCR service"""
    
    def __init__(self):
        """Initialize Tesseract client"""
        # Configure Tesseract for Spanish language
        self.lang = 'spa+eng'  # Spanish + English for better accuracy
        
        # PSM (Page Segmentation Mode) options:
        # 3 = Fully automatic page segmentation (default)
        # 6 = Assume a single uniform block of text
        # 11 = Sparse text. Find as much text as possible in no particular order
        self.config = '--psm 3 --oem 3'  # OEM 3 = Default, based on what is available
    
    def extract_text_from_bytes(self, image_bytes: bytes) -> str:
        """
        Extract text from image bytes using Tesseract
        
        Args:
            image_bytes: Image content as bytes
            
        Returns:
            Extracted text as a single string
        """
        try:
            logger.info(f"Extracting text from image ({len(image_bytes)} bytes)")
            
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Preprocess image for better OCR accuracy
            image = self._preprocess_image(image)
            
            # Extract text with Tesseract
            text = pytesseract.image_to_string(
                image,
                lang=self.lang,
                config=self.config
            )
            
            # Clean up extracted text
            text = text.strip()
            
            # Count lines for logging
            text_lines = [line for line in text.split('\n') if line.strip()]
            logger.info(f"Extracted {len(text_lines)} lines of text")
            
            return text
            
        except Exception as e:
            logger.error(f"Error extracting text with Tesseract: {e}", exc_info=True)
            raise
    
    def extract_text_with_tables(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Extract text and tables from image using Tesseract
        
        This method provides compatibility with TextractClient interface.
        Note: Tesseract doesn't detect tables explicitly, but we maintain
        the same return format for compatibility.
        
        Args:
            image_bytes: Image content as bytes
            
        Returns:
            Dictionary with extracted text and line data
        """
        try:
            logger.info(f"Analyzing document from image ({len(image_bytes)} bytes)")
            
            # Convert bytes to PIL Image
            image = Image.open(io.BytesIO(image_bytes))
            
            # Preprocess image
            image = self._preprocess_image(image)
            
            # Extract text
            text = pytesseract.image_to_string(
                image,
                lang=self.lang,
                config=self.config
            )
            
            # Split into lines
            text_lines = [line.strip() for line in text.split('\n') if line.strip()]
            
            full_text = '\n'.join(text_lines)
            
            logger.info(f"Extracted {len(text_lines)} lines")
            
            return {
                'text': full_text,
                'lines': text_lines,
                'tables': []  # Tesseract doesn't detect tables explicitly
            }
            
        except Exception as e:
            logger.error(f"Error analyzing document with Tesseract: {e}", exc_info=True)
            raise
    
    def _preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Preprocess image for better OCR accuracy
        
        Args:
            image: PIL Image object
            
        Returns:
            Preprocessed PIL Image
        """
        try:
            # Convert to RGB if necessary
            if image.mode not in ('RGB', 'L'):
                image = image.convert('RGB')
            
            # Resize if image is too small (upscale for better OCR)
            width, height = image.size
            min_dimension = 800
            
            if width < min_dimension or height < min_dimension:
                scale_factor = max(min_dimension / width, min_dimension / height)
                new_width = int(width * scale_factor)
                new_height = int(height * scale_factor)
                image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
                logger.info(f"Upscaled image from {width}x{height} to {new_width}x{new_height}")
            
            # Enhance contrast slightly for better text recognition
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(1.2)
            
            # Enhance sharpness
            enhancer = ImageEnhance.Sharpness(image)
            image = enhancer.enhance(1.3)
            
            return image
            
        except Exception as e:
            logger.warning(f"Error preprocessing image: {e}")
            # Return original image if preprocessing fails
            return image


