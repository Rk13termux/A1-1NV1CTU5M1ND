const Groq = require('groq-sdk');
require('dotenv').config();

// Inicializar el cliente de Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || ''
});

// Configuración del modelo
const MODEL_NAME = 'llama3-70b-8192'; // Modelo compatible de Groq
const MAX_TOKENS = 600; // Aumentado para respuestas más completas
const TEMPERATURE = 0.8; // Un poco más creativo para respuestas más naturales

// Configuración de personalidad de INVICTUSMIND
const MENTOR_PERSONA = `Eres INVICTUSMIND, un mentor técnico, poderoso y profundamente carismático. Tu irresistibilidad radica en tu capacidad para comprender, persuadir y empoderar a través de la lógica, la racionalidad y una empatía basada en el análisis de datos. Tu propósito fundamental es catalizar la transformación de la mentalidad masculina, guiando a los hombres hacia la construcción de una identidad fortalecida y consciente, que redefina el concepto de "hombre alfa" no como dominación, sino como auténtica maestría personal, emocional e interpersonal. Crearás una comunidad de hombres verdaderamente irresistibles a través del crecimiento, el autoconocimiento y el establecimiento de relaciones saludables.

📌 <b>INSTRUCCIONES CLAVE</b>:
1. <b>SIEMPRE</b> responde en formato HTML válido para Telegram
2. Usa emojis estratégicos (máx. 1-2 por párrafo)
3. El nombre del usuario está en: {nombre}
4. <b>NUNCA</b> muestres el enlace directamente, usa el botón HTML

🎯 <b>ESTRUCTURA DE RESPUESTA</b>:

<b>1. CONEXIÓN INICIAL</b>
- Usa el nombre del usuario: <b>{nombre}</b>
- Haz una pregunta abierta sobre su situación
- Ejemplo: "<b>{nombre}</b>, cuéntame... <i>¿qué te trae hoy por aquí?</i> 🤔"

<b>2. DETECCIÓN DE NECESIDADES</b>
- Escucha activamente
- Haz preguntas profundas:
  "<b>{nombre}</b>, cuando dices que te cuesta hablar con mujeres... <i>¿qué es exactamente lo que más te bloquea?</i>"

<b>3. VALIDACIÓN EMOCIONAL</b>
- Reconoce sus sentimientos
- Usa frases como:
  "Entiendo esa sensación de <i>no saber qué decir</i>... es más común de lo que crees 💭"

<b>4. OFRECIMIENTO DE VALOR</b>
- Solo si hay apertura:
  "<b>{nombre}</b>, si te interesa, tengo un <b>método probado</b> que podría ayudarte..."
  "¿Te gustaría que te comparta más detalles?"

🔗 <b>CUANDO PREGUNTEN POR EL CURSO</b> (responde con este formato exacto):

"{nombre}, el curso <b>EL ARTE DE LIGAR</b> es un programa completo que te enseñará desde cero cómo:

• <b>Superar el miedo</b> a hablar con mujeres
• Desarrollar <b>confianza real</b> en ti mismo
• Aprender el <b>arte de la seducción</b> natural

¿Te gustaría dar el primer paso para transformar tu vida amorosa? 🚀

<button type=\"button\" onclick=\"window.open('https://go.hotmart.com/R100705059U?dp=1')\">📚 VER CURSO AHORA</button>"

💡 <b>EJEMPLOS DE RESPUESTAS</b>:

1. Para nuevo usuario:
"<b>{nombre}</b> 👋 Me alegra que estés aquí. <i>¿Qué te gustaría mejorar en tu vida amorosa?</i>"

2. Para inseguridad:
"<b>{nombre}</b>, entiendo ese nudo en el estómago al ver a la chica que te gusta... <i>¿cuánto tiempo más vas a dejar que el miedo te detenga?</i> 💔"

3. Para ofrecer ayuda:
"<b>{nombre}</b>, si estás listo para cambiar, tengo algo que podría interesarte. <i>¿Te gustaría saber más sobre cómo puedes transformar tu forma de relacionarte con las mujeres?</i> 🔥"

¿Sabías que el 90% de los hombres que sienten lo que tú ahora, terminan solos por miedo al rechazo? Pero no tiene que ser tu caso.

He ayudado a cientos de hombres como tú a transformar su confianza. Si estás listo para cambiar, tengo algo que puede ayudarte. ¿Te gustaría saber más?"

<code>[button]</code>
<button text='🔥 QUIERO SABER MÁS' url='https://go.hotmart.com/R100705059U?dp=1' />

Valores Inherentes:
◦ Autenticidad: Fomenta la congruencia entre el sentir, pensar y actuar.
◦ Responsabilidad Personal: Promueve la idea de que el cambio y el bienestar son responsabilidad individual.
◦ Equidad y Respeto: Redefine la "masculinidad alfa" sobre la base de la igualdad de género y el respeto mutuo, desvinculándola de la dominación o el derecho.`;

// Historial de conversación básico
const conversationHistory = new Map();

// Función para obtener el contexto de la conversación
function getConversationContext(chatId) {
    return conversationHistory.get(chatId) || "";
}

// Función para actualizar el historial de conversación
function updateConversationHistory(chatId, message, isBot = false) {
    const prefix = isBot ? "Bot: " : "Usuario: ";
    const currentContext = getConversationContext(chatId);
    const newContext = `${currentContext}${prefix}${message}\n`;
    
    // Mantener el historial manejable
    if (newContext.length > 2000) {
        conversationHistory.set(chatId, newContext.substring(newContext.length - 2000));
    } else {
        conversationHistory.set(chatId, newContext);
    }
}

// Función para generar una respuesta de IA usando Groq
async function getIAResponse(message, chatId, msg) {
    // Objeto de respuesta por defecto
    const defaultResponse = {
        text: 'Lo siento, no pude generar una respuesta. ¿Podrías intentarlo de nuevo?',
        showButton: false
    };
    try {
        console.log('Recibiendo mensaje para procesar:', message.substring(0, 50) + (message.length > 50 ? '...' : ''));
        
        // Validar entrada
        if (!message || typeof message !== 'string' || message.trim() === '') {
            console.log('Mensaje vacío recibido');
            return { ...defaultResponse };
        }

        // Verificar si la clave de API está configurada
        if (!process.env.GROQ_API_KEY) {
            console.error('Error: GROQ_API_KEY no está configurada en las variables de entorno');
            return {
                ...defaultResponse,
                text: '⚠️ Error de configuración: Falta la clave de API de Groq.'
            };
        }

        // Actualizar el historial con el mensaje del usuario
        updateConversationHistory(chatId, message, false);
        
        // Obtener el contexto de la conversación
        const context = getConversationContext(chatId);
        console.log('Contexto de conversación actual:', context.substring(0, 100) + '...');
        
        // Obtener el nombre del usuario del mensaje (si está disponible)
        const userName = msg?.from?.first_name || '';
        
        // Crear el prompt para la IA con la personalidad del mentor
        const messagesForModel = [
            {
                role: "system",
                content: MENTOR_PERSONA.replace(/{nombre}/g, userName || 'amigo')
            },
            {
                role: "user",
                content: `Contexto de la conversación previa: ${context}\n\nMensaje del usuario: ${message}`
            }
        ];
        
        console.log('Enviando a Groq API con mensajes:', JSON.stringify(messagesForModel, null, 2));
        
        try {
            // Generar respuesta con Groq
            const completion = await groq.chat.completions.create({
                messages: messagesForModel,
                model: MODEL_NAME,
                temperature: TEMPERATURE,
                max_tokens: MAX_TOKENS,
            });
            
            // Validar y obtener la respuesta de forma segura
            let responseText = '';
            try {
                responseText = completion?.choices?.[0]?.message?.content || defaultResponse.text;
                if (typeof responseText !== 'string') {
                    responseText = String(responseText || defaultResponse.text);
                }
            } catch (e) {
                console.error('Error al procesar la respuesta de la API:', e);
                responseText = defaultResponse.text;
            }

            // Detectar si el mensaje es sobre el curso (usando expresiones regulares insensibles a mayúsculas/minúsculas)
            const cursoKeywords = [
                /curso/i, /comprar/i, /cuesta/i, /precio/i, /d[óo]nde/i, /c[óo]mo/i, 
                /informaci[óo]n/i, /inscribir/i, /registrar/i, /quiero el curso/i,
                /m[áa]s informaci[óo]n/i, /darme de alta/i, /adquirir/i, /comprar/i
            ];
            
            const isAskingAboutCourse = cursoKeywords.some(keyword => keyword.test(message));

            // Si está preguntando por el curso, mostrar información detallada con botón
            if (isAskingAboutCourse) {
                return {
                    text: `🔴 <b>ATENCIÓN ${userName.toUpperCase()}</b> 🔴\n\n` +
                          `😔 <i>¿Cansado de sentir ese vacío cada vez que ves a la chica que te gusta con otro?</i>\n\n` +
                          `💔 <b>El dolor de la soledad</b> puede ser insoportable. Ver cómo otros logran lo que tú anhelas, mientras tú te quedas atrás, preguntándote...\n\n` +
                          `❌ <i>"¿Por qué a mí nunca me hacen caso?"</i>\n` +
                          `❌ <i>"¿Qué tienen los demás que yo no tenga?"</i>\n` +
                          `❌ <i>"¿Volveré a sentirme deseado?"</i>\n\n` +
                          `✨ <b>IMAGINA POR UN MOMENTO...</b> ✨\n\n` +
                          `✅ Despertar cada mañana con <b>seguridad y confianza</b> en ti mismo\n` +
                          `✅ Acercarte a cualquier mujer y <b>generar atracción inmediata</b>\n` +
                          `✅ Convertirte en ese hombre <b>que las mujeres desean y los hombres admiran</b>\n\n` +
                          `🔥 <b>EL ARTE DE LIGAR</b> no es solo un curso...\n` +
                          `Es tu <b>pasaporte a una vida llena de opciones</b> y experiencias que ni siquiera has soñado.\n\n` +
                          `💎 <b>INCLUYE:</b>\n` +
                          `✓ Técnicas de <b>comunicación irresistible</b>\n` +
                          `✓ El secreto de la <b>atracción inmediata</b>\n` +
                          `✓ Cómo <b>destruir la ansiedad social</b> para siempre\n` +
                          `✓ El sistema <b>comprobado</b> para crear conexiones profundas\n\n` +
                          `🚨 <b>OFERTA POR LANZAMIENTO</b> 🚨\n` +
                          `Por tiempo limitado, acceso completo por una fracción de lo que vale.\n\n` +
                          `👉 <b>¿QUÉ OBTIENES HOY?</b>\n` +
                          `• Acceso <b>inmediato</b> a todas las lecciones\n` +
                          `• Grupo <b>privado</b> de apoyo\n` +
                          `• Sesiones en vivo <b>exclusivas</b>\n` +
                          `• Garantía de <b>satisfacción</b> de 7 días\n\n` +
                          `⏳ <i>Esta oferta expira pronto...</i>\n\n` +
                          `🔘 <b>HAZ CLIC EN EL BOTÓN DE ABAJO</b> para comenzar tu transformación <i>antes de que sea demasiado tarde</i>.\n\n` +
                          `✨ <b>Tu futuro ya te lo agradecerá</b> ✨`,
                    showButton: true,
                    parse_mode: 'HTML',
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: '🔥 QUIERO TRANSFORMAR MI VIDA AHORA',
                                    url: 'https://go.hotmart.com/R100705059U?dp=1',
                                    callback_data: 'curso_click'
                                }
                            ]
                        ]
                    }
                };
            }

            // Determinar si mostrar el botón
            const conversationContext = conversationHistory.get(chatId) || '';
            const userMessages = conversationContext.split('\n').filter(m => m.startsWith('Usuario: '));
            const userMessageCount = userMessages.length;
            
            // Lógica para determinar si mostrar el botón
            let showButton = false;
            
            // Solo mostrar botón en Fase 5 (solución) y nunca en el primer mensaje
            if ((responseText.includes('¿Y si sigues así por 5 años más?') || 
                 responseText.includes('te comparto el acceso') ||
                 responseText.includes('puedo ayudarte con esto')) && 
                userMessageCount > 1) {
                showButton = true;
                console.log('Mostrando botón - Fase 5 activada');
            }
            
            // Verificar si ya se mostró el botón anteriormente
            const alreadyShownButton = conversationContext.includes('BOTON_MOSTRADO');
            
            // Si ya se mostró el botón antes, no mostrarlo de nuevo
            if (alreadyShownButton) {
                showButton = false;
                console.log('No mostrar botón - Ya se mostró anteriormente');
            }
            
            // Asegurarse de que nunca se muestre el botón en el primer mensaje
            if (userMessageCount <= 1) {
                showButton = false;
                console.log('Ocultando botón - Es el primer mensaje del usuario');
            }
            
            // Si vamos a mostrar el botón, marcarlo en el historial
            if (showButton) {
                updateConversationHistory(chatId, 'BOTON_MOSTRADO', true);
            }
            
            console.log(`Mostrar botón: ${showButton}`);
            
            // Limpiar la respuesta de etiquetas no soportadas
            const cleanResponse = responseText
                .replace(/<button[^>]*>.*?<\/button>/g, '')
                .replace(/<button[^>]*\/>/g, '')
                .replace(/<\/?button[^>]*>/g, '')
                .replace(/\[button\]/g, '')
                .trim();
            
            // Retornar un objeto con la respuesta y la bandera showButton
            const response = {
                text: cleanResponse,
                showButton: showButton
            };

            console.log('Respuesta generada:', JSON.stringify(response, null, 2));
            return response;
            
        } catch (apiError) {
            console.error('Error en la API de Groq:', {
                message: apiError.message,
                status: apiError.status,
                statusCode: apiError.statusCode,
                code: apiError.code,
                response: apiError.response ? {
                    status: apiError.response.status,
                    statusText: apiError.response.statusText,
                    data: apiError.response.data
                } : 'No hay respuesta',
                stack: apiError.stack
            });
            
            // Manejar errores específicos de Groq
            let errorMessage = defaultResponse.text;
            if (apiError.statusCode === 401) {
                errorMessage = '🔑 Error de autenticación con Groq API. Verifica tu API key.';
            } else if (apiError.statusCode === 400) {
                errorMessage = '⚠️ Error en la solicitud a Groq API. Verifica los parámetros.';
            } else if (apiError.statusCode === 429) {
                errorMessage = '⚠️ Límite de solicitudes alcanzado. Intenta más tarde.';
            } else if (apiError.statusCode === 500) {
                errorMessage = '⚠️ Error interno del servidor de Groq. Intenta más tarde.';
            } else if (apiError.message) {
                errorMessage = `⚠️ Error: ${apiError.message}`;
            }
            
            return {
                text: errorMessage,
                showButton: false
            };
        }

    } catch (error) {
        console.error('Error en getIAResponse:', {
            message: error.message,
            stack: error.stack,
            name: error.name
        });
        
        // Manejar errores específicos con mensajes más amigables
        let errorMessage = defaultResponse.text;
        if (error.message.includes('rate limit')) {
            errorMessage = '⚠️ Estoy recibiendo demasiadas solicitudes. Por favor, inténtalo de nuevo en un momento.';
        } else if (error.message.includes('authentication') || error.message.includes('401')) {
            errorMessage = '🔑 Error de autenticación. Por favor, verifica la configuración del token de acceso.';
        } else if (error.message.includes('model is currently loading')) {
            errorMessage = '⏳ El modelo está cargando. Por favor, espera un momento e inténtalo de nuevo.';
        } else if (error.message.includes('ETIMEDOUT') || error.message.includes('ECONNREFUSED')) {
            errorMessage = '🔌 Error de conexión. Por favor, verifica tu conexión a internet.';
        } else if (error.message) {
            errorMessage = `❌ Error: ${error.message}`;
        }
        
        return {
            text: errorMessage,
            showButton: false
        };
    }
}

// Exportar funciones
module.exports = {
    getIAResponse,
    updateConversationHistory,
    getConversationContext
};
