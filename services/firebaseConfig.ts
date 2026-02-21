
// Archivo de configuración de Firebase
// Para producción: Reemplaza estos valores con los que te da la consola de Firebase
// y guárdalos también como Variables de Entorno en Vercel.

export const firebaseConfig = {
  apiKey: "TU_FIREBASE_API_KEY",
  authDomain: "tu-app.firebaseapp.com",
  projectId: "tu-app-id",
  storageBucket: "tu-app.appspot.com",
  messagingSenderId: "tu-sender-id",
  appId: "tu-app-id"
};

// Nota: Para este prototipo, seguimos usando la simulación de Auth, 
// pero este archivo es el puente para conectar el SDK real:
// import { initializeApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
