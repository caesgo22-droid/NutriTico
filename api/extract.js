// api/extract.js - Vercel Serverless Function (CommonJS)
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
        const { images, stateString } = req.body;

        if (!images || images.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron imágenes.' });
        }

        const state = JSON.parse(stateString || '{}');
        const profile = state.profile;
        const profileInfo = profile
            ? `Atleta: ${profile.name}, Estrategia: ${(profile.strategy || []).join(' + ')}`
            : '';

        const genAI = new GoogleGenAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: { responseMimeType: 'application/json' },
            systemInstruction: `Extrae datos de la TABLA NUTRICIONAL. IGNORA publicidad y recetas.
Devuelve EXACTAMENTE este JSON (sin texto extra, solo JSON):
{
  "name": "Nombre del producto",
  "portion": "descripción de porción",
  "calories": 0,
  "baseAmount": 0,
  "unit": "g",
  "p": 0,
  "c": 0,
  "f": 0,
  "fiber": 0
}
Todos los valores numéricos deben ser números, no strings.`
        });

        const parts = images.map((data) => ({
            inlineData: { mimeType: 'image/jpeg', data }
        }));
        parts.push({ text: `Extrae los datos nutricionales por porción de esta etiqueta en JSON estricto. ${profileInfo}` });

        const result = await model.generateContent(parts);
        const response = await result.response;
        const text = response.text();

        return res.status(200).json({ data: text });

    } catch (error) {
        console.error('Extract Error:', error && error.message ? error.message : error);
        return res.status(500).json({ error: `Error extrayendo datos: ${error && error.message ? error.message : 'Error desconocido'}` });
    }
};
