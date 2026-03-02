const { GoogleGenAI } = require("@google/genai");

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

    try {
        const { images } = req.body;
        if (!images || images.length === 0) {
            return res.status(400).json({ error: 'No images provided for biometric OCR.' });
        }

        const ai = new GoogleGenAI({ apiKey });

        const systemPrompt = `Eres un sistema OCR clínico especializado en biometría corporal.
Tu trabajo es extraer los datos biométricos de la imagen adjunta (pantalla de app de báscula inteligente: Cubitt, Garmin, Renpho, Xiaomi, etc).

REGLAS ESTRICTAS:
1. Devuelve SOLAMENTE un objeto JSON puro, sin bloques markdown.
2. Las claves permitidas son: bodyFatPercentage, muscleMassPercentage, waterPercentage, boneMass, visceralFat, metabolicAge.
3. Extrae SOLO los números (sin % o kg).
4. Si un dato no se encuentra, omítelo del JSON.`;

        const contentParts = [{ text: systemPrompt }];

        images.forEach(img => {
            const base64Data = typeof img === 'string'
                ? img.replace(/^data:[^;]+;base64,/, '')
                : img.data || img;
            contentParts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: 'image/jpeg'
                }
            });
        });

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{ role: 'user', parts: contentParts }]
        });

        let text = response.text;
        if (typeof text === 'function') text = text();
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        res.status(200).json(JSON.parse(text));

    } catch (error) {
        console.error('API Error (Biometrics):', error?.message || error);
        res.status(500).json({ error: error?.message || 'Error processing biometric image' });
    }
};
