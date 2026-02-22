export interface UserProfile {
    name: string;
    age: number;
    weight: number;
    height: number;
    gender: 'male' | 'female';
    activityLevel: 1.2 | 1.375 | 1.55 | 1.725 | 1.9;
    goal: 'lose' | 'maintain' | 'gain';
    strategy: string[];
    medicalConditions: string[];
}

export interface FoodItem {
    id: string;
    name: string;
    calories: number;
    macros: {
        p: number;
        c: number;
        f: number;
        fiber: number;
    };
    portion: string;
    baseAmount: number;
    unit: string;
    isCustom?: boolean;
}

export type MealType = 'Desayuno' | 'Almuerzo' | 'Merienda' | 'Cena';

export interface DayPlan {
    [meal: string]: {
        [group: string]: {
            [itemId: string]: number; // qty en porciones
        };
    };
}

export interface WeeklyPlan {
    [dayIndex: number]: DayPlan;
}

export interface AIPlanCommand {
    dayIndex: number;
    meal: MealType;
    group: string;
    itemId: string;
    qty: number;
}

export interface AIResponse {
    text: string;
    planCommands?: AIPlanCommand[];
    actionTaken?: string;
    sources: { title: string; uri: string }[];
}

export interface ConsumedItem {
    timestamp: number;
    factor: number;
    consumed: boolean;
}

export interface AppState {
    user: {
        uid: string | null;
        email: string | null;
        lastSync: number | null;
    };
    profile: UserProfile;
    isOnboardingComplete: boolean;
    weeklyPlan: WeeklyPlan;
    consumedItems: Record<string, ConsumedItem>; // key: "day-meal-group-id"
    customFoods: FoodItem[];
    trainingIntensity: 'rest' | 'moderate' | 'high';
    calculatedTargets: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    activeMeals: MealType[];
    mealTimes: Record<string, string>;
}

export interface AppActions {
    setProfile: (p: UserProfile) => void;
    setWeeklyPlan: (w: WeeklyPlan) => void;
    setTrainingIntensity: (i: 'rest' | 'moderate' | 'high') => void;
    toggleConsumed: (key: string, factor: number) => void;
    addCustomFood: (f: FoodItem) => void;
    completeOnboarding: () => void;
    resetApp: () => void;
    syncToCloud: () => Promise<void>;
    applyAICommands: (commands: AIPlanCommand[]) => void;
}
