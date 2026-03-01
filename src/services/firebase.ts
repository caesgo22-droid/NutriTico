import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// The config will use the existing env vars or default to a safe initialization
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForV3Init",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "nutritico-v3.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "nutritico-v3",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "nutritico-v3.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:dummy"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        console.error("Login Failed", error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout Failed", error);
    }
};
