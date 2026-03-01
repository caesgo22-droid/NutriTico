/**
 * NutriTico v3 - Core Type Definitions
 * Focus: Clinical Precision and Structured AI Updates
 */

export type Gender = 'male' | 'female';
export type Goal = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 1.2 | 1.375 | 1.55 | 1.725 | 1.9;
export type Strategy = 'balanceado' | 'keto' | 'ciclado' | 'ayuno_intermitente';
export type ClinicalCondition = 'Hypertension' | 'Diabetes' | 'MetabolicSyndrome' | 'HighPerformance' | 'None';

export interface UserProfile {
    name: string;
    age: number;
    weight: number;
    height: number;
    gender: Gender;
    activityLevel: ActivityLevel;
    goal: Goal;
    strategies: Strategy[];
    conditions: ClinicalCondition[];
}

export type FoodGroup = 'Proteína' | 'Carbohidratos' | 'Grasas' | 'Vegetales' | 'Frutas' | 'Lácteos' | 'Ultraprocesados' | 'Otros';

export interface FoodEquivalent {
    id: string;
    name: string;
    group: FoodGroup;
    calories: number;
    macros: {
        p: number; // protein
        c: number; // carbs
        f: number; // fat
    };
    equivalentPortion: string; // e.g. "1 rebanada", "1/2 taza"
}

export type MealType = 'Desayuno' | 'Almuerzo' | 'Merienda' | 'Cena';

export interface PlanEntry {
    foodId: string;
    portions: number;
}

export type DayPlan = {
    [key in MealType]?: PlanEntry[];
} & { [key: string]: PlanEntry[] | undefined };

export type WeeklyPlan = {
    [dayIndex: number]: DayPlan;
};

/**
 * AI Structured Output Schema
 * Used to update the plan without regex hallucinations
 */
export interface AIPlanUpdate {
    actions: {
        dayIndex: number;
        meal: MealType;
        foodId: string;
        portions: number;
        operation: 'add' | 'remove' | 'set';
    }[];
    clinicalJustification: string;
}

export interface AppState {
    profile: UserProfile;
    weeklyPlan: WeeklyPlan;
    pantry: FoodEquivalent[];
    calculatedTargets: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    isLoading: boolean;
    error: string | null;
}
