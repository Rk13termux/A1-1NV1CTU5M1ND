const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const { getIAResponse, updateConversationHistory } = require("./ia");

// Inicializar el bot de Telegram
let bot;
try {
    console.log('Inicializando el bot de Telegram...');
    bot = new TelegramBot(process.env.BOT_TOKEN, { 
        polling: true,
        request: {
            proxy: process.env.HTTP_PROXY || process.env.HTTPS_PROXY || undefined
        }
    });
    console.log('Bot de Telegram inicializado correctamente');
} catch (error) {
    console.error('Error al inicializar el bot de Telegram:', error);
    process.exit(1);
}

// Función para manejar errores
function handleError(error, chatId) {
    console.error('Error en el manejador de mensajes:', error);
    
    // Mensaje de error predeterminado
    let errorMessage = '❌ Lo siento, tuve un problema al procesar tu solicitud. Por favor, inténtalo de nuevo.';
    
    // Manejar errores específicos
    if (error.code === 'ETELEGRAM') {
        errorMessage = '❌ Error al comunicarme con Telegram. Por favor, inténtalo de nuevo más tarde.';
    } else if (error.message && error.message.includes('400')) {
        errorMessage = '❌ Error en la solicitud. Por favor, verifica tu mensaje e inténtalo de nuevo.';
    } else if (error.message.includes('rate limit')) {
        errorMessage = '⚠️ Estoy recibiendo demasiadas solicitudes. Por favor, inténtalo de nuevo en un momento.';
    } else if (error.message.includes('authentication')) {
        errorMessage = '🔑 Error de autenticación. Por favor, verifica la configuración del bot.';
    } else if (error.message.includes('model is currently loading')) {
        errorMessage = '⏳ El modelo de IA está cargando. Por favor, espera un momento e inténtalo de nuevo.';
    }
    
    // Limitar la longitud del mensaje de error para evitar problemas
    if (errorMessage.length > 400) {
        errorMessage = errorMessage.substring(0, 397) + '...';
    }
    
    // Eliminar caracteres especiales que puedan causar problemas con el parseo de Markdown
    errorMessage = errorMessage.replace(/[*_`\[\]()~>#+=|{}.!-]/g, '');
    
    // Enviar mensaje de error al usuario
    if (chatId) {
        bot.sendMessage(chatId, errorMessage, { parse_mode: 'HTML' })
            .catch(err => {
                console.error('Error al enviar mensaje de error:', err);
                // Intentar enviar un mensaje más simple si falla el envío
                if (err.code === 'ETELEGRAM') {
                    bot.sendMessage(chatId, '❌ Ocurrió un error. Por favor, inténtalo de nuevo.')
                        .catch(e => console.error('Error crítico al enviar mensaje de error:', e));
                }
            });
    }
}

// Manejar comandos y mensajes
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    const text = msg.text;

    // Ignorar mensajes sin texto (fotos, stickers, etc.)
    if (!text) {
        return bot.sendMessage(chatId, "Por ahora solo puedo procesar mensajes de texto. 😊");
    }

    // Comandos especiales
    if (text.startsWith('/')) {
        const command = text.split(' ')[0].toLowerCase();
        
        switch (command) {
            case '/start':
                return bot.sendMessage(
                    chatId,
                    `🛡️ *¡BIENVENIDO/A A TU NUEVA VIDA, ${msg.from?.first_name?.toUpperCase() || 'GUERRERO/A'}!* 🚀\n\n` +
                    `Soy *INVICTUSMIND* 🛡️, tu aliado definitivo en esta transformación personal que está a punto de comenzar.\n\n` +
                    `✨ *¿Listo/a para convertirte en la mejor versión de ti mismo/a?* ✨\n\n` +
                    `Soy más que un simple bot, soy tu *confidente personal*, tu *guía en la seducción* y tu *mentor en el arte de las relaciones*. Aquí podrás:\n\n` +
                    `• 💡 Hacerme *cualquier consulta personal* sobre seducción, relaciones o desarrollo personal\n` +
                    `• 🔥 Aprender a *conquistar* y *reconquistar* esa persona especial\n` +
                    `• 🧠 Desarrollar una *mentalidad imparable* que te hará irresistible\n` +
                    `• 💪 Transformar tus inseguridades en *poder y confianza*\n\n` +
                    `*¿Te atreves a dar el primer paso?* Escríbeme lo que necesites, desde la pregunta más simple hasta tu situación más compleja.\n\n` +
                    `*Comandos disponibles:*\n` +
                    `/ayuda - Muestra los comandos disponibles\n` +
                    `/limpiar - Reinicia nuestra conversación\n\n` +
                    `*Tu transformación comienza AHORA.* ¿Por dónde quieres empezar? 🔥`,
                    { parse_mode: 'Markdown' }
                );
                
            case '/ayuda':
                return bot.sendMessage(
                    chatId,
                    `📝 *Comandos disponibles:*\n\n` +
                    `/start - Inicia el bot y muestra la bienvenida\n` +
                    `/ayuda - Muestra esta ayuda\n` +
                    `/limpiar - Limpia el historial de la conversación\n\n` +
                    `Puedes hablarme normalmente y te responderé usando IA.`,
                    { parse_mode: 'Markdown' }
                );
                
            case '/limpiar':
                // Limpiar el historial de la conversación
                updateConversationHistory(chatId, '', true);
                return bot.sendMessage(chatId, '🧹 ¡Historial de conversación limpiado! Empezamos de nuevo.');
                
            default:
                return bot.sendMessage(chatId, 'No reconozco ese comando. Usa /ayuda para ver los comandos disponibles.');
        }
    }

    try {
        // Mostrar que estamos procesando el mensaje
        const processingMessage = await bot.sendMessage(chatId, '💭 Procesando tu mensaje...');
        
        // Generar respuesta de IA pasando el objeto msg completo
        let iaResponse;
        try {
            iaResponse = await getIAResponse(text, chatId, msg);
            
            // Validar la respuesta de la IA
            if (!iaResponse || typeof iaResponse !== 'object' || !('text' in iaResponse)) {
                console.error('Error: La respuesta de la IA no es un objeto válido:', JSON.stringify(iaResponse));
                throw new Error('Respuesta de IA inválida');
            }
            
            // Asegurar que showButton sea booleano
            if (typeof iaResponse.showButton !== 'boolean') {
                iaResponse.showButton = false;
            }
            
            // Asegurar que text sea un string
            if (typeof iaResponse.text !== 'string') {
                iaResponse.text = String(iaResponse.text || 'Lo siento, no pude generar una respuesta. ¿Podrías intentarlo de nuevo?');
            }
            
        } catch (error) {
            console.error('Error al procesar la respuesta de la IA:', error);
            iaResponse = {
                text: '❌ Lo siento, hubo un error al procesar tu mensaje. Por favor, inténtalo de nuevo.',
                showButton: false
            };
        }
        
        // Eliminar el mensaje de "procesando"
        try {
            await bot.deleteMessage(chatId, processingMessage.message_id);
        } catch (error) {
            console.error('Error al eliminar mensaje de procesamiento:', error);
        }
        
        // Limpiar la respuesta de cualquier etiqueta HTML no soportada
        const cleanResponse = iaResponse.text
            .replace(/<button[^>]*>.*?<\/button>/g, '')
            .replace(/<button[^>]*\/>/g, '')
            .replace(/<\/?button[^>]*>/g, '')
            .replace(/\[button\]/g, '')
            .trim();

        console.log('Respuesta limpia:', cleanResponse);
        console.log('Mostrar botón:', iaResponse.showButton);

        // Configuración base del mensaje
        const messageOptions = {
            parse_mode: 'HTML',
            disable_web_page_preview: false
        };

        // Solo agregar el botón si showButton es true
        if (iaResponse.showButton === true) {
            console.log('Preparando para mostrar botón inline');
            messageOptions.reply_markup = {
                inline_keyboard: [
                    [{
                        text: '🔥 ACCESO AL CURSO',
                        url: 'https://go.hotmart.com/R100705059U?dp=1'
                    }]
                ]
            };
            console.log('Botón inline configurado');
        } else {
            console.log('No mostrar botón - showButton:', iaResponse.showButton);
        }

        try {
            // Enviar el mensaje
            console.log('Enviando mensaje...');
            const sentMessage = await bot.sendMessage(chatId, cleanResponse, messageOptions);
            console.log('Mensaje enviado exitosamente con ID:', sentMessage.message_id);
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            
            // Si falla, intentar enviar sin formato HTML ni botones
            try {
                const plainText = cleanResponse
                    .replace(/<[^>]*>/g, '') // Eliminar cualquier etiqueta HTML restante
                    .replace(/\s+/g, ' ')    // Eliminar espacios múltiples
                    .trim();
                
                await bot.sendMessage(chatId, plainText);
                
                // Enviar el botón en un mensaje separado
                await bot.sendMessage(chatId, '🔗 Accede al curso aquí: https://go.hotmart.com/R100705059U?dp=1');
                
            } catch (fallbackError) {
                console.error('Error al enviar mensaje de respaldo:', fallbackError);
                await bot.sendMessage(chatId, 'Ocurrió un error al procesar tu mensaje. Por favor, inténtalo de nuevo.');
            }
        }
        
    } catch (error) {
        console.error('Error en el manejador de mensajes:', error);
        handleError(error, chatId);
    }
});

// Manejar errores del bot
bot.on("polling_error", (error) => {
    console.error('Error en el polling de Telegram:', error);
});

console.log('🤖 Bot de IA iniciado y escuchando mensajes...');
