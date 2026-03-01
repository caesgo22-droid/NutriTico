import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AppState, UserProfile, AIPlanUpdate, FoodEquivalent, Biometrics, ClinicalLabs } from '../types';

const LOCAL_STORAGE_KEY = 'nutritico_v3_state';

const initialProfile: UserProfile = {
    name: '',
    age: 30,
    weight: 70,
    height: 170,
    gender: 'male',
    activityLevel: 1.2,
    goal: 'maintain',
    strategies: ['balanceado'],
    conditions: []
};

const calculateMetabolicTargets = (profile: UserProfile) => {
    // Harris-Benedict BMR
    let bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
    bmr = profile.gender === 'male' ? bmr + 5 : bmr - 161;

    // TDEE
    let tdee = bmr * profile.activityLevel;

    // Goal Adjustments
    if (profile.goal === 'lose') tdee -= 500;
    if (profile.goal === 'gain') tdee += 500;

    // Clinical & Strategy Modifiers
    let p = 0.25, c = 0.45, f = 0.30;

    if (profile.conditions.includes('Diabetes') || profile.conditions.includes('MetabolicSyndrome')) {
        c = 0.30; p = 0.35; f = 0.35;
    }

    if (profile.strategies.includes('keto')) {
        c = 0.05; p = 0.20; f = 0.75;
    }

    return {
        calories: Math.round(tdee),
        protein: Math.round((tdee * p) / 4),
        carbs: Math.round((tdee * c) / 4),
        fat: Math.round((tdee * f) / 9)
    };
};

import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

// Extend AppState to include real user object
export interface ExtendedAppState extends AppState {
    authUser: { uid: string; email: string | null } | null;
    chatHistory: { role: 'user' | 'ai'; text: string }[];
}

const initialState: ExtendedAppState = {
    authUser: null,
    profile: initialProfile,
    weeklyPlan: {},
    pantry: [],
    chatHistory: [
        { role: 'ai', text: `Hola. He inicializado tu motor v3. Estoy conectado al anillo central. ¿En qué interactuamos hoy?` }
    ],
    calculatedTargets: calculateMetabolicTargets(initialProfile),
    isLoading: false,
    error: null
};

type Action =
    | { type: 'SET_AUTH_USER'; payload: { uid: string; email: string | null } | null }
    | { type: 'SET_PROFILE'; payload: UserProfile }
    | { type: 'APPLY_PLAN_UPDATE'; payload: AIPlanUpdate['actions'] }
    | { type: 'ADD_CHAT_MESSAGE'; payload: { role: 'user' | 'ai'; text: string } }
    | { type: 'ADD_TO_PANTRY'; payload: FoodEquivalent }
    | { type: 'UPDATE_BIOMETRICS'; payload: Biometrics }
    | { type: 'UPDATE_LABS'; payload: ClinicalLabs }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'LOAD_STATE'; payload: Partial<Omit<ExtendedAppState, 'authUser'>> };

function reducer(state: ExtendedAppState, action: Action): ExtendedAppState {
    switch (action.type) {
        case 'SET_AUTH_USER':
            return { ...state, authUser: action.payload };
        case 'SET_PROFILE':
            return {
                ...state,
                profile: action.payload,
                calculatedTargets: calculateMetabolicTargets(action.payload)
            };
        case 'APPLY_PLAN_UPDATE': {
            const newPlan = { ...state.weeklyPlan };
            action.payload.forEach(act => {
                const day = newPlan[act.dayIndex] || {};
                const mealArray = day[act.meal] || [];

                if (act.operation === 'add' || act.operation === 'set') {
                    const existingIdx = mealArray.findIndex((i: { foodId: string }) => i.foodId === act.foodId);
                    if (existingIdx > -1) {
                        mealArray[existingIdx].portions = act.portions;
                    } else {
                        mealArray.push({ foodId: act.foodId, portions: act.portions });
                    }
                } else if (act.operation === 'remove') {
                    day[act.meal] = mealArray.filter((i: { foodId: string }) => i.foodId !== act.foodId);
                } else {
                    day[act.meal] = mealArray;
                }

                newPlan[act.dayIndex] = day;
            });
            return { ...state, weeklyPlan: newPlan };
        }
        case 'ADD_CHAT_MESSAGE':
            return {
                ...state,
                chatHistory: [...state.chatHistory, action.payload]
            };
        case 'ADD_TO_PANTRY':
            // Check if it already exists, if so ignore
            if (state.pantry.find(item => item.id === action.payload.id)) {
                return state;
            }
            return {
                ...state,
                pantry: [...state.pantry, action.payload]
            };
        case 'UPDATE_BIOMETRICS':
            return {
                ...state,
                profile: {
                    ...state.profile,
                    biometrics: action.payload
                }
            };
        case 'UPDATE_LABS':
            return {
                ...state,
                profile: {
                    ...state.profile,
                    labs: action.payload
                }
            };
        case 'LOAD_STATE':
            return { ...state, ...action.payload };
        case 'SET_LOADING': return { ...state, isLoading: action.payload };
        case 'SET_ERROR': return { ...state, error: action.payload };
        default: return state;
    }
}

const GlobalStateContext = createContext<{ state: ExtendedAppState; dispatch: React.Dispatch<Action>; syncToCloud: () => Promise<void> } | null>(null);

export const GlobalStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, dispatch] = useReducer(reducer, initialState);

    // Initial Local Load
    useEffect(() => {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            dispatch({ type: 'LOAD_STATE', payload: parsed });
        }
    }, []);

    // Local Storage Sync (runs on every state change)
    useEffect(() => {
        // Omit the authUser object from being serialized into localStorage since Firebase manages auth persistence
        const { authUser, ...stateToSave } = state;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    }, [state]);

    // Firebase Auth & Cloud Sync
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                dispatch({ type: 'SET_AUTH_USER', payload: { uid: user.uid, email: user.email } });

                try {
                    const docRef = doc(db, 'users_v3', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const cloudData = docSnap.data();
                        dispatch({ type: 'LOAD_STATE', payload: cloudData as any });
                    }
                } catch (e) {
                    console.warn("Could not sync from cloud, using local state.", e);
                }
            } else {
                dispatch({ type: 'SET_AUTH_USER', payload: null });
            }
        });
        return () => unsubscribe();
    }, []);

    const syncToCloud = async () => {
        if (!state.authUser?.uid) return;
        try {
            const { authUser, ...stateToSave } = state;
            await setDoc(doc(db, 'users_v3', state.authUser.uid), stateToSave, { merge: true });
        } catch (error) {
            console.error('Cloud Sync Error', error);
        }
    };

    return (
        <GlobalStateContext.Provider value={{ state, dispatch, syncToCloud }}>
            {children}
        </GlobalStateContext.Provider>
    );
};

export const useGlobalState = () => {
    const context = useContext(GlobalStateContext);
    if (!context) throw new Error('useGlobalState must be used within GlobalStateProvider');
    return context;
};
