import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyCG__9jYaiHyf89mDrcnZdCDgRDO-lQ03s",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "bubble-rockin.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "bubble-rockin",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "bubble-rockin.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "946950890263",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:946950890263:web:940bf14390a2d896ac4d52",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-SQ0LNFP18W",
};

console.log("[Firebase] Initializing — project:", firebaseConfig.projectId);

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Analytics (only if supported)
isSupported().then(yes => { if (yes) getAnalytics(app); });

// Connectivity check — probe Firestore on startup
getDocs(query(collection(db, "bubbles"), limit(1)))
  .then(() => console.log("[Firebase] ✅ Firestore connectivity OK"))
  .catch(err => {
    const msg = (err as Error)?.message ?? "";
    if (msg.includes("Missing or insufficient permissions")) {
      console.warn("[Firebase] ⚠️ Firestore reachable but security rules may block some operations. Ensure rules allow authenticated reads/writes.");
    } else {
      console.error("[Firebase] ❌ Firestore connectivity FAILED:", msg);
    }
  });
