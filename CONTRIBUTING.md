# Contributing to EcoSense AI

Thank you for your interest in improving EcoSense AI!

## Project Structure

```
ecosense-ai/
├── api/
│   └── claude.js          # Serverless AI proxy (Vercel function)
├── src/
│   ├── constants.js        # Emission factors, reference values, static data
│   ├── calculations.js     # Pure functions (computeFootprint, predictions, etc.)
│   ├── ErrorBoundary.jsx   # React error boundary
│   ├── storage-polyfill.js # localStorage shim for window.storage API
│   ├── App.jsx             # All UI pages and components
│   ├── App.test.js         # Unit + integration tests
│   ├── test-setup.js       # Vitest + jsdom + jest-dom config
│   ├── main.jsx            # React entry point
│   └── index.css           # Base CSS reset
├── vercel.json             # Security headers + serverless function config
├── .eslintrc.cjs           # ESLint rules
├── vitest.config.js        # Test runner config
└── vite.config.js          # Build config
```

## Development Setup

```bash
git clone https://github.com/your-username/ecosense-ai.git
cd ecosense-ai
npm install
npm run dev
```

## Before Submitting a PR

1. **Run tests** — all must pass:
   ```bash
   npm test
   ```

2. **Check linting** — zero warnings:
   ```bash
   npm run lint
   ```

3. **Build check** — must succeed:
   ```bash
   npm run build
   ```

## Adding Emission Factors

All emission factors live in `src/constants.js`. When updating:
- Cite your source in a comment
- Update the corresponding test in `src/App.test.js`
- Update the README emission factor table

## Adding a New Page

1. Create the component in `src/App.jsx` (or a new file for large pages)
2. Add it to `NAV_ITEMS` in `src/App.jsx`
3. Add a case to the `renderPage()` switch
4. Add PropTypes for all props
5. Add a JSDoc comment block

## Code Style

- **Pure functions** go in `calculations.js` — no React imports, no side effects
- **Constants** go in `constants.js`
- **Components** must have PropTypes and JSDoc
- **No `console.log`** in committed code (use `console.error` / `console.warn` only)
- **Accessibility first** — every interactive element needs `aria-label` or visible text

## Updating Emission Factors

EcoSense AI uses India-weighted averages. Good sources:
- Grid emission factor: [CEA CO2 Baseline Report](https://cea.nic.in)
- Transport: [MoRTH Annual Report](https://morth.nic.in)
- Food: [IPCC AR6 Working Group III](https://www.ipcc.ch/ar6/)
- Water: [WHO / CPHEEO Guidelines](https://mohfw.gov.in)
