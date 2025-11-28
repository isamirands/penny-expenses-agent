# Instrucciones para Probar Tesseract OCR Localmente

## 📋 Requisitos Previos

### 1. Instalar Tesseract OCR en tu sistema

#### Windows:
1. Descarga el instalador desde: https://github.com/UB-Mannheim/tesseract/wiki
2. Ejecuta el instalador (recomendado: `tesseract-ocr-w64-setup-5.3.3.20231005.exe`)
3. Durante la instalación, asegúrate de seleccionar **"Additional language data"** → **Spanish**
4. Agrega Tesseract al PATH:
   - Ruta típica: `C:\Program Files\Tesseract-OCR`
   - Agregar al PATH del sistema

5. Verifica la instalación:
```powershell
tesseract --version
```

#### Mac:
```bash
brew install tesseract tesseract-lang
```

#### Linux:
```bash
sudo apt-get update
sudo apt-get install tesseract-ocr tesseract-ocr-spa
```

### 2. Instalar dependencias Python

```powershell
pip install pytesseract Pillow
```

## 📸 Preparar Imagen de Prueba

1. Guarda tu captura de pantalla de la app bancaria
2. Renómbrala como: `test_image_bank_app.jpg`
3. Colócala en el directorio: `penny-expense-processor/lambda-python3.12/`

## 🧪 Ejecutar Prueba Local

```powershell
cd penny-expense-processor\lambda-python3.12
python test_tesseract_local.py
```

## ✅ Resultados Esperados

El script debe:
1. ✅ Extraer texto de la imagen
2. ✅ Mostrar líneas de texto detectadas
3. ✅ Parsear al menos 5-8 transacciones
4. ✅ Identificar correctamente:
   - Nombres de comercios (ej: SUPERMERCADO CANDY S)
   - Fechas (ej: 27 Noviembre)
   - Montos (ej: S/ -60.61, $ -190.71)
   - Monedas (PEN/USD)

## 📊 Ejemplo de Salida Exitosa

```
================================================================================
TESSERACT OCR TEST - Banking App Screenshot
================================================================================

📸 Loading image: test_image_bank_app.jpg
   Size: 245,832 bytes

🔍 Initializing Tesseract OCR client...
   Language: spa+eng
   Config: --psm 3 --oem 3

📝 Extracting text from image...
   ✅ Extracted 45 lines of text

--------------------------------------------------------------------------------
EXTRACTED TEXT:
--------------------------------------------------------------------------------
  1| Tarjeta de crédito
  2| En cuotas
  3| Este mes
  4| SUPERMERCADO CANDY S
  5| 27 Noviembre
  6| S/ -60.61
  7| PAGO WEB DESACOPLADO
  8| 27 Noviembre
  9| $ -190.71
...
--------------------------------------------------------------------------------

🔎 Parsing transactions from extracted text...
   ✅ Found 8 transactions

================================================================================
PARSED TRANSACTIONS:
================================================================================

1. SUPERMERCADO CANDY S
   📅 Date:     2025-11-27
   💰 Amount:   PEN 60.61
   📄 Raw line: SUPERMERCADO CANDY S...

2. PAGO WEB DESACOPLADO
   📅 Date:     2025-11-27
   💰 Amount:   USD 190.71
   📄 Raw line: PAGO WEB DESACOPLADO...

...

================================================================================

✅ Validation: Found 5/5 expected merchants
✨ TEST PASSED: Tesseract OCR works well with this image format!

================================================================================
✅ ALL TESTS PASSED

Tesseract OCR is working correctly!
You can now deploy the Lambda function with:
  cd penny-expense-processor/lambda-python3.12
  sam build && sam deploy
================================================================================
```

## ⚠️ Troubleshooting

### Error: "tesseract is not installed or it's not in your PATH"

**Solución:**
1. Verifica que Tesseract está instalado: `tesseract --version`
2. Si no está en PATH, agrégalo manualmente o configura:
```python
# En Windows, agregar al inicio del script:
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
```

### Error: "No transactions found"

**Posibles causas:**
1. Imagen de baja calidad
2. OCR no detectó el texto correctamente
3. Formato de app bancaria diferente al esperado

**Soluciones:**
1. Verifica que la imagen sea clara y legible
2. Ajusta el PSM mode en `tesseract_client.py`:
   - `--psm 6`: Para bloques uniformes de texto
   - `--psm 11`: Para texto disperso
3. Revisa el texto extraído en la salida para ver qué detectó Tesseract

### Baja precisión (< 50% de transacciones)

**Soluciones:**
1. Ajustar preprocesamiento en `tesseract_client.py`:
   - Aumentar contraste: `enhancer.enhance(1.5)`
   - Aumentar sharpness: `enhancer.enhance(1.5)`
   - Convertir a escala de grises
2. Probar con imagen de mayor resolución
3. Recortar la imagen solo al área de transacciones

## 🚀 Siguiente Paso: Deploy

Si la prueba local es exitosa:

```powershell
cd penny-expense-processor\lambda-python3.12
sam build
sam deploy
```

Esto desplegará la Lambda con Tesseract OCR en lugar de AWS Textract.

## 💰 Ahorro de Costos

- **Antes (Textract)**: ~$1.50/mes por 1000 imágenes
- **Ahora (Tesseract)**: $0 (incluido en la Lambda)
- **Ahorro anual**: ~$18/año


