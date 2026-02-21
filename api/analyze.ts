import { GoogleGenAI } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

const genAI = new GoogleGenAI({ apiKey: process.env.VITE_API_KEY || "" });

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const { images, prompt, stateString } = req.body;
        const state = JSON.parse(stateString || "{}");

        const profileInfo = state.profile
            ? `\nESTADO DEL ATLETA: ${state.profile.name}. Estrategia: ${state.profile.strategy?.join(' + ')}. Alergias: ${state.profile.medicalConditions?.join(', ')}.`
            : "";

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro"
        });

        const parts = images.map((data: string) => ({
            inlineData: { mimeType: 'image/jpeg', data }
        }));
        parts.push({ text: prompt });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts }],
            systemInstruction: `Actúa como un Auditor de Calidad Alimentaria y Científico de Datos. Analiza fotos de platos servidos (estimando los carbohidratos netos reales) o etiquetas nutricionales. Ojo Crítico con los ingredientes Ticos. ${profileInfo} SI ES KETO, sé extemadamente crítico con harinas nativas (pinto, plátano, etc).`
        });
        const text = result.response.text();

        return res.status(200).json({ result: text });
    } catch (error: any) {
        console.error("Analyze Error", error);
        return res.status(500).json({ error: 'Error analizando la imagen.' });
    }
}
