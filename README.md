# EcoSense AI 🌱

**Carbon Footprint Awareness Platform** — helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized AI-driven insights.

Built for PromptWars Virtual Challenge 3.

---

## Problem Statement Alignment

| Requirement | Implementation |
|---|---|
| Understand carbon footprint | Interactive dashboard with gauge, pie chart, category breakdown |
| Track emissions over time | Log history, trend line chart, CSV export |
| Reduce footprint | Personalized roadmap, AI Climate Coach, daily missions |
| Simple actions | One-click mission completion, step-by-step wizard |
| Personalized insights | AI coach analyzes YOUR data, not generic tips |

---

## Features

- **Smart Carbon Calculator** — 6-step wizard: transport, energy, food, water/waste, shopping. Real-time live preview.
- **AI Climate Coach** — natural language conversation, personalized reduction plan, monthly targets, CO₂ savings estimate.
- **Bill Scanner** — upload electricity bill image/PDF, AI extracts kWh via OCR, auto-fills calculator.
- **Carbon Prediction Engine** — trend detection, next-month & yearly projection, risk category flagging.
- **Personalized Reduction Roadmap** — priority-ranked actions, estimated savings per action, progress tracking.
- **Tree Offset Calculator** — trees needed to offset annual footprint, visual grid, planting log.
- **Gamification** — XP points, levels, daily missions, 7 achievement badges, sustainability score.
- **Community Leaderboard** — global ranking by sustainability score, shared persistent storage.
- **Green Hub** — recycling guidance, 8 eco tips, green product recommendations.
- **Analytics & Reports** — historical bar chart, full log table, CSV download, print-to-PDF.
- **Dark / Light mode** — system-aware, persisted across sessions.
- **Fully responsive** — sticky sidebar on desktop, bottom nav + overflow menu on mobile.
- **Accessible** — WCAG 2.1 AA: skip links, ARIA labels/roles, keyboard navigation, focus indicators, reduced-motion support, high-contrast media query.

---

## Tech Stack

- **Frontend**: React 18 + Vite
- **Charts**: Recharts (line, bar, pie)
- **Icons**: lucide-react
- **AI**: Google Gemini API (via serverless proxy) / Anthropic Claude API
- **Deployment**: Vercel (serverless functions for AI proxy)
- **Testing**: Vitest + React Testing Library (55+ tests)
- **Security**: CSP, HSTS, X-Frame-Options, CORP, COOP headers via vercel.json

---

## Run Locally

Requires Node.js 18+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # run test suite
npm run build      # production build
```

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
vercel env add GEMINI_API_KEY   # or ANTHROPIC_API_KEY
vercel --prod
```

Or connect GitHub repo at vercel.com/new — auto-detects Vite, zero config.

---

## Environment Variables

| Variable | Purpose |
|---|---|
| `GEMINI_API_KEY` | Google Gemini API key (free tier at aistudio.google.com) |
| `OPENROUTER_API_KEY` | Alternative: OpenRouter key for free model access |

API key is server-side only (`api/claude.js` serverless function) — never exposed to browser.

---

## Emission Factors

All factors are India-weighted averages (kg CO₂e):

| Source | Factor |
|---|---|
| Petrol car | 0.192 kg/km |
| Indian grid electricity | 0.82 kg/kWh |
| LPG cylinder (14.2 kg) | 42.6 kg CO₂e |
| Tree absorption | 21 kg CO₂/year |

Reference values: India average 1.9 t/year, Global average 4.7 t/year, 1.5°C target 2.0 t/year.

---

## Project Structure

```
ecosense-ai/
├── api/
│   └── claude.js          # Serverless AI proxy (Gemini/Anthropic)
├── src/
│   ├── App.jsx            # Full application (components, logic, styles)
│   ├── App.test.js        # 55+ unit + integration tests
│   ├── test-setup.js      # Vitest + jsdom + jest-dom setup
│   ├── storage-polyfill.js # localStorage shim for window.storage API
│   ├── main.jsx           # React entry point
│   └── index.css          # Base reset
├── index.html
├── package.json
├── vite.config.js
├── vitest.config.js
├── vercel.json            # Security headers + function config
└── .env.example
```
