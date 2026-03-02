const { GoogleGenAI } = require("@google/genai");

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

    try {
        const { images } = req.body;
        if (!images || images.length === 0) {
            return res.status(400).json({ error: 'No images provided.' });
        }

        const ai = new GoogleGenAI({ apiKey });

        const systemPrompt = `Eres un sistema OCR clínico especializado en biometría corporal.
Extrae los datos biométricos de la pantalla de una app de báscula inteligente (Cubitt, Garmin, Renpho, Xiaomi, Fitbit, etc).

REGLAS:
1. Devuelve SOLAMENTE un objeto JSON puro, sin markdown.
2. Claves permitidas: bodyFatPercentage, muscleMassPercentage, waterPercentage, boneMass, visceralFat, metabolicAge.
3. Los valores son números (sin % ni unidades).
4. Si no encuentras un dato, omite esa clave.

Ejemplo: {"bodyFatPercentage": 18.5, "muscleMassPercentage": 42.3, "waterPercentage": 58.1, "boneMass": 2.8, "visceralFat": 7, "metabolicAge": 28}`;

        const contentParts = [{ text: systemPrompt }];

        images.forEach(img => {
            const base64Data = typeof img === 'string'
                ? img.replace(/^data:[^;]+;base64,/, '')
                : (img.data || img);
            contentParts.push({ inlineData: { data: base64Data, mimeType: 'image/jpeg' } });
        });

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{ role: 'user', parts: contentParts }]
        });

        let text = typeof response.text === 'function' ? response.text() : response.text;
        if (!text) text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        res.status(200).json(JSON.parse(text));

    } catch (error) {
        console.error('Biometrics Error:', error?.message || error);
        res.status(500).json({ error: error?.message || 'Error processing biometric image' });
    }
};
