
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppActions, UserProfile, TrainingIntensity, FoodItem } from '../types';
import { auth, db } from '../services/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const calculateScientificTargets = (profile: UserProfile, intensity: TrainingIntensity) => {
  let bmr = 0;
  if (profile.bodyFat && profile.bodyFat > 0) {
    const leanMass = profile.weight * (1 - (profile.bodyFat / 100));
    bmr = 370 + (21.6 * leanMass);
  } else {
    bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
    bmr = profile.gender === 'male' ? bmr + 5 : bmr - 161;
  }
  const activityMap = { sedentary: 1.2, moderate: 1.4, active: 1.6, athlete: 1.9 };
  let tdee = bmr * activityMap[profile.activityLevel];
  if (intensity === 'high') tdee *= 1.25;
  if (intensity === 'rest') tdee *= 0.9;
  const hasKidneyIssues = profile.medicalConditions.includes('kidney');
  const pRatio = hasKidneyIssues ? 1.2 : (profile.goal === 'performance' ? 2.2 : 1.8);
  let p = profile.weight * pRatio;
  let c = 0, f = 0;
  if (profile.strategy.includes('keto')) {
    c = intensity === 'high' ? 45 : 25;
    f = (tdee - (p * 4) - (c * 4)) / 9;
  } else {
    c = (tdee * (intensity === 'high' ? 0.55 : 0.40)) / 4;
    f = (tdee - (p * 4) - (c * 4)) / 9;
  }
  return { calories: Math.round(tdee), protein: Math.round(p), carbs: Math.round(c), fat: Math.round(f), sodium: profile.strategy.includes('keto') ? 5000 : 2300, potassium: 3500 };
};

const defaultProfile: UserProfile = {
  name: 'Usuario',
  weight: 75,
  height: 170,
  age: 30,
  gender: 'male',
  goal: 'weight-loss',
  strategy: ['keto'],
  activityLevel: 'moderate',
  medicalConditions: ['none'],
  allergies: ['none'],
  joinedAt: new Date().toISOString()
};

const defaultState: AppState = {
  user: { id: null, isAuthenticated: false, lastSync: null, isSyncing: false },
  profile: defaultProfile,
  weeklyPlan: {},
  activeMeals: ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'],
  mealTimes: { 'Desayuno': '08:00', 'Almuerzo': '12:00', 'Merienda': '16:00', 'Cena': '20:00' },
  consumedItems: {},
  fasting: { isActive: false, startTime: null, targetHours: 16, history: [] },
  weightHistory: [],
  isOnboardingComplete: false,
  trainingIntensity: 'moderate',
  calculatedTargets: calculateScientificTargets(defaultProfile, 'moderate'),
  waterIntake: 0,
  electrolyteAlert: false,
  scientificConfidence: ['Mifflin-St Jeor Equation', 'WHO Sodium Guidelines'],
  customFoods: []
};

const GlobalContext = createContext<{ state: AppState; actions: AppActions } | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(defaultState);
  const stateRef = useRef(state); // Para referencias en callbacks asíncronos

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const actions: AppActions = {
    login: (email) => setState(prev => ({ ...prev, user: { ...prev.user, id: btoa(email), isAuthenticated: true } })),
    logout: async () => {
      try {
        await signOut(auth);
        setState(defaultState);
      } catch (error) {
        console.error("Error signing out: ", error);
      }
    },
    syncToCloud: async () => {
      if (!stateRef.current.user.id) return;
      setState(prev => ({ ...prev, user: { ...prev.user, isSyncing: true } }));
      try {
        await setDoc(doc(db, "users", stateRef.current.user.id), stateRef.current, { merge: true });
      } catch (e) {
        console.error("Firebase Sync Error", e);
      }
      setState(prev => ({ ...prev, user: { ...prev.user, isSyncing: false, lastSync: new Date().toISOString() } }));
    },
    updateProfile: (data) => setState(prev => ({ ...prev, profile: { ...prev.profile, ...data } })),
    setTrainingIntensity: (i) => setState(prev => ({ ...prev, trainingIntensity: i })),
    addWater: (ml) => setState(prev => ({ ...prev, waterIntake: prev.waterIntake + ml })),
    updatePlan: (d, m, g, id, q) => setState(prev => {
      const dp = prev.weeklyPlan[d] || {}; const mp = dp[m] || {}; const gp = mp[g] || {}; const ng = { ...gp };
      if (q <= 0) delete ng[id]; else ng[id] = q;
      return { ...prev, weeklyPlan: { ...prev.weeklyPlan, [d]: { ...dp, [m]: { ...mp, [g]: ng } } } };
    }),
    logConsumption: (k, f, a) => setState(prev => ({ ...prev, consumedItems: { ...prev.consumedItems, [k]: { consumed: true, factor: f, alternative: a } } })),
    setFastingStatus: (a, s) => setState(prev => ({ ...prev, fasting: { ...prev.fasting, isActive: a, startTime: s || (a ? new Date().toISOString() : null) } })),
    updateFastingTarget: (h) => setState(prev => ({ ...prev, fasting: { ...prev.fasting, targetHours: h } })),
    stopFasting: () => setState(prev => {
      if (!prev.fasting.startTime) return prev;
      const dur = (Date.now() - new Date(prev.fasting.startTime).getTime()) / 3600000;
      return { ...prev, fasting: { ...prev.fasting, isActive: false, startTime: null, history: [...prev.fasting.history, { date: new Date().toISOString(), duration: parseFloat(dur.toFixed(1)), completed: dur >= prev.fasting.targetHours }] } };
    }),
    logWeight: (w) => setState(prev => ({ ...prev, profile: { ...prev.profile, weight: w }, weightHistory: [...prev.weightHistory, { date: new Date().toISOString(), weight: w, imc: (w / (prev.profile.height / 100) ** 2).toFixed(1) }] })),
    addMeal: (n, t) => setState(prev => ({ ...prev, activeMeals: [...prev.activeMeals, n], mealTimes: { ...prev.mealTimes, [n]: t || '12:00' } })),
    removeMeal: (n) => setState(prev => {
      const { [n]: _, ...rest } = prev.mealTimes;
      return { ...prev, activeMeals: prev.activeMeals.filter(m => m !== n), mealTimes: rest };
    }),
    reorderMeal: (o, n) => setState(prev => {
      const m = [...prev.activeMeals]; const [r] = m.splice(o, 1); m.splice(n, 0, r); return { ...prev, activeMeals: m };
    }),
    renameMeal: (o, n) => setState(prev => {
      const { [o]: t, ...rest } = prev.mealTimes; return { ...prev, activeMeals: prev.activeMeals.map(m => m === o ? n : m), mealTimes: { ...rest, [n]: t } };
    }),
    updateMealTime: (m, t) => setState(prev => ({ ...prev, mealTimes: { ...prev.mealTimes, [m]: t } })),
    addCustomFood: (f) => setState(prev => ({ ...prev, customFoods: [...prev.customFoods, f] })),
    completeOnboarding: () => setState(prev => ({ ...prev, isOnboardingComplete: true })),
    resetApp: async () => {
      await signOut(auth);
      setState(defaultState);
    }
  };

  useEffect(() => {
    const targets = calculateScientificTargets(state.profile, state.trainingIntensity);
    if (JSON.stringify(targets) !== JSON.stringify(state.calculatedTargets)) {
      setState(prev => ({ ...prev, calculatedTargets: targets }));
    }
  }, [state.profile, state.trainingIntensity]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setState(prev => ({ ...prev, ...docSnap.data() as AppState, user: { ...prev.user, id: user.uid, isAuthenticated: true } }));
          } else {
            setState(prev => ({ ...prev, user: { ...prev.user, id: user.uid, isAuthenticated: true } }));
          }
        } catch (error) {
          console.error("Doc read error", error);
          setState(prev => ({ ...prev, user: { ...prev.user, id: user.uid, isAuthenticated: true } }));
        }
      } else {
        setState(defaultState);
      }
    });
    return () => unsubscribe();
  }, []);

  return <GlobalContext.Provider value={{ state, actions }}>{children}</GlobalContext.Provider>;
};

export const useGlobalState = () => {
  const context = useContext(GlobalContext);
  if (!context) throw new Error("GlobalProvider missing");
  return context;
};
