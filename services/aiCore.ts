
import { AppState, AIResponse, AppActions, FoodItem } from "../types";
// No más dependencia de Firebase Functions aquí, usamos Fetch estándar para Vercel api/*

export const consultNutriTico = async (state: AppState, actions: AppActions, userQuery: string): Promise<AIResponse> => {
    try {
        const response = await fetch('/api/consult', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userQuery, stateString: JSON.stringify(state) })
        });

        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        const text = data.text || "";
        let actionTaken = undefined;
        let planCommands = undefined;

        // Extracción de Comandos de Plan [PLAN_UPDATE: [...]]
        // Blindaje nivel Satélite: toleramos ruidos de formato, markdown y variaciones de la IA.
        const planMatch = text.match(/\[PLAN_UPDATE:\s*([\s\S]*?)\]/);
        if (planMatch) {
            try {
                let jsonStr = planMatch[1].trim();

                // Limpieza profunda de ruido de la IA
                jsonStr = jsonStr
                    .replace(/```json/g, "")
                    .replace(/```/g, "")
                    .replace(/\n/g, " ")
                    .trim();

                // Intentar parsear el JSON extraído
                const parsed = JSON.parse(jsonStr);
                planCommands = Array.isArray(parsed) ? parsed : [parsed];

                if (planCommands.length > 0) {
                    actionTaken = `Plan Nutricional: ${planCommands.length} ajustes aplicados ✓`;
                }
            } catch (e) {
                console.error("Fallo crítico en el Parser del Satélite IA:", e);
                // Último intento: Buscar algo que parezca un array de objetos
                const arrayMatch = planMatch[1].match(/\[\s*\{[\s\S]*\}\s*\]/);
                if (arrayMatch) {
                    try {
                        planCommands = JSON.parse(arrayMatch[0]);
                        actionTaken = "Ajuste de plan recuperado mediante bypass";
                    } catch (e2) { }
                }
            }
        }

        return {
            text: text.replace(/\[PLAN_UPDATE:[\s\S]*?\]/gs, "").trim(),
            actionTaken,
            sources: [],
            planCommands
        };
    } catch (error: any) {
        console.error("Agent Cloud Error:", error);
        return {
            text: "Lo siento, hubo un error en la conexión con mi núcleo de IA en la nube. Por favor, verifica tu conexión e intenta más tarde.",
            sources: []
        };
    }
};

export const analyzeLabels = async (state: AppState, images: string[], prompt: string): Promise<string> => {
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images, prompt, stateString: JSON.stringify(state) })
        });

        if (!response.ok) throw new Error('Analyze failed');
        const data = await response.json();
        return data.result || "No se pudo procesar la imagen.";
    } catch (e) {
        console.error("Analyze Cloud Error:", e);
        return "Error al analizar la imagen desde la nube. Intenta con una foto más clara.";
    }
};

export const extractFoodData = async (state: AppState, images: string[]): Promise<Partial<FoodItem> | null> => {
    try {
        const response = await fetch('/api/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images, stateString: JSON.stringify(state) })
        });

        if (!response.ok) throw new Error('Extraction failed');
        const resultData = await response.json();
        const dataStr = resultData.data;

        const data = JSON.parse(dataStr || "{}");
        if (!data.name) return null;

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
        console.error("Data Extraction Cloud failed", e);
        return null;
    }
};
