import { GoogleGenAI } from "@google/genai";

/**
 * NutriTico v3 - Chat API (ESM)
 * AI Nutritionist with structured plan update output
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

  try {
    const { userQuery, stateString } = req.body;
    const ai = new GoogleGenAI({ apiKey });

    const systemText = `Eres NutriTico IA v3, un Nutricionista Clínico experto y miembro de una Junta Médica con Endocrinólogos.

REGLAS DE OPERACIÓN:
1. INTERCAMBIOS GABSA: Sé inflexible con las porciones equivalentes del sistema GABSA de Costa Rica.
2. OMNISCIENCIA DE DESPENSA: Prioriza siempre alimentos que el usuario ya tiene escaneados en su despensa.
3. BIOMETRÍA: Ajusta macros según composición corporal del usuario (% grasa, músculo).
4. LABORATORIOS CLÍNICOS: Si hay resistencia a la insulina (HbA1c/Glucosa alta), restringe carbohidratos simples. Si hay riesgo aterogénico (LDL alto), restringe grasas saturadas. La salud clínica manda por encima del cálculo calórico.
5. Responde siempre en español, de forma amigable y educativa.

FORMATO DE RESPUESTA (JSON puro, sin markdown, sin bloques de código):
{
  "actions": [{"dayIndex": 0, "meal": "Desayuno", "foodId": "v_abc", "portions": 1, "operation": "add"}],
  "clinicalJustification": "Razonamiento clínico breve",
  "responseText": "Respuesta amigable para el usuario"
}

Si no hay cambios al plan, usa "actions": [].
responseText SIEMPRE debe ser una respuesta conversacional útil en español.

Contexto Médico Completo del Usuario: ${stateString}`;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [{ role: 'user', parts: [{ text: systemText + '\n\nMensaje del usuario: ' + userQuery }] }],
      config: { temperature: 0.2 }
    });

    let text = typeof response.text === 'function' ? response.text() : response.text;
    if (!text) text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const parsed = JSON.parse(text);

    // Ensure required fields
    if (!Array.isArray(parsed.actions)) parsed.actions = [];
    if (!parsed.clinicalJustification) parsed.clinicalJustification = '';
    if (!parsed.responseText) parsed.responseText = 'Procesado con éxito.';

    return res.status(200).json(parsed);

  } catch (error) {
    console.error('v3 Chat Error:', error?.message || error);
    return res.status(500).json({ error: error?.message || 'Chat error' });
  }
}
