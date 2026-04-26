import {
  collection, addDoc, query, where, getDocs,
  updateDoc, doc, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const COL = 'requirements';

export interface RequirementData {
  bhk: string[];
  budgetMin: number;
  budgetMax: number;
  localities: string[];
  strict: boolean;
  possession: string;
  propertyTypes: string[];
  notes: string;
  verifiedOnly: boolean;
}

export interface Requirement extends RequirementData {
  id: string;
  uid: string;
  active: boolean;
  createdAt: string;
}

export async function postRequirement(uid: string, data: RequirementData): Promise<void> {
  // Deactivate previous requirement
  const prev = query(collection(db, COL), where('uid', '==', uid), where('active', '==', true));
  const snap = await getDocs(prev);
  await Promise.all(snap.docs.map(d => updateDoc(d.ref, { active: false })));

  await addDoc(collection(db, COL), {
    uid,
    ...data,
    active: true,
    createdAt: serverTimestamp(),
  });
}

export async function getActiveRequirement(uid: string): Promise<Requirement | null> {
  const q = query(collection(db, COL), where('uid', '==', uid), where('active', '==', true));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[snap.docs.length - 1];
  const data = d.data();
  return {
    id: d.id,
    uid: data.uid,
    bhk: data.bhk ?? [],
    budgetMin: data.budgetMin ?? 0,
    budgetMax: data.budgetMax ?? 0,
    localities: data.localities ?? [],
    strict: data.strict ?? false,
    possession: data.possession ?? 'Both',
    propertyTypes: data.propertyTypes ?? [],
    notes: data.notes ?? '',
    verifiedOnly: data.verifiedOnly ?? false,
    active: true,
    createdAt: data.createdAt?.toDate?.()?.toISOString() ?? '',
  };
}
