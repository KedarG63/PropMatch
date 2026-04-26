export type Role = 'buyer' | 'broker';
export type PropertyStatus = 'shortlisted' | 'undecided' | 'rejected';
export type PropertyTone = 'a' | 'b' | 'c' | 'd' | 'e';

export interface VisitedProperty {
  id: string;
  title: string;
  price: string;
  tone: PropertyTone;
  idx: number;
  photos: number;
  video: boolean;
  visited: string;
  broker: string;
  agent: string;
  pros: string[];
  cons: string[];
  notes: string;
  status: PropertyStatus;
}

export interface Listing {
  id: string;
  tone: PropertyTone;
  idx: number;
  photos: number;
  video: boolean;
  badge?: string;
  title: string;
  price: string;
  sub: string;
  broker: string;
  firm: string;
  verified: boolean;
  rera: string | null;
  dropFrom?: string;
}

export interface BrokerListing {
  id: string;
  tone: PropertyTone;
  idx: number;
  title: string;
  price: string;
  status: 'Active' | 'Paused' | 'Sold';
  views: number;
}

export interface MatchedBuyer {
  id: string;
  anon: string;
  name: string;
  revealed: boolean;
  bhk: string;
  budget: string;
  loc: string[];
  possession: string;
  strict: boolean;
  postedAt: string;
  match: number;
}

export interface ChatThread {
  name: string;
  who: string;
}

export interface ChatMessage {
  id: number;
  who: 'me' | 'them';
  t?: string;
  card?: { title: string; price: string; sub: string; tone: PropertyTone; idx: number };
  time: string;
}
