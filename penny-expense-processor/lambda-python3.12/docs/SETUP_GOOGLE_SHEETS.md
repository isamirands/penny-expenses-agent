# Configuración de Google Sheets API

Esta guía te ayudará a configurar Google Sheets API y crear un Service Account para que la Lambda pueda escribir en tu hoja de cálculo.

## 📋 Paso 1: Crear Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)

2. Crea un nuevo proyecto o selecciona uno existente:
   - Haz clic en el selector de proyectos (arriba a la izquierda)
   - Clic en "NEW PROJECT"
   - Nombre: `penny-expense-tracker`
   - Haz clic en "CREATE"

3. Asegúrate de que el proyecto está seleccionado en el selector de proyectos

## 📡 Paso 2: Habilitar Google Sheets API

1. En el menú de navegación (☰), ve a:
   ```
   APIs & Services > Library
   ```

2. Busca "Google Sheets API"

3. Haz clic en "Google Sheets API"

4. Haz clic en "ENABLE"

5. Espera a que se active (puede tomar unos segundos)

## 🔐 Paso 3: Crear Service Account

Un Service Account es una cuenta especial que tu Lambda usará para acceder a Google Sheets.

1. En el menú de navegación, ve a:
   ```
   IAM & Admin > Service Accounts
   ```

2. Haz clic en "+ CREATE SERVICE ACCOUNT"

3. Configura el Service Account:
   - **Service account name**: `penny-expense-processor`
   - **Service account ID**: Se genera automáticamente
   - **Description**: `Service account for Penny Expense Processor Lambda`
   - Haz clic en "CREATE AND CONTINUE"

4. **Grant this service account access to project** (Opcional):
   - No necesitas asignar ningún rol de proyecto
   - Haz clic en "CONTINUE"

5. **Grant users access to this service account** (Opcional):
   - Puedes dejarlo vacío
   - Haz clic en "DONE"

## 🔑 Paso 4: Crear Clave JSON

1. En la lista de Service Accounts, encuentra el que acabas de crear

2. Haz clic en el Service Account

3. Ve a la pestaña "KEYS"

4. Haz clic en "ADD KEY" > "Create new key"

5. Selecciona "JSON" como tipo de clave

6. Haz clic en "CREATE"

7. **¡IMPORTANTE!** Se descargará un archivo JSON automáticamente:
   - Guárdalo en un lugar seguro
   - NO LO COMPARTAS PÚBLICAMENTE
   - NO LO SUBAS A GIT
   - Nombre típico: `proyecto-123456-a1b2c3d4e5f6.json`

El archivo JSON se verá así:
```json
{
  "type": "service_account",
  "project_id": "penny-expense-tracker",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "penny-expense-processor@penny-expense-tracker.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

## 📊 Paso 5: Crear Google Sheet

1. Ve a [Google Sheets](https://sheets.google.com/)

2. Crea una nueva hoja:
   - Haz clic en el botón "+"
   - O usa una hoja existente

3. Nombra la hoja: `Penny Expenses`

4. Crea las columnas (primera fila):
   ```
   | Fecha | Método de Pago | Descripción | Categoría | Moneda | Monto |
   ```

5. Copia el ID del Sheet desde la URL:
   ```
   https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F7G8H9I0J/edit
                                          ^^^^^^^^^^^^^^^^^^^^
                                          Este es el Sheet ID
   ```

## 🔗 Paso 6: Compartir Sheet con Service Account

1. En tu Google Sheet, haz clic en "Compartir" (arriba a la derecha)

2. En "Agregar personas y grupos", pega el email del Service Account:
   - Lo encuentras en el JSON como `client_email`
   - Ejemplo: `penny-expense-processor@penny-expense-tracker.iam.gserviceaccount.com`

3. Selecciona el nivel de permisos: **Editor**

4. **DESACTIVA** "Notificar a las personas" (no queremos enviar email al bot)

5. Haz clic en "Compartir"

## ☁️ Paso 7: Guardar Credenciales en AWS Secrets Manager

Ahora necesitas subir el archivo JSON a AWS Secrets Manager.

### Opción A: Usando AWS CLI

```bash
# Reemplaza con la ruta a tu archivo JSON
aws secretsmanager create-secret \
  --name penny-expense-google-service-account \
  --description "Google Service Account credentials for Penny Expense Processor" \
  --secret-string file://ruta/al/archivo.json \
  --region us-east-1
```

### Opción B: Usando AWS Console

1. Ve a [AWS Secrets Manager Console](https://console.aws.amazon.com/secretsmanager/)

2. Haz clic en "Store a new secret"

3. Configura el secreto:
   - **Secret type**: Other type of secret
   - **Key/value**: Haz clic en "Plaintext"
   - Pega TODO el contenido del archivo JSON
   - **Encryption key**: Usa la default (aws/secretsmanager)
   - Haz clic en "Next"

4. Nombre del secreto:
   - **Secret name**: `penny-expense-google-service-account`
   - **Description**: `Google Service Account for Penny Expense Processor`
   - Haz clic en "Next"

5. Rotation (Opcional):
   - Deja "Disable automatic rotation"
   - Haz clic en "Next"

6. Review:
   - Revisa la configuración
   - Haz clic en "Store"

## ✅ Paso 8: Verificar Configuración

### Verificar que el Service Account tiene acceso:

1. Ve a tu Google Sheet

2. Haz clic en "Compartir"

3. Deberías ver el email del Service Account en la lista de personas con acceso

### Verificar el secreto en AWS:

```bash
# Listar secretos
aws secretsmanager list-secrets --region us-east-1

# Ver el secreto (sin el valor)
aws secretsmanager describe-secret \
  --secret-id penny-expense-google-service-account \
  --region us-east-1

# Ver el valor del secreto
aws secretsmanager get-secret-value \
  --secret-id penny-expense-google-service-account \
  --region us-east-1
```

## 🧪 Paso 9: Probar la Integración

Crea un script de Python para probar:

```python
import json
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Cargar credenciales
with open('path/to/service-account.json', 'r') as f:
    creds_data = json.load(f)

credentials = service_account.Credentials.from_service_account_info(
    creds_data,
    scopes=['https://www.googleapis.com/auth/spreadsheets']
)

# Crear cliente
service = build('sheets', 'v4', credentials=credentials)

# ID de tu sheet
SHEET_ID = '1A2B3C4D5E6F7G8H9I0J'

# Leer datos
result = service.spreadsheets().values().get(
    spreadsheetId=SHEET_ID,
    range='Gastos!A1:F1'
).execute()

print("Headers:", result.get('values', []))

# Escribir datos de prueba
values = [
    ['2024-01-01', 'Visa', 'Test Transaction', 'Otros', 'PEN', 10.50]
]

body = {'values': values}

result = service.spreadsheets().values().append(
    spreadsheetId=SHEET_ID,
    range='Gastos!A:F',
    valueInputOption='USER_ENTERED',
    body=body
).execute()

print(f"Added {result.get('updates').get('updatedRows')} rows")
```

## 🔒 Seguridad

### ✅ Buenas Prácticas:

1. **NUNCA** compartas el archivo JSON del Service Account
2. **NUNCA** lo subas a GitHub o repositorios públicos
3. Agrega `*.json` a tu `.gitignore`
4. Usa AWS Secrets Manager para almacenar las credenciales
5. Limita el acceso del Service Account solo al Sheet necesario
6. Considera rotar las credenciales periódicamente

### Rotar Credenciales (Recomendado cada 90 días):

1. Ve a Service Accounts en Google Cloud
2. Crea una nueva clave JSON
3. Actualiza el secreto en AWS Secrets Manager
4. Espera a que la Lambda use la nueva clave
5. Elimina la clave antigua

## ❓ Troubleshooting

### Error: "The caller does not have permission"

**Solución**: Verifica que el Service Account tiene permisos de Editor en el Sheet.

```bash
# Verifica el email del Service Account
grep "client_email" service-account.json
```

### Error: "Unable to parse range"

**Solución**: Verifica que el nombre de la pestaña sea correcto. Por defecto es "Gastos".

### Error: "Access not granted"

**Solución**: 
1. Verifica que Google Sheets API está habilitada
2. Verifica que las credenciales son correctas
3. Intenta crear una nueva clave

### Error: "Quota exceeded"

**Solución**: Google Sheets tiene límites de tasa:
- 60 requests por minuto por proyecto
- 500 requests por 100 segundos por usuario

Considera implementar exponential backoff o caching.

## 📚 Referencias

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Service Accounts Documentation](https://cloud.google.com/iam/docs/service-accounts)
- [Python Quickstart](https://developers.google.com/sheets/api/quickstart/python)

## 💡 Consejos

1. **Sheet Structure**: Mantén una estructura consistente en tu Sheet para facilitar el análisis
2. **Multiple Sheets**: Puedes crear pestañas separadas por mes o año
3. **Formulas**: Puedes agregar fórmulas en columnas adicionales para totales/análisis
4. **Data Validation**: Usa validación de datos en Google Sheets para categorías
5. **Conditional Formatting**: Usa formato condicional para resaltar gastos grandes

