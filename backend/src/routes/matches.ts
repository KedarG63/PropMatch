import { Router } from 'express';
import { db } from '../firebase';
import { matchScore, toneFromId, idxFromId, formatBudget, formatPostedAt } from '../scoring';
import { getCachedBuyerMatches, getCachedBrokerMatches } from '../db';
import { requireAuth, type AuthRequest } from '../auth';
import type { RequirementDoc, ListingDoc, RankedListing, MatchedBuyer } from '../types';

const router = Router();
router.use(requireAuth);

// ── Helpers ─────────────────────────────────────────────────────────────────

async function getActiveListings(): Promise<ListingDoc[]> {
  const snap = await db.collection('listings').orderBy('createdAt', 'desc').limit(200).get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as ListingDoc))
    .filter((l) => l.status === 'Active');
}

async function getActiveRequirements(): Promise<RequirementDoc[]> {
  const snap = await db.collection('requirements').where('active', '==', true).limit(500).get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as RequirementDoc));
}

async function getBuyerRequirement(uid: string): Promise<RequirementDoc | null> {
  const snap = await db
    .collection('requirements')
    .where('uid', '==', uid)
    .where('active', '==', true)
    .limit(1)
    .get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as RequirementDoc;
}

async function getBrokerListings(brokerUid: string): Promise<ListingDoc[]> {
  const snap = await db.collection('listings').where('uid', '==', brokerUid).get();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() } as ListingDoc))
    .filter((l) => l.status === 'Active');
}

function toRankedListing(l: ListingDoc, score: number): RankedListing {
  return {
    id: l.id,
    uid: l.uid,
    title: l.title,
    price: l.price,
    sub: [l.area, l.facing ? `${l.facing} facing` : '', l.floor ? `Floor ${l.floor}` : '']
      .filter(Boolean)
      .join(' · '),
    broker: l.brokerName,
    firm: l.brokerFirm ?? '',
    verified: false,
    rera: l.rera || null,
    bhk: l.bhk ?? '',
    tone: toneFromId(l.id),
    idx: idxFromId(l.id),
    photos: Array.isArray(l.photos) ? l.photos.length : 0,
    video: !!l.videoUrl,
    score,
  };
}

// ── Routes ───────────────────────────────────────────────────────────────────

/**
 * GET /matches/buyer/:uid
 * Returns active listings ranked by match score for the buyer's requirement.
 * Uses PostgreSQL cache if available; falls back to on-demand Firestore computation.
 */
router.get('/buyer/:uid', async (req: AuthRequest, res) => {
  const { uid } = req.params;
  if (req.uid !== uid) return res.status(403).json({ error: 'Forbidden' });

  try {
    const requirement = await getBuyerRequirement(uid);
    if (!requirement) return res.json({ listings: [], message: 'No active requirement' });

    // Try PostgreSQL cache first
    const cached = await getCachedBuyerMatches(uid);
    if (cached) {
      const listingIds = cached.map((r) => r.listing_id);
      const scoreMap = new Map(cached.map((r) => [r.listing_id, r.score]));
      const snaps = await Promise.all(
        listingIds.map((id) => db.collection('listings').doc(id).get()),
      );
      const listings: RankedListing[] = snaps
        .filter((s) => s.exists)
        .map((s) => {
          const l = { id: s.id, ...s.data() } as ListingDoc;
          return toRankedListing(l, scoreMap.get(s.id) ?? 0);
        })
        .sort((a, b) => b.score - a.score);
      return res.json({ listings, source: 'cache' });
    }

    // On-demand: fetch all active listings and score each one
    const allListings = await getActiveListings();
    const ranked: RankedListing[] = allListings
      .map((l) => toRankedListing(l, matchScore(requirement, l)))
      .filter((l) => l.score >= 40)
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);

    return res.json({ listings: ranked, source: 'live' });
  } catch (err) {
    console.error('GET /matches/buyer error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /matches/broker/:uid
 * Returns buyer requirements ranked by how well they match the broker's active listings.
 * Buyer identity is anonymised (name hidden until connection accepted).
 */
router.get('/broker/:uid', async (req: AuthRequest, res) => {
  const { uid } = req.params;
  if (req.uid !== uid) return res.status(403).json({ error: 'Forbidden' });

  try {
    const brokerListings = await getBrokerListings(uid);
    if (!brokerListings.length) return res.json({ buyers: [], message: 'No active listings' });

    // Try PostgreSQL cache first
    const cached = await getCachedBrokerMatches(uid);
    if (cached) {
      const reqIds = cached.map((r) => r.req_id);
      const scoreMap = new Map(cached.map((r) => [r.req_id, r.score]));
      const snaps = await Promise.all(
        reqIds.map((id) => db.collection('requirements').doc(id).get()),
      );
      const buyers: MatchedBuyer[] = snaps
        .filter((s) => s.exists)
        .map((s) => {
          const r = { id: s.id, ...s.data() } as RequirementDoc;
          return reqToMatchedBuyer(r, scoreMap.get(s.id) ?? 0);
        })
        .sort((a, b) => b.match - a.match);
      return res.json({ buyers, source: 'cache' });
    }

    // On-demand: score all active requirements against broker's listings
    const allReqs = await getActiveRequirements();
    const scored = allReqs
      .map((req) => ({
        req,
        score: Math.max(...brokerListings.map((l) => matchScore(req, l))),
      }))
      .filter((r) => r.score >= 40)
      .sort((a, b) => b.score - a.score)
      .slice(0, 30);

    const buyers: MatchedBuyer[] = scored.map(({ req, score }) =>
      reqToMatchedBuyer(req, score),
    );

    return res.json({ buyers, source: 'live' });
  } catch (err) {
    console.error('GET /matches/broker error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

function reqToMatchedBuyer(r: RequirementDoc, score: number): MatchedBuyer {
  const anon = 'Buyer #' + r.uid.slice(-3).toUpperCase();
  return {
    id: r.id,
    anon,
    name: '',        // populated only after connection accepted (privacy)
    revealed: false,
    bhk: (r.bhk ?? []).join(' / '),
    budget: formatBudget(r.budgetMin ?? 0, r.budgetMax ?? 0),
    loc: r.localities ?? [],
    possession: r.possession ?? '',
    strict: r.strict ?? false,
    postedAt: formatPostedAt(r.createdAt),
    match: score,
  };
}

export default router;
