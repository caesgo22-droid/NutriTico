const { GoogleGenAI, SchemaType } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

    try {
        const { images, prompt, stateString } = req.body;
        const genAI = new GoogleGenAI(apiKey);

        const schema = {
            description: "Clasificación de un alimento o ingrediente para la Despensa",
            type: SchemaType.OBJECT,
            properties: {
                id: { type: SchemaType.STRING, description: "Un identificador único corto generado como v_algo" },
                name: { type: SchemaType.STRING },
                group: {
                    type: SchemaType.STRING,
                    enum: ['Proteína', 'Carbohidratos', 'Grasas', 'Vegetales', 'Frutas', 'Lácteos', 'Ultraprocesados', 'Otros']
                },
                calories: { type: SchemaType.NUMBER },
                macros: {
                    type: SchemaType.OBJECT,
                    properties: { p: { type: SchemaType.NUMBER }, c: { type: SchemaType.NUMBER }, f: { type: SchemaType.NUMBER } }
                },
                equivalentPortion: { type: SchemaType.STRING, description: "Ej. '100g' o '1 Taza'" },
                clinicalAdvice: { type: SchemaType.STRING, description: "Aviso clínico breve si no cumple con la estrategia del usuario" }
            },
            required: ["id", "name", "group", "calories", "macros", "equivalentPortion"]
        };

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash", // Option: Upgrade to 'gemini-1.5-pro' if latency is not an issue for Paid Tier
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.1, // High precision
            },
            systemInstruction: `Eres el Auditor de Visión de NutriTico IA v3. 
            
            ESTÁNDARES DE CALIDAD (PAID TIER 1):
            1. OCR EXTREMO: Si hay una etiqueta nutricional, extrae los datos exactos por 100g o por porción indicada. 
            2. CLASIFICACIÓN GABSA: Clasifica el alimento estrictamente en los grupos de intercambio de Costa Rica (GABSA).
            3. REGLA DE SEGURIDAD: Si el alimento es ultraprocesado o tiene ingredientes conflictivos (ej: exceso de sodio en hipertensos), dilo en 'clinicalAdvice'.
            4. MULTI-DETECCIÓN: Si ves múltiples ingredientes, elige el más prominente o el que el usuario señale si hay texto en el prompt.

            Contexto del usuario (Biometría y Metas): ${stateString}`
        });

        const contents = [
            {
                role: 'user',
                parts: [
                    ...images.map(data => ({ inlineData: { mimeType: 'image/jpeg', data } })),
                    { text: prompt || 'Analiza este alimento.' }
                ]
            }
        ];

        const result = await model.generateContent({ contents });
        return res.status(200).json(JSON.parse(result.response.text()));
    } catch (error) {
        console.error('Vision API Error:', error);
        return res.status(500).json({ error: error.message });
    }
};
