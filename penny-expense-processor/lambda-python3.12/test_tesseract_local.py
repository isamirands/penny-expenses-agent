"""
Test script for Tesseract OCR locally
Tests extraction of transactions from banking app screenshot
"""
import sys
import os
from pathlib import Path

# Add expense_processor to path
sys.path.insert(0, str(Path(__file__).parent / 'expense_processor'))

from utils.tesseract_client import TesseractClient
from utils.transaction_parser import TransactionParser

def test_tesseract_extraction(image_path: str):
    """
    Test Tesseract OCR with banking app screenshot
    
    Args:
        image_path: Path to the test image
    """
    print("=" * 80)
    print("TESSERACT OCR TEST - Banking App Screenshot")
    print("=" * 80)
    print()
    
    # Check if image exists
    if not os.path.exists(image_path):
        print(f"❌ Error: Image not found at {image_path}")
        print()
        print("Please save your banking app screenshot as 'test_image_bank_app.jpg'")
        print("in the same directory as this script.")
        return False
    
    print(f"📸 Loading image: {image_path}")
    
    # Read image bytes
    with open(image_path, 'rb') as f:
        image_bytes = f.read()
    
    print(f"   Size: {len(image_bytes):,} bytes")
    print()
    
    # Initialize Tesseract client
    print("🔍 Initializing Tesseract OCR client...")
    tesseract_client = TesseractClient()
    print(f"   Language: {tesseract_client.lang}")
    print(f"   Config: {tesseract_client.config}")
    print()
    
    # Extract text
    print("📝 Extracting text from image...")
    try:
        extracted_data = tesseract_client.extract_text_with_tables(image_bytes)
        extracted_text = extracted_data['text']
        lines = extracted_data['lines']
        
        print(f"   ✅ Extracted {len(lines)} lines of text")
        print()
        
        # Show extracted text
        print("-" * 80)
        print("EXTRACTED TEXT:")
        print("-" * 80)
        for i, line in enumerate(lines, 1):
            print(f"{i:3d}| {line}")
        print("-" * 80)
        print()
        
    except Exception as e:
        print(f"   ❌ Error extracting text: {e}")
        return False
    
    # Parse transactions
    print("🔎 Parsing transactions from extracted text...")
    parser = TransactionParser()
    
    try:
        transactions = parser.parse_transactions(extracted_text)
        
        print(f"   ✅ Found {len(transactions)} transactions")
        print()
        
        if not transactions:
            print("⚠️  No transactions found!")
            print("This might indicate an OCR accuracy issue.")
            return False
        
        # Show parsed transactions
        print("=" * 80)
        print("PARSED TRANSACTIONS:")
        print("=" * 80)
        
        for i, trans in enumerate(transactions, 1):
            print(f"\n{i}. {trans['description']}")
            print(f"   📅 Date:     {trans['date']}")
            print(f"   💰 Amount:   {trans['currency']} {trans['amount']:.2f}")
            print(f"   📄 Raw line: {trans['raw_line'][:60]}...")
        
        print()
        print("=" * 80)
        
        # Validate expected transactions
        expected_merchants = [
            'SUPERMERCADO CANDY',
            'PAGO WEB DESACOPLADO',
            'SBUX 133 DT EL EJERC',
            'FARMACIA UNIVERSAL',
            'DLC*PEDIDOSYA'
        ]
        
        found_merchants = [t['description'] for t in transactions]
        matched = sum(1 for expected in expected_merchants 
                     if any(expected in desc.upper() for desc in found_merchants))
        
        print(f"\n✅ Validation: Found {matched}/{len(expected_merchants)} expected merchants")
        
        if matched >= 3:
            print("✨ TEST PASSED: Tesseract OCR works well with this image format!")
            return True
        else:
            print("⚠️  TEST WARNING: Low accuracy, may need OCR tuning")
            return False
            
    except Exception as e:
        print(f"   ❌ Error parsing transactions: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Main test function"""
    # Look for test image
    test_images = [
        'test_image_bank_app.jpg',
        'test_image_bank_app.png',
        '../test_image_bank_app.jpg',
    ]
    
    image_path = None
    for img in test_images:
        if os.path.exists(img):
            image_path = img
            break
    
    if not image_path:
        print("=" * 80)
        print("❌ TEST IMAGE NOT FOUND")
        print("=" * 80)
        print()
        print("Please save your banking app screenshot as 'test_image_bank_app.jpg'")
        print("in one of these locations:")
        for img in test_images:
            print(f"  - {os.path.abspath(img)}")
        print()
        print("Then run this script again:")
        print("  python test_tesseract_local.py")
        print()
        return
    
    # Run test
    success = test_tesseract_extraction(image_path)
    
    print()
    print("=" * 80)
    if success:
        print("✅ ALL TESTS PASSED")
        print()
        print("Tesseract OCR is working correctly!")
        print("You can now deploy the Lambda function with:")
        print("  cd penny-expense-processor/lambda-python3.12")
        print("  sam build && sam deploy")
    else:
        print("⚠️  TESTS COMPLETED WITH WARNINGS")
        print()
        print("Tesseract extracted text but accuracy may need improvement.")
        print("Consider adjusting PSM mode or preprocessing parameters.")
    print("=" * 80)


if __name__ == '__main__':
    # Check if required packages are installed
    try:
        import pytesseract
        from PIL import Image
    except ImportError as e:
        print("=" * 80)
        print("❌ MISSING DEPENDENCIES")
        print("=" * 80)
        print()
        print("Please install required packages:")
        print("  pip install pytesseract Pillow")
        print()
        print("Also install Tesseract OCR on your system:")
        print("  Windows: https://github.com/UB-Mannheim/tesseract/wiki")
        print("  Mac: brew install tesseract tesseract-lang")
        print("  Linux: sudo apt-get install tesseract-ocr tesseract-ocr-spa")
        print()
        sys.exit(1)
    
    # Configure Tesseract path if needed (Windows)
    try:
        from tesseract_config import configure_tesseract
        configure_tesseract()
    except ImportError:
        pass  # tesseract_config.py not found, assume Tesseract is in PATH
    
    main()

