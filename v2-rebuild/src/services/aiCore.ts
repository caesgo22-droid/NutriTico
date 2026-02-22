import { AppState, AIResponse, AppActions, FoodItem } from "../types";

const getAISummary = (state: AppState) => ({
    profile: state.profile,
    trainingIntensity: state.trainingIntensity,
    calculatedTargets: state.calculatedTargets,
    weeklyPlan: state.weeklyPlan,
    activeMeals: state.activeMeals
});

export const consultNutriTico = async (state: AppState, _actions: AppActions, userQuery: string): Promise<AIResponse> => {
    try {
        const response = await fetch('/api/consult', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userQuery, stateString: JSON.stringify(getAISummary(state)) })
        });
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();

        const text = data.result || "";
        const planCommands = [];
        const matches = text.match(/\[PLAN_UPDATE:([\s\S]*?)\]/g);
        if (matches) {
            matches.forEach((m: string) => {
                try {
                    const json = JSON.parse(m.replace('[PLAN_UPDATE:', '').replace(']', ''));
                    if (Array.isArray(json)) planCommands.push(...json);
                    else planCommands.push(json);
                } catch (e) { console.error("Plan command parse error", e); }
            });
        }

        const actionTakenMatch = text.match(/\[ACTION_TAKEN: (.*?)\]/);
        const actionTaken = actionTakenMatch ? actionTakenMatch[1] : undefined;

        return {
            text: text.replace(/\[(PLAN_UPDATE|ACTION_TAKEN):[\s\S]*?\]/gs, "").trim(),
            actionTaken,
            sources: [],
            planCommands
        };
    } catch (error) {
        console.error("Consult AI Error:", error);
        throw error;
    }
};

export const analyzeLabels = async (state: AppState, images: string[], prompt?: string): Promise<string> => {
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images, prompt, stateString: JSON.stringify(getAISummary(state)) })
        });
        if (!response.ok) throw new Error('Analyze failed');
        const data = await response.json();
        return data.result || "";
    } catch (error) {
        console.error("Analyze Error:", error);
        return "Error en la conexión con la IA.";
    }
};

export const extractFoodData = async (state: AppState, images: string[]): Promise<Partial<FoodItem> | null> => {
    try {
        const response = await fetch('/api/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ images, stateString: JSON.stringify(getAISummary(state)) })
        });
        if (!response.ok) throw new Error('Extraction failed');
        const data = await response.json();
        return data.result ? JSON.parse(data.result) : null;
    } catch (error) {
        console.error("Extraction Error:", error);
        return null;
    }
};
