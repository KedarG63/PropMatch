import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { ChatMessage, PropertyTone } from '../types';

export function subscribeChatThread(
  connId: string,
  myUid: string,
  callback: (messages: ChatMessage[]) => void,
): Unsubscribe {
  const q = query(
    collection(db, 'connections', connId, 'thread'),
    orderBy('sentAt', 'asc'),
  );
  return onSnapshot(q, (snap) => {
    const msgs: ChatMessage[] = snap.docs.map((d, i) => {
      const data = d.data();
      const ts = (data.sentAt as { toDate?: () => Date })?.toDate?.();
      const time = ts
        ? ts.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : '';
      const msg: ChatMessage = {
        id: i,
        who: data.senderUid === myUid ? 'me' : 'them',
        time,
      };
      if (data.text) msg.t = String(data.text);
      if (data.cardRef) {
        msg.card = {
          title: String(data.cardTitle ?? ''),
          price: String(data.cardPrice ?? ''),
          sub: String(data.cardSub ?? ''),
          tone: (data.cardTone as PropertyTone) ?? 'a',
          idx: Number(data.cardIdx ?? 0),
        };
      }
      return msg;
    });
    callback(msgs);
  });
}

export async function sendTextMessage(
  connId: string,
  senderUid: string,
  text: string,
): Promise<void> {
  await addDoc(collection(db, 'connections', connId, 'thread'), {
    senderUid,
    text,
    sentAt: serverTimestamp(),
    read: false,
  });
}
