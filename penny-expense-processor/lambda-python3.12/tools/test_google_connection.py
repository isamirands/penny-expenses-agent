"""
Script para probar la conexión a Google Sheets
Ejecuta este script para verificar que tu Service Account funciona correctamente
"""
import json
import sys
import os
from pathlib import Path

def test_connection():
    """Prueba la conexión a Google Sheets"""
    
    print("🔍 Verificando configuración de Google Sheets...\n")
    
    # Paso 1: Verificar que existen las librerías
    print("1️⃣ Verificando librerías de Google...")
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        from googleapiclient.errors import HttpError
        print("   ✅ Librerías de Google instaladas correctamente\n")
    except ImportError as e:
        print("   ❌ Error: Falta instalar las librerías de Google")
        print("   Ejecuta: pip install google-api-python-client google-auth\n")
        return False
    
    # Paso 2: Solicitar ruta del archivo JSON
    print("2️⃣ Cargando credenciales del Service Account...")
    
    # Buscar archivo JSON en el directorio actual
    json_files = list(Path('.').glob('*.json'))
    
    if json_files:
        print(f"   📁 Archivos JSON encontrados:")
        for i, f in enumerate(json_files, 1):
            print(f"      {i}. {f.name}")
        print()
        
        choice = input("   Selecciona el número del archivo o presiona Enter para el primero: ").strip()
        
        if choice and choice.isdigit() and 1 <= int(choice) <= len(json_files):
            json_file = json_files[int(choice) - 1]
        else:
            json_file = json_files[0]
    else:
        json_file = input("   Ingresa la ruta completa del archivo JSON del Service Account: ").strip()
        json_file = Path(json_file)
    
    if not json_file.exists():
        print(f"   ❌ Error: No se encontró el archivo {json_file}")
        return False
    
    print(f"   ✅ Usando: {json_file.name}\n")
    
    # Paso 3: Cargar y validar credenciales
    print("3️⃣ Validando credenciales...")
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            creds_data = json.load(f)
        
        required_fields = ['type', 'project_id', 'private_key', 'client_email']
        missing = [f for f in required_fields if f not in creds_data]
        
        if missing:
            print(f"   ❌ Error: Faltan campos en el JSON: {', '.join(missing)}")
            return False
        
        if creds_data['type'] != 'service_account':
            print("   ❌ Error: El archivo no es de un Service Account")
            return False
        
        client_email = creds_data['client_email']
        project_id = creds_data['project_id']
        
        print(f"   ✅ Service Account válido")
        print(f"   📧 Email: {client_email}")
        print(f"   🏗️  Proyecto: {project_id}\n")
        
    except json.JSONDecodeError:
        print("   ❌ Error: El archivo JSON está corrupto")
        return False
    except Exception as e:
        print(f"   ❌ Error al leer el archivo: {e}")
        return False
    
    # Paso 4: Crear credenciales de Google
    print("4️⃣ Creando credenciales de autenticación...")
    try:
        credentials = service_account.Credentials.from_service_account_info(
            creds_data,
            scopes=['https://www.googleapis.com/auth/spreadsheets']
        )
        print("   ✅ Credenciales creadas correctamente\n")
    except Exception as e:
        print(f"   ❌ Error al crear credenciales: {e}")
        return False
    
    # Paso 5: Solicitar ID del Sheet
    print("5️⃣ Configurando Google Sheet...")
    print("   📋 Para obtener el Sheet ID, ve a tu Google Sheet y copia el ID de la URL:")
    print("   https://docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit\n")
    
    sheet_id = input("   Ingresa el ID de tu Google Sheet: ").strip()
    
    if not sheet_id:
        print("   ❌ Error: Debes ingresar un Sheet ID")
        return False
    
    print()
    
    # Paso 6: Conectar a Google Sheets API
    print("6️⃣ Conectando a Google Sheets API...")
    try:
        service = build('sheets', 'v4', credentials=credentials)
        print("   ✅ Conexión establecida\n")
    except Exception as e:
        print(f"   ❌ Error al conectar: {e}")
        return False
    
    # Paso 7: Probar acceso al Sheet
    print("7️⃣ Probando acceso al Sheet...")
    try:
        # Intentar obtener metadata del sheet
        spreadsheet = service.spreadsheets().get(spreadsheetId=sheet_id).execute()
        
        title = spreadsheet['properties']['title']
        sheets = spreadsheet.get('sheets', [])
        
        print(f"   ✅ Acceso exitoso!")
        print(f"   📊 Título: {title}")
        print(f"   📑 Pestañas ({len(sheets)}):")
        for sheet in sheets:
            sheet_name = sheet['properties']['title']
            print(f"      - {sheet_name}")
        print()
        
    except HttpError as e:
        if e.resp.status == 403:
            print(f"   ❌ Error 403: Acceso denegado")
            print(f"\n   ⚠️  SOLUCIÓN:")
            print(f"   1. Ve a tu Google Sheet")
            print(f"   2. Haz clic en 'Compartir' (arriba a la derecha)")
            print(f"   3. Agrega este email con permisos de 'Editor':")
            print(f"      {client_email}")
            print(f"   4. Desactiva 'Notificar a las personas'")
            print(f"   5. Haz clic en 'Compartir'\n")
            return False
        elif e.resp.status == 404:
            print(f"   ❌ Error 404: Sheet no encontrado")
            print(f"   Verifica que el ID sea correcto: {sheet_id}\n")
            return False
        else:
            print(f"   ❌ Error HTTP {e.resp.status}: {e}")
            return False
    except Exception as e:
        print(f"   ❌ Error inesperado: {e}")
        return False
    
    # Paso 8: Probar escritura
    print("8️⃣ ¿Quieres probar escribir datos de prueba? (s/n): ", end='')
    response = input().strip().lower()
    
    if response == 's' or response == 'si':
        print("\n   Escribiendo datos de prueba...")
        
        # Obtener nombre de la primera pestaña
        first_sheet = sheets[0]['properties']['title'] if sheets else 'Sheet1'
        
        # Datos de prueba
        test_data = [
            ['Fecha', 'Método de Pago', 'Descripción', 'Categoría', 'Moneda', 'Monto'],
            ['2024-01-15', 'Test', 'Transacción de prueba', 'Otros', 'PEN', 10.00]
        ]
        
        try:
            # Agregar datos
            range_name = f"{first_sheet}!A1:F2"
            body = {'values': test_data}
            
            result = service.spreadsheets().values().update(
                spreadsheetId=sheet_id,
                range=range_name,
                valueInputOption='USER_ENTERED',
                body=body
            ).execute()
            
            updated_cells = result.get('updatedCells', 0)
            print(f"   ✅ Escritura exitosa! ({updated_cells} celdas actualizadas)")
            print(f"   🔗 Abre tu Sheet para verificar: https://docs.google.com/spreadsheets/d/{sheet_id}\n")
            
        except Exception as e:
            print(f"   ❌ Error al escribir: {e}")
            return False
    
    # Éxito total
    print("\n" + "="*60)
    print("🎉 ¡ÉXITO! La conexión a Google Sheets funciona correctamente")
    print("="*60)
    print("\n📋 Resumen de configuración:")
    print(f"   Service Account: {client_email}")
    print(f"   Sheet ID: {sheet_id}")
    print(f"   Sheet Name: {title}")
    print(f"\n✅ Estás listo para usar Google Sheets en tu Lambda!")
    print(f"\n📝 Próximos pasos:")
    print(f"   1. Guarda las credenciales en AWS Secrets Manager")
    print(f"   2. Configura el Sheet ID en samconfig.toml")
    print(f"   3. Despliega tu Lambda\n")
    
    return True


if __name__ == '__main__':
    try:
        success = test_connection()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Prueba cancelada por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

