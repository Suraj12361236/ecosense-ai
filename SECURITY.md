# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ Yes    |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public GitHub issue.

Instead, report it privately:
1. Open a GitHub Security Advisory in this repository (Security → Advisories → New draft advisory)
2. Or email the maintainer directly with subject line `[EcoSense AI] Security Vulnerability`

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if known)

We will respond within **48 hours** and aim to patch confirmed vulnerabilities within **7 days**.

## Security Measures

### API Key Protection
- API keys (Gemini, Anthropic) are stored exclusively as server-side environment variables
- Keys are never committed to the repository (see `.gitignore`)
- The frontend communicates only with `/api/claude` — a serverless proxy — never directly with AI provider APIs in production

### HTTP Security Headers (via `vercel.json`)
- `Content-Security-Policy` — restricts resource loading to known safe origins
- `Strict-Transport-Security` — enforces HTTPS with preloading
- `X-Frame-Options: DENY` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing
- `Cross-Origin-Opener-Policy: same-origin` — isolates browsing context
- `Cross-Origin-Resource-Policy: same-origin` — restricts cross-origin resource sharing
- `Permissions-Policy` — disables camera, microphone, and payment APIs

### Data Storage
- All user data is stored in `localStorage` (client-side only)
- No personal data is transmitted to any server except AI prompts (which contain only emission numbers, not PII)
- The community leaderboard stores only a display name, sustainability score, and footprint figure — no accounts or passwords

### Dependencies
- Dependencies are pinned to minor version ranges to avoid unexpected breaking changes
- Run `npm audit` regularly to check for known vulnerabilities
