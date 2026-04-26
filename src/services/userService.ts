import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { Role } from '../types';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: Role;
  verified: boolean;
  createdAt: string;
  fcmToken: string | null;
}

export async function createUserDoc(
  uid: string,
  data: { name: string; email: string; role: Role },
): Promise<void> {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    verified: false,
    fcmToken: null,
    createdAt: serverTimestamp(),
  });
}

export async function getUserDoc(uid: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    uid,
    name: d.name,
    email: d.email,
    role: d.role as Role,
    verified: d.verified ?? false,
    createdAt: d.createdAt?.toDate?.()?.toISOString() ?? '',
    fcmToken: d.fcmToken ?? null,
  };
}
