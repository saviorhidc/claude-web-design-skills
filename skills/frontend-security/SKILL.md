---
name: frontend-security
description: Security protocol for AI-generated frontends — secrets, auth, input validation, SQL injection, XSS, CSRF, security headers, rate limiting, RLS, file uploads, cookies, IDOR/BOLA. Use when building any web app, API route, auth flow, database query, or preparing to deploy. AI tools routinely generate insecure code; this skill prevents the 16 most common mistakes.
---

# Frontend Security Protocol

> **Use when:** Building any frontend, website, dashboard, or web application — especially with AI code generation tools.
> **Why this skill exists:** AI tools (Lovable, Cursor, Copilot, Claude) frequently generate code with security vulnerabilities — hardcoded API keys, missing auth checks, template-literal SQL, `dangerouslySetInnerHTML` without sanitization. This protocol provides a baseline security checklist for AI-generated frontend code; it doesn't enforce anything on its own. See `RESEARCH.md` for the full documented failure-mode analysis.

---

## Quick Reference (scan first, read sections as needed)

| Section | Topic | Key rule |
|---------|-------|----------|
| §1 | Environment variables | Never `NEXT_PUBLIC_*` for secrets |
| §2 | Authentication | Use `supabase.auth.getUser()`, never cookie-presence |
| §3 | Input validation | Use Zod `safeParse()`, size-limit requests |
| §4 | SQL / RLS | Use parameterized queries; test RLS with anon key |
| §5 | File uploads | Validate MIME, max size, virus scan for user files |
| §6 | CSRF | Use `sameSite: strict` or double-submit pattern |
| §7 | CSP + Headers | Nonce-based CSP; HSTS; no unsafe-inline script-src |
| §8 | Logging | Log events, not payloads; return generic user messages |
| §9 | Rate limiting | Upstash/Redis — in-process Map does NOT work on Vercel |
| §10 | CORS | Static allowlist; always set `Vary: Origin` |
| §11 | Dependencies | `npm ci`, `npm audit`, gitleaks; rotate exposed secrets |
| §12 | RLS policies | WITH CHECK, SECURITY DEFINER, service_role vs anon |
| §13 | IDOR | Always scope queries to authenticated user's ID |
| §14 | Cookies | `__Host-` prefix; HttpOnly; Secure; SameSite=Strict |
| §15 | Pre-deploy | Run security-reviewer agent before every production push |

---

## Quick Reference: Security Checklist

Run through this checklist before deploying any frontend project:

- [ ] **Secrets**: No API keys, tokens, or credentials in client-side code
- [ ] **Auth**: Every sensitive endpoint verifies user identity server-side
- [ ] **Input**: All user input validated with schemas (Zod) on the server
- [ ] **SQL**: All queries use parameterized placeholders (`$1`, `$2`), never string concatenation
- [ ] **XSS**: No `dangerouslySetInnerHTML` without DOMPurify sanitization
- [ ] **CSRF**: State-changing endpoints use CSRF tokens or Server Actions
- [ ] **Headers**: Security headers set (CSP, HSTS, X-Frame-Options, X-Content-Type-Options)
- [ ] **Errors**: Generic error messages to client, detailed logs server-side only
- [ ] **Rate Limiting**: Applied to auth endpoints (5/15min) and API routes (100/15min)
- [ ] **CORS**: Configured to allow only known origins, not `*`
- [ ] **Dependencies**: `npm audit` clean, lockfile committed
- [ ] **RLS**: Supabase tables have Row Level Security enabled with proper policies
- [ ] **Uploads**: File type/size validated, filenames sanitized, stored outside web root
- [ ] **HTTPS**: Enforced in production, HTTP redirects to HTTPS
- [ ] **Cookies**: `httpOnly: true`, `secure: true`, `sameSite: 'lax'` on all session cookies
- [ ] **IDOR**: Every record fetch/mutate includes owner_id/user_id constraint; no mass assignment via unvalidated body

---

## 1. Secrets & Environment Variables

### The Problem
AI tools frequently hardcode API keys directly into frontend code where they're visible in the browser.

### Rules

- **Never** put secrets (`sk_`, `secret_`, passwords, database URLs) in `.js`/`.jsx`/`.ts`/`.tsx` files
- Only use `NEXT_PUBLIC_` prefixed variables for values safe to expose (publishable keys, app URLs)
- Private keys go in `.env.local` (gitignored) and Vercel environment variables
- **Proxy** all sensitive API calls through backend routes — frontend calls `/api/stripe`, backend calls Stripe with the secret key

### Implementation

```typescript
// ❌ NEVER — secret in client code
const STRIPE_KEY = "sk_live_abc123xyz...";

// ✅ CORRECT — public key only, private key stays server-side
// .env.local
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...  // No NEXT_PUBLIC_ prefix = server-only
```

### Pre-commit Check
```bash
# Scan staged files for leaked secrets
git diff --cached | grep -iE "(sk_live|secret_key|password|api_key|Bearer )" && echo "⚠ Possible secret detected!" || echo "✓ Clean"
```

---

## 2. Authentication & Authorization

### The Problem
AI tools generate endpoints that trust client-sent user IDs or skip auth checks entirely.

### Rules

- **Never** trust `user-id` from request headers, body, or query params
- **Always** extract user identity from the server-side session/JWT
- Use middleware to protect all sensitive routes automatically
- Implement session timeouts and token rotation

### Implementation

```typescript
// ❌ NEVER — trusts client-sent ID
export async function GET(request: Request) {
  const userId = request.headers.get('user-id');
  const data = await db.query(`SELECT * FROM users WHERE id = ${userId}`);
}

// ✅ CORRECT — verify from session
import { auth } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await db.query(
    'SELECT id, name, email FROM users WHERE id = $1',
    [session.user.id]
  );
  return Response.json(data);
}
```

### Next.js Middleware Pattern

> **Cookie-presence is NOT auth.** Always verify the session against the auth provider — `supabase.auth.getUser()` round-trips to verify, while `getSession()` only reads the cookie and is forgeable.

```typescript
// middleware.ts — actually verifies the session
import { createServerClient } from '@supabase/ssr';
import { NextResponse, NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/api/user', '/api/admin'];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => request.cookies.get(name)?.value,
        set: (name, value, options) => response.cookies.set({ name, value, ...options }),
        remove: (name, options) => response.cookies.set({ name, value: '', ...options }),
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser(); // round-trips to verify; getSession() does NOT
  const isProtected = protectedPaths.some((p) => request.nextUrl.pathname.startsWith(p));
  if (isProtected && !user) return NextResponse.redirect(new URL('/login', request.url));
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

> **Note:** the `matcher` is required — without it, middleware runs on every static asset, font, and `_next/*` request, causing performance and cost issues.

### OAuth / OIDC + JWT Patterns

**PKCE flow (for SPA/mobile):** Always use PKCE (`code_challenge_method=S256`) — never implicit flow.

**JWT verification:** Never decode without verifying signature. Use the provider's SDK (`supabase.auth.getUser()`, `auth()` from next-auth) — not `jwt_decode()` which skips signature check.

**Refresh token rotation:** Enable refresh token rotation in your auth provider. On `401`, call `supabase.auth.refreshSession()` or equivalent — do not silently fail.

**Account lockout:** After 5-10 failed login attempts, implement exponential backoff or temporary lockout. Supabase: set Auth → Rate Limiting. Custom: use Upstash rate limiter on the login endpoint keyed to email + IP.

---

## 3. Input Validation & Sanitization

### The Problem
AI tools generate endpoints that pass user input directly to databases and rendering without validation.

### Rules

- Validate **all** user input on the server with Zod schemas
- Client-side validation is UX only — never rely on it for security
- Sanitize HTML content with DOMPurify before rendering
- Whitelist allowed characters for search/filter inputs

### Implementation

```typescript
import { z } from 'zod';

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  tags: z.array(z.string().max(50)).max(10).default([]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Limit request body size at the route level
  const MAX_BODY_SIZE = 1_000_000; // 1MB
  const contentLength = parseInt(request.headers.get('content-length') ?? '0');
  if (contentLength > MAX_BODY_SIZE) {
    return Response.json({ error: 'Payload too large' }, { status: 413 });
  }

  const body = await request.json();

  // DON'T: const validated = createPostSchema.parse(body) — throws, leaks Zod internals to caller
  // DO:
  const result = createPostSchema.safeParse(body);
  if (!result.success) {
    return Response.json({ error: 'Invalid input' }, { status: 400 });
    // do NOT return result.error.issues to client
  }
  const validated = result.data;

  const post = await db.query(
    'INSERT INTO posts (user_id, title, content) VALUES ($1, $2, $3) RETURNING id',
    [session.user.id, validated.title, validated.content]
  );
  return Response.json(post);
}
```

---

## 4. SQL Injection Prevention

### The Problem
AI tools generate server functions with string concatenation in SQL queries.

### Rules

- **Always** use parameterized queries (`$1`, `$2` placeholders)
- **Never** concatenate user input into SQL strings
- Validate input types before querying (use Zod)
- Apply principle of least privilege to database users

### Implementation

```typescript
// ❌ NEVER — string concatenation
const sql = `SELECT * FROM users WHERE name LIKE '%${query}%'`;

// ✅ CORRECT — parameterized query
const results = await db.query(
  'SELECT id, name FROM users WHERE name ILIKE $1 LIMIT 20',
  [`%${query}%`]
);

// ✅ Validate before querying
const idSchema = z.string().uuid();
const validatedId = idSchema.parse(id);
await db.query('DELETE FROM users WHERE id = $1', [validatedId]);
```

---

## 5. XSS Prevention

### The Problem
AI tools use `dangerouslySetInnerHTML` or render user content without encoding.

### Rules

- React auto-escapes JSX expressions — use this by default
- **Never** use `dangerouslySetInnerHTML` without DOMPurify
- **Never** use `document.innerHTML` with user input
- Implement Content Security Policy headers as defense-in-depth

### Implementation

```tsx
// ❌ NEVER — raw HTML rendering
<div dangerouslySetInnerHTML={{ __html: user.bio }} />

// ✅ CORRECT — auto-escaped
<p>{user.bio}</p>

// ✅ If HTML rendering is required, sanitize first
// isomorphic-dompurify works in both Node.js (server) and browser
// The original `dompurify` package requires `window` and throws or no-ops in server context
import DOMPurify from 'isomorphic-dompurify';

const sanitized = DOMPurify.sanitize(post.content, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
  ALLOWED_ATTR: ['href', 'target', 'rel'],
});
// Always add noopener when rendering links with target=_blank
const sanitizedWithNoopener = sanitized.replace(
  /<a([^>]*target=["']_blank["'][^>]*)>/gi,
  '<a$1 rel="noopener noreferrer">'
);
<div dangerouslySetInnerHTML={{ __html: sanitizedWithNoopener }} />
```

---

## 6. CSRF Protection

### Rules

- Use Next.js Server Actions for forms (built-in CSRF protection)
- For custom API routes, implement CSRF tokens
- **Never** use GET requests for state-changing operations
- Set `SameSite` cookie attribute to `Strict` or `Lax`

### Implementation

```tsx
// ✅ Server Actions — automatic CSRF protection
'use server';
export async function deleteAccount() {
  const session = await auth();
  if (!session?.user) throw new Error('Not authenticated');
  await db.query('DELETE FROM users WHERE id = $1', [session.user.id]);
}

// Component
<form action={deleteAccount}>
  <button type="submit">Delete Account</button>
</form>
```

> **Note:** Server Actions auto-protect against CSRF, but Route Handlers under cookie auth do NOT. For cookie-authenticated Route Handlers, you must add explicit CSRF handling:

```typescript
// For Route Handlers using cookie-based auth (not Server Actions):
// Option 1: Use Bearer token (no CSRF risk since browser can't auto-attach Authorization header)
// Option 2: Double-submit cookie
const csrfFromHeader = request.headers.get('x-csrf-token');
const csrfFromCookie = request.cookies.get('csrf')?.value;
if (!csrfFromHeader || csrfFromHeader !== csrfFromCookie) {
  return Response.json({ error: 'CSRF check failed' }, { status: 403 });
}
```

---

## 7. Security Headers

Apply these headers to every response via Next.js middleware or `next.config.js`:

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Control referer leakage |
| `Permissions-Policy` | `geolocation=(), microphone=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), interest-cohort=(), browsing-topics=()` | Disable unused APIs and FLoC/Topics |
| `Content-Security-Policy` | nonce-based (see below) | Prevent inline script injection |

### Implementation — Nonce-based CSP (no `'unsafe-inline'`)

```typescript
// middleware.ts — nonce-based CSP
import { NextResponse, NextRequest } from 'next/server';
import crypto from 'node:crypto';

export function middleware(request: NextRequest) {
  const nonce = crypto.randomBytes(16).toString('base64');
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ');

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Frame-Options', 'DENY'); // legacy header — supported in all browsers
  // Modern equivalent: frame-ancestors 'none' in CSP (set above)
  // Keep BOTH for defense-in-depth; CSP overrides XFO in CSP-aware browsers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(), usb=(), accelerometer=(), gyroscope=(), magnetometer=(), interest-cohort=(), browsing-topics=()');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

> **Note:** Tailwind v3 JIT does NOT require `'unsafe-inline'` for styles in production — only in dev. Never ship `'unsafe-inline'` in script-src; it nullifies the CSP. The `matcher` config above is required — without it, middleware runs on every static asset, font, and `_next/*` request, causing performance and cost issues.
> **HSTS preload note:** `preload` is irreversible — only add it after a 6-month bake-in period. Submit to https://hstspreload.org only for fully HTTPS-ready domains.

---

## 8. Error Handling

### The Problem
AI tools return raw error messages that expose database schema, file paths, and SQL queries.

### Rules

- Log full errors server-side (with context: user ID, endpoint, timestamp)
- Return **generic** error messages to the client
- Never expose database names, table structures, or file paths
- **Never return `error.message` or stack traces to the client.** Log them server-side with a request ID, return only a generic message to the user.

### Implementation

```typescript
// DON'T: return NextResponse.json({ error: error.message }, { status: 500 })
// DO:
export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const data = await db.query('SELECT id, title FROM posts WHERE id = $1', [id]);
    if (!data) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(data);
  } catch (error) {
    // Server-side only — log error details with requestId for tracing, never send to client
    console.error(JSON.stringify({
      requestId,
      endpoint: '/api/posts',
      error: (error as Error).message,  // server-side only
      stack: (error as Error).stack,    // server-side only
      errorCode: (error as any).code,   // pg error code (e.g. "23503")
      timestamp: new Date().toISOString(),
    }));
    // Return generic message + requestId to client (requestId allows support tracing without leaking details)
    return Response.json({ error: 'Internal server error', requestId }, { status: 500 });
  }
}
```

---

## 9. Rate Limiting

### Rules

- Auth endpoints: 5 attempts per 15 minutes
- General API: 100 requests per 15 minutes
- Expensive operations (reports, exports): 10 per hour

### Implementation (Next.js — distributed via Upstash)

> **Module-scope `Map<>` rate limiters DO NOT WORK on serverless.** Each lambda instance has its own state; cold starts reset everything. Always use a shared store (Redis/Upstash) for serverless.

Install: `npm install @upstash/ratelimit @upstash/redis`

```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const authLimiter = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '15 m'),
  analytics: true,
  prefix: 'auth',
});

export async function POST(req: Request) {
  const ip = (req as any).ip ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success, reset } = await authLimiter.limit(ip);
  if (!success) {
    return Response.json({ error: 'Too many attempts' }, {
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) },
    });
  }
}
```

---

## 10. CORS Configuration

### Rules

- **Never** use `Access-Control-Allow-Origin: *` in production
- Whitelist specific origins
- Only allow necessary HTTP methods and headers

### Implementation

> **Never** use `Access-Control-Allow-Origin: *` in production. Without an `OPTIONS` preflight handler, browsers block cross-origin mutations. Without `Vary: Origin`, CDNs cache the wrong CORS response for multi-origin apps.

```typescript
// Complete CORS response handler
const ALLOWED_ORIGINS = new Set(['https://yourdomain.com', 'https://app.yourdomain.com']);

export function corsHeaders(request: Request) {
  const origin = request.headers.get('origin') ?? '';
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : '';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400', // 24h preflight cache
    'Vary': 'Origin',                  // critical: tells CDN to cache per-origin
  };
}

// Handle preflight
if (request.method === 'OPTIONS') {
  return new Response(null, { status: 204, headers: corsHeaders(request) });
}
```

```typescript
// next.config.js — also set Vary: Origin globally for /api routes
const ALLOWED_ORIGINS = [
  'https://yourdomain.com',
  'https://preview.yourdomain.com',
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean);

module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Vary', value: 'Origin' },  // CDN must not cache wrong CORS response
        ],
      },
    ];
  },
};

// In each API route handler — echo only if in allowlist
export async function OPTIONS(request: Request) {
  const origin = request.headers.get('origin') ?? '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowed,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Vary': 'Origin',
    },
  });
}
```

---

## 11. Dependency Security

### Rules

- Run `npm audit` before every deployment
- Commit `package-lock.json` to prevent supply chain attacks
- Pin major versions in `package.json`

### Commands

```bash
# Install with lockfile (prevents supply-chain drift)
npm ci

# Audit prod dependencies only (dev vulns don't ship to prod)
npm audit --omit=dev

# Open-source vulnerability scanner (no lifecycle scripts, no npm network calls)
npx osv-scanner scan --lockfile package-lock.json

# Untrusted lockfiles: skip lifecycle scripts
npm ci --ignore-scripts
```

> **Always commit `package-lock.json`** to prevent lockfile poisoning.

### Detect & rotate leaked secrets

```bash
# Detect leaked keys before commit
npx gitleaks detect --source . --verbose
# Or: npx trufflehog filesystem .

# If a key is committed and pushed: it's compromised — rotate immediately
# 1. Supabase dashboard → Settings → API → Regenerate service_role key
# 2. Update in Vercel env vars: vercel env add SUPABASE_SERVICE_ROLE_KEY
# 3. git filter-repo to remove from history (cannot undo public exposure — only rotate)
```

---

## 12. Supabase Row Level Security (RLS)

### Rules

- **Always** enable RLS on every table
- Define explicit policies for SELECT, INSERT, UPDATE, DELETE
- Use `auth.uid()` to reference the logged-in user — never trust client-sent IDs
- **Never** use service role key in client-side code (it bypasses all RLS)

### Implementation

```sql
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_or_published" ON posts
  FOR SELECT USING (auth.uid() = user_id OR is_published = true);

CREATE POLICY "insert_own" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own" ON posts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own" ON posts
  FOR DELETE USING (auth.uid() = user_id);
```

### Testing RLS Policies

```sql
-- Test RLS policies locally
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "test-user-id"}';
SELECT * FROM posts; -- should only return test-user-id's posts

-- NEVER enable RLS on auth.* schema (Supabase manages these)
-- NEVER grant bypassrls role to application users
```

### Advanced RLS Patterns

**WITH CHECK vs USING:**
- `USING` — filters rows on SELECT/UPDATE/DELETE (which rows the user can see/touch)
- `WITH CHECK` — validates rows on INSERT/UPDATE (what data the user can write)
- Always define both for UPDATE policies

**SECURITY DEFINER functions:**
```sql
-- Runs as table owner, bypasses RLS — use sparingly for admin operations only
CREATE FUNCTION admin_get_all_users()
RETURNS SETOF users
LANGUAGE sql SECURITY DEFINER
AS $$ SELECT * FROM users $$;
```
`SECURITY DEFINER` bypasses RLS entirely. Only use for trusted server-side functions.

**auth.jwt() claims:**
```sql
-- Access custom JWT claims in RLS policies
CREATE POLICY "org members only"
ON documents FOR SELECT
USING (org_id = (auth.jwt() ->> 'org_id')::uuid);
```

**service_role key:**
The `service_role` key bypasses ALL RLS. Use only in:
- Server-side Supabase clients (never in browser code)
- Backend functions that need admin access
Never use `service_role` in frontend code or expose via `NEXT_PUBLIC_*`.

**Testing RLS:**
Always test with the `anon` key (not service_role) to verify policies actually restrict access:
```bash
# Simulate anonymous access
curl -H "apikey: YOUR_ANON_KEY" https://your-project.supabase.co/rest/v1/your_table
```

---

## 13. Secure File Uploads

### Rules

- Whitelist allowed MIME types and extensions
- Generate random filenames (UUID) — never use user-provided names
- Set file size limits (e.g., 5MB)
- Serve with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`

### Implementation

> Install: `npm install file-type` (ESM-only in v19+; if using CJS use `file-type@18`). Never trust `file.name` extension or `file.type` — both are client-controlled. Always sniff magic bytes.

```typescript
import { fileTypeFromBuffer } from 'file-type';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file || file.size > MAX_SIZE) {
    return Response.json({ error: 'Invalid file' }, { status: 400 });
  }

  // Read first 4100 bytes for magic-byte detection (file-type needs this)
  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer.subarray(0, 4100));

  if (!detected || !ALLOWED_TYPES.has(detected.mime)) {
    return Response.json({ error: 'Unsupported file type' }, { status: 400 });
  }

  const safeFilename = `${crypto.randomUUID()}.${detected.ext}`;
  // ... store safeFilename, NOT file.name
  return Response.json({ filename: safeFilename });
}
```

---

## 14. Secure Cookie Configuration

### Complete Cookie Hardening

```javascript
// Full secure cookie configuration
const cookieOptions = {
  name: '__Host-session', // __Host- prefix: forces Secure + no Domain + path=/
  value: sessionToken,
  httpOnly: true,         // no JS access
  secure: true,           // HTTPS only  
  sameSite: 'strict',     // no cross-origin requests
  path: '/',              // required for __Host- prefix
  maxAge: 60 * 60 * 8,   // 8-hour absolute timeout (seconds)
  // no domain: required for __Host- prefix
};
```

```typescript
// Use __Host- prefix for maximum security (browser enforces Secure, no Domain, path must be /)
response.cookies.set('__Host-session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',    // 'strict' breaks OAuth redirects; 'lax' is the right default
  maxAge: 60 * 60 * 24, // 24 hours
  path: '/',           // required with __Host- prefix
  // Do NOT set domain: with __Host-, browser enforces host-binding automatically
});
```

**`__Host-` prefix:** Cookies prefixed `__Host-` must be: Secure, no Domain attribute, Path=/. This prevents subdomain attacks. Use for auth session cookies.

**SameSite trade-offs:**
- `strict` — blocks CSRF but breaks OAuth redirects (user arrives without cookie)
- `lax` — allows top-level GET redirects (good for OAuth callbacks) but vulnerable to some CSRF
- `none` — cross-origin allowed; requires Secure; use only for embedded widgets

**Double-submit CSRF pattern (for APIs accepting cookies + non-strict SameSite):**
```javascript
// Server: set CSRF token in both cookie and response body
// Client: send CSRF token in X-CSRF-Token header with each mutation
// Server: verify header === cookie value
```

**Idle vs absolute timeouts:** Use `maxAge` for absolute (total session length). For idle timeout (inactivity), track last-activity server-side and invalidate after N minutes of no requests.

> **Note:** `__Host-` prefix prevents subdomain cookie injection. `sameSite: 'strict'` breaks OAuth/OIDC flows; `'lax'` is the correct production default for most apps.

---

## 15. Common AI Tool Security Mistakes

| Mistake | How to Spot | Fix |
|---------|-------------|-----|
| Hardcoded API keys | `grep -r "sk_" src/` | Move to `.env.local` |
| `SELECT *` in queries | Returns passwords, hashes | Explicit column list |
| No auth on API routes | Missing session check | Add `auth()` guard |
| `dangerouslySetInnerHTML` | Search for it | Use DOMPurify or remove |
| String concat in SQL | Template literals in queries | Parameterized queries |
| `console.log(error)` in client | Leaks stack traces | Generic error messages |
| CORS `*` | Open API to any origin | Whitelist specific origins |
| Missing `httpOnly` on cookies | Session hijack risk | Set all cookie flags |
| No rate limiting | Brute force possible | Add rate limiter middleware |
| Service role key in browser | Bypasses all RLS | Server-side only |
| IDOR / BOLA (no ownership check) | `WHERE id = $1` with no `AND user_id = $2` | Add owner constraint to every record query |

---

## 16. Object-Level Authorization (IDOR / BOLA)

### The Problem
The most common AI-codegen security failure (OWASP API Top 10 #1: BOLA). AI tools generate queries that fetch records by primary key without verifying ownership.

### Rules

- Every query that fetches/mutates a record by ID must additionally constrain by the authenticated user's ID, role, or tenant.
- Supabase RLS gives this for free at the database level; raw SQL backends do not.
- Admin endpoints must check `session.user.role === 'admin'` explicitly — presence of a session is not enough.
- Watch for mass assignment: `await db.update(table, body)` with unvalidated body — attacker can set `is_admin: true`.
- Open redirect: validate `?next=` / `redirect_to` against an allowlist or require path-relative (starts with `/` and not `//`).
- Webhook routes: read raw body (`req.text()`), verify HMAC signature with `crypto.timingSafeEqual`.
- SSRF: any user-supplied URL fetched server-side must be validated against an allowlist; block `localhost`, `127.0.0.1`, link-local, private IP ranges, and metadata endpoints (`169.254.169.254`).

### Implementation

```typescript
// ❌ NEVER — no ownership check
const order = await db.query('SELECT * FROM orders WHERE id = $1', [id]);

// ✅ CORRECT — ownership verified
const order = await db.query(
  'SELECT id, total, status FROM orders WHERE id = $1 AND user_id = $2',
  [id, session.user.id]
);

// ✅ Mass assignment defense
const updateSchema = z.object({ title: z.string().max(200), content: z.string() });
const validated = updateSchema.parse(body); // strips unknown fields
await db.query('UPDATE posts SET title = $1, content = $2 WHERE id = $3 AND user_id = $4',
  [validated.title, validated.content, postId, session.user.id]);
```

---

## Security Review Workflow

1. **Scan for secrets**: `grep -rE "(sk_|secret|password|api_key|Bearer )" src/`
2. **Check auth**: Every `/api/` route should call `auth()` or check session
3. **Audit queries**: Search for template literals in SQL — all should use `$1` params
4. **Review headers**: Check middleware or `next.config.js` for security headers
5. **Test errors**: Hit endpoints with bad input — should return generic messages
6. **Check RLS**: Every Supabase table should have `ENABLE ROW LEVEL SECURITY`
7. **Run audit**: `npm audit` should be clean
8. **Check CORS**: No wildcard `*` in production
9. **Review uploads**: File type validation, size limits, safe filenames
10. **Cookie flags**: `httpOnly`, `secure`, `sameSite` on all session cookies
