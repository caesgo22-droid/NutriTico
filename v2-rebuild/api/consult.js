const { GoogleGenAI } = require('@google/genai');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing API key' });

    try {
        const { userQuery, stateString } = req.body;
        const genAI = new GoogleGenAI({ apiKey });
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: `Eres NutriTico IA, un nutriólogo clínico experto de Costa Rica.
Analiza el estado del usuario: ${stateString}.
Ayuda al usuario a cumplir sus metas nutricionales.
Si necesitas ajustar el plan semanal, responde incluyendo: [PLAN_UPDATE: [{"dayIndex": 0, "meal": "Desayuno", "group": "Proteinas", "itemId": "huevo", "qty": 2}]]
Para acciones confirmadas usa: [ACTION_TAKEN: Mensaje de confirmación]`
        });

        const result = await model.generateContent(userQuery);
        return res.status(200).json({ result: result.response.text() });
    } catch (error) {
        console.error('Consult Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
