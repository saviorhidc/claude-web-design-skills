# Changelog

All notable changes to this project are documented here.

## [1.0.0] — 2026-05-09

The pack ships seven Claude Code skills, four reviewer agents, a security-first deploy workflow, and an early eval harness.

### Skills

- **`frontend-design`** — Bold aesthetic direction before code. WCAG 2.2 AA contrast/motion floor, `prefers-reduced-motion` guidance, named warm/cool palette options.
- **`frontend-security`** — 16-point security checklist (§1–§16 including IDOR/BOLA): secrets, auth, input validation, SQL/RLS, XSS, CSRF, headers, uploads, cookies, rate limiting, CORS, dependencies, error handling.
- **`frontend-prompting`** — SPADE framework (Spec, Persona, Anchors, Done-criteria, Examples) with a 4-round iteration strategy. Single source of truth for SPADE across the pack.
- **`frontend-actionable-tips`** — Top 10 Next.js + Tailwind + Framer Motion techniques: design-system-first, component-by-component, centralised animation variants.
- **`frontend-performance`** — Performance budgets, Core Web Vitals, bundle-size guidance for Next.js + Tailwind.
- **`vercel-deploy`** — Pre-deploy security gates, Vercel project structure, env scoping, `vercel.json` headers, cron jobs.
- **`screenshot-workflow`** — Puppeteer visual feedback loop. Localhost-only by default with `--allow-remote` opt-in (SSRF protection). Working `VIEWPORTS` map for 375/768/1280 mobile/tablet/desktop captures. Output dir `.screenshots/`.

### Agents

- **`security-reviewer`** — 16-point security review with prompt-injection defense, scoped Bash tools (`git diff:*`, `npm audit:*`, `gitleaks:*`, `semgrep:*`), Diff Review and Deployment Review modes, and a `SECURITY_REVIEW_FAILED` sentinel for downstream gating.
- **`deployment-readiness-reviewer`** — Pre-deploy risk assessment: build config, env vars, deployment hygiene.
- **`accessibility-reviewer`** — WCAG 2.2 AA review: semantic HTML, keyboard navigation, ARIA, colour contrast.
- **`design-system-reviewer`** — Design system consistency: token misuse, style drift, component inconsistencies.

All four agents pinned to `claude-sonnet-4-6`.

### Security baseline

- **CSP** — Nonce-based via Next.js middleware.
- **Secret scanning** — `gitleaks` for staged-diff and full-history scans.
- **Rate limiting** — `@upstash/ratelimit` + `@vercel/kv` for distributed limits across serverless instances.
- **Auth** — `supabase.auth.getUser()` server-side verification.
- **Uploads** — `file-type` magic-byte sniffing.
- **HTML sanitisation** — `isomorphic-dompurify` for server contexts.
- **Cookies** — `__Host-` prefix, idle/absolute timeouts, SameSite trade-offs documented.
- **CORS** — `Vary: Origin` + preflight-cache guidance, no static wildcards.
- **RLS** — `WITH CHECK` vs `USING`, `SECURITY DEFINER`, `auth.jwt()` claim trust, `service_role` vs `anon`.
- **IDOR/BOLA** — Section 16: owner constraints, admin role checks, mass assignment, open redirects, webhook HMAC, SSRF.
- **CRON_SECRET** — `crypto.timingSafeEqual` constant-time comparison.
- **Pre-deploy gates** — `productionBrowserSourceMaps: false`, env scope verification, header config, rollback runbook.

### Reproducibility

- `evals/skill-trigger/` — 30 labelled prompts (5 per skill) with expected activation.
- `evals/security/` — vulnerable Next.js snippets with expected `security-reviewer` findings.
- `evals/README.md` — manual run instructions + results-table format.
- `examples/saas-landing/` — vague-prompt vs SPADE-prompt reference (manual reproduction).
- `compatibility-matrix.md` — Tailwind 3.4 tested; v4 partially applicable (`@theme` and OKLCH not yet covered).
- `.github/workflows/ci.yml` — frontmatter validation + plugin.json schema check.

### Documentation

- `README.md` — plugin install primary, manual copy fallback, Windows PowerShell path.
- `SECURITY.md` — disclosure policy + real contact (`security@saviorhidc.dev`).
- `CONTRIBUTING.md` — PR checklist with formatting + validation.
- `templates/done-criteria.template.md` — reusable per-feature done criteria.
