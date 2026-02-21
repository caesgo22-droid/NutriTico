
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { AppState, AIResponse, AppActions, FoodItem } from "../types";
import { functions } from './firebaseConfig';
import { httpsCallable } from 'firebase/functions';

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
        const consultFn = httpsCallable(functions, 'consultNutriTico');
        const stateString = JSON.stringify(state);
        // The callable function expects { userQuery, stateString }
        const result = await consultFn({ userQuery, stateString });

        const data = result.data as { text: string };
        let text = data.text || "";
        let actionTaken = undefined;

        // Si tuvieramos function calling en backend, procesariamos la accion aqui.
        // Para no quebrar la app, si detecta la intencion, asumimos accion tomada:
        if (text.toLowerCase().includes("plan") && text.toLowerCase().includes("añadid")) {
            actionTaken = "Acción intentada por IA. (Se requiere implementar function calls estructuradas)";
        }

        return { text, actionTaken, sources: [] };
    } catch (error: any) {
        console.error("Agent Cloud Error:", error);
        return {
            text: "Lo siento, hubo un error en la conexión con mi núcleo de IA en la nube. Por favor, verifica tu conexión e intenta más tarde.",
            sources: []
        };
    }
};

export const analyzeLabels = async (images: string[], prompt: string): Promise<string> => {
    try {
        const analyzeFn = httpsCallable(functions, 'analyzeLabels');
        const result = await analyzeFn({ images, prompt });
        const data = result.data as { result: string };
        return data.result || "No se pudo procesar la imagen.";
    } catch (e) {
        console.error("Analyze Cloud Error:", e);
        return "Error al analizar la imagen desde la nube. Intenta con una foto más clara.";
    }
};

export const extractFoodData = async (images: string[]): Promise<Partial<FoodItem> | null> => {
    try {
        const extractFn = httpsCallable(functions, 'extractFoodData');
        const result = await extractFn({ images });
        const dataStr = (result.data as { data: string }).data;

        const data = JSON.parse(dataStr || "{}");
        if (!data.name) return null; // Simple validación

        return {
            id: `custom_\${Date.now()}`,
            name: data.name,
            portion: data.portion,
            calories: data.calories,
            baseAmount: data.baseAmount,
            unit: data.unit,
            macros: { p: data.p, c: data.c, f: data.f, fiber: data.fiber },
            isCustom: true
        };
    } catch (e) {
        console.error("Data Extraction Cloud failed", e);
        return null;
    }
};
