# EcoSense AI 🌱

A premium, AI-powered carbon footprint platform: calculate, track, predict and
reduce your emissions with personalized insights, gamification, and a
community leaderboard.

---

## 1. Run it locally

Requirements: [Node.js](https://nodejs.org) 18+ and npm.

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

The app will run and the calculator, dashboard, predictions, roadmap, tree
offset, gamification, green hub and analytics pages all work immediately —
no API key needed for those.

---

## 2. AI features (Climate Coach & Bill Scanner)

These two features call an AI model and need an Anthropic API key on a small
serverless backend (so the key is never exposed in the browser).

1. Create a key at https://console.anthropic.com
2. Copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`
3. When deployed to Vercel (see below), the included `api/claude.js`
   serverless function automatically proxies requests using that key.

Without a key configured, every other page still works — only the AI Coach
chat and Bill Scanner analysis will show an error message.

> Note: the brief mentioned Gemini. This project ships with an Anthropic
> (Claude) backend because it's the simplest to wire up with zero extra
> SDKs. To use Gemini instead, edit `api/claude.js` to call the Gemini API
> and adjust the request/response shape — the frontend only cares that it
> gets back `{ content: [{ text: "..." }] }`.

---

## 3. Deploy (easiest: Vercel)

### Option A — Vercel CLI
```bash
npm install -g vercel
vercel
```
Follow the prompts. Then add your environment variable:
```bash
vercel env add ANTHROPIC_API_KEY
```
and redeploy with `vercel --prod`.

### Option B — Vercel dashboard (no CLI)
1. Push this folder to a GitHub repo.
2. Go to https://vercel.com/new and import the repo.
3. Vercel auto-detects Vite — no config needed.
4. In **Project Settings → Environment Variables**, add `ANTHROPIC_API_KEY`.
5. Deploy. You'll get a public `https://your-project.vercel.app` URL.

The `api/claude.js` file is automatically picked up by Vercel as a
serverless function at `/api/claude`.

---

## 4. Deploy to Netlify (alternative)

Netlify also supports Vite out of the box:

```bash
npm run build
```

Then drag the generated `dist/` folder into https://app.netlify.com/drop,
or connect your GitHub repo for continuous deploys.

For the AI features on Netlify, convert `api/claude.js` into a
[Netlify Function](https://docs.netlify.com/functions/overview/) (the logic
is the same — forward the request body to `api.anthropic.com` with your key
from an environment variable), and place it in `netlify/functions/claude.js`.

---

## 5. Important notes about data storage

This app was originally built for an environment that provides a built-in
`window.storage` key-value API. `src/storage-polyfill.js` replaces that with
`localStorage` so the app runs anywhere.

- **Personal data** (your inputs, history, goals, badges, XP) is saved per
  browser/device via `localStorage`. It will persist across reloads but not
  across devices or browsers.
- **"Shared" data** (the community leaderboard) is currently also stored in
  `localStorage`, so each visitor only sees their own entries — it is **not**
  a real shared leaderboard yet.

To make the leaderboard genuinely shared across users, replace the calls in
`src/storage-polyfill.js` (the `shared = true` branch) with calls to a real
backend + database — e.g. [Supabase](https://supabase.com) (free tier, has a
simple JS client and a hosted Postgres table) is a quick option:

1. Create a `leaderboard` table with columns `name`, `score`, `footprint`, `date`.
2. In `storage-polyfill.js`, when `shared` is true, call Supabase's
   `insert`/`select` instead of `localStorage`.
3. Everything else in the app stays the same.

---

## 6. Project structure

```
ecosense-ai/
├── api/
│   └── claude.js        # Serverless proxy to the AI API (Vercel function)
├── src/
│   ├── App.jsx           # Entire application (pages, components, logic)
│   ├── main.jsx           # React entry point
│   ├── storage-polyfill.js  # localStorage-based window.storage shim
│   └── index.css          # Base styles
├── index.html
├── package.json
├── vite.config.js
├── .env.example
└── README.md
```

---

## 7. Customizing emission factors

All emission factors and reference values (India average, global average,
1.5°C target, tree absorption rate, etc.) are defined as constants near the
top of `src/App.jsx` — update them with sources relevant to your region or
audience.
