import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// CRITICAL: Use GEMINI_API_KEY (no VITE_ prefix) for serverless functions
// VITE_ prefixed vars are only available in the browser bundle, NOT in Node.js serverless
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_API_KEY || "" });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { images, prompt, stateString } = req.body;

        if (!images || images.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron imágenes.' });
        }

        const state = JSON.parse(stateString || "{}");
        const profile = state.profile;
        const profileInfo = profile
            ? `\nCONTEXTO DEL ATLETA: ${profile.name}. Estrategia: ${(profile.strategy || []).join(' + ')}. Condiciones: ${(profile.medicalConditions || []).join(', ')}.`
            : "";

        // v1.42 correct format: contents must be array with role
        const parts: any[] = images.map((data: string) => ({
            inlineData: { mimeType: 'image/jpeg', data }
        }));
        parts.push({ text: prompt || "Analiza esta etiqueta nutricional." });

        const response = await genAI.models.generateContent({
            model: 'gemini-1.5-pro',
            contents: [{ role: 'user', parts }],
            config: {
                systemInstruction: `Eres un Auditor de Calidad Alimentaria experto en productos centroamericanos. 
                Analiza etiquetas nutricionales o fotos de platos servidos. 
                IGNORA publicidad, slogans y recetas en el envase; enfócate SOLO en Información Nutricional e Ingredientes.
                Sé crítico con ingredientes locales.${profileInfo}
                Si la dieta es KETO, advierte severamente sobre harinas refinadas.`
            }
        });

        const text = response.text || "No se pudo obtener respuesta.";
        return res.status(200).json({ result: text });

    } catch (error: any) {
        console.error("Analyze Error:", error?.message || error);
        return res.status(500).json({ error: `Error analizando la imagen: ${error?.message || 'Error desconocido'}` });
    }
}
