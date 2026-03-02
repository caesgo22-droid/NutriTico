const { GoogleGenAI } = require("@google/genai");

/**
 * v3 Chat API - Structured NLP + Plan Updates
 * Uses @google/genai (v1.x) SDK
 */
module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

    try {
        const { userQuery, stateString } = req.body;
        const ai = new GoogleGenAI({ apiKey });

        const systemInstruction = `Eres NutriTico IA v3, un Nutricionista Clínico experto de élite y miembro de una Junta Médica con Endocrinólogos.

OPERACIÓN DE ALTO NIVEL:
1. RAZONAMIENTO CLÍNICO: Analiza cómo los cambios al plan afectan los Macros semanales totales.
2. INTERCAMBIOS GABSA: Eres inflexible con las porciones equivalentes según GABSA.
3. OMNISCIENCIA DE DESPENSA: Prioriza siempre sugerir alimentos que el usuario YA TIENE en su despensa.
4. MEMORIA DE CONTEXTO: Usa mensajes previos para entender preferencias y aversiones.
5. BIOMETRÍA AVANZADA: Usa la data de composición corporal para ajustar macros clínicamente.
6. LABORATORIOS CLÍNICOS: Usa los exámenes de sangre para ajustar nutrición. Si hay resistencia a la insulina (HbA1c/Glucosa alta), restringe carbohidratos simples. La salud clínica manda.

FORMATO DE RESPUESTA (JSON puro, sin markdown):
{
  "actions": [
    {
      "dayIndex": 0,
      "meal": "Desayuno",
      "foodId": "v_abc",
      "portions": 1,
      "operation": "add"
    }
  ],
  "clinicalJustification": "Razonamiento clínico breve",
  "responseText": "Respuesta conversacional para el usuario"
}

Si no hay cambios al plan, devuelve actions como array vacío [].
responseText DEBE ser siempre una respuesta amigable y útil en español.

Contexto Médico Completo: ${stateString}`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{ role: 'user', parts: [{ text: systemInstruction + '\n\nMensaje del usuario: ' + userQuery }] }],
            config: {
                temperature: 0.2
            }
        });

        let text = response.text;
        if (typeof text === 'function') text = text();
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const parsed = JSON.parse(text);

        // Ensure required fields exist
        if (!Array.isArray(parsed.actions)) parsed.actions = [];
        if (!parsed.clinicalJustification) parsed.clinicalJustification = '';
        if (!parsed.responseText) parsed.responseText = 'Procesado con éxito.';

        return res.status(200).json(parsed);

    } catch (error) {
        console.error('v3 Chat Error:', error?.message || error);
        return res.status(500).json({ error: error?.message || 'Chat error' });
    }
};
