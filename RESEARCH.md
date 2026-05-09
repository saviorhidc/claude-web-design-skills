# Research Foundations

> **Note:** This document synthesizes practitioner experience reports and publicly available research. Where specific claims cite third-party studies, sources are linked inline. Claims without citations reflect observed patterns from the authors' experience — not controlled studies.

This repository is grounded in research into how AI codegen tools fail at frontend work — and what fixes produce professional results.

> This section was drafted in February 2026 and reflects the landscape at that time. AI tooling evolves rapidly; specific tool capabilities and market positions shift within months.

---

## The Problem

AI-generated frontends have two systemic failure modes:

**1. Generic aesthetics.** AI tools default to the path of least resistance: Inter font, purple gradients on white, centered card grids, no animation, no visual hierarchy. The output looks like every other AI-generated page because it is.

**2. Insecure backends.** AI tools (Lovable, Cursor, Copilot, Claude) frequently generate code that hardcodes API keys in client-side files, trusts user IDs sent in request bodies, concatenates user input directly into SQL queries, skips authentication on API routes, and uses `dangerouslySetInnerHTML` without sanitization. These are not edge cases — they are the documented default output pattern.

See: [Pearce et al. 2022 — "Asleep at the Keyboard? Assessing the Security of GitHub Copilot's Code Contributions"](https://arxiv.org/abs/2108.09293) (GitHub Copilot generated vulnerable code in 40% of security-relevant scenarios); [Sandoval et al. 2023 — "Lost at C: A User Study on the Security Implications of Large Language Model Code Assistants"](https://www.usenix.org/conference/usenixsecurity23/presentation/sandoval).

Both problems are solvable with the right constraints upfront.

---

## What the Research Investigated

- **Tool landscape:** v0, Bolt.new, Cursor, Claude Code, Lovable, Replit Agent (2025–2026)
- **Prompting techniques:** Prompt specificity levels, the SPADE framework (Spec / Persona / Anchors / Done-criteria / Examples), iterative refinement strategies
- **Design system patterns:** Tailwind config, shadcn/ui, CSS variables, Framer Motion variants
- **Security failures:** OWASP Top 10 applied to AI-generated code, 15 documented failure modes

---

## Key Findings

### Design

**Specificity is the single biggest lever.** Research across all tools shows three prompt tiers:
- Basic: `"Build a SaaS landing page"` → generic output
- Structured: lists sections and components → better, but still inconsistent
- Design-Specified: includes color values, spacing scale, animation types, reference components → professional output

**Design systems before UI work.** Pre-established `tailwind.config.ts`, `tokens.ts`, and `animations.ts` force Claude to work within consistent constraints. Without them, every generation invents its own style choices.

**shadcn/ui + Tailwind + Framer Motion is the optimal stack for AI codegen** because:
1. shadcn components are copy-paste source — Claude reads the actual code, not just API docs
2. Tailwind utility classes are easier to manipulate than CSS-in-JS
3. Framer Motion variants centralized in a single file produce consistent motion

**The hybrid workflow outperforms either tool alone:**
1. Use v0.dev to generate 2–3 design variants quickly
2. Pick the best, paste into your project
3. Use Claude Code to integrate with the design system, wire up data, and ship

**Claude Code's specific weakness** (from the 2026 tool comparison research): "No built-in visual preview. Design quality is entirely prompt-dependent. Requires established project conventions for consistency." The fix — which this repo provides — is externalizing those conventions as skills and a CLAUDE.md.

### Security

15 failure modes documented across AI codegen tools, grounded in OWASP Top 10:

| # | Vulnerability | Common AI failure | Rule |
|---|--------------|-------------------|------|
| 1 | Secrets exposure | `sk_live_*` hardcoded in `.tsx` | Only `NEXT_PUBLIC_*` in client; proxy via `/api/` |
| 2 | Auth bypass | Trust client-sent `user-id` header | Extract from server session/JWT only |
| 3 | Input validation skipped | Unvalidated request bodies | Zod schemas on every endpoint |
| 4 | SQL injection | Template-literal SQL with user input | Parameterized queries (`$1`, `$2`) always |
| 5 | XSS | `dangerouslySetInnerHTML` without sanitization | DOMPurify with allowlisted tags |
| 6 | CSRF | GET endpoints that mutate state | Server Actions (built-in) or CSRF tokens |
| 7 | No security headers | Missing CSP, HSTS, X-Frame-Options | Middleware sets the 6-header bundle |
| 8 | Error leakage | `error.message` returned to client | Log server-side; generic message to client |
| 9 | No rate limiting | None on auth endpoints | 5/15min auth, 100/15min API |
| 10 | CORS wildcard | `Access-Control-Allow-Origin: *` | Whitelist specific origins only |
| 11 | Stale dependencies | `npm audit` ignored | Audit pre-deploy, commit lockfile |
| 12 | No Supabase RLS | Tables without Row Level Security | RLS on every table, per-operation policies |
| 13 | Unsafe file uploads | Trust client filename, no type/size check | Validate MIME + size, UUID filename |
| 14 | HTTPS not enforced | HTTP allowed in production | HSTS + redirect |
| 15 | Insecure cookies | Missing `httpOnly`, `secure`, `sameSite` | Set all three flags on session cookies |

---

## What This Means for Claude Code Specifically

From the tool comparison research:

> "Claude Code's strengths (full filesystem/shell access, multi-file editing, shell access, MCP tools) position it well for complex, production-grade frontends. Its weakness is the lack of visual preview and built-in design system defaults. The fix: establish design system conventions (Tailwind config, shadcn components, animation tokens) in the project, and prompt with specificity."

This repo is the materialised version of that fix. The skills provide the conventions; the CLAUDE.md provides the behavioral rules; the security checklist provides enforcement.

---

## Sources

- v0.dev documentation and community prompting guides
- Bolt.new documentation
- Cursor documentation (`.cursorrules` patterns)
- Claude Code documentation (Anthropic, 2025–2026)
- OWASP Top 10 Web Application Security Risks
- [Anthropic skills repository](https://github.com/anthropics/skills) — `frontend-design` skill
- [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills) — structural inspiration
- shadcn/ui, Tailwind CSS v4, Framer Motion documentation
- AI frontend development community patterns (2025–2026)
