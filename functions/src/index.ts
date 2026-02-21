import { onCall, HttpsError } from "firebase-functions/v2/https";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // Se tomará de Firebase Secrets o ENV del servidor

const aiCorePrompt = `Eres NutriTico Agent IA v2 (Backend Nivel 1). Experto en nutrición deportiva y salud metabólica en CR.
REGLAS DE ORO:
1. Usa jerga nutricional tica pero profesional.
2. Si el usuario pide sustituciones, valida que se ajusten a los macros objetivo.
3. Si detectas riesgo metabólico, advierte educadamente.
4. Siempre prioriza alimentos locales de temporada en CR.
5. CRÍTICO (Estrategia KETO): Si la estrategia incluye "keto" y el usuario menciona Pinto, Plátano maduro o Pejibayes, ADVIERTE que romperá la cetosis y ofrece alternativas "Dirty Keto Ticas".`;

export const consultNutriTico = onCall({ cors: true }, async (request: any) => {
    try {
        const { userQuery, stateString } = request.data;
        const state = JSON.parse(stateString);

        const systemInstruction = `${aiCorePrompt}
        ESTADO ACTUAL DEL ATLETA:
        - Nombre: ${state.profile.name}
        - Intensidad de hoy: ${state.trainingIntensity}
        - Estrategia: ${state.profile.strategy.join(' + ')}
        - Metas: ${state.calculatedTargets.calories} kcal (P:${state.calculatedTargets.protein}g, C:${state.calculatedTargets.carbs}g).
        `;

        // Usando gemini-1.5-pro para lógica deductiva compleja y nivel 1
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-pro',
            contents: userQuery,
            config: {
                systemInstruction: systemInstruction,
            }
        });

        // Simplicidad: devolvemos los datos listos para el front-end
        return { text: response.text || "", actionTaken: undefined };
    } catch (error) {
        console.error("Consult Error", error);
        throw new HttpsError('internal', 'Error al consultar NutriTico IA.');
    }
});

export const analyzeLabels = onCall({ cors: true }, async (request: any) => {
    try {
        const { images, prompt } = request.data;
        const parts = images.map((data: string) => ({
            inlineData: { mimeType: 'image/jpeg', data }
        }));
        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
            // gemini-1.5-pro es experto en OCR visual de tablas nutricionales
            model: 'gemini-1.5-pro',
            contents: { parts },
            config: {
                systemInstruction: "Actúa como un Auditor de Calidad Alimentaria y Científico de Datos. Analiza fotos de platos servidos (estimando los carbohidratos netos reales) o etiquetas nutricionales. Ojo Crítico con los ingredientes Ticos."
            }
        });
        return { result: response.text || "No se pudo procesar la imagen." };
    } catch (e) {
        throw new HttpsError('invalid-argument', 'Error analizando la imagen.');
    }
});

export const extractFoodData = onCall({ cors: true }, async (request: any) => {
    try {
        const { images } = request.data;
        const parts = images.map((data: string) => ({
            inlineData: { mimeType: 'image/jpeg', data }
        }));
        parts.push({ text: "Analiza la tabla nutricional de este producto y extrae los datos exactos por porción." });

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash', // flash es ideal para extracción JSON rápida
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        portion: { type: Type.STRING },
                        calories: { type: Type.NUMBER },
                        baseAmount: { type: Type.NUMBER },
                        unit: { type: Type.STRING },
                        p: { type: Type.NUMBER },
                        c: { type: Type.NUMBER },
                        f: { type: Type.NUMBER },
                        fiber: { type: Type.NUMBER }
                    },
                    required: ["name", "portion", "calories", "baseAmount", "unit", "p", "c", "f", "fiber"]
                }
            }
        });
        return { data: response.text || "{}" };
    } catch (e) {
        throw new HttpsError('invalid-argument', 'Error extrayendo datos.');
    }
});
