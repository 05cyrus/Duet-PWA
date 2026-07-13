/**
 * Firebase client initialisation.
 *
 * All values come from NEXT_PUBLIC_* env vars — see .env.example.
 * Firestore is created with persistent offline cache (multi-tab) so the
 * app keeps working without a connection.
 */
import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

function getApp(): FirebaseApp {
  if (!firebaseConfigured) {
    throw new Error(
      "Firebase is not configured. Copy .env.example to .env.local and fill in your project keys.",
    );
  }
  if (!app) app = getApps()[0] ?? initializeApp(firebaseConfig);
  return app;
}

export function auth(): Auth {
  if (!authInstance) authInstance = getAuth(getApp());
  return authInstance;
}

export function db(): Firestore {
  if (!dbInstance) {
    dbInstance = initializeFirestore(getApp(), {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  }
  return dbInstance;
}
