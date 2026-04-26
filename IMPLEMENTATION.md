# PropMatch Mobile — Implementation Log

> Last updated: 2026-04-26
> Status: Phase 2 complete — full Firestore data layer live, all mock data removed

---

## Tech Stack

| Layer | Choice | Version |
|---|---|---|
| Framework | Expo (managed workflow) | ~55.0.0 |
| Runtime | React Native | 0.83.6 |
| Language | TypeScript | ~5.9.2 |
| UI | React Native core + expo-linear-gradient | — |
| Fonts | @expo-google-fonts (Playfair Display, DM Sans, DM Mono) | ^0.4.2 |
| Navigation | Manual tab state machine in App.tsx | — |
| Auth | Firebase Auth (email/password via Firebase JS SDK) | ^12.12.1 |
| Database | Firestore (live — all screens wired) | ^12.12.1 |
| Session persistence | @react-native-async-storage/async-storage | ~2.1.2 |
| Backend (planned) | Node.js + Express on Cloud Run | — |
| Database (planned) | PostgreSQL on Cloud SQL (match scores) | — |
| Storage (planned) | Google Cloud Storage | — |
| Push notifications (planned) | Firebase Cloud Messaging | — |
| Repo | https://github.com/KedarG63/PropMatch | branch: master |

---

## Design System (`src/theme/index.ts`)

### Color Palette
```
cream    #F5F0E8   — page background
paper    #FAF6EE   — card background
ink      #1C1C1E   — primary text / active states
ink2     #2A2A2D
ink3     #4A4A4E
muted    #7A7570   — secondary text
line     #E6DFD3   — borders
line2    #D8CFBE
rust     #C8553D   — primary accent / CTA
rustDeep #A8442F
rustSoft #F4DCD3
gold     #B8935A   — premium accent
goldSoft #EADFC8
sage     #6B8E5A   — pro/positive
sageSoft #DDE6D0
clay     #A85A4A   — con/negative
claySoft #F0D9D2
background #E4DAC5
```

### Typography
```
serif        PlayfairDisplay_600SemiBold   — headings, screen titles
serifBold    PlayfairDisplay_700Bold
serifItalic  PlayfairDisplay_400Regular_Italic — taglines, decorative
sans         DMSans_400Regular             — body copy
sansMedium   DMSans_500Medium
sansBold     DMSans_700Bold
mono         DMMono_400Regular             — labels, kickers, captions
monoMedium   DMMono_500Medium
```

### Shadows
Three levels (sm / md / lg) defined as `shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`, `elevation`.

---

## File Structure

```
propmatch-mobile/
├── App.tsx                          ← root shell, font loading, auth state machine, screen router
├── index.ts                         ← Expo entry
├── app.json                         ← Expo config (name, slug, SDK)
├── package.json
├── tsconfig.json
├── .env                             ← Firebase config (EXPO_PUBLIC_* vars)
├── src/
│   ├── theme/index.ts               ← Colors, Fonts, Shadow tokens
│   ├── types/index.ts               ← All TypeScript interfaces + AppUser
│   ├── services/
│   │   ├── firebase.ts              ← Firebase init, auth, Firestore, UID persistence helpers
│   │   ├── userService.ts           ← createUserDoc / getUserDoc (users/{uid})
│   │   ├── visitsService.ts         ← addVisit, subscribeVisits, updateVisitStatus/Notes/ProsCons
│   │   ├── requirementsService.ts   ← postRequirement, getActiveRequirement
│   │   ├── listingsService.ts       ← postListing, subscribeBrokerListings, getDiscoverListings
│   │   ├── connectionsService.ts    ← sendConnectionRequest, subscribeBuyer/BrokerConnections, respondToConnection
│   │   └── chatService.ts           ← subscribeChatThread, sendTextMessage
│   ├── components/
│   │   ├── PropertyPhoto.tsx        ← Gradient building placeholder
│   │   ├── Tags.tsx                 ← ProTag / ConTag pills
│   │   ├── EditorialHeader.tsx      ← Kicker + serif title + count
│   │   ├── ChipRow.tsx              ← Horizontal filter chip scroll
│   │   ├── BottomNav.tsx            ← Tab bar with raised + button
│   │   ├── BottomSheet.tsx          ← Modal slide-up sheet
│   │   ├── Toast.tsx                ← Animated auto-hide toast
│   │   └── ConnectSheet.tsx         ← Connection request sheet (async onSend → Firestore)
│   └── screens/
│       ├── auth/
│       │   ├── WelcomeScreen.tsx
│       │   ├── SignUpScreen.tsx
│       │   └── LoginScreen.tsx
│       ├── buyer/
│       │   ├── MyPropertiesScreen.tsx   ← live Firestore visits
│       │   ├── PostRequirementScreen.tsx ← writes to requirements
│       │   └── DiscoverScreen.tsx        ← paginated listings feed
│       ├── broker/
│       │   ├── BrokerDashboardScreen.tsx ← live broker listings
│       │   └── PostListingScreen.tsx     ← writes to listings
│       └── shared/
│           ├── ChatScreen.tsx            ← real-time Firestore thread
│           ├── ChatsListScreen.tsx       ← connections with accept/decline
│           └── ProfileScreen.tsx
└── claude_design/                   ← Reference HTML/JSX from claude.ai/design
```

---

## TypeScript Data Models (`src/types/index.ts`)

| Type | Purpose |
|---|---|
| `Role` | `'buyer' \| 'broker'` |
| `AppUser` | Firestore user doc shape: uid, name, email, role, verified, createdAt, fcmToken |
| `PropertyStatus` | `'shortlisted' \| 'undecided' \| 'rejected'` |
| `PropertyTone` | `'a' \| 'b' \| 'c' \| 'd' \| 'e'` — controls gradient color scheme |
| `VisitedProperty` | Full buyer property record (id, title, price, tone, photos, pros, cons, notes, status, broker) |
| `Listing` | Discover feed listing — includes `uid` (broker's Firebase UID) for connection requests |
| `BrokerListing` | Broker's own listing (status: Active/Paused/Sold, views) |
| `MatchedBuyer` | Buyer matched to broker's listing (anon name, bhk, budget, locs, match %) |
| `ChatThread` | `{ name, who, connId? }` — `connId` is the Firestore connections doc ID for real-time chat |
| `ChatMessage` | Message with optional text or property card embed |

---

## Services

### `firebase.ts`
- Initialises Firebase app (reads `EXPO_PUBLIC_FIREBASE_*` from `.env`)
- Exports `auth` (Firebase Auth with `inMemoryPersistence`) and `db` (Firestore)
- Firebase 12 removed `getReactNativePersistence` — workaround: UID stored in AsyncStorage (`@propmatch/uid`) and restored on cold start
- Exports `saveUid`, `loadStoredUid`, `clearStoredUid` helpers

### `userService.ts`
- `createUserDoc(uid, { name, email, role })` — writes `users/{uid}` on sign-up
- `getUserDoc(uid)` → `AppUser | null`

### `visitsService.ts`
- `addVisit(uid, { title, price, broker, agent })` — creates visit doc
- `subscribeVisits(uid, callback)` — onSnapshot, sorted by `visitedAt` desc client-side
- `updateVisitStatus(id, status)` / `updateVisitNotes(id, notes)` / `updateVisitProsCons(id, pros, cons)`

### `requirementsService.ts`
- `postRequirement(uid, data)` — deactivates previous requirement, writes new one
- `getActiveRequirement(uid)` → `Requirement | null`

### `listingsService.ts`
- `postListing(uid, data)` → doc ID
- `subscribeBrokerListings(uid, callback)` — onSnapshot for broker's own listings
- `getDiscoverListings(pageSize, after?)` — paginated query ordered by `createdAt desc`, active filter client-side

### `connectionsService.ts`
- `sendConnectionRequest({ buyerUid, buyerName, brokerUid, brokerName, listingId, listingTitle, listingPrice, message })` → connId
- `subscribeBuyerConnections(buyerUid, callback)` — all connections for buyer, sorted by `createdAt` desc
- `subscribeBrokerConnections(brokerUid, status|'all', callback)` — broker's connections, status filtered client-side
- `respondToConnection(id, 'accepted'|'rejected')` — updates `status` field

### `chatService.ts`
- `subscribeChatThread(connId, myUid, callback)` — onSnapshot on `connections/{connId}/thread`, ordered by `sentAt`
- `sendTextMessage(connId, senderUid, text)` — writes to thread subcollection

---

## Auth Flow (`App.tsx`)

1. App opens → fonts load + `loadStoredUid()` runs in parallel
2. If stored UID found and Firebase auth is in-memory (cold start) → `getUserDoc(uid)` → restore session without sign-in prompt
3. `onAuthStateChanged` listener: on sign-in → `saveUid`, fetch user doc, set role-appropriate default tab; on sign-out → `clearStoredUid`, reset to WelcomeScreen
4. Auth views: `welcome` → `signup` (2-step) or `login`
5. Authenticated: renders main app with `BottomNav`, role-based screen routing

---

## Screen Routing (`App.tsx`)

All authenticated screens receive `appUser: AppUser`. Role-based routing:

**Buyer tabs:** `home` (MyProperties) → `discover` (Discover) → `post` (PostRequirement) → `chats` (ChatsList / ChatScreen) → `profile`

**Broker tabs:** `broker` (BrokerDashboard) → `post` (PostListing) → `chats` (ChatsList / ChatScreen) → `profile`

`ConnectSheet` wired in App.tsx: `onSend(message)` calls `sendConnectionRequest(...)` then dismisses sheet and shows toast.

---

## Components

### `PropertyPhoto`
- Gradient architectural building placeholder (no real images in Phase 2)
- `tone` (`'a'–'e'`): sky/building color; `idx` (0–2): silhouette layout
- `toneFromId` / `idxFromId` hash functions in service files ensure same doc ID → same gradient always

### `ConnectSheet`
- `onSend: (message: string) => Promise<void>` — async, shows `ActivityIndicator` while in flight
- Property preview strip, 240-char textarea, privacy note

### `ChatsListScreen`
- Accepts/Pending split sections
- Broker: inline Accept / Decline buttons call `respondToConnection`
- Buyer: pending shows waiting state, accepted shows "Active" chip with tap-to-open

### `ChatScreen`
- If `thread.connId` present: subscribes to real Firestore thread
- `send()` calls `sendTextMessage` when connId present
- `ScrollView` auto-scrolls to bottom on new messages
- Empty state for new connections ("Say hello!")

---

## Firebase Project

- **Project ID:** `propmatch-mobile`
- **Auth:** Email/Password enabled
- **Firestore:** Enabled, `asia-south1` region
- **Rules:** Currently in test mode — set production rules from ROADMAP.md before launch
- **Config:** stored in `.env` as `EXPO_PUBLIC_*` variables

---

## Known Firestore Notes

- **No composite indexes created** — all compound `where()+orderBy()` queries removed; sorting/filtering done client-side. This is fine for current data volume. Phase 3 backend handles ranking via PostgreSQL anyway.
- **Firestore offline cache** — enabled by default in JS SDK; app works on intermittent connections
- **Realtime listeners** — all `onSnapshot` subscriptions return `Unsubscribe` and are cleaned up in `useEffect` return

---

## Git History (key commits)

1. `init: scaffold Expo SDK 55 project with editorial design system`
2. `feat: implement all screens from claude_design/ reference files`
3. `chore: upgrade Expo SDK 54 → 55 for Expo Go compatibility`
4. `feat: Phase 1 — Firebase Auth (email/password, session persistence)`
5. `feat: Phase 2 — replace all mock data with live Firestore`
6. `fix: remove composite index queries to avoid Firestore index errors`
