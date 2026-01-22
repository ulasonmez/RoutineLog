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

// Lazy Firestore initialization - only on client side
let _db: Firestore | null = null;

export function getDb(): Firestore {
    if (!_db) {
        _db = getFirestore(app);
    }
    return _db;
}

// For backward compatibility - use getter
export const db = typeof window !== 'undefined' ? getFirestore(app) : null as any;

export default app;
