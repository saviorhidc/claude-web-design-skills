---
name: vercel-deploy
description: Deploy Next.js/React frontends to Vercel via git push. Use when shipping a frontend, configuring vercel.json, setting up cron jobs, managing environment variables, troubleshooting preview URLs, or preparing for production deployment.
---

# Vercel Frontend Deploy Pattern

> **Use when:** User describes a frontend, dashboard, website, landing page, or web UI to be deployed.
> **Place code in:** `<project>/frontend/`
> **Why this skill exists:** Next.js + Vercel is the optimal delivery pattern for AI-built frontends — git push triggers production deployment, no manual steps, preview URLs per branch for review.

---

## Deploy Pattern

Claude writes Next.js/React code → git push → Vercel auto-deploys to live URL.

No manual deploy step needed once the GitHub repo is connected. Every push to `main` triggers a production deployment. Every PR or branch push triggers a preview deployment with its own URL.

---

## Account Setup (First Time)

1. Sign up at [vercel.com](https://vercel.com)
2. Install the CLI: `npm i -g vercel`
3. Authenticate: `vercel login`
4. Connect the GitHub repo in the Vercel dashboard: **Settings > Git > Connect Git Repository**
5. Set the **Root Directory** to `<project>/frontend` if the repo contains multiple projects

---

## Project Structure

```
<project>/frontend/
├── package.json
├── vercel.json            # optional but recommended
├── next.config.js
├── tailwind.config.ts
├── .env.local             # local secrets — MUST be in .gitignore
├── src/
│   ├── app/               # Next.js 14+ App Router
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── api/           # Route Handlers (serverless)
│   ├── components/
│   │   ├── ui/            # shadcn/ui base components
│   │   ├── layout/        # Header, Footer, Sidebar, Container
│   │   └── sections/      # Page sections (Hero, Features, Pricing)
│   ├── styles/
│   │   ├── tokens.ts      # Design tokens (colors, spacing, radius, shadows)
│   │   └── animations.ts  # Framer Motion reusable variants
│   └── lib/
│       └── utils.ts       # cn() helper, shared utilities
└── components.json        # shadcn/ui config (auto-generated)
```

---

## Design System Setup

Before starting any UI work, install the design system so Claude has concrete constraints.

### 1. Install dependencies

```bash
npm install framer-motion tailwindcss-animate
```

### 2. Install shadcn/ui base components

```bash
npx shadcn@latest init
npx shadcn@latest add button card badge separator
npx shadcn@latest add dialog dropdown-menu sheet
npx shadcn@latest add input label textarea select
npx shadcn@latest add tabs accordion tooltip
npx shadcn@latest add avatar skeleton progress
```

### 3. Pre-UI checklist

- [ ] Design system files exist (`tailwind.config.ts`, `tokens.ts`, `animations.ts`, `globals.css`)
- [ ] shadcn/ui base components installed
- [ ] SPADE framework applied to prompt (Spec, Persona, Anchors, Done-criteria, Examples)
- [ ] Building component-by-component (not full pages at once)

---

## package.json Template

```json
{
  "name": "project-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "typescript": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0"
  }
}
```

---

## vercel.json Configuration

### Basic (most projects)

```json
{
  "framework": "nextjs"
}
```

### With cron jobs

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-sync",
      "schedule": "0 8 * * *"
    }
  ]
}
```

### With function configuration

```json
{
  "framework": "nextjs",
  "functions": {
    "src/app/api/heavy-task/route.ts": {
      "maxDuration": 60
    }
  }
}
```

---

## Cron Jobs

### 1. Define schedule in `vercel.json`

```json
{
  "crons": [{ "path": "/api/cron/daily-sync", "schedule": "0 8 * * *" }]
}
```

### 2. Create the route with CRON_SECRET validation

```typescript
// src/app/api/cron/daily-sync/route.ts
import { timingSafeEqual } from 'node:crypto';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  const provided = authHeader ?? '';
  // Length check prevents timing oracle on length; timingSafeEqual prevents timing oracle on content
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Your cron logic here
  return NextResponse.json({ ok: true });
}
```

### 3. Add CRON_SECRET

```bash
vercel env add CRON_SECRET  # use openssl rand -hex 32 for the value
```

---

## Environment Variables

```bash
vercel env add DATABASE_URL       # prompted for value and environments
vercel env add API_KEY production  # production only
vercel env pull .env.local         # pull remote vars locally
```

```typescript
// Server only
const dbUrl = process.env.DATABASE_URL;

// Client-side (prefix with NEXT_PUBLIC_)
const apiBase = process.env.NEXT_PUBLIC_API_URL;
```

---

## Pre-Deploy Security Gates

Run these checks before every production deployment. Block deploy if any fail.

**1. Env var scope check**
- Verify no `NEXT_PUBLIC_*` variables contain secrets (service keys, JWT secrets, etc.)
- Check Vercel dashboard: each secret must be scoped to "Preview/Production" only, not "Development" (or vice versa for public vars)

**2. Source maps**
- Ensure `next.config.js` has `productionBrowserSourceMaps: false` (or unset — false is default)
- Never ship source maps with server-side logic visible to browser

**3. Security headers**
Run `security-reviewer` agent or manually verify these headers are set in `next.config.js` headers config or middleware:
- `Content-Security-Policy` (nonce-based, no `unsafe-inline` on script-src)
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

**4. Domain lock**
- Confirm only production domains are in Vercel project settings
- Remove any unintended wildcard subdomain configurations

**5. Pre-deploy secret scan**
```bash
npx --yes gitleaks@8.21.2 detect --source . --no-git --exit-code 1
```

**6. Dependency audit**
```bash
npm audit --audit-level=high
```

**7. Rollback runbook**
Before deploying a risky change, note the current production deployment ID:
```bash
vercel ls --scope=<team>
```
To rollback: `vercel rollback <deployment-url>`

---

## CLI Commands

```bash
vercel               # Deploy preview
vercel --prod        # Deploy to production
vercel dev           # Local dev (uses Vercel env vars)
vercel env ls        # List env vars
vercel logs <url>    # View deployment logs
vercel domains ls    # List connected domains
```

---

## Git Auto-Deploy

| Action | Result |
|--------|--------|
| Push to `main` | Production deployment |
| Push to any other branch | Preview deployment with unique URL |
| Open a Pull Request | Preview deployment, link posted as PR comment |
| Merge PR to `main` | Production deployment |

**Rollback:** Vercel Dashboard → Deployments → find last good deployment → **Promote to Production**.

---

## Dev/Prod Lifecycle

| Stage | How | URL |
|-------|-----|-----|
| **Local dev** | `npm run dev` or `vercel dev` | `http://localhost:3000` |
| **Preview** | Push to any non-main branch | `<project>-<hash>.vercel.app` |
| **Production** | Merge to `main` | Your production domain |

**Workflow:**
1. Branch: `git checkout -b dev/<feature>`
2. Develop locally
3. Push → preview URL generated
4. Open PR → Vercel posts preview link as comment
5. Merge → auto-deploys to production

---

## MCP Integration

```bash
vercel mcp start  # Start Vercel MCP server
```

Add to `.mcp.json`:
```json
{
  "vercel": {
    "type": "stdio",
    "command": "npx",
    "args": ["vercel", "mcp", "start"]
  }
}
```

---

## Limitations

| Constraint | Hobby (Free) | Pro |
|------------|-------------|-----|
| Function duration | 60s | 300s |
| Cron jobs | 2 per project | 40 per project |
| Deployments/day | 100 | 6,000 |

- Cron schedules use **UTC timezone**
- `vercel dev` does not execute cron jobs — test cron routes via `curl`
- `NEXT_PUBLIC_` prefix required for client-side env vars
- **Never commit** `.env.local`
