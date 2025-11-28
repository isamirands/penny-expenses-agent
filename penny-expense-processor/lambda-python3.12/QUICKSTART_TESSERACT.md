# 🚀 Quick Start - Tesseract OCR Migration

## ⚡ Comandos Rápidos

### 1️⃣ Instalar Tesseract (Windows)

```powershell
# Opción A: Script automático
.\install_tesseract_windows.ps1

# Opción B: Con Chocolatey
choco install tesseract -y

# Opción C: Manual
# Descarga desde: https://github.com/UB-Mannheim/tesseract/wiki
```

### 2️⃣ Instalar Dependencias Python

```powershell
pip install pytesseract Pillow
```

### 3️⃣ Verificar Instalación

```powershell
# Verificar Tesseract
tesseract --version

# Verificar configuración Python
python tesseract_config.py
```

### 4️⃣ Preparar Imagen de Prueba

1. Toma captura de pantalla de tu app bancaria
2. Guárdala como: `test_image_bank_app.jpg`
3. Colócala en: `penny-expense-processor/lambda-python3.12/`

### 5️⃣ Ejecutar Prueba Local

```powershell
cd penny-expense-processor\lambda-python3.12
python test_tesseract_local.py
```

**Resultado esperado:**
```
✅ Found 8 transactions
✨ TEST PASSED: Tesseract OCR works well with this image format!
```

### 6️⃣ Deploy a AWS

```powershell
cd penny-expense-processor\lambda-python3.12
sam build
sam deploy
```

**Nota:** Primera build tardará ~5-10 minutos (instala Tesseract).

### 7️⃣ Verificar en Producción

```powershell
# Ver logs en tiempo real
aws logs tail /aws/lambda/penny-expense-processor --region us-east-2 --follow
```

## 🎯 Resultado Final

✅ **Costo reducido:** $1.50/mes → $0/mes  
✅ **Velocidad mejorada:** 3-5s → 1-2s  
✅ **Sin dependencias AWS externas**

## 🆘 Ayuda Rápida

### ❌ Error: "tesseract is not installed"

```powershell
# Verifica instalación
tesseract --version

# Si no funciona, reinstala
.\install_tesseract_windows.ps1
```

### ❌ Error: "No transactions found"

1. Verifica que la imagen sea clara
2. Revisa el texto extraído en la salida
3. Ajusta PSM mode en `tesseract_client.py`

### ❌ Error: Build falla en SAM

```powershell
# Limpia cache y rebuild
Remove-Item -Recurse -Force .aws-sam
sam build --use-container
```

## 📚 Documentación Completa

- **Instrucciones detalladas:** `TEST_INSTRUCTIONS.md`
- **Resumen de cambios:** `MIGRATION_SUMMARY.md`
- **Rollback:** Ver sección en `MIGRATION_SUMMARY.md`

## 💡 Tips

1. **Primera vez:** Usa `sam build --use-container` para evitar problemas
2. **Depuración:** Agrega `logger.info()` en `tesseract_client.py`
3. **Mejor precisión:** Ajusta contraste/nitidez en `_preprocess_image()`

---

**¿Listo?** Empieza con el paso 1️⃣ y sigue la secuencia.


