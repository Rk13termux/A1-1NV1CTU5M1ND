// Validación de contenido simple usando expresiones regulares
function validateContent(text) {
    // Palabras clave inapropiadas
    const inappropriateWords = ['mal', 'groser', 'violencia', 'odio', 'discriminacion'];
    
    // Verificar si el texto contiene palabras inapropiadas
    const hasInappropriateContent = inappropriateWords.some(word => 
        new RegExp(`\\b${word}\\b`, 'i').test(text)
    );
    
    if (hasInappropriateContent) {
        throw new Error('Contenido inapropiado detectado');
    }
    
    return true;
}

// Manejo de errores
function handleError(error, chatId, bot) {
    const errorMessages = {
        'ContentFilterError': 'Lo siento, no puedo procesar ese contenido.',
        'APIError': 'Error al comunicarme con el servicio de IA. Por favor, intenta de nuevo.',
        'ValidationError': 'El contenido no cumple con las políticas de uso.',
        'default': 'Lo siento, ha ocurrido un error. Por favor, intenta de nuevo.'
    };

    const errorType = error.name || 'default';
    const errorMessage = errorMessages[errorType] || errorMessages['default'];

    bot.sendMessage(chatId, errorMessage);
    console.error('Error:', error);
}

// Seguimiento de conversación
const conversationHistory = new Map();

function updateConversationHistory(chatId, message) {
    if (!conversationHistory.has(chatId)) {
        conversationHistory.set(chatId, []);
    }
    const history = conversationHistory.get(chatId);
    history.push({
        role: 'user',
        content: message,
        timestamp: new Date()
    });
    // Mantener solo los últimos 10 mensajes
    if (history.length > 10) {
        history.shift();
    }
}

function getConversationContext(chatId) {
    const history = conversationHistory.get(chatId) || [];
    return history.map(msg => `${msg.role}: ${msg.content}`).join('\n');
}

// Exportar funciones
module.exports = {
    validateContent,
    handleError,
    updateConversationHistory,
    getConversationContext
};
