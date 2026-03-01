# NutriTico IA v3 - Blueprint & Master Prompt

Este documento resume la concepción, arquitectura y funciones de NutriTico IA, junto con las lecciones aprendidas de las versiones anteriores (problemas de alucinaciones y sincronización). Al final encontrarás un **Prompt Maestro** para iniciar una nueva sesión de desarrollo desde cero (borrón y cuenta nueva).

---

## 1. Visión y Concepto
**NutriTico IA** es una aplicación web progresiva (PWA) de nutrición clínica, actuando como un asistente nutricional hiper-personalizado. No es un simple contador de calorías; es un "Cerebro Médico" basado en evidencia (OMS, GABSA Costa Rica, ADA) que adapta planes de alimentación considerando patologías (Diabetes, Hipertensión), estrategias clínicas (Keto, Ayuno Intermitente) y los alimentos reales que el usuario tiene en su despensa mediante visión artificial.

## 2. Arquitectura Base (Stack Tecnológico)
Para la nueva versión, la arquitectura debe ser inmaculada:
*   **Frontend Core:** React + TypeScript + Vite.
*   **Estilos:** Tailwind CSS (Diseño Premium, Glassmorphism, animaciones fluidas, 100% responsivo).
*   **Estado Global:** React Context (`GlobalState`) actuando como el "Aro de Información". Debe ser la única fuente de verdad (Single Source of Truth) y persistir en `localStorage` y Firebase.
*   **Backend (Serverless):** Funciones Serverless de Vercel (`/api`) en Node.js para ocultar y proteger las API Keys de Gemini.
*   **IA Engine:** Gemini 1.5 Flash/Pro via el SDK oficial de Google Gen AI (`@google/genai`).
*   **Autenticación y Base de Datos:** Firebase Auth y Firestore.

## 3. Capacidades Core (Módulos de la App)
1.  **Onboarding Clínico:** Recolección de datos biométricos (peso, altura, edad, género, nivel de actividad), objetivos (perder, mantener, ganar) y perfil clínico (patologías como Diabetes, Hipertensión; estrategias como Keto, Ayuno).
2.  **Motor Metabólico:** Cálculo de TDEE (Harris-Benedict) y asignación automática de macros con consideraciones clínicas estrictas (ej. Keto = 5% Carbs, 20% Proteína, 75% Grasa).
3.  **Chat Consultorio (IA Nutricionista):** Interfaz principal donde el usuario habla con la IA. La IA tiene acceso constante al `GlobalState` del usuario.
4.  **Sistema de Visión (Escáner/Despensa):** Capacidad de subir imágenes (etiquetas nutricionales o platos de comida) para que la IA los clasifique (Proteína, Carbos, Grasas, Vegetales, Ultraprocesados) y los agregue a la "Despensa Inteligente".
5.  **Directorio de Alimentos y Equivalencias:** Módulo para consultar alimentos por categoría con su información nutricional y, lo más importante, su **sistema de equivalencias** (ej. 1 porción de carbohidrato = 1 rebanada de pan = 1/2 taza de arroz). La IA debe usar estas equivalencias para ajustar el plan.
6.  **Plan Semanal Interactivo:** Una grilla visual (Días vs. Tiempos de Comida) que muestra el plan de alimentación. La IA debe poder modificar este plan de forma programática usando el sistema de porciones/equivalencias.
7.  **Protocolos Clínicos (Keto/Ayuno):** Lógica que bloquea o sugiere alimentos según la estrategia activa:
    *   **Keto:** Alerta ante carbohidratos netos altos y prioriza grasas/proteínas.
    *   **Ayuno Intermitente:** Define ventanas de alimentación (ej. 16:8) y sincroniza las sugerencias de la IA con el horario permitido para comer.

## 4. Lecciones Aprendidas (El Problema de las Alucinaciones)
En la versión anterior, la IA generaba acciones a través de texto puro usando etiquetas como `[PLAN_UPDATE: ...]`. Esto causaba:
*   **Alucinaciones:** JSON mal formado, campos faltantes, o respuestas donde la IA se salía del formato.
*   **Desincronización:** La IA no siempre sabía si el alimento ya estaba en la despensa o no entendía la estructura exacta del plan.
*   **Gestión de Equivalencias:** A veces la IA sugería cantidades absurdas por no entender el concepto de "porción" clínica vs "gramos".
*   **Solución para v3:** **OBLIGATORIO usar Structured Outputs (Google Gen AI `responseSchema`) o Function Calling**. La API de Gemini debe forzarse a devolver siempre un objeto JSON estrictamente tipado que use el sistema de equivalencias de la app.

---

## 5. PROMPT MAESTRO DE INICIALIZACIÓN
*Copia el siguiente texto y pégalo en una nueva conversación vacía con el asistente de IA para arrancar el proyecto de cero.*

***

**[COPIAR DESDE AQUÍ]**

Eres un Asistente de IA Experto en Arquitectura de Software y Nutrición. Vamos a construir desde cero la versión definitiva de **NutriTico IA (v3)**, una app web de nutrición clínica impulsada por Gemini. 

El stack estricto a usar es: React, TypeScript, Vite, Tailwind CSS, Firebase (Auth + Firestore) y Vercel Serverless Functions.

El mayor problema de la versión anterior fueron las **alucinaciones de la IA** al intentar modificar el plan nutricional mediante parseo de texto con expresiones regulares que a menudo causaba bloqueos y problemas de estado. 
Para esta nueva versión v3, **la regla de oro es**: Cualquier endpoint de IA que deba modificar el plan o devolver datos estructurados DEBE utilizar **Structured Outputs (`responseSchema` en la configuración de la API de Gemini `@google/genai`)**. Está prohibido usar Regex para parsear acciones de la IA.

**Estructura del Proyecto a crear:**
1.  **Motor Metabólico y Estado Global (`context/GlobalState.tsx`):** Definiciones estrictas de TypeScript (`types.ts`) para todas las entidades (Perfil, Plan, Despensa, Alimentos). El cálculo de macros debe considerar patologías (Diabetes, Hipertensión) y estrategias (Keto, Ayuno Intermitente) automáticamente. Todo el estado debe persistir localmente y en Firestore.
2.  **Módulo de Equivalencias y Directorio:** Base de datos/JSON local con alimentos y su valor en "porciones equivalentes" (Carbohidratos, Proteínas, Grasas, Frutas, Lácteos, Vegetales).
3.  **Vercel Serverless API (`api/chat.js`):** Endpoints seguros que instancian Gemini. El `systemInstruction` debe obligar a la IA a usar el sistema de **Porciones Equivalentes** para cualquier sugerencia o actualización de plan.
4.  **UI/UX Premium:** Usa Tailwind para crear un diseño tipo "Glassmorphism" moderno y premium. Pantallas: `Onboarding`, `Dashboard (Chat)`, `Pantry (Scanner)`, `Plan Semana`, `Directorio de Alimentos`.

**Tu primera tarea:**
1. Genera el contenido completo del archivo `types.ts` con interfaces muy detalladas que abarquen el Perfil Clínico, el Plan Semanal, la Despensa y el **Esquema de Equivalencias Nutricionales**.
2. Crea el esqueleto base de `src/context/GlobalState.tsx` que implemente estos tipos, maneje el cálculo de Harris-Benedict con modificadores Keto/IF/Clínicos, y proporcione métodos `dispatch` claros para actualizar el plan desde respuestas JSON estructuradas.
3. Proporciona el código de una Vercel Function de ejemplo (`api/chat.js`) utilizando la sintaxis de `@google/genai` con un `responseSchema` estricto que devuelva un arreglo de acciones para el plan (ej. `[{day: 0, meal: 'Cena', foodId: 'pollo', portions: 2}]`).

No escribas componentes visuales aún. Enfócate 100% en blindar la arquitectura de datos, el tipado y el backend de IA para asegurar que no haya alucinaciones en esta nueva etapa.

**[HASTA AQUÍ]**
