# PropMatch Mobile — Implementation Log

> Last updated: 2026-04-26
> Status: Phase 1 complete — Firebase Auth live, running on Expo Go (SDK 55)

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
| Database | Firebase Firestore (wired in Phase 2) | ^12.12.1 |
| Session persistence | @react-native-async-storage/async-storage | ~2.1.2 |
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
├── App.tsx                          ← root shell, font loading, auth state machine
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
│   │   └── userService.ts           ← createUserDoc / getUserDoc (users/{uid})
│   ├── components/
│   │   ├── PropertyPhoto.tsx        ← Gradient building placeholder
│   │   ├── Tags.tsx                 ← ProTag / ConTag pills
│   │   ├── EditorialHeader.tsx      ← Kicker + serif title + count
│   │   ├── ChipRow.tsx              ← Horizontal filter chip scroll
│   │   ├── BottomNav.tsx            ← Tab bar with raised + button
│   │   ├── BottomSheet.tsx          ← Modal slide-up sheet
│   │   ├── Toast.tsx                ← Animated auto-hide toast
│   │   └── ConnectSheet.tsx         ← Connection request sheet content
│   └── screens/
│       ├── auth/
│       │   ├── WelcomeScreen.tsx    ← Landing: hero + Get Started / Sign In
│       │   ├── SignUpScreen.tsx     ← 2-step: role picker → name/email/password
│       │   └── LoginScreen.tsx      ← Email + password + forgot password
│       ├── buyer/
│       │   ├── MyPropertiesScreen.tsx
│       │   ├── PostRequirementScreen.tsx
│       │   └── DiscoverScreen.tsx
│       ├── broker/
│       │   ├── BrokerDashboardScreen.tsx
│       │   └── PostListingScreen.tsx
│       └── shared/
│           ├── ChatScreen.tsx
│           ├── ChatsListScreen.tsx
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
| `Listing` | Discover feed listing (badge, title, price, broker, verified, rera, dropFrom) |
| `BrokerListing` | Broker's own listing (status: Active/Paused/Sold, views) |
| `MatchedBuyer` | Buyer matched to broker's listing (anon name, bhk, budget, locs, match %) |
| `ChatThread` | `{ name, who }` — minimal thread ref |
| `ChatMessage` | Message with optional text or property card embed |

---

## Services

### `firebase.ts`
- Initialises Firebase app (reads `EXPO_PUBLIC_FIREBASE_*` from `.env`)
- Exports `auth` (Firebase Auth with `inMemoryPersistence`) and `db` (Firestore)
- Firebase 12 removed `getReactNativePersistence` — workaround: UID is stored in AsyncStorage (`@propmatch/uid`) and restored on cold start by `App.tsx`
- Exports `saveUid`, `loadStoredUid`, `clearStoredUid` helpers

### `userService.ts`
- `createUserDoc(uid, { name, email, role })` — writes `users/{uid}` to Firestore on sign-up
- `getUserDoc(uid)` → `AppUser | null` — reads user doc, maps Firestore timestamp to ISO string

---

## Auth Flow (`App.tsx`)

1. App opens → fonts load + `loadStoredUid()` runs in parallel
2. If stored UID found and Firebase auth is in-memory (cold start) → `getUserDoc(uid)` → restore session without sign-in prompt
3. `onAuthStateChanged` listener: on sign-in → `saveUid`, fetch user doc, set role-appropriate default tab; on sign-out → `clearStoredUid`, reset to WelcomeScreen
4. Auth views: `welcome` → `signup` (2-step) or `login`
5. Authenticated: renders main app with `BottomNav`, role-based screen routing

---

## Components

### `PropertyPhoto`
- Renders gradient architectural building placeholder (no real images needed at this stage)
- `tone` prop (`'a'–'e'`) controls sky/building color scheme
- `idx` prop (0–2) controls building silhouette layout variant
- Layers: sky gradient → building blocks → ground strip → bottom vignette
- Accepts `height`, `label`, `video` props

### `ProTag` / `ConTag` (Tags.tsx)
- Pill labels for property pros (sage green `#DDE6D0`) and cons (clay red `#F0D9D2`)
- DM Mono font, uppercase, 10px

### `EditorialHeader`
- DM Mono kicker (uppercase, rust or muted color, letter-spaced)
- Playfair Display serif title
- Optional numeric count badge
- Optional right-side slot (ReactNode)

### `ChipRow`
- Horizontal `ScrollView` of filter chips (no scroll indicator)
- Active chip: ink background + cream text
- Inactive chip: transparent + line2 border + ink3 text

### `BottomNav`
- 5-tab bar: Home, Discover/Matched, **+** (center, raised), Chats, Profile
- Center `+` button: rust background, `translateY: -6`, circular
- Active tab: rust bar above icon, rust icon color
- Unread badge support (red dot with count)
- Role-aware: buyer tabs differ from broker tabs

### `BottomSheet`
- React Native `Modal` with `animationType="slide"`
- Backdrop tap-to-close
- Handle bar (36×4 rounded pill)
- `borderTopLeftRadius/TopRightRadius: 24`

### `Toast`
- Positioned absolutely at bottom center
- `Animated.Value` for opacity + `translateY`
- Auto-dismisses after 2.5s
- Paper background, ink text, DM Mono font

### `ConnectSheet`
- Content rendered inside `BottomSheet` when connecting to a broker
- Property preview strip (photo thumbnail + title + price)
- 240-character `TextInput` for intro message
- Privacy note (buyer name not revealed until both connect)
- "Send Request" rust CTA button

---

## Screens

### Auth Screens

#### `WelcomeScreen`
- Full-bleed `PropertyPhoto` hero (300px, tone c, idx 1) with dark gradient overlay
- "PropMatch · Pune" mono kicker on hero
- "Find your home. On your terms." serif heading
- Body copy + Verified Brokers / No Spam / Pune Market pill row
- "Get Started" rust CTA → SignUpScreen
- "I already have an account" link → LoginScreen

#### `SignUpScreen`
- **Step 1 — Role picker**: same editorial card design as original OnboardingScreen; Continue button disabled until role selected
- **Step 2 — Profile**: Full Name, Email, Password inputs + role badge + "Create Account" button
- `createUserWithEmailAndPassword` → `createUserDoc` on success
- Error handling with `Alert` for weak password, invalid email, Firebase errors

#### `LoginScreen`
- "Sign in to PropMatch" serif heading
- Email + Password inputs
- "Forgot?" link → `sendPasswordResetEmail` (fires only if email field is filled)
- "Sign In" rust CTA → `signInWithEmailAndPassword`
- Friendly error messages for `auth/invalid-credential`

### `MyPropertiesScreen` (buyer — Home tab)
- `EditorialHeader`: "My Visited Properties" + count
- `ChipRow`: All / Shortlisted / Undecided / Rejected filters
- Property cards with: `PropertyPhoto` (180px), status badge, pros/cons tags, collapsible notes, 3-way status toggle, Chat button
- Floating `+` FAB ("Add property visited") — *mock data, Phase 2 wires Firestore*

### `PostRequirementScreen` (buyer — + tab)
- BHK multi-select, budget stepper (min/max ₹ lakhs), locality chips, strict toggle, possession segmented control, property type grid, notes, verified-only toggle
- "Post Requirement" CTA — *mock submit, Phase 2 writes to Firestore*

### `DiscoverScreen` (buyer — Discover tab)
- Listing cards with NEW/PRICE DROP badges, save button, broker strip, "Send connection request" → ConnectSheet
- *Mock data, Phase 2 reads from Firestore listings*

### `BrokerDashboardScreen` (broker — Home tab)
- KPI strip, listings carousel, matched buyers with 3 sub-tabs (Matched/Connections/Pending)
- *Mock data, Phase 2 wires Firestore*

### `PostListingScreen` (broker — + tab)
- Photo upload zone (dashed), Title/Price/Area/RERA/Floor/Facing fields
- *Mock submit, Phase 2 writes to Firestore*

### `ChatScreen` (shared)
- `KeyboardAvoidingView`, anti-spam mute banner (buyer-only), message bubbles, property card messages, attach panel
- *Mock messages, Phase 2 wires Firestore real-time listener*

### `ChatsListScreen` (shared — Chats tab)
- Thread list with unread badge, verified tick, property context line
- *Mock data, Phase 2 reads from connections + messages*

### `ProfileScreen` (shared — Profile tab)
- Profile card with real name/email/initials from `AppUser`
- Menu items (Privacy, Credentials, Notifications, Help)
- Demo role switcher (dev only)
- **Sign Out** button → `signOut(auth)` + `clearStoredUid()` → WelcomeScreen

---

## Firebase Project

- **Project ID:** `propmatch-mobile`
- **Auth:** Email/Password enabled
- **Firestore:** Enabled, `asia-south1` region, test mode rules
- **Config:** stored in `.env` as `EXPO_PUBLIC_*` variables

---

## Git History (key commits)

1. `init: scaffold Expo SDK 55 project with editorial design system`
2. `feat: implement all screens from claude_design/ reference files`
3. `chore: upgrade Expo SDK 54 → 55 for Expo Go compatibility`
4. `feat: Phase 1 — Firebase Auth (email/password, session persistence)`
