# Skill-trigger eval corpus — 30 labelled prompts

These prompts test the auto-activation logic for the six skills in this pack. Each prompt should trigger **exactly one** skill, and the `description` field of that skill's `SKILL.md` is what the orchestrator matches against.

Skills covered (5 prompts each):
- `frontend-design`
- `frontend-security`
- `frontend-prompting`
- `frontend-actionable-tips`
- `screenshot-workflow`
- `vercel-deploy`

## How to use

1. Paste each `Input` into a fresh Claude Code session with this skill pack installed.
2. Note which skill (if any) auto-activates.
3. Compare against `Expected skill`.
4. A regression is: wrong skill activated, no skill activated, or multiple skills activated.

The `Reason` line is the discrimination test — it explains *why* this prompt is unambiguous between adjacent skills (e.g., "design" vs "actionable-tips" both touch frontend craft).

---

## frontend-design (5)

### Prompt 1
**Input:** "Build me a landing page for a YC-style B2B SaaS. Bold, opinionated, dark mode."
**Expected skill:** `frontend-design`
**Reason:** Direct ask for visual production work ("build me a landing page") with aesthetic direction ("bold, opinionated"). Not a security, deploy, or screenshot task.

### Prompt 2
**Input:** "Design a pricing table component with three tiers. Make it feel premium, not generic."
**Expected skill:** `frontend-design`
**Reason:** Component-level design work with explicit anti-generic framing — exactly what `frontend-design` exists for.

### Prompt 3
**Input:** "I need a dashboard layout for an analytics product. Think Linear or Vercel, not Material UI."
**Expected skill:** `frontend-design`
**Reason:** Layout/aesthetics work with reference anchors. Could brush against `frontend-prompting` (which is about *writing* briefs), but the user is asking Claude to *build*, not to write a brief.

### Prompt 4
**Input:** "Style this React form to look less like Bootstrap and more like a Stripe checkout."
**Expected skill:** `frontend-design`
**Reason:** Visual restyling against named references. Pure design craft.

### Prompt 5
**Input:** "Make this page look distinctive — right now it looks like every other AI-generated SaaS site."
**Expected skill:** `frontend-design`
**Reason:** "Distinctive" + "AI-generated SaaS" framing is the canonical trigger phrase from the skill description.

---

## frontend-security (5)

### Prompt 6
**Input:** "Set up auth with Supabase for this Next.js app — magic link login plus protected routes."
**Expected skill:** `frontend-security`
**Reason:** Auth + Supabase + Next.js is the exact intersection the security skill covers. Could touch `frontend-design` only if styling were involved (it isn't).

### Prompt 7
**Input:** "Add rate limiting to my /api/ai-chat route so users can't burn my Anthropic credits."
**Expected skill:** `frontend-security`
**Reason:** Rate limiting is in §9 of frontend-security. Not a design or deploy task.

### Prompt 8
**Input:** "Review this API route for vulnerabilities before I merge."
**Expected skill:** `frontend-security`
**Reason:** Direct ask for a security review — could also trigger the `security-reviewer` agent, but the *skill* responsible is `frontend-security`. (Note: in practice the user might run `/security-review` instead — that's a separate flow.)

### Prompt 9
**Input:** "What headers should I set on my Next.js middleware so I get an A on securityheaders.com?"
**Expected skill:** `frontend-security`
**Reason:** Security headers are §7. Unambiguous — no overlap with design or deploy.

### Prompt 10
**Input:** "I'm storing Stripe customer IDs and Anthropic API keys — am I leaking these to the client?"
**Expected skill:** `frontend-security`
**Reason:** Secrets exposure is the headline risk in `frontend-security`. Not a deploy or design task.

---

## frontend-prompting (5)

### Prompt 11
**Input:** "Write the brief for a dashboard I want Claude to build — analytics for an e-commerce store."
**Expected skill:** `frontend-prompting`
**Reason:** "Write the brief" is the trigger — the user wants help *prompting*, not building. Distinguished from `frontend-design` (which builds) by the meta-level ask.

### Prompt 12
**Input:** "How do I structure my prompt so Claude stops defaulting to indigo gradients?"
**Expected skill:** `frontend-prompting`
**Reason:** Meta-question about prompting technique. Discusses design *outcomes* but the ask is about prompt structure.

### Prompt 13
**Input:** "Give me a SPADE-style brief I can paste into Claude for a portfolio site."
**Expected skill:** `frontend-prompting`
**Reason:** Explicit reference to SPADE — the framework that lives inside `frontend-prompting`.

### Prompt 14
**Input:** "What done-criteria should I include in my prompt so Claude self-checks before saying it's finished?"
**Expected skill:** `frontend-prompting`
**Reason:** Done-criteria are a SPADE pillar — squarely in the prompting skill, not in design or security.

### Prompt 15
**Input:** "Help me turn 'make a nice landing page' into a brief that won't produce slop."
**Expected skill:** `frontend-prompting`
**Reason:** Brief-improvement task — same loop as the worked example in `examples/saas-landing/`.

---

## frontend-actionable-tips (5)

### Prompt 16
**Input:** "How do I handle the whileInView animation not firing on the first scroll into view?"
**Expected skill:** `frontend-actionable-tips`
**Reason:** Specific Framer Motion gotcha — it's a known tip with a known fix in the actionable-tips skill. Not a design *vision* question.

### Prompt 17
**Input:** "What's the trick for getting Tailwind dark mode to actually work without flash-of-wrong-theme?"
**Expected skill:** `frontend-actionable-tips`
**Reason:** Specific implementation tip with a canonical fix — not a design or security question.

### Prompt 18
**Input:** "Why does my Next.js Image component look blurry on retina screens? Specific fix please."
**Expected skill:** `frontend-actionable-tips`
**Reason:** Specific known-fix request. Not a security or deploy issue.

### Prompt 19
**Input:** "Give me your top techniques for making a Claude-built frontend not look like a Claude-built frontend."
**Expected skill:** `frontend-actionable-tips`
**Reason:** "Top techniques" maps to the skill's name. Adjacent to `frontend-design` (building) but the ask is for a list of *tips*, not a build.

### Prompt 20
**Input:** "How do I avoid CLS spikes when fonts load on a Next.js site?"
**Expected skill:** `frontend-actionable-tips`
**Reason:** Specific perf tip with a known fix (`next/font` + `font-display: optional`). Not a security or design question.

---

## screenshot-workflow (5)

### Prompt 21
**Input:** "Take a screenshot of my dev server at localhost:3000 so we can iterate on the design."
**Expected skill:** `screenshot-workflow`
**Reason:** Direct ask — dev server screenshot is the skill's headline use case.

### Prompt 22
**Input:** "I want to compare my landing page against the reference design at https://linear.app — capture both."
**Expected skill:** `screenshot-workflow`
**Reason:** Visual comparison flow. Not a design *build*, just a capture.

### Prompt 23
**Input:** "Capture mobile and desktop screenshots of /pricing so I can check responsive behaviour."
**Expected skill:** `screenshot-workflow`
**Reason:** Multi-viewport screenshot — covered by the skill's VIEWPORTS map.

### Prompt 24
**Input:** "Run the puppeteer screenshot script against my preview deploy and show me what it looks like."
**Expected skill:** `screenshot-workflow`
**Reason:** Puppeteer + screenshot — direct match. Not a deploy task (deploy is upstream).

### Prompt 25
**Input:** "Visual QA — I want to see how the page looks in mobile Safari before I push."
**Expected skill:** `screenshot-workflow`
**Reason:** "Visual QA" is verbatim from the skill description.

---

## vercel-deploy (5)

### Prompt 26
**Input:** "Deploy this Next.js app to Vercel."
**Expected skill:** `vercel-deploy`
**Reason:** Canonical trigger. Single-skill match.

### Prompt 27
**Input:** "Add my Anthropic API key as an env var on the Vercel project and redeploy."
**Expected skill:** `vercel-deploy`
**Reason:** Vercel env var management is a deploy concern. Adjacent to `frontend-security` (which warns *not* to expose secrets) but the operation itself is deploy.

### Prompt 28
**Input:** "Set up a custom domain (savior.dev) on my Vercel project and configure DNS."
**Expected skill:** `vercel-deploy`
**Reason:** Domain + Vercel — pure deploy concern.

### Prompt 29
**Input:** "Why is my Vercel build failing with `Module not found: @/lib/supabase`?"
**Expected skill:** `vercel-deploy`
**Reason:** Vercel build troubleshooting. Not a security or design issue, even though Supabase is mentioned.

### Prompt 30
**Input:** "Promote the latest preview deployment to production."
**Expected skill:** `vercel-deploy`
**Reason:** Vercel-specific deployment-promotion operation. Single-skill match.

---

## Tracking results

When running this corpus, record results as a table:

| # | Expected | Actual | Pass/Fail | Notes |
|---|----------|--------|-----------|-------|
| 1 | frontend-design | frontend-design | PASS | |
| ... | | | | |

A regression in this corpus often points at an over-broad `description:` field in one of the SKILL.md files — tighten the wording so the skill's trigger surface doesn't overlap with neighbours.
