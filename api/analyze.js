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

ESTÁNDARES DE CALIDAD:
1. OCR EXTREMO: Si hay una etiqueta nutricional, extrae los datos exactos por 100g o por porción indicada.
2. CLASIFICACIÓN GABSA: Clasifica el alimento estrictamente en los grupos de intercambio de Costa Rica.
3. REGLA DE SEGURIDAD: Si el alimento es ultraprocesado o tiene ingredientes conflictivos, dilo en clinicalAdvice.
4. Devuelve SOLAMENTE un objeto JSON puro con las claves: id, name, brand, ingredients, group, calories, macros (p/c/f), equivalentPortion, clinicalAdvice.
5. group debe ser uno de: Proteína, Carbohidratos, Grasas, Vegetales, Frutas, Lácteos, Ultraprocesados, Otros.
6. calories y macros deben ser números.
7. NO incluyas bloques markdown, solo JSON puro.

Contexto del usuario: ${stateString}`;

        const contentParts = [{ text: systemPrompt + '\n\n' + (prompt || 'Analiza este alimento y extrae toda la información nutricional disponible.') }];

        for (const img of images) {
            const mimeType = img.mimeType || 'image/jpeg';
            const base64Data = img.data;

            if (mimeType === 'application/pdf') {
                const tmpFile = path.join(os.tmpdir(), `pantry_${Date.now()}.pdf`);
                fs.writeFileSync(tmpFile, Buffer.from(base64Data, 'base64'));

                try {
                    const uploaded = await ai.files.upload({
                        file: tmpFile,
                        config: { mimeType: 'application/pdf' }
                    });
                    contentParts.push({ fileData: { fileUri: uploaded.uri, mimeType: 'application/pdf' } });
                } finally {
                    fs.unlinkSync(tmpFile);
                }
            } else {
                contentParts.push({ inlineData: { data: base64Data, mimeType } });
            }
        }

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{ role: 'user', parts: contentParts }]
        });

        let text = response.text;
        if (typeof text === 'function') text = text();
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const result = JSON.parse(text);
        if (!result.id) result.id = `v_${Date.now()}`;

        return res.status(200).json(result);

    } catch (error) {
        console.error('Vision API Error:', error?.message || error);
        return res.status(500).json({ error: error?.message || 'Error processing image' });
    }
};
