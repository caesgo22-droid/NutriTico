import { GoogleGenAI, Type } from "@google/genai";

// Initialize the API client strictly from import.meta.env in Vite
const apiKey = import.meta.env.VITE_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getNutritionAdvice = async (userGoal: string, currentMeal: string) => {
  try {
    // Use gemini-3-flash-preview for basic text advice tasks
    const model = 'gemini-3-flash-preview';

    const response = await ai.models.generateContent({
      model: model,
      contents: `Soy un usuario en Costa Rica. Mi objetivo es ${userGoal}. Estoy comiendo ${currentMeal}. ¿Es esto adecuado? Dame una respuesta breve de 2 lineas.`,
      config: {
        systemInstruction: "Eres NutriTico IA, un experto en nutrición deportiva y salud metabólica enfocado en comida costarricense.",
      }
    });

    // Directly access .text property from the response
    return response.text;
  } catch (error) {
    console.error("Error fetching Gemini advice:", error);
    return "No se pudo conectar con NutriTico IA en este momento.";
  }
};

export const analyzeFoodImage = async (base64Image: string) => {
  // This is a placeholder for image analysis using gemini-2.5-flash-image
  return {
    food: "Casado",
    calories: 650,
    macros: { p: 25, c: 60, f: 20 }
  };
}