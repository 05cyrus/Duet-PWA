# Duet 💞 — Our Little Universe

A premium, installable **couple relationship PWA**: memories, chat, games, plans and little
rituals — one private home for two people. Built with **Next.js 15, React 19, TypeScript,
Tailwind CSS 4, Framer Motion and Firebase**.

![stack](https://img.shields.io/badge/Next.js-15-black) ![react](https://img.shields.io/badge/React-19-blue) ![firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20Storage-orange) ![pwa](https://img.shields.io/badge/PWA-offline%20ready-f43f6e)

## ✨ Features

| Area | Highlights |
|---|---|
| **Couple pairing** | Google / email / phone-OTP login, 6-char invite codes, anniversary setup |
| **Dashboard** | Days-together counter, relationship level & XP, love score, moods, today's memory, upcoming events, daily quote, quick notes, weather, love statistics |
| **Timeline** | First meet → today; photos, videos, location, captions, tags, filters |
| **Gallery** | Albums, favorites, reactions, comments, download, auto slideshow |
| **Chat** | Realtime messages, emoji, GIFs (Tenor), voice notes, images, read receipts, typing indicator, pinned messages, search |
| **15 Love Games** | Love Quiz, Couple Trivia, This or That, Truth or Dare, Never Have I Ever, Spin the Bottle, Guess the Emoji, Memory Match, Sliding Puzzle, Tic Tac Toe, Connect Four, Hangman, Word Search, Love Bingo, Daily Challenge |
| **Geometry Track** | Canvas dash game: physics, spikes & blocks, coins, 3 levels, checkpoints, 6 skins, synthesized music & SFX, particles, 3 difficulties, leaderboard, achievements, keyboard + touch, fully offline |
| **Trackers** | Habits with streaks & 30-day charts, mood tracker with combined analytics & mood-sync score |
| **Planning** | Shared calendar (recurring events, Google Calendar links), bucket list with savings goals |
| **Love Letters** | Rich-text editor, drafts, scheduled delivery, passphrase-sealed letters, favorites |
| **AI Assistant** | "Cupid" — Claude-powered date/gift/trip/food ideas with an offline rule-based fallback |
| **Music** | Spotify embeds, shared playlist, favorites, song dedications |
| **Location** | Opt-in live location, distance & ETA, safe-arrival notification |
| **Gamification** | XP, coins, levels, achievements, per-game leaderboards |
| **PWA** | Installable on Android/iOS/Windows/macOS, offline caching, push notifications, install prompt, offline page |

## 🚀 Quick start

```bash
# 1. Install
npm install

# 2. Configure Firebase
cp .env.example .env.local     # then fill in your Firebase web config

# 3. Run
npm run dev
```

### Firebase setup (one time, ~5 minutes)

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication → Sign-in method**: enable *Google*, *Email/Password* and *Phone*.
3. **Firestore Database**: create in production mode.
4. **Storage**: enable.
5. **Project settings → Your apps → Web**: register an app and copy the config
   into `.env.local`.
6. Deploy the security rules and indexes:
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use <your-project-id>
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
7. *(Optional, for push)* **Project settings → Cloud Messaging → Web Push
   certificates → Generate key pair** → put it in `NEXT_PUBLIC_FIREBASE_VAPID_KEY`.

### Optional integrations

| Feature | Env var | Where to get it |
|---|---|---|
| AI Assistant | `ANTHROPIC_API_KEY` | [platform.claude.com](https://platform.claude.com) (server-side only — never exposed to the browser) |
| GIFs in chat | `NEXT_PUBLIC_TENOR_API_KEY` | [Tenor API](https://developers.google.com/tenor) (free) |

Both features degrade gracefully when unset.

## 📁 Project structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/             # login, signup (centered glass layout)
│   ├── (app)/              # authenticated app (guarded shell)
│   │   ├── dashboard/ timeline/ gallery/ chat/
│   │   ├── games/          # hub, [gameId], geometry
│   │   ├── habits/ moods/ calendar/ bucket-list/ letters/
│   │   ├── assistant/ music/ location/ leaderboard/
│   │   └── profile/ settings/
│   ├── api/assistant/      # Claude-powered assistant route
│   ├── pair/               # couple pairing + anniversary flow
│   ├── offline/            # SW offline fallback page
│   ├── layout.tsx manifest.ts not-found.tsx page.tsx
├── components/
│   ├── ui/                 # GlassCard, Button, Modal, Toggle, Skeleton…
│   ├── layout/             # AppShell, nav, notifications bell
│   ├── charts/             # accessible mood/habit charts
│   ├── dashboard/ timeline/ gallery/ chat/ letters/
│   └── games/              # GameShell + 15 games + geometry engine
├── hooks/                  # useCoupleCollection, useGameScore, useInstallPrompt…
├── lib/
│   ├── firebase/           # client, db, storage, messaging
│   ├── games/              # decks, registry
│   └── content.ts types.ts utils.ts
└── providers/              # Theme, Toast, Auth, Couple
public/sw.js                # hand-written service worker
firestore.rules storage.rules firebase.json
```

## 🗄️ Data model (Firestore)

```
users/{uid}                          # profile, coupleId, FCM tokens
couples/{coupleId}                   # members, names, inviteCode, anniversary, xp, coins
  ├── messages/       ├── timeline/     ├── albums/    ├── gallery/
  ├── calendar/       ├── habits/       ├── moods/     ├── bucketList/
  ├── letters/        ├── scores/       ├── achievements/
  ├── notes/          ├── music/        ├── locations/ ├── notifications/
  └── meta/settings, meta/typing
```

All couple data lives under `couples/{coupleId}` and is readable/writable
**only by the two members** — enforced in `firestore.rules` / `storage.rules`.

## 🔒 Security

- Firestore & Storage rules restrict every document to the couple's members.
- Chat messages validate sender identity and cap length; updates are limited to
  reactions/read-receipts/pins.
- Letters can be passphrase-sealed (SHA-256, never stored in plain text).
- Rich text is sanitised on save **and** render.
- The assistant API route validates input, caps sizes and rate-limits per IP;
  the Anthropic key stays server-side.
- Images are compressed client-side; storage caps uploads at 60 MB and
  image/video/audio MIME types.

## 📱 PWA

- `manifest.webmanifest` (via `app/manifest.ts`) with maskable icons & shortcuts.
- Hand-written `public/sw.js`: precache, network-first navigations with an
  offline fallback page, cache-first hashed assets, stale-while-revalidate
  runtime cache, push + notification-click handlers, background-sync hook.
- Install prompt surfaced on the landing page and in Settings.
- The Geometry Track game and Firestore-backed pages work offline
  (Firestore persistent cache queues writes).

Regenerate icons anytime: `node scripts/generate-icons.mjs`.

## 🧞 Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `node scripts/generate-icons.mjs` | Regenerate PWA icons |

## 🚢 Deployment

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for step-by-step Vercel and Firebase
Hosting guides (both take under 10 minutes).

---

Made with 💖 — your data belongs to the two of you.
