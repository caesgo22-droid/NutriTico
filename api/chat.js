const { GoogleGenAI, SchemaType } = require("@google/generative-ai");

/**
 * v3 Chat API - Strict Structured Output
 * Forces Gemini to return EXACT JSON for plan updates
 */
module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

    try {
        const { userQuery, stateString } = req.body;
        const genAI = new GoogleGenAI(apiKey);

        // Define strict response schema to eliminate hallucinations
        const schema = {
            description: "Nutritional plan update actions",
            type: SchemaType.OBJECT,
            properties: {
                actions: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            dayIndex: { type: SchemaType.NUMBER, description: "0-6 for Sun-Sat" },
                            meal: { type: SchemaType.STRING, enum: ["Desayuno", "Almuerzo", "Merienda", "Cena"] },
                            foodId: { type: SchemaType.STRING },
                            portions: { type: SchemaType.NUMBER },
                            operation: { type: SchemaType.STRING, enum: ["add", "remove", "set"] }
                        },
                        required: ["dayIndex", "meal", "foodId", "portions", "operation"]
                    }
                },
                clinicalJustification: { type: SchemaType.STRING },
                responseText: { type: SchemaType.STRING, description: "Natural language response to user" }
            },
            required: ["actions", "clinicalJustification", "responseText"]
        };

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.2, // Balanced precision and conversational flow
            },
            systemInstruction: `Eres NutriTico IA v3, un Nutricionista Clínico experto de élite. 
            
            OPERACIÓN DE ALTO NIVEL (PAID TIER 1 - SPARK):
            1. RAZONAMIENTO CLÍNICO: Tienes una ventana de contexto amplia. Analiza no solo el mensaje actual, sino cómo los cambios afectan los Macros semanales totales.
            2. INTERCAMBIOS GABSA: Eres inflexible con las porciones equivalentes. Si el usuario pide un cambio, calcula exactamente cuántas porciones de qué grupo se están moviendo.
            3. OMNISCIENCIA DE DESPENSA: Tienes acceso total al inventario de alimentos escaneados. Prioriza siempre sugerir lo que el usuario YA TIENE.
            4. MEMORIA DE CONTEXTO: Utiliza los mensajes previos para entender preferencias y aversiones.

            Contexto del Usuario (Estado, Targets, Plan, Despensa, Historial): ${stateString}`
        });

        const result = await model.generateContent(userQuery);
        const responseText = result.response.text();

        return res.status(200).json(JSON.parse(responseText));
    } catch (error) {
        console.error('v3 Chat Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
