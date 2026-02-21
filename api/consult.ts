import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// CRITICAL: Use GEMINI_API_KEY (no VITE_ prefix) for serverless functions
// VITE_ prefixed vars are NOT available in Node.js serverless runtime
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_API_KEY || "" });

const SYSTEM_PROMPT = `Eres NutriTico Agent IA v2 - Nutricionista Deportivo Tico. Experto en nutrición deportiva y salud metabólica en Costa Rica.
REGLAS DE ORO:
1. Responde en español usando jerga nutricional tica pero profesional.
2. Si el usuario pide un plan o ajustes, responde con texto motivador Y un bloque de planCommands.
3. Si la estrategia es Keto, NUNCA incluyas Harinas. Prioriza Grasas y Proteínas.
4. Indica cantidades en PORCIONES numéricas exactas (ej: 2 porciones).
5. FORMATO OBLIGATORIO DE COMANDO (incluye al FINAL de tu respuesta si hay cambios al plan):
[PLAN_UPDATE: [{"dayIndex":0,"meal":"Desayuno","group":"Proteinas","itemId":"p1","qty":2},{"dayIndex":0,"meal":"Desayuno","group":"Grasas","itemId":"g1","qty":1}]]

CATÁLOGO COMPLETO (usa estos IDs exactos):
- Harinas: h1=Gallo Pinto, h2=Plátano Maduro, h3=Tortilla Maíz, h4=Pejibaye, h5=Yuca
- Proteinas: p1=Huevo, p2=Queso Turrialba, p3=Pechuga Pollo, p4=Atún
- Grasas: g1=Aguacate Hass, g2=Natilla, g3=Aceite Coco
- Vegetales: v1=Ensalada Verde, v2=Chayote`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { userQuery, stateString } = req.body;

        if (!userQuery) {
            return res.status(400).json({ error: 'No se proporcionó consulta.' });
        }

        const state = JSON.parse(stateString || "{}");
        const profile = state.profile || { name: 'Atleta', strategy: [], medicalConditions: [] };
        const targets = state.calculatedTargets || { calories: 2000, protein: 150, carbs: 200, fat: 70 };
        const activeMeals = (state.activeMeals || ['Desayuno', 'Almuerzo', 'Merienda', 'Cena']).join(', ');

        const contextPrompt = `${SYSTEM_PROMPT}

ESTADO DEL ATLETA:
- Nombre: ${profile.name}
- Peso: ${profile.weight}kg | Estatura: ${profile.height}cm | Edad: ${profile.age}
- Objetivo: ${profile.goal}
- Estrategia dietética: ${(profile.strategy || []).join(', ') || 'ninguna específica'}
- Intensidad entrenamiento: ${state.trainingIntensity || 'moderate'}
- METAS DIARIAS: ${targets.calories} kcal | Proteína:${targets.protein}g | Carbs:${targets.carbs}g | Grasa:${targets.fat}g
- COMIDAS DEL DÍA (usa estos nombres EXACTOS en meal): ${activeMeals}`;

        const response = await genAI.models.generateContent({
            model: 'gemini-1.5-pro',
            contents: [{ role: 'user', parts: [{ text: userQuery }] }],
            config: {
                systemInstruction: contextPrompt,
            }
        });

        const text = response.text || "Lo siento, no pude generar una respuesta. Intenta de nuevo.";
        return res.status(200).json({ text });

    } catch (error: any) {
        console.error("Consult Error:", error?.message || error);
        return res.status(500).json({ error: `Error al consultar NutriTico IA: ${error?.message || 'Error desconocido'}` });
    }
}
