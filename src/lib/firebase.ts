import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth
export const auth = getAuth(app);

// Set persistence to local (survives browser restarts)
if (typeof window !== 'undefined') {
    setPersistence(auth, browserLocalPersistence).catch(console.error);
}

// Initialize Firestore with settings
// Using initializeFirestore to force long polling which fixes 20s timeout issues on some networks
import { initializeFirestore } from 'firebase/firestore';

export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});

// Lazy getter for compatibility
export function getDb() {
    return db;
}

export default app;
