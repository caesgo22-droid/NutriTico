import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

const genAI = new GoogleGenAI({ apiKey: process.env.VITE_API_KEY || "" });

const aiCorePrompt = `Eres NutriTico Agent IA v2 (Vercel Edge). Experto en nutrición deportiva y salud metabólica en CR.
REGLAS DE ORO:
1. Usa jerga nutricional tica pero profesional.
2. Si el usuario pide sustituciones, valida que se ajusten a los macros objetivo.
3. Si detectas riesgo metabólico, advierte educadamente.
4. Siempre prioriza alimentos locales de temporada en CR.
5. CRÍTICO (Estrategia KETO): Si la estrategia incluye "keto" y el usuario menciona Pinto, Plátano maduro o Pejibayes, ADVIERTE que romperá la cetosis y ofrece alternativas "Dirty Keto Ticas".`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { userQuery, stateString } = req.body;
        const state = JSON.parse(stateString || "{}");

        const profile = state.profile || { name: 'Atleta', strategy: [], medicalConditions: [] };
        const targets = state.calculatedTargets || { calories: 2000, protein: 150, carbs: 200 };

        const systemInstruction = `${aiCorePrompt}
        ESTADO ACTUAL DEL ATLETA:
        - Nombre: ${profile.name}
        - Intensidad de hoy: ${state.trainingIntensity || 'moderada'}
        - Estrategia: ${(profile.strategy || []).join(' + ')}
        - Metas: ${targets.calories} kcal (P:${targets.protein}g, C:${targets.carbs}g).
        `;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
        });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: userQuery }] }],
            systemInstruction: systemInstruction
        });
        const text = result.response.text();

        return res.status(200).json({ text, actionTaken: undefined });
    } catch (error: any) {
        console.error("Consult Error", error);
        return res.status(500).json({ error: 'Error al consultar NutriTico IA.' });
    }
}
