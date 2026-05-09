---
name: frontend-design
description: Aesthetic direction and visual styling for web UIs — design system setup, shadcn/Tailwind/Framer Motion installation, font and color choices, component library, anti-generic-AI patterns. Use when deciding how the UI should look and feel.
---

# Frontend Design

> Based on [anthropics/skills/frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)

> **Why this skill exists:** Research across v0, Bolt.new, Cursor, and Claude Code found that AI-generated frontends consistently default to generic aesthetics — cookie-cutter layouts, bland palettes, predictable component patterns. This skill forces Claude to commit to a specific aesthetic direction before touching code.

Create distinctive frontend interfaces that avoid generic AI aesthetics. Generates polished code with deliberate design choices rather than fall-back defaults.

---

## Design Thinking

Before coding, understand the context and commit to a **BOLD** aesthetic direction:

- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work -- the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Functional and well-considered
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

---

## Aesthetic Brief (complete this BEFORE writing any code)

Before generating any UI, Claude must complete this brief in one paragraph. Do not skip it. The brief prevents generic-AI defaults (Inter font, indigo-500 buttons, card grids with `rounded-lg`).

> **Project aesthetic:** [e.g., "Brutalist data terminal: monospaced fonts, high-contrast black-on-cream, no rounded corners, dense information hierarchy"]
> **Mood reference:** [e.g., "Linear.app meets Bloomberg terminal"]
> **One thing it must NOT look like:** [e.g., "generic SaaS dashboard with rounded cards"]
> **Primary typeface:** [name a specific font — not Inter, Roboto, or DM Sans unless deliberately chosen]
> **Accent color (hex):** [not #6366F1, #3B82F6, or #8B5CF6 unless deliberately chosen]

### Verifiable invariants (auto-fail if violated)
- Primary font is NOT in the generic-AI set: {Inter, Roboto, DM Sans, Plus Jakarta Sans}
- Primary accent is NOT in the AI-purple set: {#6366F1, #8B5CF6, #818CF8, #7C3AED}
- All interactive elements have visible `:focus-visible` rings
- `prefers-reduced-motion` is respected in all Framer Motion variants

---

## Aesthetics Guidelines

### Typography
Choose fonts that are beautiful, unique, and interesting. Avoid generic fonts like Arial and Inter; opt for distinctive choices that elevate aesthetics -- unexpected, characterful font choices. Pair a distinctive display font with a refined body font.

### Color & Theme
Commit to a cohesive aesthetic. Use CSS variables for consistency. Dominant colors with sharp accents outperform timid, evenly-distributed palettes.

### Motion
Use animations for effects and micro-interactions. Prioritize CSS-only solutions for HTML. Use Motion library for React when available. Focus on high-impact moments: one well-orchestrated page load with staggered reveals (`animation-delay`) creates more delight than scattered micro-interactions. Use scroll-triggering and hover states that surprise.

### Spatial Composition
Unexpected layouts. Asymmetry. Overlap. Diagonal flow. Grid-breaking elements. Generous negative space OR controlled density.

### Backgrounds & Visual Details
Create atmosphere and depth rather than defaulting to solid colors. Add contextual effects and textures that match the overall aesthetic. Apply creative forms like gradient meshes, noise textures, geometric patterns, layered transparencies, dramatic shadows, decorative borders, custom cursors, and grain overlays.

> ⚠ Custom cursors: test with keyboard-only users (cursor may vanish on trackpad) and on OLED displays (battery impact). Ensure fallback `cursor: auto` for reduced-motion users.

---

## Anti-Patterns (NEVER Do)

NEVER use generic AI-generated aesthetics:
- Overused font families (Inter, Roboto, Arial, system fonts)
- Cliched color schemes (particularly purple gradients on white backgrounds)
- Predictable layouts and component patterns
- Cookie-cutter design that lacks context-specific character

NEVER converge on common choices (e.g., Space Grotesk) across generations. Vary between light and dark themes, different fonts, different aesthetics. Interpret creatively and make unexpected choices that feel genuinely designed for the context. No two designs should look the same.

---

## Implementation Notes

- Match implementation complexity to the aesthetic vision
- Maximalist designs need elaborate code with extensive animations and effects
- Minimalist/refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details
- Elegance comes from executing the vision well, not from complexity alone
- For HTML: prefer CSS-only animations and effects
- For React: use Motion (framer-motion) library when available for complex animations
- Always ensure responsive behavior across viewport sizes
- Maintain accessibility (contrast ratios, semantic HTML, keyboard navigation) even with bold aesthetics

---

## Accessibility Floor (WCAG 2.2 AA — non-negotiable)

Every UI built with this skill MUST meet these minimums:

### Contrast
- Body text: **4.5:1** minimum against background
- Large text (≥18pt / ≥14pt bold) and UI icons: **3:1** minimum
- Focus indicators: **3:1** against adjacent color

### Motion
```css
/* Always wrap Framer Motion animations in this media query check */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
In Framer Motion: set `duration: 0` or `animate: false` when `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.

### Focus
- Use `:focus-visible` (not `:focus`) so keyboard users see focus rings; mouse users don't see outlines.
- Every interactive element must have a visible focus indicator with ≥3:1 contrast.

### Touch targets
- Minimum 44×44 CSS px for all interactive elements (WCAG 2.5.5).
- On mobile: add `env(safe-area-inset-*)` padding on nav bars and bottom CTAs.

### Semantics
- Use semantic HTML: `<nav>`, `<main>`, `<header>`, `<footer>`, `<section>`, `<article>`.
- Form inputs must have associated `<label>` (not placeholder-only).
- Images must have `alt` text (empty `alt=""` for decorative images).
- Dynamic content changes must announce via `aria-live` or focus management.

### Self-review checklist (before marking UI done)
- [ ] Run axe-core or Lighthouse a11y audit (score ≥ 90)
- [ ] Tab through every interactive element — all reachable, all labeled
- [ ] Test with `prefers-reduced-motion` on — no missing content, no layout gaps
- [ ] Check contrast of body text, headings, buttons, links, placeholders
- [ ] All images have alt text; decorative images have empty alt
