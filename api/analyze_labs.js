const { GoogleGenAI } = require("@google/genai");
const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing API Key' });

    try {
        const { images } = req.body;
        if (!images || images.length === 0) {
            return res.status(400).json({ error: 'No images provided for medical OCR.' });
        }

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `Eres un Médico Internista y Endocrinólogo experto.
        Tu trabajo es analizar los resultados de exámenes de laboratorio de sangre adjuntos (fotos, capturas o documentos PDF) e identificar los valores numéricos exactos de los biomarcadores clave.
        
        REGLAS ESTRICTAS:
        1. Devuelve SOLAMENTE un objeto JSON puro, sin ningún bloque markdown, sin prefijos, solo el JSON.
        2. El JSON debe tener exactamente estas claves (si no encuentras el valor, omite la clave o usa null): fastingGlucose, hba1c, triglycerides, hdl, ldl, tsh, uricAcid, medicalObservations.
        3. Los valores numéricos deben ser números (no strings).
        4. En 'medicalObservations', redacta un breve análisis clínico (máximo 3 oraciones) si detectas patrones de riesgo. Si todo es normal, indícalo.
        5. NO inventes valores que no puedas leer claramente en el documento.`;

        const contentParts = [{ text: prompt }];

        // Process each file
        for (const img of images) {
            const mimeType = img.mimeType || 'image/jpeg';
            const base64Data = img.data;

            if (mimeType === 'application/pdf') {
                // For PDFs: use File API (upload as temp file first)
                const tmpDir = os.tmpdir();
                const tmpFile = path.join(tmpDir, `lab_${Date.now()}.pdf`);
                const buffer = Buffer.from(base64Data, 'base64');
                fs.writeFileSync(tmpFile, buffer);

                try {
                    const uploadResult = await ai.files.upload({
                        file: tmpFile,
                        config: { mimeType: 'application/pdf' }
                    });

                    contentParts.push({
                        fileData: {
                            fileUri: uploadResult.uri,
                            mimeType: 'application/pdf'
                        }
                    });
                } finally {
                    fs.unlinkSync(tmpFile);
                }
            } else {
                // For images: use inlineData directly
                contentParts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: mimeType
                    }
                });
            }
        }

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-pro',
            contents: [{ role: 'user', parts: contentParts }]
        });

        let text = response.text;
        if (typeof text === 'function') text = text();
        // Clean any markdown code fences if present
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const labsData = JSON.parse(text);
        labsData.lastUpdated = new Date().toISOString();

        res.status(200).json(labsData);

    } catch (error) {
        console.error('API Error (Clinical Labs):', error?.message || error);
        res.status(500).json({ error: error?.message || 'Error processing clinical labs document' });
    }
};
