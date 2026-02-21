
export type TrainingIntensity = 'rest' | 'moderate' | 'high';

export interface UserProfile {
  uid?: string;
  name: string;
  email?: string;
  weight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  goal: 'weight-loss' | 'health' | 'performance';
  strategy: string[];
  activityLevel: 'sedentary' | 'moderate' | 'active' | 'athlete';
  bodyFat?: number;
  medicalConditions: string[];
  allergies: string[];
  joinedAt: string;
}

export interface FoodItem {
  id: string;
  name: string;
  portion: string;
  calories: number;
  baseAmount: number;
  unit: string;
  macros: {
    p: number;
    c: number;
    f: number;
    fiber: number;
  };
  isCustom?: boolean;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AIPlanCommand {
  dayIndex: number;
  meal: string;
  group: string;
  itemId: string;
  qty: number;
}

export interface AIResponse {
  text: string;
  sources: GroundingSource[];
  actionTaken?: string;
  planCommands?: AIPlanCommand[];
}

export type SelectionsState = Record<string, Record<string, Record<string, number>>>;
export type WeeklyPlanState = Record<number, SelectionsState>;

export interface ConsumedItemLog {
  consumed: boolean;
  factor: number;
  alternative?: string;
}

export interface FastingSession {
  date: string;
  duration: number;
  completed: boolean;
}

export interface FastingState {
  isActive: boolean;
  startTime: string | null;
  targetHours: number;
  history: FastingSession[];
}

export interface WeightRecord {
  date: string;
  weight: number;
  imc: string;
}

export interface AppState {
  user: {
    id: string | null;
    isAuthenticated: boolean;
    lastSync: string | null;
    isSyncing: boolean;
  };
  isLoadingData: boolean;
  profile: UserProfile;
  weeklyPlan: WeeklyPlanState;
  activeMeals: string[];
  mealTimes: Record<string, string>;
  consumedItems: Record<string, ConsumedItemLog>;
  fasting: FastingState;
  weightHistory: WeightRecord[];
  isOnboardingComplete: boolean;
  trainingIntensity: TrainingIntensity;
  calculatedTargets: { calories: number; protein: number; carbs: number; fat: number; sodium: number; potassium: number };
  waterIntake: number;
  electrolyteAlert: boolean;
  scientificConfidence: string[];
  customFoods: FoodItem[];
}

export interface AppActions {
  login: (email: string) => void;
  logout: () => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  updatePlan: (dayIndex: number, meal: string, group: string, itemId: string, qty: number) => void;
  setWeeklyPlan: (plan: WeeklyPlanState) => void;
  logConsumption: (itemId: string, factor: number, alternative?: string) => void;
  setFastingStatus: (isActive: boolean, startTime?: string) => void;
  updateFastingTarget: (hours: number) => void;
  stopFasting: () => void;
  logWeight: (weight: number) => void;
  addMeal: (name: string, time?: string) => void;
  removeMeal: (name: string) => void;
  reorderMeal: (oldIndex: number, newIndex: number) => void;
  renameMeal: (oldName: string, newName: string) => void;
  updateMealTime: (mealName: string, time: string) => void;
  setTrainingIntensity: (intensity: TrainingIntensity) => void;
  addWater: (ml: number) => void;
  addCustomFood: (food: FoodItem) => void;
  completeOnboarding: () => void;
  resetApp: () => void;
  syncToCloud: () => Promise<void>;
}
