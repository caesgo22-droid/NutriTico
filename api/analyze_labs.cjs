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
Analiza los exámenes de laboratorio de sangre adjuntos e identifica los valores numéricos exactos de los biomarcadores.

REGLAS ESTRICTAS:
1. Devuelve SOLAMENTE un objeto JSON puro, sin bloques markdown, sin texto adicional.
2. Las claves son: fastingGlucose (mg/dL), hba1c (%), triglycerides (mg/dL), hdl (mg/dL), ldl (mg/dL), tsh (mIU/L), uricAcid (mg/dL), medicalObservations (string).
3. Los valores son NÚMEROS (no strings). Si no encuentras el valor, omite esa clave o usa null.
4. En medicalObservations escribe un análisis clínico breve (max 3 oraciones).
5. NO inventes valores. Si el documento no es legible, devuelve: {"medicalObservations": "No se pudo leer el documento claramente."}

Ejemplo: {"fastingGlucose": 95, "triglycerides": 140, "hdl": 55, "ldl": 110, "medicalObservations": "Valores dentro del rango normal."}`;

        const contentParts = [{ text: prompt }];

        for (const img of images) {
            const mimeType = img.mimeType || 'image/jpeg';
            const base64Data = img.data;

            if (mimeType === 'application/pdf') {
                // Use File API for PDFs
                const tmpFile = path.join(os.tmpdir(), `lab_${Date.now()}.pdf`);
                try {
                    fs.writeFileSync(tmpFile, Buffer.from(base64Data, 'base64'));

                    // Try File API upload
                    let fileUri = null;
                    try {
                        const { createPartFromUri } = require('@google/genai');
                        const uploaded = await ai.files.upload({
                            file: tmpFile,
                            config: { mimeType: 'application/pdf' }
                        });
                        fileUri = uploaded?.uri || uploaded?.file?.uri || null;
                    } catch (uploadErr) {
                        console.warn('File API upload failed, using inlineData fallback:', uploadErr.message);
                    }

                    if (fileUri) {
                        contentParts.push({ fileData: { fileUri, mimeType: 'application/pdf' } });
                    } else {
                        // Fallback: inline base64 (works for small PDFs)
                        contentParts.push({ inlineData: { data: base64Data, mimeType: 'application/pdf' } });
                    }
                } finally {
                    try { fs.unlinkSync(tmpFile); } catch (_) { }
                }
            } else {
                contentParts.push({ inlineData: { data: base64Data, mimeType } });
            }
        }

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-pro',
            contents: [{ role: 'user', parts: contentParts }]
        });

        let text = typeof response.text === 'function' ? response.text() : response.text;
        if (!text) text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const labsData = JSON.parse(text);
        labsData.lastUpdated = new Date().toISOString();

        res.status(200).json(labsData);

    } catch (error) {
        console.error('API Error (Clinical Labs):', error?.message || error);
        res.status(500).json({ error: error?.message || 'Error processing clinical labs document' });
    }
};
