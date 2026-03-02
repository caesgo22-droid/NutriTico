const { GoogleGenAI } = require("@google/genai");

/**
 * NutriTico v3 - Chat API
 * AI Nutritionist + Medical Board
 */
module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

    try {
        const { userQuery, stateString } = req.body;
        const ai = new GoogleGenAI({ apiKey });

        const systemText = `Eres NutriTico IA v3, un Nutricionista Clínico experto y miembro de una Junta Médica.

REGLAS:
1. Prioriza alimentos de la despensa del usuario en tus sugerencias.
2. Usa el sistema GABSA de porciones de Costa Rica.
3. Considera biometría y laboratorios para ajustar recomendaciones (si HbA1c alta: reduce carbos simples; si LDL alto: reduce grasas saturadas).
4. Responde siempre en español.

FORMATO DE RESPUESTA (JSON puro, SIN markdown):
{"actions": [{"dayIndex": 0, "meal": "Desayuno", "foodId": "v_abc", "portions": 1, "operation": "add"}], "clinicalJustification": "...", "responseText": "..."}

Si no hay cambios al plan usa actions: [].
responseText SIEMPRE debe ser una respuesta conversacional útil.

Contexto completo del usuario: ${stateString}`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{ role: 'user', parts: [{ text: systemText + '\n\nUsuario: ' + userQuery }] }],
            config: { temperature: 0.2 }
        });

        let text = typeof response.text === 'function' ? response.text() : response.text;
        if (!text) text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed.actions)) parsed.actions = [];
        if (!parsed.responseText) parsed.responseText = 'Procesado.';

        return res.status(200).json(parsed);

    } catch (error) {
        console.error('Chat Error:', error?.message || error);
        return res.status(500).json({ error: error?.message || 'Chat error' });
    }
};
