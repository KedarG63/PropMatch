import {
  collection, addDoc, query, where, onSnapshot,
  updateDoc, doc, serverTimestamp, orderBy, type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { PropertyStatus, PropertyTone, VisitedProperty } from '../types';

const COL = 'visits';

const TONES: PropertyTone[] = ['a', 'b', 'c', 'd', 'e'];

function toneFromId(id: string): PropertyTone {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return TONES[h % TONES.length];
}

function idxFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 17 + id.charCodeAt(i)) & 0xffff;
  return h % 3;
}

export interface NewVisit {
  title: string;
  price: string;
  broker: string;
  agent: string;
}

export async function addVisit(uid: string, data: NewVisit): Promise<void> {
  await addDoc(collection(db, COL), {
    uid,
    ...data,
    pros: [],
    cons: [],
    notes: '',
    status: 'undecided' as PropertyStatus,
    visitedAt: serverTimestamp(),
  });
}

export function subscribeVisits(
  uid: string,
  callback: (visits: VisitedProperty[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, COL),
    where('uid', '==', uid),
    orderBy('visitedAt', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    const visits: VisitedProperty[] = snap.docs.map((d) => {
      const data = d.data();
      const ts = data.visitedAt?.toDate?.();
      const visited = ts
        ? ts.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : '';
      return {
        id: d.id,
        title: data.title ?? '',
        price: data.price ?? '',
        tone: toneFromId(d.id),
        idx: idxFromId(d.id),
        photos: data.photos ?? 0,
        video: data.video ?? false,
        visited,
        broker: data.broker ?? '',
        agent: data.agent ?? '',
        pros: data.pros ?? [],
        cons: data.cons ?? [],
        notes: data.notes ?? '',
        status: data.status ?? 'undecided',
      };
    });
    callback(visits);
  });
}

export async function updateVisitStatus(id: string, status: PropertyStatus): Promise<void> {
  await updateDoc(doc(db, COL, id), { status });
}

export async function updateVisitNotes(id: string, notes: string): Promise<void> {
  await updateDoc(doc(db, COL, id), { notes });
}

export async function updateVisitProsCons(
  id: string,
  pros: string[],
  cons: string[],
): Promise<void> {
  await updateDoc(doc(db, COL, id), { pros, cons });
}
