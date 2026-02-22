const { GoogleGenAI } = require('@google/genai');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing API key' });

    try {
        const { images, prompt, stateString } = req.body;
        const genAI = new GoogleGenAI({ apiKey });
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: `Eres un Auditor de Calidad Alimentaria. Analiza imágenes de etiquetas o comida.
Contexto Usuario: ${stateString}. Responde en español.`
        });

        const contents = [
            {
                role: 'user',
                parts: [
                    ...images.map(data => ({ inlineData: { mimeType: 'image/jpeg', data } })),
                    { text: prompt || 'Analiza esta imagen.' }
                ]
            }
        ];

        const result = await model.generateContent({ contents });
        return res.status(200).json({ result: result.response.text() });
    } catch (error) {
        console.error('Analyze Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
