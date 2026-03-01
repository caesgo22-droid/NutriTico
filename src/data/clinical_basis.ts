/**
 * NutriTico v3 - Clinical Single Source of Truth
 * This file contains the foundations, methodologies, and clinical sources
 * used by the AI and the application logic.
 */

export const CLINICAL_BASIS = {
    version: "3.0.0",
    lastUpdate: "2026-03-01",
    foundations: [
        {
            name: "GABSA (Guía Alimentaria para Costa Rica)",
            description: "Sistema de intercambio de alimentos y porciones equivalentes adaptado al contexto local.",
            application: "Clasificación de alimentos en el Escáner y Directorio."
        },
        {
            name: "ADA (American Diabetes Association)",
            description: "Estándares de atención médica en diabetes para el manejo de carbohidratos netos y carga glucémica.",
            application: "Ajuste de macros para usuarios con Diabetes o Síndrome Metabólico."
        },
        {
            name: "Organización Mundial de la Salud (OMS)",
            description: "Recomendaciones globales sobre ingesta de sodio, azúcares libres y grasas saturadas.",
            application: "Protocolos DASH y prevención de hipertensión."
        }
    ],
    methodologies: [
        {
            name: "Harris-Benedict (Revisada)",
            description: "Ecuación para calcular la Tasa Metabólica Basal (TMB) basada en peso, talla, edad y sexo.",
            application: "Cálculo base de calorías en el perfil de usuario."
        },
        {
            name: "Protocolos de Ayuno Intermitente (IF)",
            description: "Basado en la optimización de la sensibilidad a la insulina y autofagia celular (16:8, 14:10).",
            application: "Widget de seguimiento de ayuno en el Dashboard."
        },
        {
            name: "Cetosis Nutricional (Keto)",
            description: "Reducción estratégica de carbohidratos (<50g/día) para inducir el uso de cuerpos cetónicos.",
            application: "Inhibición de alucinaciones de la IA al sugerir alimentos altos en carbos en modo Keto."
        }
    ],
    aiLogic: {
        title: "Arquitectura Antigravitatoria (v3)",
        principles: [
            "Salidas Estructuradas (JSON): La IA no genera texto libre para planes, sino datos puros que validan contra interfaces de TypeScript.",
            "Validación Cruzada: Cada sugerencia de la IA se coteja contra la base de datos de equivalentes clínica antes de renderizarse.",
            "Análisis de Visión Estricto: El escáner usa modelos de visión 1.5 Pro/Flash para identificar densidades calóricas reales, no estimaciones basadas en promedio."
        ]
    },
    disclaimer: "NutriTico IA v3 es una herramienta de apoyo nutricional basada en modelos computacionales y guías clínicas internacionales. No sustituye la consulta médica presencial. En caso de patologías severas, consulte siempre a un profesional de salud certificado."
};
