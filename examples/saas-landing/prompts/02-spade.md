# Prompt 02 — SPADE

The same brief as `01-vague.md`, restructured using SPADE (**S**pec / **P**ersona / **A**nchors / **D**one-criteria / **E**xamples). Roughly 5x longer. The output is qualitatively different.

## The prompt

```
Build a landing page for a project management SaaS tool aimed at enterprise dev teams.
Brutalist aesthetic — speed, power, and zero-bullshit engineering culture.

# SPEC
- Brutalist project management dashboard landing page for enterprise dev teams.
- Sections: hero, social proof (logo strip), 3 feature blocks, pricing, CTA, footer.
- Dark background (#0A0A0A), stark white text, monospaced font for headings.
- NO rounded corners (border-radius: 0 everywhere).
- NO gradients. NO drop shadows. NO card-grid feature section.
- Feature sections are full-bleed horizontal slabs separated by 1px hairlines, not cards.

# PERSONA
You are a senior product designer at Linear or Vercel circa 2024, building a landing
page that signals speed, power, and zero-bullshit engineering culture. You would rather
ship something polarising than something polite. You hate the "AI-generated SaaS page"
look on principle.

# ANCHORS
- Background: #0A0A0A
- Text: #FAFAFA primary, #888888 secondary
- Accent: #00FF41 (terminal green) — used sparingly, for hover states, key numbers, and the primary CTA
- Forbidden colours: any shade of blue, indigo, or purple. No gradients of any kind.
- Typography: JetBrains Mono for all headings (font-weight 500, never bold), system-ui for body text
- Type scale: 72px / 48px / 24px / 16px ONLY — no in-between sizes
- Layout: 12-column CSS grid with 24px gutters, full-bleed sections, 120px vertical rhythm between sections
- Border-radius: 0 everywhere (override any Tailwind rounded-* defaults)
- Spacing: use multiples of 8px only

# DONE-CRITERIA
(Reference templates/done-criteria.template.md, plus the following project-specific checks.)
- Font is JetBrains Mono for headings — open DevTools and verify computed font-family
- Accent colour is exactly #00FF41 — no blue, indigo, or purple anywhere on the page
- Border-radius is 0 on every element — including buttons, inputs, images
- No box-shadow on any element except the focus-visible ring
- All sections are full-bleed (100vw) with internal max-width 1280px content
- Vertical rhythm: 120px padding-top/bottom on every section, no exceptions
- Lighthouse perf ≥ 90 on mobile
- Contrast ratio ≥ 4.5:1 for body text, ≥ 3:1 for the green accent on dark
- Hero LCP ≤ 2.0s on a throttled 4G profile
- WCAG 2.2 AA: focus-visible ring on every interactive element, prefers-reduced-motion respected

# EXAMPLES (mood)
Think Linear's old website (linear.app circa 2022) meets a Bloomberg terminal.
Vercel's developer-tools landing pages also fit. Stripe Press for the type discipline.
Anti-references: do NOT look like Notion, Asana, ClickUp, or any "friendly" SaaS page.
```

## Why this works

Each SPADE section closes a degree of freedom that the vague prompt left open:

- **Spec** — pins down sections AND anti-patterns ("no card-grid feature section"). The negative space is as important as the positive.
- **Persona** — gives the model a *taste* to apply, not just a brief. "Linear or Vercel circa 2024" is a much sharper anchor than "modern."
- **Anchors** — every design token is named explicitly, including forbidden colours. Forbidding indigo is the single highest-leverage line in the prompt — it disables the model's strongest default.
- **Done-criteria** — converts the brief into a checklist Claude can self-verify against, not a vibes-based "looks good."
- **Examples** — points at real reference work and explicit anti-references.

## The cost

Roughly 5 minutes of upfront thinking per page. The payoff is a page that looks like it was made for *one* product, not for *any* product — and that doesn't need 6 rounds of "make it less generic" follow-ups.
