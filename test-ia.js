const { HfInference } = require('@huggingface/inference');
require('dotenv').config();

// Configuración
const HF_ACCESS_TOKEN = process.env.HF_ACCESS_TOKEN || 'tu_token_aqui';
const MODEL_NAME = 'gpt2';

// Inicializar el cliente de Hugging Face
const hf = new HfInference(HF_ACCESS_TOKEN);

// Función para probar la generación de texto
async function testTextGeneration() {
    try {
        console.log('🔍 Iniciando prueba de generación de texto...');
        console.log(`📝 Modelo: ${MODEL_NAME}`);
        console.log('📤 Enviando solicitud a la API de Hugging Face...');
        
        const prompt = 'Hola, ¿cómo estás?';
        
        const response = await hf.textGeneration({
            model: MODEL_NAME,
            inputs: prompt,
            parameters: {
                max_new_tokens: 50,
                temperature: 0.7,
                return_full_text: false,
                do_sample: true,
                top_p: 0.9,
                top_k: 50,
                repetition_penalty: 1.2
            }
        });
        
        console.log('✅ Prueba exitosa!');
        console.log('📥 Respuesta recibida:');
        console.log(response.generated_text);
        
    } catch (error) {
        console.error('❌ Error en la prueba:');
        console.error('Mensaje:', error.message);
        console.error('Código:', error.code);
        console.error('Estado:', error.status);
        
        if (error.response) {
            console.error('Respuesta del servidor:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data
            });
        }
    }
}

// Ejecutar la prueba
testTextGeneration();
