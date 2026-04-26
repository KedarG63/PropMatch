import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { Pool } from 'pg';
import { matchScore, formatBudget, formatPostedAt } from '../../backend/src/scoring';
import type { RequirementDoc, ListingDoc } from '../../backend/src/types';

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
