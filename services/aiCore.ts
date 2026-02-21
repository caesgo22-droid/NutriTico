
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { AppState, AIResponse, AppActions, FoodItem } from "../types";

// Inicialización centralizada y segura
const apiKey = import.meta.env.VITE_API_KEY || ''; // Usamos import.meta.env para Vite
const ai = new GoogleGenAI({ apiKey });

const updatePlanTool: FunctionDeclaration = {
    name: "updateUserPlan",
    parameters: {
        type: Type.OBJECT,
        description: "Actualiza el plan alimenticio del usuario para el día de hoy basado en alimentos de Costa Rica.",
        properties: {
            meal: { type: Type.STRING, description: "Tiempo de comida (Desayuno, Almuerzo, Merienda, Cena)." },
            foodCategory: { type: Type.STRING, description: "Categoría (Harinas, Proteinas, Grasas, Vegetales)." },
            foodName: { type: Type.STRING, description: "Nombre específico del alimento." },
            quantity: { type: Type.NUMBER, description: "Número de porciones (ej: 1, 0.5, 2)." }
        },
        required: ["meal", "foodCategory", "foodName", "quantity"]
    }
};

const generateSystemPrompt = (state: AppState): string => {
    const { profile, calculatedTargets, trainingIntensity } = state;
    return `Eres NutriTico Agent IA v2. Experto en nutrición deportiva y salud metabólica en el contexto de Costa Rica.
    
    ESTADO ACTUAL DEL ATLETA:
    - Nombre: ${profile.name}
    - Intensidad de hoy: ${trainingIntensity} (${trainingIntensity === 'high' ? 'Ciclado de carbohidratos activo' : 'Prioridad oxidación grasas'})
    - Estrategia: ${profile.strategy.join(' + ')}
    - Alergias/Condiciones: ${profile.medicalConditions.join(', ')}
    - Metas Macro: ${calculatedTargets.calories} kcal (P:${calculatedTargets.protein}g, C:${calculatedTargets.carbs}g, F:${calculatedTargets.fat}g).

    REGLAS DE ORO:
    1. Usa jerga nutricional tica pero profesional.
    2. Si el usuario pide sustituciones, valida que se ajusten a los macros objetivo.
    3. Si detectas riesgo metabólico, advierte educadamente.
    4. Siempre prioriza alimentos locales de temporada en CR.
    5. CRÍTICO (Estrategia KETO): Si la estrategia incluye "keto" y el usuario menciona Pinto, Plátano maduro o Pejibayes, ADVIERTE que romperá la cetosis por los carbohidratos netos y ofrece alternativas "Dirty Keto Ticas" (ej. Pinto de coliflor, chayote, aguacate).`;
};

export const consultNutriTico = async (state: AppState, actions: AppActions, userQuery: string): Promise<AIResponse> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: userQuery,
            config: {
                systemInstruction: generateSystemPrompt(state),
                tools: [{ googleSearch: {} }, { functionDeclarations: [updatePlanTool] }]
            }
        });

        let text = response.text || "";
        let actionTaken = undefined;

        if (response.functionCalls) {
            for (const fc of response.functionCalls) {
                if (fc.name === "updateUserPlan") {
                    const { meal, foodCategory, foodName, quantity } = fc.args as any;
                    actions.updatePlan(0, meal, foodCategory, foodName, quantity);
                    actionTaken = `Actualizado: ${meal}`;
                    text += `\n\n✅ He ajustado tu plan: ${quantity} porción(es) de ${foodName} en el ${meal}.`;
                }
            }
        }

        const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const sources = groundingChunks
            .filter(chunk => chunk.web)
            .map(chunk => ({
                title: chunk.web.title || "Referencia NutriTico",
                uri: chunk.web.uri || "#"
            }));

        return { text, sources, actionTaken };
    } catch (error: any) {
        console.error("Agent Error:", error);
        return {
            text: "Lo siento, hubo un error en la conexión con mi núcleo de IA. Por favor, verifica tu conexión o intenta más tarde.",
            sources: []
        };
    }
};

export const analyzeLabels = async (images: string[], prompt: string): Promise<string> => {
    try {
        const parts = images.map(data => ({
            inlineData: { mimeType: 'image/jpeg', data }
        }));
        parts.push({ text: prompt } as any);

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts },
            config: {
                systemInstruction: "Actúa como un Auditor de Calidad Alimentaria. Analiza fotos de etiquetas nutricionales e ingredientes. Busca ingredientes inflamatorios, excesos de sodio y azúcares ocultos. Compara objetivamente si hay varios productos."
            }
        });
        return response.text || "No se pudo procesar la imagen.";
    } catch (e) {
        return "Error al analizar la imagen. Intenta con una foto más clara.";
    }
};

export const extractFoodData = async (images: string[]): Promise<Partial<FoodItem> | null> => {
    try {
        const parts = images.map(data => ({
            inlineData: { mimeType: 'image/jpeg', data }
        }));
        parts.push({ text: "Analiza la tabla nutricional de este producto y extrae los datos exactos por porción." } as any);

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
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

        const data = JSON.parse(response.text || "{}");
        return {
            id: `custom_${Date.now()}`,
            name: data.name,
            portion: data.portion,
            calories: data.calories,
            baseAmount: data.baseAmount,
            unit: data.unit,
            macros: { p: data.p, c: data.c, f: data.f, fiber: data.fiber },
            isCustom: true
        };
    } catch (e) {
        console.error("Data Extraction failed", e);
        return null;
    }
};
