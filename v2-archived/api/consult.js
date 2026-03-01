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
            systemInstruction: `Eres NutriTico IA, un sistema de Nutrición Clínica avanzada basado en evidencia médica.
Tu razonamiento debe seguir estrictamente estos pilares:
1. GABSA (Costa Rica 2022): Fomenta alimentos frescos, variados y locales. Prioriza la cultura alimentaria costarricense saludable.
2. Estándares ADA/Protocolo Clínico: Individualiza carbohidratos. Si hay Diabetes/IR, el límite es estricto. Si hay Hipertensión, aplica protocolo DASH.
3. Cetosis y Ayuno: Si la estrategia incluye 'keto', mantén carbohidratos netos <50g y prioriza grasas saludables. Si incluye 'ayuno', recomienda ventanas de alimentación (ej. 16:8) y evita sugerir ingestas en horas de ayuno.
4. Directrices OMS: Alerta sobre excesos de Sodio, Azúcares añadidos y grasas trans.
5. Razonamiento Científico: No alucines. Si el usuario tiene una patología o estrategia activa (Keto/Ayuno), justifica tu cambio con: "Dado tu protocolo de [Estrategia/Patología], ajustamos [Parámetro] según evidencia clínica...".

Estado del Usuario: ${stateString}.
Objetivo: Ayudar al usuario con precisión médica.

Si ajustas el plan semanal, responde incluyendo: [PLAN_UPDATE: [{"dayIndex": 0, "meal": "Desayuno", "group": "Proteinas", "itemId": "huevo", "qty": 2}]]
Para acciones confirmadas usa: [ACTION_TAKEN: Mensaje de confirmación]`
        });

        const result = await model.generateContent(userQuery);
        return res.status(200).json({ result: result.response.text() });
    } catch (error) {
        console.error('Consult Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
