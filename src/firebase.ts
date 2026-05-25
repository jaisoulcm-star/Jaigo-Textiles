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
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);

// Initialize Firestore with robust fallbacks to handle blocked third-party storage/IndexedDB in sandboxed environments
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
    experimentalForceLongPolling: true,
  }, (firebaseConfig as any).firestoreDatabaseId);
} catch (error) {
  console.warn("Firestore persistent local cache failed to initialize (often caused by sandboxed iframe tracking protection). Falling back to memory cache.", error);
  try {
    firestoreDb = initializeFirestore(app, {
      localCache: memoryLocalCache(),
      experimentalForceLongPolling: true,
    }, (firebaseConfig as any).firestoreDatabaseId);
  } catch (fallbackError) {
    console.error("Firestore custom initialization failed completely. Falling back to default getFirestore.", fallbackError);
    firestoreDb = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
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
      console.error("Please check your Firebase configuration or firewall.");
    }
  }
};
testConnection();
