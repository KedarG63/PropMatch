import type { RequirementDoc, ListingDoc } from './types';

const TONES = ['a', 'b', 'c', 'd', 'e'] as const;

function hash31(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return h;
}

export function toneFromId(id: string): string {
  return TONES[hash31(id) % TONES.length];
}

export function idxFromId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 17 + id.charCodeAt(i)) & 0xffff;
  return h % 3;
}

export function priceToLakhs(price: string): number {
  const s = price.replace(/[₹,\s]/g, '');
  const part = s.split(/[–\-]/)[0].trim();
  const n = parseFloat(part);
  if (isNaN(n)) return 0;
  return /cr/i.test(s) ? Math.round(n * 100) : n;
}

export function formatBudget(min: number, max: number): string {
  const fmt = (n: number) => n >= 100 ? `₹${(n / 100).toFixed(2).replace(/\.?0+$/, '')} Cr` : `₹${n} L`;
  return `${fmt(min)} – ${fmt(max)}`;
}

export function formatPostedAt(ts: FirebaseFirestore.Timestamp | null): string {
  if (!ts) return '';
  const ms = Date.now() - ts.toMillis();
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? '1d ago' : `${d}d ago`;
}

/**
 * Score a listing against a buyer's requirement.
 * Returns 0–100. Returns 0 when req.strict and no locality match.
 */
export function matchScore(req: RequirementDoc, listing: ListingDoc): number {
  let score = 0;

  // BHK: +30
  if (listing.bhk && req.bhk?.includes(listing.bhk)) score += 30;

  // Budget: +25
  const price = priceToLakhs(listing.price);
  if (price > 0 && price >= req.budgetMin && price <= req.budgetMax) score += 25;

  // Locality: +20 or strict block
  const area = (listing.area ?? '').toLowerCase();
  const localityMatch = (req.localities ?? []).some((l) => {
    const loc = l.toLowerCase();
    return area.includes(loc) || loc.includes(area);
  });
  if (localityMatch) {
    score += 20;
  } else if (req.strict) {
    return 0;
  }

  // Possession: +15
  const listing_possession = derivePossession(listing);
  if (listing_possession && req.possession && possessionMatch(req.possession, listing_possession)) {
    score += 15;
  }

  // Property type: +10
  if (req.propertyTypes?.length && listing.title) {
    const titleLower = listing.title.toLowerCase();
    if (req.propertyTypes.some((t) => titleLower.includes(t.toLowerCase()))) score += 10;
  }

  return Math.min(score, 100);
}

function derivePossession(listing: ListingDoc): string {
  // Infer from title keywords until we have an explicit field
  const t = listing.title.toLowerCase();
  if (t.includes('ready') || t.includes('possession ready')) return 'Ready to Move';
  if (t.includes('under construction')) return 'Under Construction';
  return '';
}

function possessionMatch(reqPossession: string, listingPossession: string): boolean {
  if (reqPossession === 'Both') return true;
  return reqPossession.toLowerCase() === listingPossession.toLowerCase();
}
