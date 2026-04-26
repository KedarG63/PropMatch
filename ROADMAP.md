# PropMatch Mobile — Roadmap

> Last updated: 2026-04-26
> Current status: Phase 1 complete — Firebase Auth live (email/password, session persistence)

---

## Phase Overview

| Phase | Focus | Status |
|---|---|---|
| 0 | UI Shell (all screens, design system) | ✅ Done |
| 1 | Firebase Auth + real user accounts | ✅ Done |
| 2 | Firestore data layer (listings, requirements, visits, connections, chat) | 🔄 In Progress |
| 3 | Matching engine (Node.js backend + PostgreSQL) | After Phase 2 |
| 4 | Push notifications (FCM) | After Phase 3 |
| 5 | Media (photos, video) via GCS | After Phase 4 |
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

## Phase 2 — Firestore Data Layer 🔄

**Goal:** Replace all mock data with real Firestore reads/writes. By end of this phase the app is fully functional without any hardcoded data.

### Firestore collections

```
users/{uid}
  name, email, role, verified, fcmToken, createdAt

requirements/{reqId}                  ← Buyer posts
  uid, bhk[], budgetMin, budgetMax, localities[], strict,
  possession, propertyTypes[], notes, verifiedOnly, createdAt, active

listings/{listingId}                  ← Broker posts
  uid (broker), title, price, area, rera, floor, facing,
  tone, idx, photos[], videoUrl, status, views, createdAt

visits/{visitId}                      ← Buyer's visited log
  uid (buyer), title, broker, agent,
  pros[], cons[], notes, status, visitedAt

connections/{connId}                  ← Buyer ↔ Broker link
  buyerUid, brokerUid, listingId, requirementId,
  message, status (pending/accepted/rejected), createdAt

messages/{connId}/thread/{msgId}      ← Chat under a connection
  senderUid, text, cardRef (listingId), sentAt, read

mutes/{buyerUid}/brokers/{brokerUid}
  mutedAt
```

### Firestore security rules (set before any writes)
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

### Tasks

#### 2.1 — Visited Properties (Buyer — My Properties) ← Start here
- `visitsService.ts`: `addVisit`, `getVisits(uid)`, `updateVisitStatus`, `updateVisitNotes`
- `MyPropertiesScreen`: replace mock data with `onSnapshot` listener on `visits` where `uid == me`
- FAB "Add property visited" → bottom sheet form (title, broker, pros/cons, notes)
- Status toggle + notes edit → Firestore update

#### 2.2 — Post Requirement (Buyer)
- `requirementsService.ts`: `postRequirement`, `getMyRequirement(uid)`
- `PostRequirementScreen`: on submit, write to `requirements/{newId}`
- Show active requirement card at top of `MyPropertiesScreen`
- Deactivate old requirement when new one is posted (`active: false`)

#### 2.3 — Post Listing (Broker)
- `listingsService.ts`: `postListing`, `getBrokerListings(uid)`, `updateListingStatus`
- `PostListingScreen`: on submit, write to `listings/{newId}`
- `BrokerDashboardScreen` listings carousel: read real listings for current broker

#### 2.4 — Discover Feed (Buyer)
- `DiscoverScreen`: read `listings` ordered by `createdAt desc` (paginated, 10 at a time)
- Filter chips → Firestore query constraints (bhk array-contains, price range)
- Real broker name + verified status pulled from `users/{brokerUid}`

#### 2.5 — Connections
- `connectionsService.ts`: `sendConnectionRequest`, `getPendingConnections(brokerUid)`, `respondToConnection`
- ConnectSheet: on "Send Request" → write `connections/{newId}` with `status: pending`
- Broker Dashboard Pending tab: real list from Firestore
- Accept/Reject → update `status` field

#### 2.6 — Chat (real-time)
- `chatService.ts`: `sendMessage`, `subscribeToThread(connId, callback)`
- `ChatScreen`: `onSnapshot` for real-time messages
- `ChatsListScreen`: read all connections for current user + last message preview

---

## Phase 3 — Matching Engine (Backend)

**Goal:** Brokers see buyers ranked by match score; buyers see relevant listings first.

### Architecture

```
Node.js + Express API (Cloud Run or App Engine)
  ↓
PostgreSQL (Cloud SQL) — stores denormalized match scores
  ↑
Firestore triggers → Cloud Functions → compute score → write to PostgreSQL
```

### Matching logic

**Buyer requirement → Listing score:**
- BHK overlap: +30 pts if listing BHK in buyer's BHK list
- Budget overlap: +25 pts if listing price within buyer's budget range
- Locality overlap: +20 pts if listing locality in buyer's list; 0 if buyer `strict=true` and no match
- Possession match: +15 pts
- Property type match: +10 pts

**API endpoints:**
```
GET /matches/buyer/:uid        → ranked listings for buyer
GET /matches/broker/:uid       → ranked requirements for broker's listings
POST /verify/broker            → broker verification request
```

### Tasks

#### 3.1 Backend scaffold
- Node.js + Express + TypeScript project in `/backend`
- Cloud SQL (PostgreSQL) setup with schema migrations
- Docker + Cloud Run deployment config

#### 3.2 Match score Cloud Function
- Firestore trigger on `requirements` write → compute buyer↔listing scores
- Firestore trigger on `listings` write → compute listing↔requirement scores
- Write scores to PostgreSQL `matches` table

#### 3.3 Wire to mobile
- `DiscoverScreen`: call `/matches/buyer/:uid` instead of raw Firestore query
- `BrokerDashboardScreen` Matched tab: call `/matches/broker/:uid`

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
| New buyer requirement matching listing | Broker | "New buyer looking for your listing type" |

### Tasks

#### 4.1 Token management
- On login: get FCM token → write to `users/{uid}.fcmToken`
- Refresh token listener

#### 4.2 Cloud Functions notification triggers
- On `connections` write (new pending): notify broker
- On `connections` update (accepted): notify buyer
- On `messages` write: notify other party (respect mute records)
- On match score above threshold: notify buyer/broker

#### 4.3 Mobile foreground handling
- `expo-notifications` for in-app banner when app is foregrounded
- Deep link tap → navigate to relevant screen

---

## Phase 5 — Media (Photos & Video)

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
- Backend: when sending a message, check `mutes/{buyerUid}/brokers/{brokerUid}` — reject if muted
- Cloud Function: on mute write, revoke broker's ability to send via messaging rules

#### 6.2 Verified broker badge
- Manual verification flow: broker submits RERA number + ID
- Admin Cloud Function or manual Firestore write flips `users/{uid}.verified = true`
- `DiscoverScreen` "Verified only" filter → query `listings` joined on verified brokers
- `PostRequirementScreen` "Verified brokers only" toggle persists to requirement doc

#### 6.3 Rate limiting
- Cloud Function: count messages from broker to buyer in last 24h
- Block if > threshold (e.g., 10 messages/day to unconnected buyer)

#### 6.4 Connection-gated messaging
- Enforce at Firestore security rules: can only write to `messages/{connId}/thread` if a matching `connections` doc exists with `status: accepted`

---

## Phase 7 — Polish & App Store

**Goal:** Ship v1.0 to Play Store and App Store.

### Tasks

#### 7.1 Real onboarding
- Profile photo step
- "Post your first requirement" nudge for buyers after sign-up

#### 7.2 Empty states
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
