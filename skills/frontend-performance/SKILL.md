---
name: frontend-performance
description: Next.js performance optimisation — Core Web Vitals, image sizing, font loading, code splitting, Server vs Client Component decisions, bundle analysis. Use when Lighthouse perf score is below 90 or when optimising for LCP/CLS/INP.
---

# Frontend Performance

> **Why this skill exists:** AI-generated Next.js apps frequently default to all-Client-Component architectures, ship oversized JS bundles, omit `next/image` width/height (causing CLS), and block the main thread with synchronous third-party scripts. This skill provides a deterministic checklist for hitting Lighthouse 90+ and Core Web Vitals "Good" thresholds.

---

## Core Web Vitals Targets

These are the thresholds Google uses for Search ranking and Chrome UX Report:

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | 2.5s – 4.0s | > 4.0s |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1 – 0.25 | > 0.25 |
| **INP** (Interaction to Next Paint) | ≤ 200ms | 200ms – 500ms | > 500ms |

INP replaced FID in March 2024. It measures the latency of all user interactions over the page lifetime, not just the first.

Secondary targets:
- **TTFB** (Time to First Byte): ≤ 600ms
- **FCP** (First Contentful Paint): ≤ 1.8s
- **TBT** (Total Blocking Time, lab metric): ≤ 200ms

---

## Image Optimisation

### Always use `next/image`

```tsx
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Product hero"
  width={1200}
  height={630}
  priority           // for above-the-fold LCP image
  sizes="(max-width: 768px) 100vw, 1200px"
/>
```

**Why every prop matters:**
- `width` + `height` → reserves space, prevents CLS.
- `priority` → preloads the LCP image, removes lazy-loading delay (use on max 1 image per page).
- `sizes` → tells the browser which srcset variant to download. Without it, browsers download the full-resolution image even on mobile.
- `alt` → accessibility (also required by a11y reviewer).

### Image format config

```js
// next.config.mjs
export default {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
};
```

AVIF is ~50% smaller than JPEG; WebP is ~30% smaller. Next.js falls back automatically.

### External images

```js
images: {
  remotePatterns: [
    { protocol: 'https', hostname: 'cdn.example.com', pathname: '/**' },
  ],
}
```

Never use raw `<img src="https://external.com/...">` — bypasses optimisation pipeline.

---

## Font Optimisation

### Use `next/font` with `display: 'swap'`

```tsx
// app/layout.tsx
import { Inter, Playfair_Display } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  weight: ['400', '700'],   // load only weights you use
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

- `display: 'swap'` shows fallback font immediately, swaps when web font loads → better FCP/LCP.
- `subsets` limits to Latin chars only (skip Cyrillic, Greek, etc. unless needed) → smaller payload.
- Specify `weight` array — loading all 9 weights of Inter when you only use 400/700 wastes bandwidth.
- `next/font` self-hosts the font (no Google Fonts request → no extra DNS round-trip, no privacy issue).

### Local fonts

```tsx
import localFont from 'next/font/local';

const myFont = localFont({
  src: './my-font.woff2',
  display: 'swap',
  variable: '--font-my',
});
```

Always use `.woff2` (best compression). Skip `.woff`, `.ttf`, `.eot` fallbacks unless supporting IE (which Next.js 14+ doesn't anyway).

---

## Server vs Client Components

### Default rule: Server Component unless you need a Client Component

A Client Component is required when the file uses:
- `useState`, `useReducer`, `useContext`, any hook
- `useEffect`, `useLayoutEffect`
- Browser-only APIs (`window`, `document`, `localStorage`)
- Event handlers (`onClick`, `onChange`)
- Class components
- Third-party libraries that internally use any of the above (Framer Motion, most charting libs)

Everything else can be a Server Component:
- Data fetching (`async function Page()` with `await fetch()`)
- Static rendering (marketing pages, blog posts)
- Layout shells, headers, footers (unless they have client-side interactivity)
- Any component that just composes other components

### Common mistake: marking entire pages `"use client"` for one interactive widget

```tsx
// BAD — entire page becomes a client bundle
"use client";
import { useState } from 'react';
export default function Page() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <BigStaticHero />        {/* now ships in client bundle */}
      <BigStaticContent />     {/* now ships in client bundle */}
      <button onClick={() => setOpen(!open)}>Toggle</button>
    </div>
  );
}
```

```tsx
// GOOD — Server Component page, isolate client logic
export default function Page() {
  return (
    <div>
      <BigStaticHero />
      <BigStaticContent />
      <ToggleButton />          {/* Client Component, scoped to interactivity */}
    </div>
  );
}

// components/toggle-button.tsx
"use client";
import { useState } from 'react';
export function ToggleButton() {
  const [open, setOpen] = useState(false);
  return <button onClick={() => setOpen(!open)}>Toggle</button>;
}
```

### Pass Server Components as children to Client Components

When a Client Component wrapper needs to contain server-rendered content, pass it as `children` (not as an imported component):

```tsx
// Client wrapper
"use client";
export function CollapsibleSection({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return <section>{open && children}</section>;
}

// Server Component using it
export default function Page() {
  return (
    <CollapsibleSection>
      <ExpensiveServerComponent />   {/* Stays a Server Component */}
    </CollapsibleSection>
  );
}
```

---

## Dynamic Imports for Heavy Components

```tsx
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('./chart'), {
  ssr: false,                // skip SSR if the lib touches window
  loading: () => <ChartSkeleton />,
});

const RichEditor = dynamic(() => import('./rich-editor'), {
  loading: () => <p>Loading editor…</p>,
});
```

**When to dynamic-import:**
- Heavy libraries (charts, rich-text editors, code editors, video players, map libraries) that aren't above-the-fold.
- Modal/dialog content (load when opened, not at page load).
- Admin-only or rarely-used features.

**When NOT to dynamic-import:**
- Above-the-fold components (extra round-trip hurts LCP).
- Components <10KB gzipped (overhead exceeds savings).

---

## Bundle Analysis

### Setup

```bash
npm i -D @next/bundle-analyzer
```

```js
// next.config.mjs
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer({
  // your config
});
```

### Run

```bash
ANALYZE=true npm run build
```

Opens treemap of every route's bundle. Look for:
- Single dependencies > 100KB (often a sign of importing a whole library when you need one function — e.g. `import _ from 'lodash'` instead of `import debounce from 'lodash/debounce'`).
- Duplicated dependencies across routes (extract to shared chunk via dynamic import or layout).
- Polyfills that shouldn't be there (target modern browsers via `browserslist`).

### Common bundle bloat culprits

| Culprit | Fix |
|---------|-----|
| `lodash` (full) | `lodash-es` + named imports, or use native ES methods |
| `moment` | `date-fns` (tree-shakable) or native `Intl.DateTimeFormat` |
| `axios` | native `fetch` |
| Whole `@mui/material` import | named imports `import { Button } from '@mui/material'` (with `babel-plugin-import` or modern bundler) |
| Whole icon library | per-icon imports `import Heart from 'lucide-react/icons/heart'` |
| `recharts` / `chart.js` on landing page | dynamic import |

---

## Server-Side Data Fetching

Default to fetching in Server Components. Client-side `useEffect` fetches add a waterfall (HTML → JS → fetch → render) and a loading state.

```tsx
// GOOD — Server Component, parallel fetches
export default async function Dashboard() {
  const [user, stats] = await Promise.all([
    fetch('https://api.example.com/user', { next: { revalidate: 60 } }).then(r => r.json()),
    fetch('https://api.example.com/stats', { next: { revalidate: 60 } }).then(r => r.json()),
  ]);
  return <DashboardView user={user} stats={stats} />;
}
```

**Caching options on `fetch`:**
- `{ cache: 'force-cache' }` — default in Next 14, cached indefinitely until revalidated.
- `{ cache: 'no-store' }` — never cache (use for per-request data like authed user).
- `{ next: { revalidate: 60 } }` — ISR, revalidate every 60s.
- `{ next: { tags: ['posts'] } }` — tag-based revalidation via `revalidateTag()`.

---

## Route-Level Code Splitting

Next.js App Router splits routes automatically — each `app/<route>/page.tsx` produces its own chunk. You don't need to do anything for this. But:

- Avoid importing every route's components into a shared `lib/` index file — destroys tree-shaking.
- `loading.tsx` files render instantly while route segment loads — use them on data-heavy routes for perceived performance.
- `error.tsx` files contain errors at the route segment, prevent full-page crash.

---

## Lighthouse CI Integration

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run build
      - run: npm i -g @lhci/cli@0.13.x
      - run: lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
```

```js
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm start',
      url: ['http://localhost:3000', 'http://localhost:3000/about'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 200 }],
      },
    },
    upload: { target: 'temporary-public-storage' },
  },
};
```

---

## Performance Done-Criteria Checklist

Before declaring perf work complete:

- [ ] Lighthouse Performance ≥ 90 (mobile)
- [ ] LCP ≤ 2.5s (real device, not localhost)
- [ ] CLS ≤ 0.1
- [ ] INP ≤ 200ms (test interactive widgets)
- [ ] All images use `next/image` with `width`/`height`
- [ ] LCP image has `priority`
- [ ] All fonts loaded via `next/font` with `display: 'swap'`
- [ ] No `"use client"` on whole-page Server Components that don't need it
- [ ] Heavy non-critical components dynamic-imported
- [ ] Bundle analyzed; no single dep > 100KB unless justified
- [ ] No third-party `<script>` tags blocking render (use `next/script` with `strategy="afterInteractive"` or `lazyOnload`)
- [ ] `next/script` for analytics, chat widgets, A/B test scripts
