// api/analyze.js - Vercel Serverless Function (CommonJS)
const { GoogleGenAI } = require('@google/genai');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;
    if (!apiKey) {
        console.error('Missing GEMINI_API_KEY environment variable');
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }

    try {
        const { images, prompt, stateString } = req.body;

        if (!images || images.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron imágenes.' });
        }

        const state = JSON.parse(stateString || '{}');
        const profile = state.profile;
        const profileInfo = profile
            ? `\nCONTEXTO: ${profile.name}, Estrategia: ${(profile.strategy || []).join(' + ')}, Condiciones: ${(profile.medicalConditions || []).join(', ')}.`
            : '';

        const genAI = new GoogleGenAI({ apiKey });

        // El SDK nuevo usa genAI.models.generateContent directamente
        const result = await genAI.models.generateContent({
            model: 'gemini-1.5-flash',
            systemInstruction: `Eres un Auditor de Calidad Alimentaria experto en productos centroamericanos.
Analiza etiquetas nutricionales o fotos de platos servidos.
IGNORA publicidad, slogans y recetas; enfócate SOLO en Información Nutricional e Ingredientes.
Responde en español.${profileInfo}
Si la dieta es KETO, advierte sobre harinas refinadas.`,
            contents: [
                {
                    role: 'user',
                    parts: [
                        ...images.map(data => ({
                            inlineData: { mimeType: 'image/jpeg', data }
                        })),
                        { text: prompt || 'Analiza esta etiqueta nutricional.' }
                    ]
                }
            ]
        });

        return res.status(200).json({ result: result.text });

    } catch (error) {
        console.error('Analyze Error:', error);
        return res.status(500).json({ error: `Error analizando: ${error.message || 'Error desconocido'}` });
    }
};
