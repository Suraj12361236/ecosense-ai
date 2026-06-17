# EcoSense AI 🌱
**Carbon Footprint Awareness Platform**

> Helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized AI-driven insights.

---

## 1. Chosen Vertical

**Carbon Footprint Awareness** — designed around a sustainability assistant persona that acts as a personal climate coach. The assistant understands user lifestyle data, reasons about emission sources, and provides actionable, context-aware reduction plans.

---

## 2. Approach & Logic

### Smart Assistant Design
The core logic treats carbon footprint calculation as a multi-dimensional reasoning problem:

1. **Input collection** — 6 lifestyle categories (transport, energy, food, water, waste, shopping) collected via a guided wizard
2. **Emission computation** — deterministic calculation using India-weighted emission factors (kg CO₂e per unit)
3. **Gap analysis** — compares user total against 3 benchmarks: 1.5°C-aligned target (2.0t), India average (1.9t), Global average (4.7t)
4. **Prioritized recommendations** — roadmap items ranked by actual CO₂ saving potential, not generic tips
5. **Prediction engine** — linear trend detection across saved entries, projects next-month and yearly emissions
6. **AI coaching** — natural language interface sends user context + live footprint data to AI model, receives personalized reduction plan

### Decision Making Logic
- Roadmap actions only appear if they apply to the user's actual inputs (e.g. flight tip only shown if user flies)
- Savings are calculated per-user, not hardcoded ("switching half your 50km/week petrol driving saves 0.23t/year")
- Badge unlock conditions check real app state (entries saved, footprint level, actions completed)
- Prediction requires minimum 2 data points — gracefully degrades with empty state UI

---

## 3. How the Solution Works

### Architecture
```
User → React Frontend → Emission Calculator (pure functions)
                     → AI Proxy (Vercel serverless) → Gemini/Claude API
                     → localStorage (via window.storage polyfill)
```

### Key Flows

**Calculator flow:**
```
User inputs → computeFootprint() → breakdown by category
           → computeSustainabilityScore() → 0-100 score
           → computeTreesNeeded() → offset target
           → buildRoadmap() → ranked action items
```

**AI Coach flow:**
```
User message + live footprint context → /api/claude (serverless)
→ Gemini API → personalized plan → chat UI
```

**Prediction flow:**
```
Saved entries (≥2) → linear delta avg → next month projection
                  → 4x delta → yearly projection
                  → highest rising category → risk flag
```

### Pages & Features
| Page | Purpose |
|---|---|
| Dashboard | Score gauge, breakdown pie, trend chart, benchmarks |
| Calculator | 6-step wizard, live preview, save to log |
| AI Coach | Natural language chat, context-aware plan generation |
| Bill Scanner | Upload electricity bill image/PDF → AI OCR → auto-fill |
| Predictions | Trend detection, next-month/yearly projection |
| Roadmap | Prioritized actions, estimated savings, progress tracking |
| Tree Offset | Trees needed to offset footprint, planting log, visual grid |
| Challenges | XP system, daily missions, 7 achievement badges, levels |
| Leaderboard | Community ranking by sustainability score |
| Green Hub | Recycling guidance, eco tips, green product suggestions |
| Analytics | Historical charts, CSV export, print report |
| Profile | Score, badges, goal tracking, history |

---

## 4. Assumptions Made

- **Emission factors** are India-weighted averages from publicly available sources (CEA grid factor 0.82 kg CO₂e/kWh, IPCC food estimates, MoRTH transport data). Factors are illustrative and tunable.
- **LPG cylinder** assumed 14.2 kg standard Indian cylinder = 42.6 kg CO₂e.
- **Tree absorption** assumed 21 kg CO₂/year per mature tree (commonly cited average).
- **Shopping emissions** modeled as embedded carbon proportional to spend (₹ × factor) — simplified proxy for lifecycle emissions.
- **Water emissions** modeled via pumping + treatment energy factor (0.00035 kg CO₂e/litre).
- **Prediction** uses simple linear extrapolation — sufficient for MVP, would need ARIMA/ML for production accuracy.
- **Leaderboard** uses shared localStorage-based storage (same-device only in standalone deployment). A real backend (e.g. Supabase) would enable true cross-user sharing.
- **AI features** require an API key (Gemini free tier or Anthropic). All other features work without a key.

---

## 5. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Charts | Recharts (line, bar, pie) |
| Icons | lucide-react |
| AI backend | Vercel serverless function → Gemini API |
| Storage | localStorage (window.storage polyfill) |
| Testing | Vitest + React Testing Library (62 tests) |
| Security | CSP, HSTS, X-Frame-Options, CORP, COOP (vercel.json) |
| Deployment | Vercel (zero-config, auto-deploys from GitHub) |

---

## 6. Run Locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # run 62-test suite
npm run build      # production build
```

**Environment variables** (optional — only for AI features):
```
GEMINI_API_KEY=your-key-here   # free at aistudio.google.com/app/apikey
```

---

## 7. Security

- API key stored server-side only (Vercel env var → serverless function)
- Never exposed to browser or committed to repo
- HTTP security headers via `vercel.json`: `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, `Permissions-Policy`

---

## 8. Accessibility

- WCAG 2.1 AA compliant design
- Skip-to-main-content link
- All interactive elements: `aria-label`, `aria-pressed`, `aria-current`, `aria-live`, `aria-expanded`
- Semantic HTML: `<main>`, `<nav>`, `<header>`, `<section>`, `<fieldset>`, `<legend>`, `<dl>`, `<ol>`, `<ul>`
- Keyboard navigable — visible focus indicators on all interactive elements
- `prefers-reduced-motion` media query — disables animations
- `prefers-contrast: high` media query — increases border widths
- Screen reader support: decorative icons marked `aria-hidden="true"`, charts have `role="img"` + `aria-label` descriptions
