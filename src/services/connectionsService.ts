import {
  collection, addDoc, query, where, onSnapshot, updateDoc,
  doc, serverTimestamp, orderBy, type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

const COL = 'connections';

export type ConnectionStatus = 'pending' | 'accepted' | 'rejected';

export interface Connection {
  id: string;
  buyerUid: string;
  buyerName: string;
  brokerUid: string;
  brokerName: string;
  listingId: string;
  listingTitle: string;
  listingPrice: string;
  message: string;
  status: ConnectionStatus;
  createdAt: string;
}

export async function sendConnectionRequest(data: {
  buyerUid: string;
  buyerName: string;
  brokerUid: string;
  brokerName: string;
  listingId: string;
  listingTitle: string;
  listingPrice: string;
  message: string;
}): Promise<string> {
  const ref = await addDoc(collection(db, COL), {
    ...data,
    status: 'pending' as ConnectionStatus,
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export function subscribeBuyerConnections(
  buyerUid: string,
  callback: (connections: Connection[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, COL),
    where('buyerUid', '==', buyerUid),
    orderBy('createdAt', 'desc'),
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(docToConnection));
  });
}

export function subscribeBrokerConnections(
  brokerUid: string,
  status: ConnectionStatus | 'all',
  callback: (connections: Connection[]) => void,
): Unsubscribe {
  let q = query(
    collection(db, COL),
    where('brokerUid', '==', brokerUid),
    orderBy('createdAt', 'desc'),
  );
  if (status !== 'all') {
    q = query(q, where('status', '==', status));
  }
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map(docToConnection));
  });
}

export async function respondToConnection(
  id: string,
  status: 'accepted' | 'rejected',
): Promise<void> {
  await updateDoc(doc(db, COL, id), { status });
}

function docToConnection(d: { id: string; data: () => Record<string, unknown> }): Connection {
  const data = d.data();
  return {
    id: d.id,
    buyerUid: String(data.buyerUid ?? ''),
    buyerName: String(data.buyerName ?? ''),
    brokerUid: String(data.brokerUid ?? ''),
    brokerName: String(data.brokerName ?? ''),
    listingId: String(data.listingId ?? ''),
    listingTitle: String(data.listingTitle ?? ''),
    listingPrice: String(data.listingPrice ?? ''),
    message: String(data.message ?? ''),
    status: (data.status as ConnectionStatus) ?? 'pending',
    createdAt: (data.createdAt as { toDate?: () => Date })?.toDate?.()?.toISOString() ?? '',
  };
}
