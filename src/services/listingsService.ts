import {
  collection, addDoc, query, where, onSnapshot, orderBy,
  updateDoc, doc, serverTimestamp, limit,
  startAfter, getDocs, type QueryDocumentSnapshot, type DocumentData, type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { PropertyTone, BrokerListing, Listing } from '../types';

const COL = 'listings';

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

export interface NewListing {
  title: string;
  price: string;
  area: string;
  rera: string;
  floor: string;
  facing: string;
  brokerName: string;
  brokerFirm: string;
}

export async function postListing(uid: string, data: NewListing): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    uid,
    ...data,
    photos: [],
    videoUrl: null,
    status: 'Active',
    views: 0,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeBrokerListings(
  uid: string,
  callback: (listings: BrokerListing[]) => void,
): Unsubscribe {
  const q = query(collection(db, COL), where('uid', '==', uid));
  return onSnapshot(q, (snap) => {
    const listings: BrokerListing[] = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        tone: toneFromId(d.id),
        idx: idxFromId(d.id),
        title: data.title ?? '',
        price: data.price ?? '',
        status: data.status ?? 'Active',
        views: data.views ?? 0,
      };
    });
    listings.sort((a, b) => a.title.localeCompare(b.title));
    callback(listings);
  });
}

export async function getDiscoverListings(
  pageSize = 10,
  after?: QueryDocumentSnapshot<DocumentData>,
): Promise<{ listings: Listing[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  // Single-field orderBy avoids composite index requirement; status filtered client-side
  let q = query(collection(db, COL), orderBy('createdAt', 'desc'), limit(pageSize));
  if (after) q = query(collection(db, COL), orderBy('createdAt', 'desc'), limit(pageSize), startAfter(after));

  const snap = await getDocs(q);
  const lastDoc = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : null;

  const listings: Listing[] = snap.docs
    .filter(d => (d.data().status ?? 'Active') === 'Active')
    .map((d) => {
      const data = d.data();
      return {
        id: d.id,
        uid: String(data.uid ?? ''),
        tone: toneFromId(d.id),
        idx: idxFromId(d.id),
        photos: (data.photos as unknown[])?.length ?? 0,
        video: !!data.videoUrl,
        title: String(data.title ?? ''),
        price: String(data.price ?? ''),
        sub: [data.area, data.facing ? `${data.facing} facing` : '', data.floor ? `Floor ${data.floor}` : ''].filter(Boolean).join(' · '),
        broker: String(data.brokerName ?? ''),
        firm: String(data.brokerFirm ?? ''),
        verified: false,
        rera: data.rera ? String(data.rera) : null,
      };
    });

  return { listings, lastDoc };
}

export async function updateListingStatus(
  id: string,
  status: 'Active' | 'Paused' | 'Sold',
): Promise<void> {
  await updateDoc(doc(db, COL, id), { status });
}
