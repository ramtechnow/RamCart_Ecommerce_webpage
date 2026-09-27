import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "firebase/auth";

// Environment variables configuration with safe browser Vite & Node fallbacks
const getEnv = (key, viteKey, fallback) => {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[viteKey]) {
    return import.meta.env[viteKey];
  }
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnv("REACT_APP_FIREBASE_API_KEY", "VITE_FIREBASE_API_KEY", "AIzaSyAbhOjpXJb88Dan3-tWS9rkBUOX0ND_6kI"),
  authDomain: getEnv("REACT_APP_FIREBASE_AUTH_DOMAIN", "VITE_FIREBASE_AUTH_DOMAIN", "ecommerce-website-dfd55.firebaseapp.com"),
  projectId: getEnv("REACT_APP_FIREBASE_PROJECT_ID", "VITE_FIREBASE_PROJECT_ID", "ecommerce-website-dfd55"),
  storageBucket: getEnv("REACT_APP_FIREBASE_STORAGE_BUCKET", "VITE_FIREBASE_STORAGE_BUCKET", "ecommerce-website-dfd55.firebasestorage.app"),
  messagingSenderId: getEnv("REACT_APP_FIREBASE_MESSAGING_SENDER_ID", "VITE_FIREBASE_MESSAGING_SENDER_ID", "128549464864"),
  appId: getEnv("REACT_APP_FIREBASE_APP_ID", "VITE_FIREBASE_APP_ID", "1:128549464864:web:f6d80c86bf13ccdd30c545"),
  measurementId: getEnv("REACT_APP_FIREBASE_MEASUREMENT_ID", "VITE_FIREBASE_MEASUREMENT_ID", "G-L194PK372N")
};

let app = null;
let auth = null;
let isFirebaseSimulated = true;

// Proactively verify configuration validity to decide on simulated fallback
const isConfigValid = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY" &&
  firebaseConfig.projectId;

if (isConfigValid) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    auth = getAuth(app);
    isFirebaseSimulated = false;
    console.log("🔥 Firebase initialized successfully!");
  } catch (error) {
    console.warn("⚠️ Firebase failed to initialize. Falling back to simulated authentication mode.", error);
    isFirebaseSimulated = true;
  }
} else {
  console.log("ℹ️ No Firebase API credentials found in environment. Running in Simulated Firebase Authentication Mode.");
  isFirebaseSimulated = true;
}

export { 
  app, 
  auth, 
  isFirebaseSimulated,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  sendPasswordResetEmail
};
export default app;
