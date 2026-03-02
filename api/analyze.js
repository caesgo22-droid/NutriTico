const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

    try {
        const { images, prompt, stateString } = req.body;
        if (!images || images.length === 0) {
            return res.status(400).json({ error: 'No images provided.' });
        }

        const ai = new GoogleGenAI({ apiKey });

        const systemPrompt = `Eres el Auditor de Visión de NutriTico IA v3.
Analiza con OCR de precisión el alimento, empaque o etiqueta nutricional en las imágenes o PDFs.

REGLAS:
1. Devuelve SOLAMENTE un objeto JSON puro, sin markdown, sin texto adicional.
2. El JSON DEBE tener estas claves exactamente: id, name, brand, ingredients, group, calories, macros, equivalentPortion, clinicalAdvice.
3. id: string tipo "v_" + número aleatorio. name: nombre del alimento. brand: marca (string vacío si no aplica). ingredients: lista de ingredientes (string vacío si no aplica). group: uno de [Proteína, Carbohidratos, Grasas, Vegetales, Frutas, Lácteos, Ultraprocesados, Otros]. calories: número. macros: objeto con p (proteína g), c (carbos g), f (grasa g) como números. equivalentPortion: string tipo "100g" o "1 taza". clinicalAdvice: string vacío si todo está bien.
4. Si hay etiqueta nutricional, extrae los datos EXACTOS de la tabla.

Ejemplo: {"id":"v_1234","name":"Leche Descremada","brand":"Dos Pinos","ingredients":"","group":"Lácteos","calories":90,"macros":{"p":8,"c":12,"f":0},"equivalentPortion":"1 taza (240ml)","clinicalAdvice":""}

Contexto del usuario: ${stateString || '{}'}`;

        const contentParts = [{ text: systemPrompt + '\n\n' + (prompt || 'Analiza este alimento y extrae la información nutricional completa.') }];

        for (const img of images) {
            const mimeType = img.mimeType || 'image/jpeg';
            const base64Data = img.data;

            if (mimeType === 'application/pdf') {
                const tmpFile = path.join(os.tmpdir(), `pantry_${Date.now()}.pdf`);
                try {
                    fs.writeFileSync(tmpFile, Buffer.from(base64Data, 'base64'));
                    let fileUri = null;
                    try {
                        const uploaded = await ai.files.upload({ file: tmpFile, config: { mimeType: 'application/pdf' } });
                        fileUri = uploaded?.uri || uploaded?.file?.uri || null;
                    } catch (e) {
                        console.warn('File upload fallback:', e.message);
                    }
                    if (fileUri) {
                        contentParts.push({ fileData: { fileUri, mimeType: 'application/pdf' } });
                    } else {
                        contentParts.push({ inlineData: { data: base64Data, mimeType: 'application/pdf' } });
                    }
                } finally {
                    try { fs.unlinkSync(tmpFile); } catch (_) { }
                }
            } else {
                contentParts.push({ inlineData: { data: base64Data, mimeType } });
            }
        }

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{ role: 'user', parts: contentParts }]
        });

        let text = typeof response.text === 'function' ? response.text() : response.text;
        if (!text) text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const result = JSON.parse(text);
        if (!result.id) result.id = `v_${Date.now()}`;
        if (!result.macros) result.macros = { p: 0, c: 0, f: 0 };

        return res.status(200).json(result);

    } catch (error) {
        console.error('Vision API Error:', error?.message || error);
        return res.status(500).json({ error: error?.message || 'Error processing image' });
    }
};
