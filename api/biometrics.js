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
                bodyFatPercentage: { type: SchemaType.NUMBER, description: "Porcentaje de Grasa Corporal. Ej 15.2" },
                muscleMassPercentage: { type: SchemaType.NUMBER, description: "Porcentaje de Masa Muscular." },
                waterPercentage: { type: SchemaType.NUMBER, description: "Porcentaje de Agua o Hidratación Corporal." },
                boneMass: { type: SchemaType.NUMBER, description: "Masa Ósea en KG." },
                visceralFat: { type: SchemaType.NUMBER, description: "Nivel de Grasa Visceral (entero o decimal)." },
                metabolicAge: { type: SchemaType.NUMBER, description: "Edad Metabólica." }
            }
        };

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });

        const prompt = `Eres un sistema OCR clínico especializado en biometría corporal.
        Tu trabajo es extraer los siguientes datos biométricos de la imagen adjunta, la cual pertenece a una aplicación de báscula inteligente (ej. Cubitt, Garmin, Renpho, Xiaomi).
        
        REGLAS ESTRICTAS:
        1. Devuelve SOLAMENTE el formato JSON especificado.
        2. Extrae SOLO los números de los porcentajes o niveles (sin el signo % o kg).
        3. Si un dato explícitamente no se encuentra en la pantalla, puedes omitirlo o enviar 0, pero haz tu mejor esfuerzo por inspeccionar toda la captura.`;

        const parts = [prompt];
        if (images && images.length > 0) {
            images.forEach(img => {
                const base64Data = img.includes('base64,') ? img.split('base64,')[1] : img;
                parts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: "image/jpeg"
                    }
                });
            });
        } else {
            return res.status(400).json({ error: 'No images provided for biometric OCR.' });
        }

        const result = await model.generateContent(parts);
        const responseText = result.response.text();
        // Fallback cleanup in case of markdown wrappers despite standard config
        const jsonMatch = responseText.replace(/```json\n?|\n?```/g, '').trim();

        res.status(200).json(JSON.parse(jsonMatch));

    } catch (error) {
        console.error('API Error (Biometrics):', error);
        res.status(500).json({ error: 'Error processing biometric image' });
    }
}
