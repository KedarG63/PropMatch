import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { Pool } from 'pg';
import { matchScore, formatBudget, formatPostedAt } from '../../backend/src/scoring';
import type { RequirementDoc, ListingDoc } from '../../backend/src/types';

// ─── Expo push helper ────────────────────────────────────────────────────────

async function getUserToken(uid: string): Promise<string | null> {
  const snap = await db.collection('users').doc(uid).get();
  return (snap.data()?.fcmToken as string | undefined) ?? null;
}

async function sendExpoPush(
  token: string,
  title: string,
  body: string,
  data: Record<string, string> = {},
): Promise<void> {
  if (!token.startsWith('ExponentPushToken')) return;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ to: token, title, body, data, sound: 'default' }),
  });
}

if (!getApps().length) initializeApp();
const db = getFirestore();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function upsertMatch(buyerUid: string, listingId: string, score: number) {
  await pool.query(
    `INSERT INTO matches (buyer_uid, listing_id, score, computed_at) VALUES ($1,$2,$3,NOW())
     ON CONFLICT (buyer_uid, listing_id) DO UPDATE SET score=EXCLUDED.score, computed_at=NOW()`,
    [buyerUid, listingId, score],
  );
}

async function upsertReqMatch(brokerUid: string, reqId: string, listingId: string, score: number) {
  await pool.query(
    `INSERT INTO req_matches (broker_uid, req_id, listing_id, score, computed_at) VALUES ($1,$2,$3,$4,NOW())
     ON CONFLICT (broker_uid, req_id, listing_id) DO UPDATE SET score=EXCLUDED.score, computed_at=NOW()`,
    [brokerUid, reqId, listingId, score],
  );
}

async function getActiveListings(): Promise<ListingDoc[]> {
  const snap = await db.collection('listings').where('status', '==', 'Active').limit(500).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ListingDoc));
}

async function getActiveRequirements(): Promise<RequirementDoc[]> {
  const snap = await db.collection('requirements').where('active', '==', true).limit(500).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as RequirementDoc));
}

/**
 * Triggered when a buyer posts or updates a requirement.
 * Scores the requirement against all active listings and writes to PostgreSQL.
 */
export const onRequirementWritten = onDocumentWritten(
  'requirements/{reqId}',
  async (event) => {
    const after = event.data?.after;
    if (!after?.exists) return; // deleted

    const req = { id: after.id, ...after.data() } as RequirementDoc;
    if (!req.active) return; // deactivated requirement — skip

    const listings = await getActiveListings();
    await Promise.all(
      listings.map(async (listing) => {
        const score = matchScore(req, listing);
        if (score <= 0) return;
        // buyer → listing match
        await upsertMatch(req.uid, listing.id, score);
        // broker sees buyer: req_matches keyed by broker uid
        await upsertReqMatch(listing.uid, req.id, listing.id, score);
      }),
    );

    console.log(`Scored requirement ${req.id} against ${listings.length} listings`);
  },
);

/**
 * Triggered when a broker posts or updates a listing.
 * Scores the listing against all active buyer requirements and writes to PostgreSQL.
 */
export const onListingWritten = onDocumentWritten(
  'listings/{listingId}',
  async (event) => {
    const after = event.data?.after;
    if (!after?.exists) return;

    const listing = { id: after.id, ...after.data() } as ListingDoc;
    if (listing.status !== 'Active') return;

    const requirements = await getActiveRequirements();
    await Promise.all(
      requirements.map(async (req) => {
        const score = matchScore(req, listing);
        if (score <= 0) return;
        await upsertMatch(req.uid, listing.id, score);
        await upsertReqMatch(listing.uid, req.id, listing.id, score);
      }),
    );

    console.log(`Scored listing ${listing.id} against ${requirements.length} requirements`);
  },
);

// ─── Notification triggers ───────────────────────────────────────────────────

/**
 * New connection request (status: pending) → push to broker.
 */
export const onConnectionCreated = onDocumentWritten(
  'connections/{connId}',
  async (event) => {
    const before = event.data?.before;
    const after = event.data?.after;
    if (!after?.exists || before?.exists) return; // only fire on create

    const conn = after.data() as {
      brokerUid: string;
      buyerName: string;
      listingTitle: string;
      status: string;
    };
    if (conn.status !== 'pending') return;

    const token = await getUserToken(conn.brokerUid);
    if (!token) return;

    await sendExpoPush(
      token,
      'New connection request',
      `${conn.buyerName} is interested in ${conn.listingTitle}`,
      { type: 'connection', connId: after.id },
    );
  },
);

/**
 * Connection accepted → push to buyer.
 */
export const onConnectionUpdated = onDocumentWritten(
  'connections/{connId}',
  async (event) => {
    const before = event.data?.before;
    const after = event.data?.after;
    if (!before?.exists || !after?.exists) return; // only fire on update

    const prev = before.data() as { status: string };
    const curr = after.data() as {
      buyerUid: string;
      brokerName: string;
      status: string;
    };
    if (prev.status === curr.status || curr.status !== 'accepted') return;

    const token = await getUserToken(curr.buyerUid);
    if (!token) return;

    await sendExpoPush(
      token,
      'Request accepted',
      `${curr.brokerName} accepted your connection request`,
      { type: 'connection', connId: after.id },
    );
  },
);

/**
 * New chat message → push to the other party.
 */
export const onMessageSent = onDocumentWritten(
  'connections/{connId}/thread/{msgId}',
  async (event) => {
    const before = event.data?.before;
    const after = event.data?.after;
    if (!after?.exists || before?.exists) return; // only on new message

    const msg = after.data() as { senderUid: string; text: string };
    const connId = event.params.connId;

    const connSnap = await db.collection('connections').doc(connId).get();
    if (!connSnap.exists) return;

    const conn = connSnap.data() as {
      buyerUid: string;
      buyerName: string;
      brokerUid: string;
      brokerName: string;
    };

    const recipientUid =
      msg.senderUid === conn.buyerUid ? conn.brokerUid : conn.buyerUid;
    const senderName =
      msg.senderUid === conn.buyerUid ? conn.buyerName : conn.brokerName;

    // Check mute — buyer can mute broker
    if (msg.senderUid === conn.brokerUid) {
      const muteSnap = await db
        .collection('mutes')
        .doc(conn.buyerUid)
        .collection('brokers')
        .doc(conn.brokerUid)
        .get();
      if (muteSnap.exists) return;
    }

    const token = await getUserToken(recipientUid);
    if (!token) return;

    const preview = msg.text.length > 60 ? msg.text.slice(0, 57) + '…' : msg.text;
    await sendExpoPush(
      token,
      senderName,
      preview,
      { type: 'message', connId },
    );
  },
);
