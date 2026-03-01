import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, AppActions, UserProfile } from '../types';
import { auth, db } from '../services/firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'nutritico_v2_state';

const defaultProfile: UserProfile = {
    name: '',
    age: 30,
    weight: 70,
    height: 170,
    gender: 'male',
    activityLevel: 1.2,
    goal: 'maintain',
    strategy: ['balanceado'],
    medicalConditions: [],
    pathologies: []
};

const calculateMetabolicTargets = (profile: UserProfile, intensity: string) => {
    // Harris-Benedict BMR
    let bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
    bmr = profile.gender === 'male' ? bmr + 5 : bmr - 161;

    // TDEE
    let tdee = bmr * profile.activityLevel;

    // Goal Adjustment
    if (profile.goal === 'lose') tdee -= 500;
    if (profile.goal === 'gain') tdee += 500;

    // Intensity Modifier
    if (intensity === 'high') tdee += 300;
    if (intensity === 'rest') tdee -= 200;

    // Base Percentages
    let proteinPct = 0.25;
    let carbPct = 0.45;
    let fatPct = 0.30;

    // Strategy-based adjustments (Keto, etc.)
    if (profile.strategy.includes('keto')) {
        carbPct = 0.05;
        proteinPct = 0.25;
        fatPct = 0.70;
    }

    // Pathology Modifiers (Overrides strategy if necessary for clinical safety)
    if (profile.pathologies.includes('MetabolicSyndrome') || profile.pathologies.includes('Diabetes')) {
        if (!profile.strategy.includes('keto')) {
            carbPct = 0.30;
            proteinPct = 0.35;
            fatPct = 0.35;
        }
    }

    if (profile.pathologies.includes('HighPerformance')) {
        proteinPct = 0.30;
        carbPct = 0.50;
        fatPct = 0.20;
    }

    if (profile.strategy.includes('keto')) {
        carbPct = 0.05;
        proteinPct = 0.20;
        fatPct = 0.75;
    }

    return {
        calories: Math.round(tdee),
        protein: Math.round((tdee * proteinPct) / 4),
        carbs: Math.round((tdee * carbPct) / 4),
        fat: Math.round((tdee * fatPct) / 9)
    };
};

const defaultState: AppState = {
    user: { uid: null, email: null, lastSync: null },
    profile: defaultProfile,
    isOnboardingComplete: false,
    weeklyPlan: {},
    consumedItems: {},
    customFoods: [],
    pantry: [],
    trainingIntensity: 'moderate',
    calculatedTargets: { calories: 2000, protein: 150, carbs: 200, fat: 65 },
    activeMeals: ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'],
    mealTimes: { Desayuno: '08:00', Almuerzo: '13:00', Merienda: '16:00', Cena: '20:00' }
};

const GlobalStateContext = createContext<{ state: AppState; actions: AppActions } | null>(null);

export const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<AppState>(() => {
        const local = localStorage.getItem(LOCAL_STORAGE_KEY);
        return local ? JSON.parse(local) : defaultState;
    });

    // Sync state to localStorage on every change
    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    useEffect(() => {
        const unsubAuth = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setState(prev => ({ ...prev, user: { uid: user.uid, email: user.email, lastSync: prev.user.lastSync } }));

                // Carga inicial desde Firestore (background)
                try {
                    const docRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const cloudData = docSnap.data() as Partial<AppState>;
                        setState(prev => ({ ...prev, ...cloudData }));
                    }
                } catch (e) {
                    console.warn("Firestore unavailable, using local cache", e);
                }
            } else {
                setState(defaultState);
                localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
        });

        return () => unsubAuth();
    }, []);

    const actions: AppActions = {
        setProfile: (profile) => setState(prev => ({
            ...prev,
            profile,
            calculatedTargets: calculateMetabolicTargets(profile, prev.trainingIntensity)
        })),
        setWeeklyPlan: (weeklyPlan) => setState(prev => ({ ...prev, weeklyPlan })),
        setTrainingIntensity: (trainingIntensity) => setState(prev => ({
            ...prev,
            trainingIntensity,
            calculatedTargets: calculateMetabolicTargets(prev.profile, trainingIntensity)
        })),
        toggleConsumed: (key, factor) => setState(prev => {
            const current = prev.consumedItems[key];
            return {
                ...prev,
                consumedItems: {
                    ...prev.consumedItems,
                    [key]: { timestamp: Date.now(), factor, consumed: !current?.consumed }
                }
            };
        }),
        addCustomFood: (food) => setState(prev => ({ ...prev, customFoods: [...prev.customFoods, food] })),
        addToPantry: (item) => setState(prev => ({ ...prev, pantry: [...prev.pantry, item] })),
        removeFromPantry: (id) => setState(prev => ({ ...prev, pantry: prev.pantry.filter(i => i.id !== id) })),
        completeOnboarding: () => setState(prev => ({ ...prev, isOnboardingComplete: true })),
        syncToCloud: async () => {
            if (!state.user.uid) return;
            try {
                await setDoc(doc(db, 'users', state.user.uid), {
                    ...state,
                    user: { ...state.user, lastSync: Date.now() }
                }, { merge: true });
                setState(prev => ({ ...prev, user: { ...prev.user, lastSync: Date.now() } }));
            } catch (e) {
                console.error("Sync error", e);
            }
        },
        resetApp: async () => {
            await signOut(auth);
            setState(defaultState);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        },
        applyAICommands: (commands) => setState(prev => {
            let newPlan = { ...prev.weeklyPlan };
            commands.forEach(cmd => {
                const dp = newPlan[cmd.dayIndex] || {};
                const mp = dp[cmd.meal] || {};
                const gp = mp[cmd.group] || {};
                const ng = { ...gp };
                if (cmd.qty <= 0) delete ng[cmd.itemId]; else ng[cmd.itemId] = cmd.qty;
                newPlan = { ...newPlan, [cmd.dayIndex]: { ...dp, [cmd.meal]: { ...mp, [cmd.group]: ng } } };
            });
            return { ...prev, weeklyPlan: newPlan };
        })
    };

    return (
        <GlobalStateContext.Provider value={{ state, actions }}>
            {children}
        </GlobalStateContext.Provider>
    );
};

export const useGlobalState = () => {
    const context = useContext(GlobalStateContext);
    if (!context) throw new Error('useGlobalState must be used within GlobalStateProvider');
    return context;
};
