import { Pool } from 'pg';

// Pool is null when DATABASE_URL is not set — routes fall back to on-demand Firestore computation
export const pool: Pool | null = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : null;

export async function upsertMatch(
  buyerUid: string,
  listingId: string,
  score: number,
): Promise<void> {
  if (!pool) return;
  await pool.query(
    `INSERT INTO matches (buyer_uid, listing_id, score, computed_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (buyer_uid, listing_id)
     DO UPDATE SET score = EXCLUDED.score, computed_at = NOW()`,
    [buyerUid, listingId, score],
  );
}

export async function upsertReqMatch(
  brokerUid: string,
  reqId: string,
  listingId: string,
  score: number,
): Promise<void> {
  if (!pool) return;
  await pool.query(
    `INSERT INTO req_matches (broker_uid, req_id, listing_id, score, computed_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (broker_uid, req_id, listing_id)
     DO UPDATE SET score = EXCLUDED.score, computed_at = NOW()`,
    [brokerUid, reqId, listingId, score],
  );
}

export async function getCachedBuyerMatches(
  buyerUid: string,
): Promise<Array<{ listing_id: string; score: number }> | null> {
  if (!pool) return null;
  const res = await pool.query<{ listing_id: string; score: number }>(
    `SELECT listing_id, score FROM matches
     WHERE buyer_uid = $1 AND score >= 40
     ORDER BY score DESC LIMIT 50`,
    [buyerUid],
  );
  return res.rows.length > 0 ? res.rows : null;
}

export async function getCachedBrokerMatches(
  brokerUid: string,
): Promise<Array<{ req_id: string; score: number }> | null> {
  if (!pool) return null;
  const res = await pool.query<{ req_id: string; score: number }>(
    `SELECT req_id, MAX(score) AS score FROM req_matches
     WHERE broker_uid = $1 AND score >= 40
     GROUP BY req_id
     ORDER BY score DESC LIMIT 30`,
    [brokerUid],
  );
  return res.rows.length > 0 ? res.rows : null;
}
