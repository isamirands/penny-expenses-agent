"""
Configuración de Tesseract para Windows
Si Tesseract no está en tu PATH, puedes configurar la ruta aquí.
"""
import os
import sys
import platform

def configure_tesseract():
    """
    Configura la ruta de Tesseract si no está en PATH
    """
    # Solo aplicar en Windows
    if platform.system() != 'Windows':
        return
    
    # Intentar importar pytesseract
    try:
        import pytesseract
    except ImportError:
        print("❌ pytesseract no está instalado")
        print("Instala con: pip install pytesseract Pillow")
        sys.exit(1)
    
    # Verificar si tesseract ya está accesible
    try:
        import subprocess
        subprocess.run(['tesseract', '--version'], 
                      capture_output=True, 
                      check=True)
        print("✅ Tesseract encontrado en PATH")
        return
    except (subprocess.CalledProcessError, FileNotFoundError):
        pass
    
    # Rutas comunes de instalación de Tesseract en Windows
    common_paths = [
        r'C:\Program Files\Tesseract-OCR\tesseract.exe',
        r'C:\Program Files (x86)\Tesseract-OCR\tesseract.exe',
        r'C:\Users\{}\AppData\Local\Tesseract-OCR\tesseract.exe'.format(os.getenv('USERNAME')),
        r'C:\ProgramData\chocolatey\bin\tesseract.exe',
    ]
    
    # Buscar Tesseract en rutas comunes
    for path in common_paths:
        if os.path.exists(path):
            print(f"✅ Tesseract encontrado en: {path}")
            pytesseract.pytesseract.tesseract_cmd = path
            return
    
    # Si no se encuentra, mostrar instrucciones
    print("=" * 80)
    print("❌ TESSERACT NO ENCONTRADO")
    print("=" * 80)
    print()
    print("Por favor instala Tesseract OCR:")
    print()
    print("Opción 1 - Instalador manual:")
    print("  1. Descarga: https://github.com/UB-Mannheim/tesseract/wiki")
    print("  2. Ejecuta el instalador")
    print("  3. Selecciona 'Additional language data' → Spanish")
    print()
    print("Opción 2 - Con Chocolatey:")
    print("  choco install tesseract -y")
    print()
    print("Opción 3 - Script automático:")
    print("  .\\install_tesseract_windows.ps1")
    print()
    print("Después de instalar, agrega Tesseract al PATH o configura manualmente:")
    print()
    print("  import pytesseract")
    print("  pytesseract.pytesseract.tesseract_cmd = r'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'")
    print()
    print("=" * 80)
    sys.exit(1)


def get_tesseract_version():
    """
    Obtiene la versión de Tesseract instalada
    """
    try:
        import pytesseract
        version = pytesseract.get_tesseract_version()
        return version
    except Exception as e:
        return None


if __name__ == '__main__':
    print("=" * 80)
    print("VERIFICADOR DE TESSERACT OCR")
    print("=" * 80)
    print()
    
    configure_tesseract()
    
    version = get_tesseract_version()
    if version:
        print(f"✅ Tesseract versión: {version}")
        print()
        print("Todo listo para ejecutar:")
        print("  python test_tesseract_local.py")
    else:
        print("⚠️  No se pudo obtener la versión de Tesseract")
    
    print()
    print("=" * 80)


