"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractFoodData = exports.analyzeLabels = exports.consultNutriTico = void 0;
const https_1 = require("firebase-functions/v2/https");
const genai_1 = require("@google/genai");
const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }); // Se tomará de Firebase Secrets o ENV del servidor
const aiCorePrompt = `Eres NutriTico Agent IA v2 (Backend Nivel 1). Experto en nutrición deportiva y salud metabólica en CR.
REGLAS DE ORO:
1. Usa jerga nutricional tica pero profesional.
2. Si el usuario pide sustituciones, valida que se ajusten a los macros objetivo.
3. Si detectas riesgo metabólico, advierte educadamente.
4. Siempre prioriza alimentos locales de temporada en CR.
5. CRÍTICO (Estrategia KETO): Si la estrategia incluye "keto" y el usuario menciona Pinto, Plátano maduro o Pejibayes, ADVIERTE que romperá la cetosis y ofrece alternativas "Dirty Keto Ticas".`;
exports.consultNutriTico = (0, https_1.onCall)({ cors: true }, async (request) => {
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
    }
    catch (error) {
        console.error("Consult Error", error);
        throw new https_1.HttpsError('internal', 'Error al consultar NutriTico IA.');
    }
});
exports.analyzeLabels = (0, https_1.onCall)({ cors: true }, async (request) => {
    var _a, _b;
    try {
        const { images, prompt, stateString } = request.data;
        const state = JSON.parse(stateString || "{}");
        const profileInfo = state.profile ? `\nESTADO DEL ATLETA: ${state.profile.name}. Estrategia: ${(_a = state.profile.strategy) === null || _a === void 0 ? void 0 : _a.join(' + ')}. Alergias: ${(_b = state.profile.medicalConditions) === null || _b === void 0 ? void 0 : _b.join(', ')}.` : "";
        const parts = images.map((data) => ({
            inlineData: { mimeType: 'image/jpeg', data }
        }));
        parts.push({ text: prompt });
        const response = await ai.models.generateContent({
            // gemini-1.5-pro es experto en OCR visual de tablas nutricionales
            model: 'gemini-1.5-pro',
            contents: { parts },
            config: {
                systemInstruction: `Actúa como un Auditor de Calidad Alimentaria y Científico de Datos. Analiza fotos de platos servidos (estimando los carbohidratos netos reales) o etiquetas nutricionales. Ojo Crítico con los ingredientes Ticos. ${profileInfo} SI ES KETO, sé extemadamente crítico con harinas nativas (pinto, plátano, etc).`
            }
        });
        return { result: response.text || "No se pudo procesar la imagen." };
    }
    catch (e) {
        throw new https_1.HttpsError('invalid-argument', 'Error analizando la imagen.');
    }
});
exports.extractFoodData = (0, https_1.onCall)({ cors: true }, async (request) => {
    var _a;
    try {
        const { images, stateString } = request.data;
        const state = JSON.parse(stateString || "{}");
        const profileInfo = state.profile ? `Considerar contexto: Atleta ${state.profile.name}, Estrategia ${(_a = state.profile.strategy) === null || _a === void 0 ? void 0 : _a.join(' + ')}` : "";
        const parts = images.map((data) => ({
            inlineData: { mimeType: 'image/jpeg', data }
        }));
        parts.push({ text: `Analiza la tabla nutricional de este producto y extrae los datos exactos por porción. Si detectas ingredientes incompatibles con la dieta del usuario, puedes omitirlo o ajustarlo. ${profileInfo}` });
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash', // flash es ideal para extracción JSON rápida
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: genai_1.Type.OBJECT,
                    properties: {
                        name: { type: genai_1.Type.STRING },
                        portion: { type: genai_1.Type.STRING },
                        calories: { type: genai_1.Type.NUMBER },
                        baseAmount: { type: genai_1.Type.NUMBER },
                        unit: { type: genai_1.Type.STRING },
                        p: { type: genai_1.Type.NUMBER },
                        c: { type: genai_1.Type.NUMBER },
                        f: { type: genai_1.Type.NUMBER },
                        fiber: { type: genai_1.Type.NUMBER }
                    },
                    required: ["name", "portion", "calories", "baseAmount", "unit", "p", "c", "f", "fiber"]
                }
            }
        });
        return { data: response.text || "{}" };
    }
    catch (e) {
        throw new https_1.HttpsError('invalid-argument', 'Error extrayendo datos.');
    }
});
//# sourceMappingURL=index.js.map