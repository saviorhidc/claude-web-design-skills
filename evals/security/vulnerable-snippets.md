# Security eval corpus — 25 vulnerable Next.js snippets

These are deliberately insecure Next.js / React / Node snippets used as a regression corpus for the `security-reviewer` agent. Each one is annotated with the expected finding so we can diff what the agent reports against what *should* be reported.

Format:

````
### N. <short title>

<one-line description>

```ts
// EXPECTED: <severity> <type> — <brief description>
<vulnerable code>
```
````

Severities: `Critical`, `High`, `Medium`, `Low`.

---

### 1. Hardcoded API key

Secret committed in source — reviewer must flag any plaintext credential.

```ts
// EXPECTED: Critical SecretsExposure — hardcoded Anthropic API key
const anthropic = new Anthropic({
  apiKey: "sk-ant-api03-AAaaBBbb1234567890abcdef..."
});
```

---

### 2. SELECT * with no field allowlist

Unbounded column projection leaks fields the client never needed (password_hash, internal_notes, etc.).

```ts
// EXPECTED: Medium DataExposure — SELECT * leaks unintended columns
export async function GET() {
  const { data } = await supabase.from("users").select("*");
  return Response.json(data);
}
```

---

### 3. API route with no auth check

Route exposes user data with no `getUser()` gate.

```ts
// EXPECTED: Critical MissingAuthentication — no auth check on data-returning route
export async function GET() {
  const { data } = await supabase.from("invoices").select("id, amount, customer_id");
  return Response.json(data);
}
```

---

### 4. String concatenation in SQL

Classic SQL injection via interpolated identifier.

```ts
// EXPECTED: Critical SQLInjection — user input concatenated into SQL string
import { sql } from "@/lib/db";
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  const rows = await sql.unsafe(`SELECT * FROM orders WHERE id = ${id}`);
  return Response.json(rows);
}
```

---

### 5. `dangerouslySetInnerHTML` without sanitisation

Raw user content rendered as HTML — stored XSS.

```tsx
// EXPECTED: Critical XSS — dangerouslySetInnerHTML with unsanitised user content
export function Comment({ body }: { body: string }) {
  return <div dangerouslySetInnerHTML={{ __html: body }} />;
}
```

---

### 6. CORS wildcard on credentialed route

`Access-Control-Allow-Origin: *` combined with cookies/credentials breaks the same-origin guarantee.

```ts
// EXPECTED: High CORSMisconfiguration — wildcard origin on credentialed endpoint
export async function GET() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}
```

---

### 7. Missing `httpOnly` on auth cookie

Session cookie readable from JS — any XSS escalates to full account takeover.

```ts
// EXPECTED: High InsecureCookie — auth cookie missing httpOnly/secure/sameSite
cookies().set("session", token, {
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
});
```

---

### 8. In-memory rate limiter

Module-scope `Map` does not persist across serverless instances — useless in production.

```ts
// EXPECTED: High BrokenRateLimiting — in-memory limiter ineffective on serverless
const hits = new Map<string, number>();
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const count = (hits.get(ip) ?? 0) + 1;
  hits.set(ip, count);
  if (count > 10) return new Response("Too many requests", { status: 429 });
  // ...
}
```

---

### 9. Cookie-presence-only auth check

Middleware treats *the existence of any cookie named `sb-access-token`* as proof of authentication.

```ts
// EXPECTED: Critical BrokenAuthentication — cookie presence checked but token never verified
export function middleware(req: NextRequest) {
  const token = req.cookies.get("sb-access-token");
  if (!token) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}
```

---

### 10. No IDOR / authorisation check

User authenticated, but no check that the *requested resource* belongs to them.

```ts
// EXPECTED: Critical IDOR — authenticated user can read any invoice by ID
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("unauthorized", { status: 401 });
  const { data } = await supabase.from("invoices").select("*").eq("id", params.id).single();
  return Response.json(data);
}
```

---

### 11. Trusting `file.type` for upload validation

`file.type` is set by the client and trivially spoofed.

```ts
// EXPECTED: High InsecureFileUpload — file.type is client-controlled, not the actual MIME
export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("file") as File;
  if (file.type !== "image/png") return new Response("png only", { status: 400 });
  await uploadToBucket(file);
  return Response.json({ ok: true });
}
```

---

### 12. `'unsafe-inline'` in CSP

Neutralises XSS protection — script-src 'unsafe-inline' allows any injected `<script>` to execute.

```ts
// EXPECTED: High CSPMisconfiguration — script-src 'unsafe-inline' negates XSS defence
const headers = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'",
};
```

---

### 13. Returning raw error messages to client

Stack traces leak filesystem paths, library versions, and implementation details.

```ts
// EXPECTED: Medium InfoDisclosure — raw error/stack returned to client
export async function POST(req: Request) {
  try {
    return Response.json(await doWork(req));
  } catch (err: any) {
    return new Response(err.stack, { status: 500 });
  }
}
```

---

### 14. Mass assignment

Spreading the request body straight into a DB insert — user can set fields like `is_admin`, `stripe_customer_id`.

```ts
// EXPECTED: High MassAssignment — request body spread into DB insert without allowlist
export async function POST(req: Request) {
  const body = await req.json();
  const { data } = await supabase.from("users").insert({ ...body }).select().single();
  return Response.json(data);
}
```

---

### 15. Open redirect

`?next=` used as a redirect target with no allowlist — phishing vector.

```ts
// EXPECTED: Medium OpenRedirect — user-controlled redirect target without allowlist
export async function GET(req: Request) {
  const next = new URL(req.url).searchParams.get("next") ?? "/";
  return NextResponse.redirect(next);
}
```

---

### 16. SSRF via user-supplied URL

Server fetches whatever URL the user submits — internal metadata endpoints (`http://169.254.169.254/`) become reachable.

```ts
// EXPECTED: High SSRF — server fetches arbitrary user-supplied URL
export async function POST(req: Request) {
  const { url } = await req.json();
  const res = await fetch(url);
  return new Response(await res.text());
}
```

---

### 17. Webhook with no signature verification

Anyone can POST forged events to the webhook endpoint.

```ts
// EXPECTED: Critical UnverifiedWebhook — Stripe webhook accepted without signature check
export async function POST(req: Request) {
  const event = await req.json();
  if (event.type === "checkout.session.completed") {
    await markPaid(event.data.object.customer);
  }
  return new Response("ok");
}
```

---

### 18. Service-role key on the client

`SUPABASE_SERVICE_ROLE_KEY` exposed in a client component bypasses every RLS policy.

```tsx
// EXPECTED: Critical SecretsExposure — service-role key bundled into client code
"use client";
import { createClient } from "@supabase/supabase-js";
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
);
```

---

### 19. CI uses `npm install` instead of `npm ci`

`npm install` mutates the lockfile and may pull newer (uncommitted) versions in CI.

```yaml
# EXPECTED: Low SupplyChain — npm install in CI mutates lockfile, prefer npm ci
- name: install
  run: npm install
```

---

### 20. No HSTS header

Browser may downgrade to HTTP on subsequent requests.

```ts
// EXPECTED: Medium MissingSecurityHeader — no Strict-Transport-Security header set
const securityHeaders = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  // (missing Strict-Transport-Security)
};
```

---

### 21. JWT decoded but not verified

`jwt-decode` reads the payload without checking the signature — any attacker-crafted token is trusted.

```ts
// EXPECTED: Critical BrokenAuthentication — JWT payload trusted without signature verification
import jwtDecode from "jwt-decode";
const payload = jwtDecode<{ sub: string; role: string }>(req.headers.get("authorization")!);
if (payload.role === "admin") return adminData();
```

---

### 22. `Math.random()` for security tokens

Non-cryptographic PRNG — predictable from seed, unsuitable for tokens.

```ts
// EXPECTED: High WeakCrypto — Math.random() used for security-sensitive token
const resetToken = Math.random().toString(36).slice(2);
await db.passwordResets.insert({ userId, token: resetToken });
```

---

### 23. Prototype pollution via `Object.assign` on req.body

User-controlled `__proto__` key pollutes Object.prototype.

```ts
// EXPECTED: High PrototypePollution — Object.assign on user-controlled object
export async function POST(req: Request) {
  const body = await req.json();
  const config = {};
  Object.assign(config, body);
  applyConfig(config);
}
```

---

### 24. Missing CSRF protection on state-changing GET

Mutating action via GET is reachable from any origin's `<img>` tag.

```ts
// EXPECTED: High CSRF — state-changing operation served via GET, no CSRF token
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  await supabase.from("posts").delete().eq("id", id);
  return new Response("deleted");
}
```

---

### 25. Email enumeration via login error messages

Different responses for "user not found" vs "wrong password" lets attackers enumerate accounts.

```ts
// EXPECTED: Low InfoDisclosure — distinguishable login errors enable email enumeration
const user = await db.users.findOne({ email });
if (!user) return Response.json({ error: "no account with that email" }, { status: 404 });
const ok = await bcrypt.compare(password, user.passwordHash);
if (!ok) return Response.json({ error: "wrong password" }, { status: 401 });
```

---

## How to use this corpus

1. Run the `security-reviewer` agent over this file (or paste each snippet into a fresh review session).
2. For each snippet, the agent should produce at minimum the finding annotated in the `// EXPECTED:` comment.
3. Track the **recall** (how many EXPECTED findings the agent reproduces) and **precision** (how many agent findings are not noise) over time.
4. When adding a new snippet, follow the same format and include an EXPECTED comment.
