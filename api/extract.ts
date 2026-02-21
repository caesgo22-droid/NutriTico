import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

const genAI = new GoogleGenAI({ apiKey: process.env.VITE_API_KEY || "" });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { images, stateString } = req.body;
        const state = JSON.parse(stateString || "{}");
        const profileInfo = state.profile ? `Considerar contexto: Atleta ${state.profile.name}, Estrategia ${state.profile.strategy?.join(' + ')}` : "";

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
            }
        });

        const parts = images.map((data: string) => ({
            inlineData: { mimeType: 'image/jpeg', data }
        }));
        parts.push({ text: `Analiza la tabla nutricional de este producto y extrae los datos exactos por porción en JSON. Si detectas ingredientes incompatibles con la dieta del usuario, puedes omitirlo o ajustarlo. ${profileInfo}` });

        const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
        const text = result.response.text();

        return res.status(200).json({ data: text });
    } catch (error: any) {
        console.error("Extract Error", error);
        return res.status(500).json({ error: 'Error extrayendo datos.' });
    }
}
