import { auth } from './firebase';
import type { Listing, MatchedBuyer } from '../types';

const BASE = process.env.EXPO_PUBLIC_API_URL ?? '';

async function authHeader(): Promise<{ Authorization: string } | Record<string, never>> {
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchRankedListings(uid: string): Promise<Listing[] | null> {
  if (!BASE) return null;
  try {
    const headers = await authHeader();
    const res = await fetch(`${BASE}/matches/buyer/${uid}`, { headers });
    if (!res.ok) return null;
    const data = await res.json() as { listings?: Listing[] };
    return data.listings ?? [];
  } catch {
    return null;
  }
}

export async function fetchMatchedBuyers(uid: string): Promise<MatchedBuyer[] | null> {
  if (!BASE) return null;
  try {
    const headers = await authHeader();
    const res = await fetch(`${BASE}/matches/broker/${uid}`, { headers });
    if (!res.ok) return null;
    const data = await res.json() as { buyers?: MatchedBuyer[] };
    return data.buyers ?? [];
  } catch {
    return null;
  }
}
