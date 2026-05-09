---
name: screenshot-workflow
description: Take screenshots of localhost dev servers via Puppeteer for visual feedback. Use when iterating on UI designs, comparing against reference designs, debugging layout issues, doing visual QA, or verifying responsive behavior. Closes Claude Code's biggest documented weakness — the lack of visual preview. Includes SSRF protection — remote URLs blocked by default; pass --allow-remote only in trusted environments.
---

# Screenshot Workflow

> **Why this skill exists:** Research across v0, Bolt.new, Cursor, and Claude Code identified Claude Code's #1 weakness as the lack of visual preview — design quality is entirely prompt-dependent because the model can't see what it produced. This skill closes that gap. Take a screenshot of the running dev server, then read the PNG with Claude's `Read` tool. Claude can see and analyze the image directly.

---

## Prerequisites — Read Before Installing

This skill ships an executable Puppeteer script (`screenshot.mjs`). Unlike the other skills in this collection, it requires runtime setup before it works. Skim this section first.

### What you need

| Requirement | Why | Where to get it |
|-------------|-----|-----------------|
| **Node.js 18+** | The script uses ES modules (`.mjs`) and modern async/await | [nodejs.org](https://nodejs.org) |
| **Puppeteer 21+** | Provides headless Chromium for screenshots | `npm install puppeteer --save-dev` |
| **~170MB free disk** | Puppeteer downloads its own Chromium binary on first install | One-time download |
| **A running dev server** | The script captures whatever's at the URL you point it at | `npm run dev`, `vercel dev`, etc. |

### Where Chromium gets cached

Puppeteer downloads Chromium **once per Node version** to a global cache:

| OS | Cache path |
|----|-----------|
| macOS / Linux | `~/.cache/puppeteer/` |
| Windows | `%LOCALAPPDATA%\puppeteer\` (e.g. `C:\Users\<you>\AppData\Local\puppeteer\`) |

If the cache is missing or you change Node version, Puppeteer re-downloads on next install.

### Where to install Puppeteer (per-project vs workspace root)

Two valid patterns:

- **Per-project** — `cd <project> && npm install puppeteer --save-dev`. Each project gets its own copy. Most explicit; safest for CI.
- **Workspace root** — install Puppeteer once at the top of a monorepo. Node's module resolution walks up the directory tree, so subprojects find it via the parent `node_modules`. **Saves disk space** (one Chromium copy instead of N) and **avoids version drift**. Use this if you have multiple frontends in one repo.

### Common install gotchas

- **Corporate proxy blocks Chromium download** — set `PUPPETEER_DOWNLOAD_BASE_URL` to a mirror, or pre-install Chromium and set `PUPPETEER_EXECUTABLE_PATH`.
- **`puppeteer-core` vs `puppeteer`** — this skill uses `puppeteer` (with bundled Chromium). Don't substitute `puppeteer-core` unless you know what you're doing — it doesn't bundle a browser.
- **`PUPPETEER_SKIP_DOWNLOAD=true`** — if your `.npmrc` has this flag set, Chromium won't download and the script will fail. Unset for the install, then optionally re-set.

---

## Quick Start

After completing Prerequisites above:

### 1. Drop `screenshot.mjs` into your project root (or workspace root)

The script lives next to this `SKILL.md`. Copy it to your project root — no edits needed, it's portable. From a subproject in a monorepo, you'd call it as `node ../../screenshot.mjs <url>`.

### 2. Add to `.gitignore`

```
.screenshots/
```

### 3. Take a screenshot

```bash
node screenshot.mjs http://localhost:3000
node screenshot.mjs http://localhost:3000 hero-section   # with label
node screenshot.mjs https://example.com after-fix --allow-remote  # remote URL (trusted env only)
```

Output: `./.screenshots/screenshot-N.png` (auto-incremented, never overwritten).

> **SSRF protection:** Remote URLs are blocked by default. Only `localhost`, `127.0.0.1`, and `::1` are allowed without the `--allow-remote` flag. Pass `--allow-remote` only in trusted environments (e.g. local dev machines). Never enable it in CI or shared infrastructure.

### 5. Have Claude read it

After the screenshot exists, use the `Read` tool on the PNG path. Claude sees the image directly.

---

## The Comparison Vocabulary

When reviewing a screenshot against a reference (Figma, another site, a design doc), be **specific** with measurements. Vague feedback wastes iterations:

| ❌ Vague | ✅ Specific |
|---------|-------------|
| "Looks off" | "Heading is 32px, reference shows ~24px" |
| "Spacing's wrong" | "Card gap is 16px, should be 24px (gap-6)" |
| "Wrong shade of blue" | "Primary is `#4F46E5`, design tokens specify `#6366F1`" |
| "Border looks weird" | "Border radius is `rounded-lg` (8px), reference uses `rounded-xl` (12px)" |
| "Buttons aren't right" | "Primary button padding is `px-3 py-1`, should be `px-6 py-3`" |

Specific comparisons fix in one round. Vague comparisons spiral.

---

## The Check-Everything Checklist

When reviewing a screenshot, audit every category — don't fixate on one issue:

- **Spacing & padding** — section spacing, card padding, button padding, gap between elements
- **Font** — size, weight, line-height, letter-spacing, font-family
- **Colors** — exact hex values for backgrounds, text, borders, accents
- **Alignment** — left/center/right, baseline, vertical centering, grid alignment
- **Border radius** — every container, button, image, input
- **Shadows** — depth, blur, spread, color
- **Image sizing** — aspect ratio, object-fit, responsive scaling

Pair this checklist with the SPADE framework's **D**one-criteria: each item above can become a verifiable pass/fail before merge.

---

## Motion-Rich Sites (Important)

The bundled `screenshot.mjs` is built to handle motion-rich pages. After navigation, it:

1. Waits 2s for client-side hydration (Next.js dev mode is slow)
2. Slow-scrolls through the page (250px every 150ms) so each section sits in viewport long enough to fire `IntersectionObserver` callbacks
3. Settles for 1.5s after scroll for animations to complete
4. Scrolls back to top + 600ms wait before `fullPage` capture

**Why this matters:** without the slow scroll-through, sections that use Framer Motion's `whileInView` or any CSS scroll-triggered reveal get captured at their `initial` state — opacity:0 — leaving big empty gaps in the screenshot. The script handles this transparently; you don't need to do anything special.

**If your site still has gaps:** check the Framer Motion variant inheritance gotcha documented in `frontend-actionable-tips/SKILL.md` (Technique #11). It's the most common cause when a parent's `whileInView` doesn't propagate to children.

---

## Workflow Patterns

### Pattern A: Iterate against a reference

```
1. Upload reference image to Claude (paste into chat)
2. Generate the component
3. Run dev server
4. node screenshot.mjs http://localhost:3000
5. Read the screenshot — compare to reference using the vocabulary above
6. Refine — repeat from step 3
```

Two or three rounds of this beat ten rounds of "make it nicer."

### Pattern B: Multi-viewport responsive check

The script ships a `VIEWPORTS` map keyed by label. Pass any of `mobile`, `tablet`, or `desktop` as the second argument and the script captures at that device's dimensions:

| Label | Width × Height | DPR | Device |
|-------|---------------|-----|--------|
| `mobile` | 390 × 844 | 2 | iPhone 14 |
| `tablet` | 768 × 1024 | 2 | iPad Mini |
| `desktop` | 1280 × 800 | 2 | default (used for any other label) |

```bash
node screenshot.mjs http://localhost:3000 mobile
node screenshot.mjs http://localhost:3000 tablet
node screenshot.mjs http://localhost:3000 desktop
```

Then ask Claude to read all three and flag layout breaks. Faster than manually resizing the browser window.

To add or change a viewport, edit the `VIEWPORTS` object at the top of `screenshot.mjs`. Any label not in the map falls back to `desktop`, so passing a free-form label like `hero-section` still works as a filename suffix.

### Pattern C: Before/after security or refactor

```
1. node screenshot.mjs http://localhost:3000 before-refactor
2. Apply changes (security-reviewer fixes, refactor, design tweak)
3. node screenshot.mjs http://localhost:3000 after-refactor
4. Read both — confirm visual parity (no regressions)
```

Especially valuable after security work — confirms the secured version didn't break the layout.

---

## Integration with Other Skills

| Pair with | Why |
|-----------|-----|
| `frontend-design` | Generate UI → screenshot → refine. Adds visual feedback to the design loop. |
| `frontend-prompting` (SPADE) | Done-criteria like "renders at 320/768/1280px without breaks" become checkable via screenshots at each viewport. |
| `security-reviewer` agent | After security review passes, screenshot to confirm secured version still renders correctly. |
| `frontend-actionable-tips` | Technique #4 ("reference existing components") becomes verifiable — screenshot the reference, compare against new component. |

---

## What NOT to Do

- **Don't commit screenshots.** They're disposable. Always `.gitignore` the `.screenshots/` folder.
- **Don't screenshot production URLs without a reason.** This is for dev iteration; live URLs are slower (network latency) and may be rate-limited.
- **Don't skip the comparison vocabulary.** "Looks better" without specifics is the iteration trap. Every comparison should have a measurable claim.
- **Don't run Puppeteer headed in CI.** Default headless mode is faster and works in any environment.

---

## Privacy & Redaction

Never commit screenshot output of authenticated or user-specific content.
- Add `.screenshots/` to `.gitignore`
- For post-login captures, blur sensitive fields: `await page.evaluate(() => { document.querySelectorAll('[data-redact]').forEach(el => el.style.filter = 'blur(8px)'); });`
- Do not screenshot pages containing PII, session tokens, or API keys in the DOM

---

## Origin & Credit

Workflow concept observed in a publicly shared CLAUDE.md (May 2026) — a developer who packaged this Puppeteer-screenshot pattern for personal use. The bundled `screenshot.mjs` here is a fresh, portable, cross-platform implementation. Credit to the original pattern; the script is independent.

---

## Files in this skill

- `SKILL.md` — this file
- `screenshot.mjs` — the working Puppeteer script (drop into project root)
