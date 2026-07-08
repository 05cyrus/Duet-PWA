# Deploying Duet

Duet is a standard Next.js 15 app — deploy to **Vercel** (recommended) or
**Firebase Hosting**. Both keep the AI assistant's server route working.

## Prerequisites (both targets)

1. A Firebase project with **Auth (Google, Email/Password, Phone)**,
   **Firestore** and **Storage** enabled.
2. Security rules deployed:
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use <project-id>
   firebase deploy --only firestore:rules,firestore:indexes,storage
   ```
3. Your production domain added to **Authentication → Settings →
   Authorized domains** (e.g. `duet.vercel.app`).

---

## Option A — Vercel (recommended)

1. Push the repo to GitHub/GitLab.
2. [vercel.com/new](https://vercel.com/new) → import the repo. Vercel
   auto-detects Next.js; no build settings needed.
3. Add the environment variables from `.env.example` under
   **Settings → Environment Variables** (at minimum the six
   `NEXT_PUBLIC_FIREBASE_*` values; optionally `NEXT_PUBLIC_FIREBASE_VAPID_KEY`,
   `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_TENOR_API_KEY`).
4. Deploy. Done ✅

CLI alternative:

```bash
npm i -g vercel
vercel            # first deploy, follow prompts
vercel env add NEXT_PUBLIC_FIREBASE_API_KEY   # repeat per variable
vercel --prod
```

## Option B — Firebase Hosting (App Hosting / web frameworks)

`firebase.json` is already configured with `frameworksBackend`, which builds
and serves Next.js (including the API route) on Cloud Functions.

```bash
npm i -g firebase-tools
firebase login
firebase experiments:enable webframeworks
firebase use <project-id>

# put your env vars in .env.local (build-time) — server-only secrets:
firebase functions:secrets:set ANTHROPIC_API_KEY   # optional

firebase deploy
```

> Firebase's web-frameworks support requires the **Blaze** plan (server code
> runs on Cloud Functions).

---

## Post-deploy checklist

- [ ] Open the site → Chrome DevTools → **Lighthouse → PWA**: installability,
      service worker and offline checks should pass (SW only registers in
      production builds).
- [ ] Install on a phone (Android: install banner / iOS: Share → Add to Home
      Screen) and confirm the splash + standalone window.
- [ ] Sign in with two accounts, pair them with the invite code, exchange a
      chat message and confirm realtime sync.
- [ ] Airplane-mode test: dashboard renders from cache, Geometry Track plays,
      `/offline` appears for uncached pages.
- [ ] If push is configured: Settings → Enable push, then send a test message
      from Firebase console → Cloud Messaging.

## Push notification backend (optional)

Client tokens are saved on `users/{uid}.fcmTokens`. To actually send pushes
(daily reminders, anniversary countdowns, partner activity), add a small Cloud
Function using `firebase-admin`, e.g. a Firestore trigger on
`couples/{coupleId}/notifications/{id}` that reads the recipient's tokens and
calls `admin.messaging().sendEachForMulticast(...)`, plus a scheduled function
(`pubsub.schedule('every day 09:00')`) for daily reminders. The in-app
notification center works without any backend.

## Performance notes

- Every game is dynamically imported → small route chunks.
- Images are compressed client-side before upload and lazy-loaded.
- Firestore persistent cache + the service worker give warm loads < 1s.
- Fonts are self-hosted through `next/font` (no layout shift).
