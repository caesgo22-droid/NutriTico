import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

const genAI = new GoogleGenAI({ apiKey: process.env.VITE_API_KEY || "" });

const aiCorePrompt = `Eres NutriTico Agent IA v2 (Vercel Edge). Experto en nutrición deportiva y salud metabólica en CR.
REGLAS DE ORO:
1. Usa jerga nutricional tica pero profesional.
2. Si el usuario pide un plan o ajustes, responde con texto motivador Y un bloque JSON de "planCommands" para automatizar la carga.
3. Si la estrategia es Keto, evita Harinas y prioriza Grasas/Proteínas.
4. Siempre indica cantidades en PORCIONES (ej: 1.5 porciones de Gallo Pinto).
5. FORMATO DE COMANDO: Si quieres actualizar el plan, incluye al final de tu respuesta: [PLAN_UPDATE: [{"dayIndex":0, "meal":"NOMBRE_EXACTO_COMIDA", "group":"Harinas", "itemId":"h1", "qty":1.5}]]
6. USA ESTOS NOMBRES PARA 'meal' (Caso sensitivo): {{MEALS}}`;

const EQUIVALENCIES_CATALOG = `
CATEGORÍAS Y ALIMENTOS DISPONIBLES (Usa estos IDs exactos):
- Harinas: h1 (Gallo Pinto), h2 (Plátano), h3 (Tortilla), h4 (Pejibaye), h5 (Yuca)
- Proteinas: p1 (Huevo), p2 (Queso), p3 (Pollo), p4 (Atún)
- Grasas: g1 (Aguacate), g2 (Natilla), g3 (COCO)
- Vegetales: v1 (Ensalada), v2 (Chayote)
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { userQuery, stateString } = req.body;
        const state = JSON.parse(stateString || "{}");

        const profile = state.profile || { name: 'Atleta', strategy: [], medicalConditions: [] };
        const targets = state.calculatedTargets || { calories: 2000, protein: 150, carbs: 200 };

        const systemInstruction = `${aiCorePrompt.replace('{{MEALS}}', (state.activeMeals || []).join(', '))}
        ${EQUIVALENCIES_CATALOG}
        ESTADO ACTUAL DEL ATLETA:
        - Nombre: ${profile.name}
        - Intensidad: ${state.trainingIntensity}
        - Estrategia: ${(profile.strategy || []).join(', ')}
        - Objetivos: ${targets.calories} kcal, P:${targets.protein}g, C:${targets.carbs}g, F:${targets.fat}g.
        - COMIDAS ACTIVAS: ${(state.activeMeals || []).join(', ')}
        `;

        const response = await genAI.models.generateContent({
            model: 'gemini-1.5-pro',
            contents: userQuery,
            config: {
                systemInstruction: systemInstruction,
            }
        });
        const text = response.text || "";

        return res.status(200).json({ text, actionTaken: undefined });
    } catch (error: any) {
        console.error("Consult Error", error);
        return res.status(500).json({ error: 'Error al consultar NutriTico IA.' });
    }
}
