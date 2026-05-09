# Done-Criteria Template

Copy-paste this into your SPADE **D**one-criteria block. Delete lines that don't apply.

## Accessibility
- [ ] axe-core / Lighthouse a11y score ≥ 90
- [ ] All interactive elements keyboard-reachable and labeled
- [ ] `prefers-reduced-motion` respected (no missing content, no layout gaps)
- [ ] Body text contrast ≥ 4.5:1; large text / icons ≥ 3:1
- [ ] All images have alt text
- [ ] Touch targets ≥ 44×44 CSS px on mobile

## Performance (Lighthouse)
- [ ] LCP ≤ 2.5s on simulated mobile 4G
- [ ] CLS ≤ 0.1
- [ ] FID / INP ≤ 200ms
- [ ] Lighthouse perf score ≥ 90
- [ ] All images use `next/image` with explicit width/height
- [ ] No layout-blocking fonts (use `font-display: swap`)

## Responsive
- [ ] Renders without horizontal scroll at 320px, 768px, 1280px
- [ ] Touch targets ≥ 44px on 390px (iPhone 14)
- [ ] No fixed pixel widths that break on mobile
- [ ] Safe-area insets on mobile nav/footer

## Security
- [ ] No secrets in client-side code
- [ ] All API routes verify session server-side
- [ ] Inputs validated with Zod on server
- [ ] All SQL uses parameterized placeholders
- [ ] IDOR: every record fetch includes owner_id check
- [ ] CSP, HSTS, X-Frame-Options headers set

## Visual QA
- [ ] Screenshot at 390px (mobile), 768px (tablet), 1280px (desktop) — no layout breaks
- [ ] Dark/light mode (if applicable) — no invisible text or overflow
- [ ] Hover and focus states visible on all interactive elements
- [ ] Aesthetic brief invariants satisfied (font, accent color not from generic-AI set)
