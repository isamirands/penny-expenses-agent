# Configuración de AWS Bedrock

Esta guía te ayudará a configurar AWS Bedrock para usar modelos de IA (Claude) para clasificar transacciones.

## 🤖 ¿Qué es Bedrock?

AWS Bedrock es un servicio totalmente administrado que proporciona acceso a modelos de IA de última generación a través de una API. Usaremos Claude de Anthropic para clasificar transacciones en categorías.

## 🌍 Paso 1: Verificar Disponibilidad Regional

Bedrock no está disponible en todas las regiones. Las regiones principales son:

- **us-east-1** (Virginia) ✅ Recomendado
- **us-west-2** (Oregon) ✅
- **eu-central-1** (Frankfurt) ✅
- **ap-southeast-1** (Singapur) ✅
- **ap-northeast-1** (Tokyo) ✅

Verifica en: https://aws.amazon.com/bedrock/pricing/

## 🔓 Paso 2: Solicitar Acceso a Modelos

Por defecto, NO tienes acceso a los modelos de Bedrock. Debes solicitarlo:

### Usando AWS Console:

1. Ve a [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)

2. Asegúrate de estar en una región compatible (ej: **us-east-1**)

3. En el menú lateral, ve a **Model access**

4. Verás una lista de modelos disponibles

5. Haz clic en **Manage model access** (arriba a la derecha)

6. Selecciona los modelos de Claude:
   - ✅ **Claude 3 Haiku** (Recomendado - rápido y económico)
   - ✅ **Claude 3 Sonnet** (Opcional - más preciso)
   - ⬜ **Claude 3 Opus** (Opcional - muy preciso pero caro)

7. Para cada modelo, haz clic en el checkbox

8. Lee y acepta los términos de uso (EULA)

9. Haz clic en **Request model access**

10. **Espera la aprobación** (usualmente instantánea, pero puede tomar unos minutos)

### Usando AWS CLI:

```bash
# Verificar qué modelos están disponibles
aws bedrock list-foundation-models \
  --region us-east-1 \
  --query 'modelSummaries[?contains(providerName, `Anthropic`)]'

# Verificar tu acceso actual
aws bedrock list-model-invocation-jobs \
  --region us-east-1
```

## ✅ Paso 3: Verificar Acceso

Una vez aprobado, verifica:

### En Console:

1. Ve a **Model access** en Bedrock Console
2. Deberías ver estado "Access granted" en verde ✅

### En CLI:

```bash
# Listar modelos con acceso
aws bedrock list-foundation-models \
  --region us-east-1 \
  --by-provider Anthropic \
  --query 'modelSummaries[*].[modelId,modelName]' \
  --output table
```

Deberías ver algo como:
```
--------------------------------------------------------------------
|                      ListFoundationModels                      |
+--------------------------------------------------+--------------+
|  anthropic.claude-3-haiku-20240307-v1:0         |  Claude 3 Haiku  |
|  anthropic.claude-3-sonnet-20240229-v1:0        |  Claude 3 Sonnet |
+--------------------------------------------------+--------------+
```

## 🧪 Paso 4: Probar Invocación

Prueba que puedes invocar el modelo:

### Usando Python (boto3):

```python
import json
import boto3

bedrock = boto3.client('bedrock-runtime', region_name='us-east-1')

# Preparar request
prompt = "Clasifica esta transacción: UBER TRIP. Responde solo con la categoría."

body = {
    "anthropic_version": "bedrock-2023-05-31",
    "max_tokens": 100,
    "temperature": 0.0,
    "messages": [
        {
            "role": "user",
            "content": prompt
        }
    ]
}

# Invocar modelo
response = bedrock.invoke_model(
    modelId='anthropic.claude-3-haiku-20240307-v1:0',
    body=json.dumps(body)
)

# Parsear respuesta
response_body = json.loads(response['body'].read())
print("Response:", response_body['content'][0]['text'])
# Output: "Transporte"
```

### Usando AWS CLI:

```bash
# Crear archivo de request
cat > request.json << EOF
{
  "anthropic_version": "bedrock-2023-05-31",
  "max_tokens": 100,
  "temperature": 0.0,
  "messages": [
    {
      "role": "user",
      "content": "Clasifica esta transacción: RAPPI RESTAURANT. Responde solo con la categoría: Comida, Transporte, Servicios, Compras, Entretenimiento, Salud, Educación u Otros."
    }
  ]
}
EOF

# Invocar modelo
aws bedrock-runtime invoke-model \
  --region us-east-1 \
  --model-id anthropic.claude-3-haiku-20240307-v1:0 \
  --body file://request.json \
  output.json

# Ver respuesta
cat output.json | jq -r '.content[0].text'
# Output: "Comida"
```

## 🔐 Paso 5: Configurar Permisos IAM

La Lambda necesita permisos para invocar Bedrock.

### Permisos Necesarios:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-haiku-20240307-v1:0",
        "arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-sonnet-20240229-v1:0"
      ]
    }
  ]
}
```

**Nota**: El template SAM ya incluye estos permisos automáticamente. ✅

## 💰 Paso 6: Entender Costos

Bedrock cobra por token (input y output):

### Precios de Claude 3 (us-east-1):

| Modelo | Input (por 1M tokens) | Output (por 1M tokens) | Velocidad |
|--------|----------------------|------------------------|-----------|
| **Haiku** | $0.25 | $1.25 | ⚡⚡⚡ Muy rápido |
| **Sonnet** | $3.00 | $15.00 | ⚡⚡ Rápido |
| **Opus** | $15.00 | $75.00 | ⚡ Lento |

### Estimación de Costos:

Para clasificar **100 transacciones/mes**:
- Prompt promedio: ~150 tokens
- Response promedio: ~5 tokens
- Total por transacción: 155 tokens

**Con Haiku**:
- Input: 100 × 150 tokens = 15,000 tokens = $0.004
- Output: 100 × 5 tokens = 500 tokens = $0.001
- **Total: ~$0.005/mes** (medio centavo)

**Con Sonnet**:
- **Total: ~$0.06/mes** (6 centavos)

**Recomendación**: Usa **Haiku** para clasificación simple. Es 10x más barato y suficientemente preciso.

## ⚙️ Paso 7: Configurar en Lambda

En tu `template.yaml`, el parámetro `BedrockModelId` controla qué modelo se usa:

```yaml
Parameters:
  BedrockModelId:
    Type: String
    Default: anthropic.claude-3-haiku-20240307-v1:0
    Description: Bedrock model ID for expense classification
```

### Para cambiar el modelo:

```bash
sam deploy \
  --parameter-overrides \
  BedrockModelId="anthropic.claude-3-sonnet-20240229-v1:0" \
  # ... otros parámetros
```

## 🎯 Paso 8: Optimizar Prompts

Nuestro prompt actual:

```python
prompt = f"""Clasifica la siguiente transacción en una de estas categorías: {categories}

Transacción: {description}

Responde ÚNICAMENTE con el nombre de la categoría, sin explicación adicional.

Ejemplos:
- "UBER TRIP" -> Transporte
- "RAPPI RESTAURANT" -> Comida
- "NETFLIX SUSCRIPCION" -> Entretenimiento

Categoría:"""
```

### Tips para mejorar prompts:

1. **Sea específico**: Define claramente qué quieres
2. **Use ejemplos**: Few-shot learning mejora precisión
3. **Limite la respuesta**: "Responde ÚNICAMENTE con..."
4. **Use temperatura 0**: Para respuestas consistentes

### Prompt Avanzado (Opcional):

```python
prompt = f"""Eres un experto en clasificación de gastos personales.

Categorías válidas:
- Comida: Restaurantes, delivery, supermercado
- Transporte: Uber, taxi, gasolina, peajes
- Servicios: Luz, agua, internet, teléfono
- Compras: Ropa, electrónica, hogar
- Entretenimiento: Netflix, cine, juegos
- Salud: Farmacia, doctor, seguro médico
- Educación: Cursos, libros, universidad
- Otros: Todo lo demás

Transacción: "{description}"

Instrucciones:
1. Analiza la descripción
2. Identifica palabras clave
3. Responde SOLO con el nombre de la categoría (sin explicación)

Categoría:"""
```

## 📊 Paso 9: Monitoreo

### CloudWatch Metrics:

Bedrock automáticamente envía métricas a CloudWatch:

```bash
# Ver invocaciones
aws cloudwatch get-metric-statistics \
  --namespace AWS/Bedrock \
  --metric-name Invocations \
  --dimensions Name=ModelId,Value=anthropic.claude-3-haiku-20240307-v1:0 \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum

# Ver latencia
aws cloudwatch get-metric-statistics \
  --namespace AWS/Bedrock \
  --metric-name InvocationLatency \
  --dimensions Name=ModelId,Value=anthropic.claude-3-haiku-20240307-v1:0 \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average
```

### Crear Alarma de Costos:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name bedrock-high-usage \
  --alarm-description "Alert if Bedrock usage is high" \
  --metric-name Invocations \
  --namespace AWS/Bedrock \
  --statistic Sum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 1000 \
  --comparison-operator GreaterThanThreshold
```

## ❓ Troubleshooting

### Error: "AccessDeniedException"

**Causa**: No tienes acceso al modelo.

**Solución**:
1. Ve a Bedrock Console → Model access
2. Solicita acceso al modelo
3. Espera aprobación

### Error: "ValidationException: Could not resolve the foundation model"

**Causa**: Model ID incorrecto o región incorrecta.

**Solución**:
```bash
# Listar modelos disponibles en tu región
aws bedrock list-foundation-models \
  --region us-east-1 \
  --query 'modelSummaries[*].modelId'
```

### Error: "ThrottlingException"

**Causa**: Demasiadas requests simultáneas.

**Solución**: Implementa exponential backoff:

```python
import time
from botocore.exceptions import ClientError

def invoke_with_retry(client, model_id, body, max_retries=3):
    for i in range(max_retries):
        try:
            return client.invoke_model(modelId=model_id, body=body)
        except ClientError as e:
            if e.response['Error']['Code'] == 'ThrottlingException':
                wait_time = (2 ** i) + random.uniform(0, 1)
                time.sleep(wait_time)
            else:
                raise
    raise Exception("Max retries exceeded")
```

### Modelo muy lento

**Solución**: 
1. Usa Haiku en lugar de Sonnet/Opus
2. Reduce `max_tokens` en el request
3. Procesa en paralelo (con límite de concurrencia)

## 🚀 Alternativas

Si Bedrock no está disponible en tu región o prefieres otras opciones:

### OpenAI GPT

```python
import openai

openai.api_key = "sk-..."

response = openai.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "user", "content": f"Clasifica: {description}"}
    ],
    temperature=0,
    max_tokens=10
)

category = response.choices[0].message.content
```

**Costo**: ~$0.002 por 100 clasificaciones

### Azure OpenAI

Similar a OpenAI pero en Azure.

### Clasificación basada en reglas (Sin IA)

Si quieres evitar costos de IA:

```python
def classify_simple(description):
    description = description.lower()
    
    if any(word in description for word in ['uber', 'taxi', 'gasolina']):
        return 'Transporte'
    elif any(word in description for word in ['restaurant', 'rappi', 'comida']):
        return 'Comida'
    # ... más reglas
    
    return 'Otros'
```

**Costo**: $0 (pero menos preciso)

## 📚 Referencias

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Claude API Reference](https://docs.anthropic.com/claude/reference)
- [Bedrock Pricing](https://aws.amazon.com/bedrock/pricing/)
- [Model IDs List](https://docs.aws.amazon.com/bedrock/latest/userguide/model-ids.html)

