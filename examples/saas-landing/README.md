# Worked example — SaaS landing page (vague vs SPADE)

> **Note:** This example is a prompt-only reference. No generated output is committed (screenshots and code vary by Claude version and settings). To reproduce:
> 1. Run the prompts in `prompts/` sequentially in a new Claude Code session
> 2. Optionally capture screenshots with the screenshot-workflow skill
> 3. Compare output against the done-criteria template in `templates/done-criteria.template.md`

This example demonstrates the design-quality delta between a vague prompt and a SPADE-structured prompt for the same brief: a landing page for a project management SaaS tool.

## What's in this folder

```
examples/saas-landing/
├── README.md                  # this file
└── prompts/
    ├── 01-vague.md            # the kind of brief most users send
    └── 02-spade.md            # the same intent, structured with SPADE
```

## How to use it

1. Spin up a fresh Next.js sandbox (`npx create-next-app@latest saas-landing-test`).
2. In **two separate Claude Code sessions** (so the second isn't primed by the first), paste the two prompts and let Claude build the page.
3. Run the dev server, then run `node screenshot.mjs` (from the repo root) against `http://localhost:3000` to capture both results.
4. Place the resulting PNGs side by side. The visual delta is the point.

## What you'll observe

**`01-vague.md` typically produces:**
- Inter font (the "default" choice across every AI-generated SaaS page)
- Indigo-500 / purple gradient primary
- Rounded card grid for the features section (`rounded-xl`, soft shadow)
- "Start Free Trial" CTA, possibly with a sparkles emoji
- A page indistinguishable from 10,000 other SaaS landings — competent, generic, forgettable

**`02-spade.md` typically produces:**
- JetBrains Mono headings, system-ui body
- Black `#0A0A0A` background, terminal-green `#00FF41` accent
- Hard 0px corners everywhere, no shadows, no gradients
- 12-column grid with 120px vertical rhythm
- A page with a clear point of view that signals what kind of company built it

## Screenshots

Screenshots are **not committed** to the repo (they're large binaries and would balloon the install). Generate them locally:

```bash
# from the repo root, after starting your dev server on :3000
node screenshot.mjs http://localhost:3000 ./examples/saas-landing/01-vague.png
node screenshot.mjs http://localhost:3000 ./examples/saas-landing/02-spade.png
```

Add `examples/saas-landing/*.png` to your local `.gitignore` if you want to keep them around without staging.

## Why this matters

The SPADE prompt is ~5x longer than the vague prompt. The output is qualitatively different — not "slightly better," but recognisably the work of a designer with a point of view rather than a model producing the population mean of every SaaS site in its training data.

The cost is upfront thinking. The payoff is a page that looks like it was made for *one* product, not for *any* product.
