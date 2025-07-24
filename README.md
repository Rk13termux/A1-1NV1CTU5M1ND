# Seductor Bot IA

Bot de Telegram con IA gratuita (vía Puter.js o local) para motivar, guiar y persuadir en el nicho de la seducción masculina.

## Cómo usar

### Bot de Telegram con IA Profesional

Un bot de Telegram que utiliza IA de manera profesional y gratuita para responder mensajes de manera inteligente.

## Características

- Integración con Hugging Face Inference API (gratuito)
- Sistema de validación de contenido
- Manejo de errores robusto
- Seguimiento de conversación
- Selección dinámica de modelos IA
- Contexto persistente en conversaciones
- Respuestas más naturales y coherentes

## Configuración

1. Instalar dependencias:
```bash
npm install
```

2. Crear archivo `.env` con las siguientes variables:
```env
BOT_TOKEN=your_telegram_bot_token
HUGGINGFACE_API_KEY=your_huggingface_api_key
```

## Modelos Disponibles (Todos gratuitos)

- `general`: mistralai/Mixtral-8x7B-v0.1 (para conversaciones generales)
- `coding`: deepseek-ai/deepseek-coder-6.7b-base (para programación y desarrollo)
- `creative`: facebook/opt-350m (para tareas creativas)

## Manejo de Errores

El bot incluye un sistema robusto de manejo de errores que:
- Maneja errores de API
- Proporciona mensajes de error claros al usuario
- Mantiene un registro de errores

## Seguridad

- Validación básica de contenido inapropiado
- Manejo seguro de tokens y credenciales

## Desarrollo

Ejecutar el bot:
```bash
node index.js
```

El bot responderá automáticamente a los mensajes recibidos usando IA, manteniendo contexto y seleccionando el modelo más apropiado según el contexto de la conversación.
# A1-1NV1CTU5M1ND
