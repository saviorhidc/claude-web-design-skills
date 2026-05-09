# Compatibility Matrix

This skill pack is tested against the following versions. Behaviour outside these ranges is untested.

| Package | Minimum | Recommended | Notes |
|---------|---------|-------------|-------|
| Next.js | 14.0 | 15.x | App Router required (Pages Router not covered) |
| React | 18.0 | 18.3 | Server Components require React 18+ |
| Tailwind CSS v3 | 3.4 | 3.4.x | All examples use v3 patterns |
| Tailwind CSS v4 | Partial | — | `@theme` and OKLCH syntax not yet in examples; v3 patterns apply but syntax differs |
| shadcn/ui | 0.8 | latest | Requires Tailwind 3.x |
| Framer Motion | 10.x | 11.x | whileInView requires 6+ |
| Supabase JS | 2.x | 2.x | SSR helpers require @supabase/ssr |
| Puppeteer | 21.x | 22.x | headless:true required in 22+ |
| Node.js | 18.x | 20.x | ES modules (screenshot.mjs) require 18+ |

Last updated: 2026-05-05
