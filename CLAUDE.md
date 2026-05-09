# CLAUDE.md

<!-- This file configures Claude's behavior within a project using this plugin. For installation instructions, see README.md. -->

My personal behavioral guidelines for web frontends with Claude Code.
Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward distinctive, secure, shippable UIs over raw speed.
For throwaway prototypes, use judgment. For anything that ships to users, follow these rules.

---

## 1. Commit to One Aesthetic

**Don't blend styles. Pick a direction and execute it with precision.**

Before touching code:
- Choose an extreme: brutalist, editorial, retro-futuristic, luxury/refined, maximalist chaos, art deco, soft/pastel, industrial, playful/toy-like, etc.
- Bold maximalism and refined minimalism both work — intentionality is the lever, not intensity.
- Avoid generic fonts (Arial, Inter-as-default, Roboto). Pair a distinctive display font with a refined body font.
- Dominant colors with sharp accents outperform timid, evenly-distributed palettes.
- Asymmetry, overlap, diagonal flow, grid-breaking elements > centered card grids every time.
- One well-orchestrated page load with staggered reveals creates more delight than scattered micro-interactions.

Ask yourself: "Would someone scroll past this in 3 seconds?" If yes, start over.

---

## 2. Specificity Over Creativity

**SPADE every prompt: Spec, Persona, Anchors, Done-criteria, Examples.** (Full framework defined in `skills/frontend-prompting/SKILL.md`.)

Vague prompts produce generic output. Specific prompts with theme tokens, layout dimensions, and component references produce professional output. Research across v0, Cursor, and Claude Code consistently shows specificity is the single biggest lever.

- Three prompt levels: Basic → Structured → Design-Specified. **Always operate at level 3.**
- Establish design tokens (`tokens.ts`, `tailwind.config.ts`, `animations.ts`) **before** any UI work.
- Reference existing components by path: `"Match the style of src/components/ui/Card.tsx"`.
- Specify dark theme values explicitly — `"dark theme"` is vague; `"bg-[#0a0a0f], text-white/90, border-white/10"` is not.

---

## 3. Use the Default Stack (shadcn/ui + Tailwind + Framer Motion)

**This stack is what AI generates best — highest training data density, copy-paste source.**

- shadcn components are readable source code, not just API docs. Claude can see and match them.
- Tailwind utility classes are easier for Claude to manipulate than CSS-in-JS.
- Framer Motion variants centralized in `animations.ts` produce consistent motion across pages.

Pre-install before prompting:
```bash
npx shadcn@latest add button card badge dialog dropdown-menu sheet input label tabs accordion tooltip avatar skeleton
npm install framer-motion tailwindcss-animate
```

> **Stack caveat:** The above installs shadcn/ui, Tailwind, and Framer Motion. If your project uses a different design system (MUI, Chakra, plain CSS, vanilla-extract, etc.), skip these installs and tell Claude your stack — it will adapt the skill guidance accordingly. These are recommended defaults, not hard requirements.

Build component-by-component, not page-by-page. Use centralized animation variants, not inline values.

---

## 4. Security Is Not Optional

**No secrets in client code. No unvalidated input. No skipped auth.**

AI tools (Lovable, Cursor, Copilot, Claude) routinely generate code with hardcoded API keys, client-trusted user IDs, template-literal SQL, and `dangerouslySetInnerHTML` without sanitization. These are not edge cases — they are the default pattern.

Run through the 16-point (§1–§16, including §16 IDOR/BOLA) checklist in `skills/frontend-security/SKILL.md` before deploying.
Spawn the `security-reviewer` agent after any frontend code changes.

The three most common failures:
1. Secrets in `.tsx` files — use `/api/` route proxies and `process.env` (no `NEXT_PUBLIC_` prefix)
2. Auth skipped on endpoints — always extract user identity from server session, never from request body
3. String-concatenated SQL — always use `$1`, `$2` parameterized queries

---

## 5. Surgical, Verifiable Changes

**Touch only what you must. Define success before coding.**

- Don't "improve" adjacent code that wasn't asked about.
- Transform vague goals into testable criteria: "tokens used consistently", "security checklist passed", "build green", "mobile layout confirmed".
- Iterate in focused rounds: Structure → Design → Motion → Polish. One mega-prompt produces mediocre results; four focused rounds produce professional results.
- Every changed line should trace directly to the user's request.

---

## 6. Close the Visual Feedback Loop

**Claude Code can't see what it built. Show it.**

Claude Code's biggest documented weakness is the lack of visual preview — the model is reasoning blind about every design decision unless you give it eyes. The fix: Puppeteer screenshot of the running dev server, then `Read` the PNG.

- Drop `screenshot.mjs` (from `screenshot-workflow` skill) in the project root
- After every meaningful UI change, screenshot it
- Compare with specificity: *"heading is 32px, reference shows ~24px"* — never *"looks off"*
- Multi-viewport screenshots verify SPADE Done-criteria like "renders at 320/768/1280px"

Two rounds of screenshot-driven iteration consistently beat ten rounds of "make it nicer."

---

## 7. Know When to Use Another Tool

**Claude Code is best for integration and production. v0 is best for visual exploration.**

| Need | Best tool |
|------|-----------|
| Quick component prototype | v0.dev |
| Full-stack MVP from scratch | Bolt.new |
| Adding feature to existing project | Claude Code |
| Complex multi-file production feature | Claude Code |
| Design exploration (3 variants fast) | v0.dev |

**Hybrid workflow:** Use v0 to generate 2–3 design variants → pick best → paste into project → use Claude Code to integrate with the design system, wire up data, and ship.

---

## How to Use the Skills in This Repo

| Skill | Auto-triggers on | Source |
|-------|-----------------|--------|
| `frontend-design` | "build a UI", "design a page", styling work | Based on Anthropic's official frontend-design skill |
| `frontend-security` | API routes, auth, env vars, deploy prep, database queries | 16-point (§1–§16, including §16 IDOR/BOLA) OWASP-style checklist |
| `frontend-prompting` | Planning a UI prompt, refining a brief | SPADE framework from AI frontend research |
| `frontend-actionable-tips` | Next.js + Tailwind + Framer Motion projects | Top 10 techniques from comparative tool research |
| `vercel-deploy` | Shipping a frontend, vercel.json, env vars, cron jobs | Vercel + Next.js deployment patterns |
| `screenshot-workflow` | Visual QA, comparing against reference, debugging layout, responsive checks | Puppeteer-based screenshot loop for visual feedback |

## How to Use the security-reviewer Agent

Place `agents/security-reviewer.md` in your project's `.claude/agents/` directory. It will be spawned automatically (or you can invoke it) after frontend code is written.

It scans the git diff against the 16-point (§1–§16, including §16 IDOR/BOLA) security checklist and reports findings by severity (Critical / High / Medium / Low) with exact file paths, line numbers, and fix recommendations.

---

**These guidelines are working if:** UIs look distinctive (not template-y), no secrets ship to git, prompts include concrete specs, and the security checklist runs before deployment.
