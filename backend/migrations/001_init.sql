-- Match scores: pre-computed by Cloud Functions, read by API
CREATE TABLE IF NOT EXISTS matches (
  id           SERIAL PRIMARY KEY,
  buyer_uid    TEXT NOT NULL,
  listing_id   TEXT NOT NULL,
  score        INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  computed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (buyer_uid, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_buyer  ON matches (buyer_uid, score DESC);
CREATE INDEX IF NOT EXISTS idx_matches_listing ON matches (listing_id, score DESC);

-- Requirement ↔ Broker scores (broker sees ranked buyers)
CREATE TABLE IF NOT EXISTS req_matches (
  id           SERIAL PRIMARY KEY,
  broker_uid   TEXT NOT NULL,
  req_id       TEXT NOT NULL,
  listing_id   TEXT NOT NULL,
  score        INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  computed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (broker_uid, req_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_req_matches_broker ON req_matches (broker_uid, score DESC);
