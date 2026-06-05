import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDocFromServer,
  persistentLocalCache,
  persistentMultipleTabManager,
  memoryLocalCache,
} from "firebase/firestore";
import firebaseConfigJson from "../firebase-applet-config.json";

// Dynamic configuration matching both local development and Netlify environment variables
const getCleanValue = (envVal: any, jsonVal: any) => {
  if (!envVal) return jsonVal;
  const cleaned = String(envVal).trim().replace(/['"]/g, "");
  if (
    cleaned === "" ||
    cleaned.startsWith("your-") ||
    cleaned === "undefined" ||
    cleaned === "null"
  ) {
    return jsonVal;
  }
  return cleaned;
};

const firebaseConfig = {
  apiKey: getCleanValue(import.meta.env.VITE_FIREBASE_API_KEY, firebaseConfigJson.apiKey),
  authDomain: getCleanValue(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, firebaseConfigJson.authDomain),
  projectId: getCleanValue(import.meta.env.VITE_FIREBASE_PROJECT_ID, firebaseConfigJson.projectId),
  storageBucket: getCleanValue(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, firebaseConfigJson.storageBucket),
  messagingSenderId: getCleanValue(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, firebaseConfigJson.messagingSenderId),
  appId: getCleanValue(import.meta.env.VITE_FIREBASE_APP_ID, firebaseConfigJson.appId),
  measurementId: getCleanValue(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, firebaseConfigJson.measurementId || ""),
  firestoreDatabaseId: getCleanValue(import.meta.env.VITE_FIREBASE_DATABASE_ID, firebaseConfigJson.firestoreDatabaseId || ""),
};

console.log("Firebase Config Active - Project ID:", firebaseConfig.projectId, "API Key: starts with", firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 5) : "none", "length:", firebaseConfig.apiKey ? firebaseConfig.apiKey.length : 0);

const app = initializeApp(firebaseConfig);

// Initialize Firestore with robust fallbacks to handle blocked third-party storage/IndexedDB in sandboxed environments
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
    experimentalForceLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
} catch (error) {
  console.warn("Firestore persistent local cache failed to initialize (often caused by sandboxed iframe tracking protection). Falling back to memory cache.", error);
  try {
    firestoreDb = initializeFirestore(app, {
      localCache: memoryLocalCache(),
      experimentalForceLongPolling: true,
    }, firebaseConfig.firestoreDatabaseId);
  } catch (fallbackError) {
    console.error("Firestore custom initialization failed completely. Falling back to default getFirestore.", fallbackError);
    firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = firestoreDb;

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// Request Google Sheets scopes for the application
googleProvider.addScope("https://www.googleapis.com/auth/spreadsheets");

export const signInWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (error: any) {
    if (error.code === "auth/popup-closed-by-user") {
      console.log("User closed the login popup.");
      return null;
    }
    console.error("Google Sign-In Error:", error);
    throw error;
  }
};
export const logout = () => auth.signOut();

// CRITICAL CONSTRAINT: Test connection on boot
const testConnection = async () => {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("the client is offline")
    ) {
      console.warn("Firebase client is operating in offline mode. Local cached store will be used as a robust fallback.");
    }
  }
};
testConnection();
