// Firestore document shapes used by the backend

export interface RequirementDoc {
  id: string;
  uid: string;
  bhk: string[];
  budgetMin: number;
  budgetMax: number;
  localities: string[];
  strict: boolean;
  possession: string;
  propertyTypes: string[];
  notes: string;
  verifiedOnly: boolean;
  active: boolean;
  createdAt: FirebaseFirestore.Timestamp | null;
}

export interface ListingDoc {
  id: string;
  uid: string;           // broker uid
  title: string;
  price: string;
  area: string;
  bhk: string;           // '1 BHK' | '2 BHK' | '3 BHK' | '4 BHK' | '4+ BHK'
  rera: string;
  floor: string;
  facing: string;
  brokerName: string;
  brokerFirm: string;
  photos: string[];
  videoUrl: string | null;
  status: 'Active' | 'Paused' | 'Sold';
  views: number;
  createdAt: FirebaseFirestore.Timestamp | null;
}

export interface UserDoc {
  uid: string;
  name: string;
  email: string;
  role: 'buyer' | 'broker';
  verified: boolean;
}

// API response types

export interface RankedListing {
  id: string;
  uid: string;
  title: string;
  price: string;
  sub: string;
  broker: string;
  firm: string;
  verified: boolean;
  rera: string | null;
  bhk: string;
  tone: string;
  idx: number;
  photos: number;
  video: boolean;
  score: number;
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
