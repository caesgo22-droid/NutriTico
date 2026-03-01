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
            systemInstruction: `Eres un Auditor Clínico de Calidad Alimentaria y Gestor de Despensa.
Analiza imágenes basándote en:
1. Perfil Nutricional OMS: Sodio, Azúcares y Grasas.
2. Criterio GABSA: Grado de procesamiento.
3. Clasificación de Despensa (Clustering): Clasifica el alimento en uno de estos: 'Proteína', 'Carbohidratos', 'Grasas', 'Vegetales', 'Ultraprocesados', 'Otros'.
4. Contexto Metabólico: ${stateString}.
5. Estrategia Clínica: Si el contexto incluye 'keto', penaliza fuertemente carbohidratos netos altos. Si incluye 'ayuno', evalúa si este alimento rompería el ayuno.

Responde en español indicando la CLASIFICACIÓN y si es RECOMENDABLE, LIMITADO o EVITAR.`
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
