// api/consult.js - Vercel Serverless Function (CommonJS)
const { GoogleGenAI } = require('@google/genai');

const FOOD_CATALOG = `
CATÁLOGO DE ALIMENTOS (usa estos IDs exactos en planCommands):
- Harinas: h1=Gallo Pinto, h2=Plátano Maduro, h3=Tortilla Maíz, h4=Pejibaye, h5=Yuca
- Proteinas: p1=Huevo entero, p2=Queso Turrialba, p3=Pechuga Pollo, p4=Atún en agua
- Grasas: g1=Aguacate Hass, g2=Natilla, g3=Aceite de Coco
- Vegetales: v1=Ensalada Verde, v2=Chayote`;

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_API_KEY;
    if (!apiKey) {
        console.error('Missing GEMINI_API_KEY environment variable');
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
    }

    try {
        const { userQuery, stateString } = req.body;

        if (!userQuery) {
            return res.status(400).json({ error: 'No se proporcionó consulta.' });
        }

        const state = JSON.parse(stateString || '{}');
        const profile = state.profile || { name: 'Atleta', strategy: [], medicalConditions: [] };
        const targets = state.calculatedTargets || { calories: 2000, protein: 150, carbs: 200, fat: 70 };
        const activeMeals = (state.activeMeals || ['Desayuno', 'Almuerzo', 'Merienda', 'Cena']).join(', ');

        const genAI = new GoogleGenAI({ apiKey });

        const systemInstruction = `Eres NutriTico Agent IA - Nutricionista Deportivo experto en Costa Rica. Responde en español.

PERFIL DEL ATLETA:
- Nombre: ${profile.name}
- Peso: ${profile.weight}kg | Altura: ${profile.height}cm | Edad: ${profile.age} años
- Objetivo: ${profile.goal} | Estrategia: ${(profile.strategy || []).join(', ') || 'ninguna'}
- Intensidad entrenamiento: ${state.trainingIntensity || 'moderate'}
- METAS: ${targets.calories} kcal | P:${targets.protein}g | C:${targets.carbs}g | G:${targets.fat}g
- COMIDAS (usa estos nombres exactos): ${activeMeals}

${FOOD_CATALOG}

REGLAS:
1. Si el usuario pide un plan, genera texto motivador Y al final incluye el bloque [PLAN_UPDATE].
2. Si la estrategia es Keto, NUNCA incluyas Harinas (h1-h5).
3. Distribuye las calorías proporcionalmente entre las comidas.
4. FORMATO OBLIGATORIO para actualizar el plan:
[PLAN_UPDATE: [{"dayIndex":0,"meal":"Desayuno","group":"Proteinas","itemId":"p1","qty":2},{"dayIndex":0,"meal":"Desayuno","group":"Grasas","itemId":"g1","qty":1}]]
5. dayIndex va de 0 (Lunes) a 6 (Domingo).`;

        const response = await genAI.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: [{ role: 'user', parts: [{ text: userQuery }] }],
            config: { systemInstruction }
        });

        const text = response.text || 'Lo siento, no pude generar respuesta. Intenta de nuevo.';
        return res.status(200).json({ text });

    } catch (error) {
        console.error('Consult Error:', error && error.message ? error.message : error);
        return res.status(500).json({ error: `Error al consultar: ${error && error.message ? error.message : 'Error desconocido'}` });
    }
};
