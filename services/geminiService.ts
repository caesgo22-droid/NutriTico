import { functions } from './firebaseConfig';
import { httpsCallable } from 'firebase/functions';

export const getNutritionAdvice = async (prompt: string): Promise<string> => {
  try {
    const consultFn = httpsCallable(functions, 'consultNutriTico');
    // Para reutilizar el endpoint pasamos un state string vacio (no afectará el query directo)
    const result = await consultFn({ userQuery: prompt, stateString: "{}" });
    const data = result.data as { text: string };
    return data.text || "Hubo un error de conexión con NutriTico IA.";
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