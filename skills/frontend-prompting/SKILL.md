---
name: frontend-prompting
description: Use when writing a prompt or brief for a UI/frontend task — designing a component, page layout, or visual system with Claude. Applies the SPADE framework (Spec, Persona, Anchors, Done-criteria, Examples) and 4-round iteration strategy. Use when composing or reviewing the prompt, not during implementation.
---

# Prompting Best Practices for AI Frontend Generation

> **Why this skill exists:** Research across v0, Bolt.new, Cursor, and Claude Code found that specificity is the single biggest lever for AI frontend quality. Vague prompts produce generic, cookie-cutter output. The SPADE framework and 4-round iteration strategy documented here consistently produce professional results. See `RESEARCH.md` for the full evidence base.

---

## The Core Principle

**Specificity beats creativity.** The more concrete detail you provide about visual design, layout, interactions, and styling, the better the AI output. Vague prompts ("make a nice dashboard") produce generic results. Specific prompts ("dark theme dashboard with a sidebar, gradient header, data cards with hover shadows, and a chart section") produce professional output.

---

## Structured Prompting Framework

### Level 1: Basic (Generic Results)
```
Build a landing page for a SaaS product.
```

### Level 2: Structured (Better Results)
```
Build a landing page for a SaaS analytics product:
- Dark theme with a gradient hero section
- Navigation bar with logo, links, and CTA button
- Hero with headline, subtext, and a dashboard mockup image
- Feature grid (3 columns) with icons
- Pricing table with 3 tiers
- Footer with links and social icons
- Use Tailwind CSS, shadcn/ui components
```

### Level 3: SPADE-Structured (Professional Results)
```
Build a SaaS analytics landing page.

SPEC:
- Marketing landing page for a SaaS analytics product
- Sections: nav, hero, features (3-col), pricing (3-tier), footer
- Stack: Next.js 14 App Router, Tailwind, shadcn/ui, Framer Motion
- Target: Vercel deploy

PERSONA:
- Solo technical founder evaluating tools at 11pm
- Skims for trust signals (customer logos, transparent pricing, working demo)
- Skeptical of marketing-speak; rewards specificity and density

ANCHORS:
- Editorial density like linear.app
- Trust-signal layout like stripe.com
- Motion restraint like vercel.com (subtle, not flashy)

DONE-CRITERIA:
- Renders at 320 / 768 / 1280px without layout breaks
- Lighthouse perf >= 90 on the landing route
- No `dangerouslySetInnerHTML`, no hardcoded keys, no `Access-Control-Allow-Origin: *`
- Tab key reaches every interactive element in document order
- Hero CTA and pricing CTAs route to /signup with correct plan query param

EXAMPLES:
- Match visual style of src/components/ui/Card.tsx
- Reference: linear.app for nav + hero density
- Use animation variants from src/styles/animations.ts (fadeInUp, staggerContainer)
```

**Always operate at Level 3.**

---

## The SPADE Framework

<!-- Single source of truth for SPADE. Other skills reference this definition — do not redefine here. -->

Five inputs that turn vague prompts into shippable briefs. Works for any prompt — UI, backend, agent, CLI, copywriting — not just design tasks.

- **S**pec: What you're building. Concrete artifact, scope, and tech stack.
- **P**ersona: Who it's for. User context, what they care about, what they distrust.
- **A**nchors: Reference points. "Like X but with Y." Inspirational benchmarks beat adjectives every time.
- **D**one-criteria: Verifiable success conditions — perf, accessibility, security, layout. Pass/fail bar.
- **E**xamples: Concrete code samples or existing components to match.

**Anchors** are the highest-leverage letter most people skip. *"Editorial like The Verge"* beats *"modern and clean"* every time — references carry implicit information that adjectives lose.

**Done-criteria** is the second highest-leverage. Without it, you can't tell if iteration is converging or just looping. Vague or incomplete prompts produce generic, correction-heavy output — front-loading context prevents revision loops.

---

## Iterative Refinement Strategy

### Round 1: Structure & Layout
```
Create the page layout with sections. Use placeholder content.
Focus on responsive grid and component hierarchy.
```

### Round 2: Visual Design
```
Apply the design system. Use the color palette from our Tailwind config.
Ensure consistent spacing (use space-y-24 between sections).
Typography: 4xl for section titles, lg for body, sm for captions.
```

### Round 3: Interactions & Animation
```
Add Framer Motion animations:
- Fade up on scroll for each section (variants with staggerChildren)
- Hover scale(1.02) on cards with spring transition
- Page load: staggered reveal for hero elements
```

### Round 4: Polish & Details
```
Polish: check mobile layout, add subtle gradient overlays,
ensure all buttons have hover/active states, add loading states.
```

---

## Common Failure Modes & Fixes

| Failure | Cause | Fix |
|---------|-------|-----|
| Generic/bland output | Prompt lacks visual specificity | Include color palette, spacing values, animation types, and references |
| Inconsistent styling | No design tokens established | Define Tailwind config with custom colors/fonts before any UI work |
| Poor responsive behavior | Mobile not mentioned | Specify breakpoints: "Mobile: single column, tablet: 2 columns, desktop: 3 columns" |
| Flat/lifeless UI | No animation guidance | Include hover states, transitions, scroll-triggered animations |
| Component soup | Generated full pages at once | Build component by component: "Create a PricingCard component that accepts..." |
| Ignoring existing patterns | Not referencing codebase | "Read components/ui/Card.tsx first and follow the same patterns" |

---

## Prompt Templates

### New Component
```
Create a [ComponentName] component in components/[path].tsx

Props: [list props with types]
Style: [colors, spacing, sizing]
States: [hover, active, disabled, loading]
Animation: [transitions, motion]
Responsive: [mobile, tablet, desktop behavior]

Reference existing pattern: [similar component path]
```

### Page Layout
```
Create the [page name] page at app/[path]/page.tsx

Sections (top to bottom):
1. [Section name]: [description, layout]
2. [Section name]: [description, layout]

Design tokens: [reference Tailwind config or style constants]
Import components from: [paths]
Animation pattern: [scroll reveal, stagger, etc.]
Mobile behavior: [stacking, hiding, simplifying]
```

### Redesign/Improve
```
Improve the visual design of [component/page path].

Current issues: [what looks generic or wrong]
Target aesthetic: [dark/light, modern/minimal, bold/subtle]
Specific changes:
- [Change 1]
- [Change 2]
Keep: [what should NOT change]
```

---

*Sources: AI frontend community best practices, v0.dev prompting guides, Cursor documentation, Claude Code usage patterns (2025-2026)*
