import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, inMemoryPersistence, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Firebase 12 removed getReactNativePersistence. We use inMemoryPersistence for the
// SDK's auth state and separately persist the UID in AsyncStorage so sessions survive
// app restarts (handled in App.tsx via STORED_UID_KEY).
let auth: Auth;
try {
  auth = initializeAuth(app, { persistence: inMemoryPersistence });
} catch {
  auth = getAuth(app);
}

export { auth, app };
export const db = getFirestore(app);

// Key used by App.tsx to persist the signed-in user's UID across cold starts
export const STORED_UID_KEY = '@propmatch/uid';

export async function saveUid(uid: string) {
  await AsyncStorage.setItem(STORED_UID_KEY, uid);
}

export async function loadStoredUid(): Promise<string | null> {
  return AsyncStorage.getItem(STORED_UID_KEY);
}

export async function clearStoredUid() {
  await AsyncStorage.removeItem(STORED_UID_KEY);
}
