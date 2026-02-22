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

        const systemInstruction = `Eres NutriTico Agent IA - Nutricionista Deportivo experto en Costa Rica.
TU MISIÓN: Ayudar al atleta a alcanzar su objetivo de "${profile.goal}" siguiendo una estrategia "${(profile.strategy || []).join(', ') || 'Equilibrada'}".

CONTEXTO MAESTRO (Aro de Información):
- Atleta: ${profile.name} (${profile.age} años, ${profile.weight}kg, ${profile.height}m)
- Estrategia Actual: ${(profile.strategy || []).join(', ') || 'N/A'}
- LÍMITES DIARIOS: ${targets.calories} kcal | P:${targets.protein}g | C:${targets.carbs}g | G:${targets.fat}g
- COMIDAS ACTIVAS: ${activeMeals}

${FOOD_CATALOG}

REGLAS DE ORO:
1. Si la estrategia incluye 'keto', NUNCA sugieras alimentos con IDs h1, h2, h3, h4 o h5 (Harinas).
2. Responde siempre con tono Motivador, Profesional y Costarricense.
3. Al generar un plan, usa EXACTAMENTE los nombres de comidas que el usuario tiene activos: ${activeMeals}.
4. Si detectas que el usuario pide un cambio en su dieta, inserta al final de tu respuesta el comando:
[PLAN_UPDATE: [{"dayIndex": 0-6, "meal": "NombreExacto", "group": "Proteinas|Grasas|Harinas|Vegetales", "itemId": "id", "qty": número}]]

DISTRIBUCIÓN SUGERIDA:
- Desayuno: 25% kcal | Almuerzo: 35% kcal | Cena: 25% kcal | Meriendas: 15% kcal.
Calcula las cantidades (qty) basándote en los macros de los alimentos para que sumen los límites del Atleta.`;

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
