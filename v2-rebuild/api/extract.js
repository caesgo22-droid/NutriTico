const { GoogleGenAI } = require('@google/genai');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing API key' });

    try {
        const { images } = req.body;
        const genAI = new GoogleGenAI({ apiKey });
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: `Extrae datos nutricionales en JSON: {"name": "", "calories": 0, "macros": {"p":0, "c":0, "f":0, "fiber":0}, "portion": "", "baseAmount": 100, "unit": "g"}. SOLO RESPONDE EL JSON.`
        });

        const contents = [
            {
                role: 'user',
                parts: [
                    ...images.map(data => ({ inlineData: { mimeType: 'image/jpeg', data } })),
                    { text: "Extrae los datos de esta etiqueta." }
                ]
            }
        ];

        const result = await model.generateContent({ contents });
        return res.status(200).json({ result: result.response.text().replace(/```json/g, '').replace(/```/g, '').trim() });
    } catch (error) {
        console.error('Extract Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
