---
name: frontend-actionable-tips
description: Specific Next.js, Tailwind, and Framer Motion techniques and gotchas — code-level patterns, anti-patterns, and debugging. Use when implementing frontend details, not when planning the overall aesthetic.
---

# Top Actionable Techniques for Claude Code + Next.js/Tailwind/Framer Motion

> **Why this skill exists:** Research comparing AI frontend tools found that Claude Code consistently produces better output when given pre-established design constraints, component-level scope, and explicit animation patterns. Without these, every generation makes different style choices and the result looks generic. These 10 techniques are the highest-ROI fixes.

---

## The 10 Most Impactful Techniques

### 1. Establish a Design System File Before Any UI Work

**Why:** Without design constraints, every Claude Code generation makes different style choices. A `tokens.ts` + configured `tailwind.config.ts` + `animations.ts` file forces consistency.

**Action:**
```bash
# Before starting any frontend project:
# 1. Configure tailwind.config.ts with custom colors, spacing, fonts
# 2. Create src/styles/tokens.ts with exported design constants
# 3. Create src/styles/animations.ts with Framer Motion variants
# 4. Install shadcn/ui base components
```

**Prompt pattern:**
```
Before generating any components, read these files:
- tailwind.config.ts (color palette, spacing)
- src/styles/tokens.ts (design tokens)
- src/styles/animations.ts (animation variants)
Use ONLY colors and values from these files. Do not introduce new ones.
```

---

### 2. Use the SPADE Framework in Every Prompt

**Why:** Structured prompts eliminate ambiguity. The AI doesn't have to guess what "nice" or "good" means.

**SPADE checklist:**
- **S**pec: Concrete artifact, scope, tech stack — *"marketing landing page in Next.js 14 with shadcn/ui and Framer Motion"*
- **P**ersona: Who it's for — *"solo technical founder evaluating tools at 11pm, skims for trust signals"*
- **A**nchors: Reference points, not adjectives — *"editorial density like linear.app, motion restraint like vercel.com"*
- **D**one-criteria: Verifiable conditions — *"Lighthouse perf >= 90, no client-side secrets, tab order correct, renders at 320/768/1280px"*
- **E**xamples: Concrete code or components to match — *"match style of src/components/ui/Card.tsx, use variants from src/styles/animations.ts"*

The two highest-leverage letters are **A** (anchors beat adjectives — references carry information adjectives lose) and **D** (without verifiable criteria, iteration loops instead of converging).

---

### 3. Build Component-by-Component, Not Page-by-Page

**Why:** AI generates better focused, small components than monolithic pages.

**Workflow:**
1. Generate `FeatureCard` component with specific props
2. Generate `FeatureGrid` that uses `FeatureCard`
3. Generate `FeaturesSection` that wraps `FeatureGrid` with heading and animation
4. Assemble into the page

**Prompt pattern:**
```
Create a FeatureCard component at components/sections/FeatureCard.tsx

Props:
- icon: LucideIcon
- title: string
- description: string

Style:
- bg-surface-raised border border-white/10 rounded-xl p-6
- Hover: translateY(-4px), shadow-lg, border-white/20
- Icon: text-brand-500, 40x40
- Title: text-lg font-semibold text-white mt-4
- Description: text-sm text-slate-400 mt-2
```

---

### 4. Reference Existing Components Explicitly

**Why:** Claude Code can read your codebase. Telling it to match existing patterns produces more consistent output than describing the style from scratch.

**Prompt pattern:**
```
Create a new PricingCard component.
Match the visual style of src/components/ui/Card.tsx.
Use the same color scheme, border treatment, and hover animation
as src/components/sections/FeatureCard.tsx.
```

---

### 5. Use Framer Motion Variants, Not Inline Animation

**Why:** Centralized animation variants ensure consistent motion across the app.

**Action:** Create `src/styles/animations.ts` with reusable variants:
```ts
export const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };
export const staggerContainer = { animate: { transition: { staggerChildren: 0.1 } } };
export const hoverLift = { whileHover: { y: -4, transition: { duration: 0.2 } } };
export const scrollReveal = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-100px' },
  transition: { duration: 0.6, ease: 'easeOut' },
};
```

**Prompt pattern:**
```
Use animation variants from src/styles/animations.ts.
Import fadeInUp, staggerContainer, and hoverLift.
Do NOT define animation values inline.
```

---

### 6. Specify Dark Theme Details Explicitly

**Why:** "Dark theme" is vague — AI picks different grays, contrasts, and borders every time. Pick ONE palette before generating and use it throughout. Do not mix both options.

**Pick Option A (warm/editorial) or Option B (cool/technical) before generating. Use only that palette throughout.**

```
<!-- Option A: Warm/Editorial palette -->
- Background: bg-stone-950 (near-black with warm undertone)
- Surface: bg-stone-900 for cards, bg-stone-800 for elevated
- Borders: border-stone-700 (default), border-amber-400/30 (hover)
- Text: text-amber-50 (primary), text-stone-400 (secondary), text-stone-500 (muted)
- Accent: text-amber-400 for highlights, bg-amber-400 for buttons
// Accent: amber-400, Surface: stone-950, Text: amber-50

<!-- Option B: Cool/Technical palette -->
- Background: bg-slate-950 (near-black with cool undertone)
- Surface: bg-slate-900 for cards, bg-slate-800 for elevated
- Borders: border-slate-700 (default), border-cyan-500/30 (hover)
- Text: text-slate-100 (primary), text-slate-400 (secondary), text-slate-500 (muted)
- Accent: text-cyan-300 for highlights, bg-cyan-500 for buttons
// Accent: cyan-400, Surface: slate-950, Text: slate-100
```

---

### 7. Add Visual Depth with Layered Effects

**Why:** The difference between "flat" and "polished" is layered effects — gradients, glows, shadows, transparency.

**Techniques to specify:**
```
Visual depth elements to include:
- Glass morphism: backdrop-blur-xl bg-white/5 border-white/10
- Gradient overlays: bg-gradient-to-b from-accent/10 to-transparent
- Colored shadows: matched to your chosen palette accent (e.g. shadow-amber-400/20 for Option A, shadow-cyan-500/20 for Option B)
- Subtle noise texture: via CSS background-image
- Dot or grid patterns as section backgrounds
```

---

### 8. Always Specify Responsive Behavior

**Why:** AI often generates desktop-only layouts unless explicitly told otherwise.

**Prompt pattern:**
```
Responsive behavior:
- Mobile (< 640px): Single column, hamburger menu, stacked cards
- Tablet (640-1024px): 2-column grid, side sheet instead of modal
- Desktop (> 1024px): Full layout with sidebar, 3-column grids
- Max content width: 1280px, centered with mx-auto px-4
```

---

### 9. Iterate in Focused Rounds

**Why:** One mega-prompt produces mediocre results. Four focused rounds produce professional results.

**Round sequence:**
1. **Structure:** "Create the page layout with all sections. Use placeholder text. Focus on grid and component hierarchy."
2. **Design:** "Apply the design system. Use our color tokens, typography scale, and spacing values."
3. **Motion:** "Add Framer Motion animations. Import variants from animations.ts. Add scroll reveals and hover effects."
4. **Polish:** "Review mobile layout. Add loading states. Ensure all interactive elements have hover/active/focus states."

---

### 10. Include Anti-Patterns in Your Prompt

**Why:** Telling the AI what NOT to do prevents the most common AI-generated-look mistakes.

**Prompt pattern:**
```
AVOID these anti-patterns:
- Do NOT use pure white (#fff) text on dark backgrounds (use slate-50 or slate-100)
- Do NOT use default blue (#3b82f6) — use our brand colors
- Do NOT make all sections the same height or spacing
- Do NOT use generic gradient placeholder images — they are an AI-generated aesthetic tell. Use `next/image` with `placeholder="blur"` or a single-color solid bg (e.g. `bg-stone-800`) instead
- Do NOT center-align all text — left-align body text, center only headings
- Do NOT make buttons all the same size — primary CTA larger than secondary
- Do NOT use equal padding everywhere — vary spacing to create visual hierarchy
```

---

### 11. Match Framer Motion Variant Key Names Across Parent and Children

**Why:** Framer Motion's variant inheritance is silent — when it breaks, children stay at `initial` (opacity:0) and you see an empty section instead of an error. The most common cause is variant key name mismatch between parent prop and child variant definition.

**The bug:**

```tsx
// animations.ts — variants only define `initial` and `animate` keys
export const fadeInUp = { initial: {...}, animate: {...} };
export const scrollRevealStagger = { initial: {}, whileInView: {...} };

// Component — parent uses whileInView="whileInView"
<motion.div variants={scrollRevealStagger} initial="initial" whileInView="whileInView">
  <motion.div variants={fadeInUp}>  {/* ← child looks for fadeInUp.whileInView, doesn't exist */}
    Card content
  </motion.div>
</motion.div>
```

The parent transitions correctly, but children look for a `whileInView` key in `fadeInUp` — finds none — never animate. The section renders as empty space.

**The fix — canonical naming with `animate`:**

```tsx
// animations.ts — every variant uses `animate` as the target state name
export const fadeInUp = { initial: {...}, animate: {...} };
export const scrollRevealStagger = { initial: {}, animate: {...} };

// Component — parent inherits children's `animate` variant
<motion.div variants={scrollRevealStagger} initial="initial" whileInView="animate">
  <motion.div variants={fadeInUp}>  {/* ← inherits, finds fadeInUp.animate, animates */}
    Card content
  </motion.div>
</motion.div>
```

**The shortcut for hero-adjacent sections — fire on mount:**

If a section sits close to the fold (or you don't want to debug `IntersectionObserver` timing), skip `whileInView` entirely and use `animate="animate"` directly. Children fire on mount, no scroll dependency:

```tsx
<motion.div variants={scrollRevealStagger} initial="initial" animate="animate">
  {items.map(item => <motion.div key={item.id} variants={fadeInUp}>...</motion.div>)}
</motion.div>
```

Trade-off: animations fire whether the user is looking at that section or not. Acceptable for short pages, hero areas, or anything within 1-2 viewport heights of the top. Use `whileInView` only for sections genuinely far below the fold.

**Bonus debugging tip:** if a section silently renders empty in production, view source / DevTools → search for `style="opacity:0"`. If you see `opacity:0;transform:translateY(...)` on every supposedly-rendered child, you've hit this gotcha.

---

## Quick Reference Card

```
BEFORE starting any frontend task with Claude Code:

1. [ ] Design system files exist (tailwind.config.ts, tokens.ts, animations.ts)
2. [ ] shadcn/ui components installed (button, card, badge minimum)
3. [ ] SPADE framework applied to prompt
4. [ ] Building component-by-component (not full page)
5. [ ] Referencing existing components for consistency
6. [ ] Animation variants defined centrally
7. [ ] Dark theme palette chosen (Option A warm/editorial OR Option B cool/technical) and applied consistently
8. [ ] Visual depth techniques listed
9. [ ] Responsive breakpoints specified
10. [ ] Anti-patterns listed in prompt
```

---

*Compiled from AI frontend development research, community best practices, and production experience (February 2026). See `RESEARCH.md` for sources.*
