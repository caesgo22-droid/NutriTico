const { GoogleGenAI, SchemaType } = require("@google/generative-ai");

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

    try {
        const { images } = req.body;
        const genAI = new GoogleGenAI(apiKey);

        const schema = {
            type: SchemaType.OBJECT,
            properties: {
                fastingGlucose: { type: SchemaType.NUMBER, description: "Glucosa en ayunas (mg/dL)" },
                hba1c: { type: SchemaType.NUMBER, description: "Hemoglobina Glicosilada (%)" },
                triglycerides: { type: SchemaType.NUMBER, description: "Triglicéridos (mg/dL)" },
                hdl: { type: SchemaType.NUMBER, description: "Colesterol HDL (mg/dL)" },
                ldl: { type: SchemaType.NUMBER, description: "Colesterol LDL (mg/dL)" },
                tsh: { type: SchemaType.NUMBER, description: "Hormona Estimulante de la Tiroides TSH (mIU/L)" },
                uricAcid: { type: SchemaType.NUMBER, description: "Ácido Úrico (mg/dL)" },
                medicalObservations: { type: SchemaType.STRING, description: "Análisis médico breve de los rangos anormales detectados (Ej. Resistencia a la insulina sugerida por HOMA-IR o Triglicéridos/HDL)" }
            }
        };

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro", // Usar PRO para análisis médico complejo
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });

        const prompt = `Eres un Médico Internista y Endocrinólogo experto.
        Tu trabajo es analizar los resultados de exámenes de laboratorio de sangre adjuntos (fotos o capturas) e identificar los valores numéricos exactos de los biomarcadores clave.
        
        REGLAS ESTRICTAS:
        1. Devuelve SOLAMENTE el formato JSON especificado.
        2. Si un biomarcador no está presente en la imagen, devuelve null o simplemente omítelo, NO lo inventes.
        3. En 'medicalObservations', redacta un breve análisis clínico (máximo 3 oraciones) si detectas patrones de riesgo (ej. riesgo aterogénico por lípidos, sospecha de hipotiroidismo subclínico, o hiperinsulinemia). Si todo es normal, indícalo.`;

        const parts = [prompt];
        if (images && images.length > 0) {
            images.forEach(img => {
                const mimeType = img.mimeType || "image/jpeg";
                const base64Data = typeof img === 'string' ? img.replace(/^data:[a-z]+\/[a-z]+;base64,/, '') : img.data.replace(/^data:[a-z]+\/[a-z]+;base64,/, '');

                parts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                });
            });
        } else {
            return res.status(400).json({ error: 'No images provided for medical OCR.' });
        }

        const result = await model.generateContent(parts);
        const responseText = result.response.text();
        const jsonMatch = responseText.replace(/```json\n?|\n?```/g, '').trim();

        // Inject timestamp
        const labsData = JSON.parse(jsonMatch);
        labsData.lastUpdated = new Date().toISOString();

        res.status(200).json(labsData);

    } catch (error) {
        console.error('API Error (Clinical Labs):', error);
        res.status(500).json({ error: 'Error processing clinical labs image' });
    }
}
