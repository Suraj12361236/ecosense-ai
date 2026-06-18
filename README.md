# EcoSense AI 🌱
**Carbon Footprint Awareness Platform**

> A smart, dynamic AI assistant that helps individuals understand, track, and reduce their carbon footprint through logical decision making and personalized insights.

---

## 1. Chosen Vertical

**Carbon Footprint Awareness** — the assistant persona is a personal climate coach that:
- Understands user lifestyle context from natural language input
- Applies logical decision-making to prioritize the highest-impact reduction actions
- Provides practical, real-world recommendations tailored to each user's actual data
- Tracks progress over time and adapts its suggestions as habits change

---

## 2. Smart Assistant Design

### Logical Decision Making Based on User Context

The assistant applies multi-layer reasoning to every interaction:

**Layer 1 — Data collection**
6-category lifestyle wizard captures transport, energy, food, water, waste, and shopping habits. Every field maps to a validated emission factor.

**Layer 2 — Contextual analysis**
```
computeFootprint(inputs) → per-category breakdown + total tons CO₂e
```
The system doesn't apply generic averages — it computes your exact footprint from your exact inputs.

**Layer 3 — Gap reasoning**
```
result.totalTons vs PARIS_TARGET (2.0t) vs NATIONAL_AVG (1.9t) vs GLOBAL_AVG (4.7t)
```
The assistant reasons about *where you stand* before making any recommendation.

**Layer 4 — Priority ranking**
```
buildRoadmap(inputs, result) → actions sorted by actual CO₂ saving potential
```
Only actions relevant to the user's habits appear. Savings are calculated per-user ("switching half your 50km/week petrol commute saves 0.23t/year"), not hardcoded.

**Layer 5 — Predictive reasoning**
```
computePredictions(entries) → trend detection → next-month + yearly projection
```
The system detects whether habits are improving or worsening and flags the fastest-growing emission category.

**Layer 6 — Natural language coaching**
The AI Climate Coach receives the user's live footprint breakdown as context alongside every message, enabling genuinely personalized responses rather than generic climate advice.

### Practical and Real-World Usability

- **Bill Scanner**: upload a real electricity bill photo/PDF → AI reads the kWh → auto-fills the calculator. Zero manual entry for the most common input.
- **India-specific factors**: grid emission factor (CEA 2023), LPG cylinder (14.2 kg standard), domestic flight averages — not US/Europe defaults.
- **Offline-first**: calculator, dashboard, predictions, roadmap, gamification all work with zero API key. AI features are additive, not required.
- **Persistent state**: all data saved to localStorage — reload the page, your history is intact.

---

## 3. How the Solution Works

### Architecture
```
User Input
    ↓
React Wizard (6 steps)
    ↓
computeFootprint() ← pure function, zero side effects
    ↓
├── Dashboard (gauge + charts)
├── buildRoadmap() → prioritized actions
├── computePredictions() → trend + forecast
├── computeTreesNeeded() → offset target
└── computeSustainabilityScore() → 0-100 score
    ↓
AI Coach: user message + live footprint context → /api/claude (serverless) → Gemini API
```

### Key Flows

| Flow | Logic |
|---|---|
| Calculator | inputs → emission factors → kg CO₂e per source → tons/year |
| Roadmap | per-user saving = (current habit − better habit) × factor × 52 weeks |
| Prediction | linear avg delta across consecutive log entries |
| Score | linear interpolation between Paris target (100) and global avg (0) |
| Tree offset | totalTons × 1000 ÷ 21 kg/tree/year, ceiling, minimum 1 |

### Pages
| Page | Purpose |
|---|---|
| Dashboard | Score gauge, breakdown pie, trend chart, benchmarks |
| Calculator | 6-step wizard, live pie preview, save to log |
| AI Coach | Natural language, context-aware plan generation |
| Bill Scanner | Upload bill → AI OCR → auto-fill electricity field |
| Predictions | Trend detection, next-month/yearly projection |
| Roadmap | Prioritized actions, estimated savings, progress |
| Tree Offset | Trees needed, planting log, visual grid |
| Challenges | XP, levels, daily missions, 7 achievement badges |
| Leaderboard | Community ranking by sustainability score |
| Green Hub | Recycling guide, eco tips, green product picks |
| Analytics | Historical charts, CSV export, print report |
| Profile | Score, badges, goal tracking, history |

---

## 4. Clean and Maintainable Code

### File structure (separation of concerns)
```
src/
├── constants.js       # All emission factors and reference values (JSDoc documented)
├── calculations.js    # All pure functions (fully JSDoc + unit tested)
├── ErrorBoundary.jsx  # React error boundary (class component)
├── storage-polyfill.js# localStorage shim for window.storage API
├── App.jsx            # UI components (PropTypes on every component)
├── App.test.js        # 65+ unit tests (Vitest + no mocks needed for pure functions)
├── test-setup.js      # jsdom + jest-dom + ResizeObserver mocks
└── main.jsx           # Entry point with ErrorBoundary wrapper
```

### Code quality measures
- **PropTypes** on every React component
- **JSDoc** on every exported function and typedef
- **ESLint** config (`.eslintrc.cjs`) with react, react-hooks, and jsx-a11y plugins
- **Pure functions** — `computeFootprint`, `buildRoadmap`, `computePredictions` have zero side effects, making them trivially testable
- **`useCallback` / `useMemo`** for all expensive computations and stable function references
- **Error boundary** catches render errors gracefully instead of blank screen
- **No `console.log`** in production code

---

## 5. Assumptions Made

- **Emission factors** are India-weighted averages. Grid factor: CEA 2023 (0.82 kg CO₂e/kWh). LPG: standard 14.2 kg cylinder. Transport: MoRTH averages. Food: IPCC AR6.
- **Tree absorption**: 21 kg CO₂/year per mature tree (commonly cited average; varies by species and age).
- **Shopping factor**: embedded carbon modeled as proportional to spend (₹ × 0.0005 kg CO₂e) — a simplified proxy; lifecycle assessment would be more accurate in production.
- **Water factor**: 0.00035 kg CO₂e/litre via pumping + treatment energy (WHO/CPHEEO estimates).
- **Prediction model**: linear extrapolation from average delta — sufficient for MVP trend detection; ARIMA or ML would be more accurate for production.
- **Leaderboard**: uses shared localStorage in standalone deployment — not truly cross-user without a backend. Supabase or Firebase would enable real sharing.
- **AI features** require an API key. All non-AI features work without one.
- **EV emissions** are not zero — they reflect India's grid emission factor applied to electricity consumption, not a zero-emission assumption.

---

## 6. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Vite | Fast HMR, small bundle, modern JSX |
| Charts | Recharts | Declarative, accessible, composable |
| Icons | lucide-react | Tree-shakeable, consistent style |
| AI backend | Vercel serverless → Gemini API | Key stays server-side, zero backend infra |
| Storage | localStorage (window.storage polyfill) | Offline-first, no account required |
| Testing | Vitest + React Testing Library | Fast, ESM-native, jest-compatible |
| Linting | ESLint + jsx-a11y + react-hooks | Catches bugs and a11y issues at write time |
| Security | vercel.json security headers | CSP, HSTS, X-Frame, CORP, COOP |
| Deployment | Vercel | Zero-config, auto-deploys from GitHub |

---

## 7. Run Locally

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # 65+ unit tests
npm run lint         # ESLint check
npm run build        # production build
```

**Optional — AI features (Climate Coach + Bill Scanner):**
```bash
cp .env.example .env
# Add GEMINI_API_KEY=your-key (free at aistudio.google.com/app/apikey)
```

---

## 8. Security

- API key server-side only (`api/claude.js` Vercel function, env var)
- Never in browser or repository
- HTTP headers via `vercel.json`: CSP, HSTS, X-Frame-Options: DENY, X-Content-Type-Options, CORP, COOP, Permissions-Policy
- See [SECURITY.md](./SECURITY.md) for vulnerability reporting

---

## 9. Accessibility (WCAG 2.1 AA)

- Skip-to-main-content link
- `aria-label`, `aria-pressed`, `aria-current`, `aria-live`, `aria-expanded` on all interactive elements
- Semantic HTML: `<main>`, `<nav>`, `<header>`, `<section>`, `<fieldset>`, `<legend>`, `<dl>`, `<ol>`, `<ul>`
- Visible focus indicators (`:focus-visible` outline)
- Decorative icons: `aria-hidden="true"`
- Charts: `role="img"` + descriptive `aria-label`
- `prefers-reduced-motion` — disables all animations
- `prefers-contrast: high` — increases border widths
