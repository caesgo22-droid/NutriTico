import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import os from 'os';

export default async function handler(req, res) {
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
Tu trabajo es analizar los resultados de exámenes de laboratorio de sangre adjuntos e identificar los valores numéricos exactos de los biomarcadores clave.

REGLAS ESTRICTAS:
1. Devuelve SOLAMENTE un objeto JSON puro, sin bloques markdown, sin prefijos.
2. Las claves del JSON deben ser: fastingGlucose, hba1c, triglycerides, hdl, ldl, tsh, uricAcid, medicalObservations.
3. Los valores numéricos deben ser números (no strings). Si no encuentras el valor, omite esa clave.
4. En medicalObservations: escribe un breve análisis clínico (max 3 oraciones) si detectas patrones de riesgo. Si todo es normal, indícalo.
5. NO inventes valores que no puedas leer claramente.

Ejemplo de respuesta esperada:
{"fastingGlucose": 95, "hba1c": 5.2, "triglycerides": 140, "hdl": 55, "ldl": 110, "medicalObservations": "Los valores están dentro del rango normal."}`;

        const contentParts = [{ text: prompt }];

        for (const img of images) {
            const mimeType = img.mimeType || 'image/jpeg';
            const base64Data = img.data;

            if (mimeType === 'application/pdf') {
                // Upload via File API for PDFs
                const tmpFile = path.join(os.tmpdir(), `lab_${Date.now()}.pdf`);
                fs.writeFileSync(tmpFile, Buffer.from(base64Data, 'base64'));

                try {
                    const { createPartFromUri } = await import('@google/genai');
                    const uploadedFile = await ai.files.upload({
                        file: {
                            name: path.basename(tmpFile),
                            mimeType: 'application/pdf',
                            size: fs.statSync(tmpFile).size
                        },
                        media: {
                            mimeType: 'application/pdf',
                            body: fs.createReadStream(tmpFile)
                        }
                    });
                    contentParts.push({
                        fileData: {
                            fileUri: uploadedFile.uri || uploadedFile.file?.uri,
                            mimeType: 'application/pdf'
                        }
                    });
                } catch (uploadErr) {
                    console.error('File upload failed, falling back to inlineData:', uploadErr.message);
                    // Fallback: try inline anyway
                    contentParts.push({ inlineData: { data: base64Data, mimeType: 'application/pdf' } });
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
        if (!text) {
            // fallback candidate extraction
            text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
        }
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const labsData = JSON.parse(text);
        labsData.lastUpdated = new Date().toISOString();

        res.status(200).json(labsData);

    } catch (error) {
        console.error('API Error (Clinical Labs):', error?.message || error);
        res.status(500).json({ error: error?.message || 'Error processing clinical labs document' });
    }
}
