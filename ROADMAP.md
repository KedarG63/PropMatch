# PropMatch Mobile — Roadmap

> Last updated: 2026-04-27
> Current status: Phase 4 complete — push notifications via Expo Push Service

---

## Phase Overview

| Phase | Focus | Status |
|---|---|---|
| 0 | UI Shell (all screens, design system) | ✅ Done |
| 1 | Firebase Auth + real user accounts | ✅ Done |
| 2 | Firestore data layer (listings, requirements, visits, connections, chat) | ✅ Done |
| 3 | Matching engine (Node.js backend + PostgreSQL) | ✅ Done |
| 4 | Push notifications (FCM) | ✅ Done |
| 5 | Media (photos) via Firebase Storage | ✅ Done |
| 6 | Anti-spam enforcement (mute, rate limit, verification) | After Phase 5 |
| 7 | Polish, onboarding flow, app store submission | Final |

---

## Phase 1 — Firebase Auth ✅ DONE

**Delivered:**
- Firebase JS SDK wired with email/password auth
- `WelcomeScreen` → `SignUpScreen` (2-step: role → profile) → `LoginScreen`
- `users/{uid}` Firestore doc created on sign-up (name, email, role, verified, createdAt)
- Session persistence via AsyncStorage UID cache (Firebase 12 removed `getReactNativePersistence`)
- `onAuthStateChanged` in `App.tsx` replaces manual role state
- `ProfileScreen` shows real name/email; Sign Out button wired
- Forgot password flow via `sendPasswordResetEmail`

---

## Phase 2 — Firestore Data Layer ✅ DONE

**Delivered:**
- All mock/hardcoded data replaced with live Firestore reads/writes
- `visitsService.ts` — buyer visited property log (add, subscribe, update status/notes/pros-cons)
- `requirementsService.ts` — buyer posts requirement; old requirement deactivated on new post
- `listingsService.ts` — broker posts listing; broker dashboard subscribes; paginated discover feed
- `connectionsService.ts` — buyer sends connection request; broker accepts/rejects; stores buyer+broker names
- `chatService.ts` — real-time chat thread via `onSnapshot`; `sendTextMessage` writes to Firestore subcollection
- All screens now accept and use `appUser: AppUser` prop (uid threaded through every write)
- `ChatsListScreen` shows pending/accepted connections with broker accept/decline inline
- `ChatScreen` subscribes to live thread when `connId` present, empty state for new connections
- Composite index issue fixed: removed compound `where()+orderBy()` queries; sort/filter client-side

### Firestore collection structure
```
users/{uid}
  name, email, role, verified, fcmToken, createdAt

requirements/{reqId}
  uid, bhk[], budgetMin, budgetMax, localities[], strict,
  possession, propertyTypes[], notes, verifiedOnly, createdAt, active

listings/{listingId}
  uid (broker), brokerName, brokerFirm, title, price, area, rera,
  floor, facing, photos[], videoUrl, status, views, createdAt

visits/{visitId}
  uid (buyer), title, price, broker, agent,
  pros[], cons[], notes, status, visitedAt

connections/{connId}
  buyerUid, buyerName, brokerUid, brokerName,
  listingId, listingTitle, listingPrice,
  message, status (pending/accepted/rejected), createdAt

connections/{connId}/thread/{msgId}
  senderUid, text, cardRef, sentAt, read

mutes/{buyerUid}/brokers/{brokerUid}
  mutedAt
```

### Firestore security rules
Set these in Firebase Console → Firestore → Rules before deploying to production:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    match /requirements/{reqId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == request.resource.data.uid;
      allow update, delete: if request.auth.uid == resource.data.uid;
    }
    match /listings/{listingId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == request.resource.data.uid;
      allow update, delete: if request.auth.uid == resource.data.uid;
    }
    match /visits/{visitId} {
      allow read, write: if request.auth.uid == resource.data.uid
                         || request.auth.uid == request.resource.data.uid;
    }
    match /connections/{connId} {
      allow read: if request.auth.uid == resource.data.buyerUid
                  || request.auth.uid == resource.data.brokerUid;
      allow create: if request.auth.uid == request.resource.data.buyerUid;
      allow update: if request.auth.uid == resource.data.brokerUid;
    }
    match /connections/{connId}/thread/{msgId} {
      allow read, write: if request.auth != null;
    }
    match /mutes/{buyerUid}/brokers/{brokerUid} {
      allow read, write: if request.auth.uid == buyerUid;
    }
  }
}
```

---

## Phase 3 — Matching Engine (Backend) ✅ DONE

**Delivered:**
- `backend/` — Node.js + Express + TypeScript API server
- `backend/src/scoring.ts` — `matchScore(req, listing)`: BHK +30, budget +25, locality +20 (strict block = 0), possession +15, property type +10, capped at 100
- `backend/src/routes/matches.ts` — `GET /matches/buyer/:uid` (ranked listings ≥40), `GET /matches/broker/:uid` (ranked buyers)
- `backend/src/auth.ts` — `requireAuth` middleware: Firebase ID token verification via Admin SDK
- `backend/src/firebase.ts` — `initializeApp({ credential: applicationDefault() })`, exports `db` and `adminAuth`
- `backend/.env` — `GOOGLE_APPLICATION_CREDENTIALS`, `FIREBASE_PROJECT_ID`, `PORT=8080`
- `backend/Dockerfile` — multi-stage build for Cloud Run
- `backend/migrations/001_init.sql` — `matches` + `req_matches` tables with indexes
- `functions/src/index.ts` — `onRequirementWritten` + `onListingWritten` Cloud Function triggers to upsert scores to PostgreSQL
- `src/services/apiService.ts` — `fetchRankedListings(uid)` + `fetchMatchedBuyers(uid)` with Firebase ID token auth header
- `DiscoverScreen` — ranked mode: calls API, shows `% MATCH` badge in sage green, "Matched for you" kicker
- `BrokerDashboardScreen` — Matched tab: replaces mock with live `fetchMatchedBuyers()` data
- `PostListingScreen` — BHK chip picker (required field) wired to listing doc
- `src/types/index.ts` — `bhk?: string`, `score?: number` on `Listing`
- `tsconfig.json` — `exclude: ["backend", "functions"]` to prevent tsc from picking up sub-projects
- `EXPO_PUBLIC_API_URL` — falls back to Firestore-only mode when unset

---

## Phase 4 — Push Notifications ✅ DONE

**Delivered:**
- `expo-notifications`, `expo-device`, `expo-constants` installed
- `app.json` — `expo-notifications` plugin with icon + accent color, Android RECEIVE_BOOT_COMPLETED + VIBRATE permissions
- `src/services/notificationsService.ts` — `registerForPushNotifications(uid)`: requests permission, gets Expo Push Token, saves to `users/{uid}.fcmToken`; `addNotificationTapListener(onTap)`: foreground notification tap → navigates to chats
- `App.tsx` — `useEffect` fires on appUser set: calls `registerForPushNotifications`, registers `addNotificationTapListener` to route taps to chats tab
- `functions/src/index.ts` — `sendExpoPush()` helper (calls `https://exp.host/--/api/v2/push/send`); three new triggers:
  - `onConnectionCreated` — new pending connection → push to broker
  - `onConnectionUpdated` — status → accepted → push to buyer
  - `onMessageSent` — new thread message → push to recipient (respects mute records)

---

## Phase 3 — Matching Engine (Backend) — ARCHIVED

**Goal:** Buyers see listings ranked by how well they match their requirement. Brokers see buyers ranked by match score. Currently the Discover feed shows all Active listings in chronological order — Phase 3 replaces this with scored, ranked results. (Delivered — see above.)

### Architecture

```
Mobile App (React Native)
    │
    ▼ REST calls
Node.js + Express API  ←  Firebase Admin SDK
    │                         │
    ▼                         ▼
PostgreSQL (Cloud SQL)   Firestore (source of truth)
  matches table            requirements, listings
    ▲
    │ writes
Cloud Functions (Firestore triggers)
  on requirements write → compute scores for all active listings
  on listings write     → compute scores for all active requirements
```

### Match scoring logic

**Buyer requirement vs Listing:**

| Signal | Points | Notes |
|---|---|---|
| BHK match | +30 | Listing BHK in buyer's selected BHK list |
| Budget match | +25 | Listing price within buyer's budgetMin–budgetMax |
| Locality match | +20 | Listing area in buyer's localities list |
| Locality strict block | −100 | If buyer `strict=true` and no locality match → score = 0 |
| Possession match | +15 | Ready-to-move vs under-construction matches |
| Property type match | +10 | Flat/Villa/Row House etc. |

Scores capped at 100. Listings below 40 not shown.

### PostgreSQL schema

```sql
CREATE TABLE matches (
  id           SERIAL PRIMARY KEY,
  buyer_uid    TEXT NOT NULL,
  listing_id   TEXT NOT NULL,
  score        INTEGER NOT NULL,
  computed_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (buyer_uid, listing_id)
);

CREATE INDEX ON matches (buyer_uid, score DESC);
CREATE INDEX ON matches (listing_id, score DESC);
```

### API endpoints

```
GET  /matches/buyer/:uid          → ranked listings for buyer (with listing fields)
GET  /matches/broker/:uid         → ranked requirements for broker's listings
POST /verify/broker               → broker RERA verification request (Phase 6)
```

### Tasks

#### 3.1 — Backend scaffold
- [ ] Create `/backend` directory: Node.js + Express + TypeScript
- [ ] Connect to Cloud SQL (PostgreSQL) via `pg` or `drizzle-orm`
- [ ] Run schema migrations (matches table)
- [ ] Deploy to Cloud Run (Dockerfile + `gcloud run deploy`)
- [ ] Add Firebase Admin SDK for auth token verification on API routes

#### 3.2 — Match score Cloud Function
- [ ] Firestore trigger: `onDocumentWritten('requirements/{reqId}')` → fetch all active listings → compute scores → upsert to PostgreSQL
- [ ] Firestore trigger: `onDocumentWritten('listings/{listingId}')` → fetch all active requirements → compute scores → upsert to PostgreSQL
- [ ] Score computation in shared `matchScore(requirement, listing): number` utility
- [ ] Deploy Cloud Functions from `/functions` directory

#### 3.3 — Wire to mobile
- [ ] `DiscoverScreen`: replace `getDiscoverListings()` Firestore query with `GET /matches/buyer/:uid`
- [ ] `BrokerDashboardScreen` Matched tab: replace mock `MATCHED_BUYERS` with `GET /matches/broker/:uid`
- [ ] Add auth header to API calls (Firebase ID token via `getIdToken()`)
- [ ] Loading + empty states already in place — just swap the data source

---

## Phase 4 — Push Notifications (FCM)

**Goal:** Real-time alerts without polling.

### Notification types

| Event | Recipient | Message |
|---|---|---|
| New connection request | Broker | "A buyer is interested in [listing]" |
| Connection accepted | Buyer | "[Broker] accepted your request" |
| New chat message | Both | "[Name]: [preview]" |
| New listing matching requirement | Buyer | "New 3 BHK in Baner matches your requirement" |

### Tasks

#### 4.1 Token management
- On login: get FCM token → write to `users/{uid}.fcmToken`
- Refresh token listener

#### 4.2 Cloud Functions notification triggers
- On `connections` write (new pending): notify broker
- On `connections` update (accepted): notify buyer
- On `thread` write: notify other party (respect mute records)
- On match score above threshold: notify buyer/broker

#### 4.3 Mobile foreground handling
- `expo-notifications` for in-app banner when app is foregrounded
- Deep link tap → navigate to relevant screen

---

## Phase 5 — Media (Photos) ✅ DONE

**Delivered:**
- `expo-image-picker` installed + plugin in `app.json` with photos permission string
- `src/services/storageService.ts` — `uploadListingPhotos(listingId, uris[])`: fetches each local URI as a blob, uploads to `listings/{listingId}/photo_{i}.jpg` in Firebase Storage, returns array of download URLs
- `src/services/firebase.ts` — exports `storage` (Firebase Storage instance)
- `src/services/listingsService.ts` — `photos` field mapped as `string[]` URLs from Firestore; `updateListingPhotos()` helper to patch the doc after upload; `NewListing.photos?` optional
- `src/types/index.ts` — `Listing.photos: string[]` (was `number`)
- `PostListingScreen` — photo zone taps `launchImageLibraryAsync()` (multi-select, up to 5); thumbnail strip with ✕ per photo + add-more tile; upload progress label during submit; two-step post: create doc → upload photos → patch URLs
- `PropertyPhoto` — accepts `photos?: string[]`; when photos present: horizontal paging `ScrollView` with `Image` per photo, synced dot indicator via `onMomentumScrollEnd`; gradient building art shown as fallback when no photos
- `DiscoverScreen` — passes `photos={l.photos}` to `PropertyPhoto`; removed static dots (now managed inside `PropertyPhoto`)

**Firebase Storage rules to set:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /listings/{listingId}/{file} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## Phase 5 — Media (Photos & Video) — ARCHIVED

**Goal:** Brokers upload real listing photos/videos; buyers see them.

### Tasks

#### 5.1 Photo upload (Broker — Post Listing)
- `expo-image-picker` for selecting photos from camera roll
- Upload to Google Cloud Storage via signed URL (generated by backend)
- Write GCS URLs to `listings/{id}.photos[]`

#### 5.2 Photo carousel (Buyer — Discover + My Properties)
- Replace `PropertyPhoto` gradient placeholder with real `Image` components
- Horizontal swipe carousel with dot indicators (dots already in UI)
- Lazy load / progressive load for feed performance

#### 5.3 Video
- `expo-video` for playback
- Broker can upload one video per listing
- Video badge already present in `PropertyPhoto` component

---

## Phase 6 — Anti-Spam Enforcement

**Goal:** Make the mute and verified-only features actually work.

### Tasks

#### 6.1 Mute enforcement
- Mute UI already exists in `ChatScreen` (buyer-side)
- Backend: check `mutes/{buyerUid}/brokers/{brokerUid}` before allowing message send
- Cloud Function: on mute write, revoke broker's ability to send via messaging rules

#### 6.2 Verified broker badge
- Manual verification: broker submits RERA number + ID
- Admin Cloud Function or manual Firestore write flips `users/{uid}.verified = true`
- `DiscoverScreen` "Verified only" filter wired to real `verified` flag
- `PostRequirementScreen` "Verified brokers only" toggle persists to requirement doc

#### 6.3 Rate limiting
- Cloud Function: count messages from broker to buyer in last 24h; block above threshold

#### 6.4 Connection-gated messaging
- Enforce at security rules: can only write to `thread` if `connections` doc with `status: accepted` exists

---

## Phase 7 — Polish & App Store

**Goal:** Ship v1.0 to Play Store and App Store.

### Tasks

#### 7.1 Real onboarding
- Profile photo step
- "Post your first requirement" nudge for buyers after sign-up

#### 7.2 Empty states (already partially done — verify all screens)
- `MyPropertiesScreen`: "You haven't visited any properties yet."
- `DiscoverScreen`: "No listings match your requirement yet."
- `ChatsListScreen`: "No conversations yet."
- `BrokerDashboardScreen`: "Post your first listing to start getting matched."

#### 7.3 Error states + offline handling
- Network error banners
- Firestore offline cache (already enabled by default in JS SDK)
- Retry logic for failed writes

#### 7.4 App store assets
- Splash screen with PropMatch logo
- Screenshots for store listing
- Privacy policy URL (required for both stores)

#### 7.5 EAS Build
- Configure `eas.json` for development / preview / production profiles
- `eas build --platform android` → APK / AAB for Play Store
- `eas build --platform ios` → IPA for App Store

#### 7.6 Analytics
- Firebase Analytics for key events (requirement posted, listing posted, connection made)
