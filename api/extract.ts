import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

// CRITICAL: Use GEMINI_API_KEY (no VITE_ prefix) for serverless functions
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.VITE_API_KEY || "" });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { images, stateString } = req.body;

        if (!images || images.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron imágenes.' });
        }

        const state = JSON.parse(stateString || "{}");
        const profile = state.profile;
        const profileInfo = profile
            ? `Atleta ${profile.name}, Estrategia ${(profile.strategy || []).join(' + ')}`
            : "";

        // v1.42 correct format: contents must be array with role
        const parts: any[] = images.map((data: string) => ({
            inlineData: { mimeType: 'image/jpeg', data }
        }));
        parts.push({ text: `Extrae SOLO los datos de la tabla nutricional en formato JSON. ${profileInfo}` });

        const response = await genAI.models.generateContent({
            model: 'gemini-1.5-pro',
            contents: [{ role: 'user', parts }],
            config: {
                responseMimeType: "application/json",
                systemInstruction: `Extrae datos nutricionales de la TABLA NUTRICIONAL de la imagen. 
                IGNORA slogans, recetas y publicidad. Localiza SOLO la tabla de información nutricional.
                Devuelve EXACTAMENTE este JSON (valores numéricos sin unidades):
                {
                  "name": "Nombre del producto",
                  "portion": "descripción de porción (ej: 1 pieza, 30g)",
                  "calories": 0,
                  "baseAmount": 0,
                  "unit": "g",
                  "p": 0,
                  "c": 0,
                  "f": 0,
                  "fiber": 0
                }`
            }
        });

        const text = response.text || "{}";
        return res.status(200).json({ data: text });

    } catch (error: any) {
        console.error("Extract Error:", error?.message || error);
        return res.status(500).json({ error: `Error extrayendo datos: ${error?.message || 'Error desconocido'}` });
    }
}
