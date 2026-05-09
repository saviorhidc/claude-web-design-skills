# claude-web-design-skills

An opinionated skill pack I built for my own Next.js work — sharing in case it's useful.

> Built by [saviorhidc](https://github.com/saviorhidc). Structural pattern inspired by [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills).

---

## Why This Exists

AI-generated frontends have two systemic failure modes: **generic aesthetics** (Inter font, purple gradients, centered card grids) and **insecure backends** (hardcoded keys, missing auth, template-literal SQL). Both failures are documented, repeatable, and fixable with the right constraints upfront.

These skills exist because Claude Code's output quality is entirely convention-dependent — it has no built-in design system defaults, no visual preview, and no security enforcement. This repo is the externalised version of those conventions, grounded in comparative research across v0, Bolt.new, Cursor, and Claude Code (see `RESEARCH.md` for the full evidence base).

The result: Claude Code is guided toward distinctive frontends, safer defaults, validated inputs, and repeatable pre-deployment review patterns.

---

## Skills

| Skill | What it does | Auto-triggers on |
|-------|-------------|-----------------|
| `frontend-design` | Commits Claude to a bold aesthetic direction before touching code. Enforces distinctive typography, composition, and motion patterns. | "build a UI", "design a page", UI aesthetic decisions: layout structure, color palette, typography, motion |
| `frontend-security` | 16-point (§1–§16, including §16 IDOR/BOLA) OWASP-style security checklist with implementation code. Covers secrets, auth, SQL, XSS, CSRF, headers, RLS, uploads, cookies. | API routes, auth, deploy prep, database queries |
| `frontend-prompting` | SPADE framework (Spec, Persona, Anchors, Done-criteria, Examples) + 4-round iteration strategy. Turns vague briefs into professional specs. SPADE is defined in `skills/frontend-prompting/SKILL.md` — see that file for the full framework. | Planning a UI prompt, writing a design brief, refining any vague request |
| `frontend-actionable-tips` | Top 10 techniques for Next.js + Tailwind + Framer Motion: design-system-first, component-by-component, centralized animation variants. | Starting a new frontend, improving existing UI |
| `frontend-performance` | Performance budgets, Core Web Vitals, bundle size optimisation for Next.js + Tailwind frontends. | Performance audits, Lighthouse scores, bundle analysis |
| `vercel-deploy` | Next.js → Vercel deploy patterns: project structure, design system setup, vercel.json, cron jobs, env vars, CLI commands. | Shipping a frontend, configuring Vercel |
| `screenshot-workflow` | Puppeteer-based visual feedback loop. Ships a working `screenshot.mjs` script — capture localhost dev server, then have Claude `Read` the PNG. Closes the visual-preview gap. | Visual QA, design-vs-reference comparisons, responsive checks, before/after refactor verification |

## Agents

| Agent | What it does |
|-------|-------------|
| `security-reviewer` | Spawned after frontend code changes. Scans the git diff against the 16-point (§1–§16, including §16 IDOR/BOLA) security checklist. Reports Critical/High/Medium/Low findings with file paths, line numbers, and fixes. |
| `deployment-readiness-reviewer` | Pre-deploy risk assessment — checks build config, env vars, and deployment hygiene before shipping. |
| `accessibility-reviewer` | WCAG 2.2 AA compliance review — audits semantic HTML, keyboard navigation, ARIA usage, and colour contrast. |
| `design-system-reviewer` | Design system consistency review — flags token misuse, style drift, and component inconsistencies. |

---

## Installation

> **Security note:** Skills are markdown that materially influence Claude's behavior — they are system-prompt-equivalent. Read every `SKILL.md` (and `agents/security-reviewer.md`) before copying anything to `~/.claude/skills/` or `.claude/agents/`. Pin to the latest tag: `git checkout $(git describe --tags --abbrev=0)` rather than tracking `main` so a future repo compromise can't silently rewrite your installed skills on the next `git pull`.

### Option A: Plugin install (recommended)

> Plugin install is recommended: it enables updates via `claude plugin update .` and avoids name collision with global skills.

```bash
git clone https://github.com/saviorhidc/claude-web-design-skills.git
cd claude-web-design-skills
claude plugin install .
```

Then either:
- **Global**: Merge the contents of `CLAUDE.md` into `~/.claude/CLAUDE.md` to apply the behavioral guidelines everywhere
- **Per-project**: Copy `CLAUDE.md` to your project root (or merge it into your existing `CLAUDE.md`)

### Option B: Manual copy (fallback)

Copy the skills into your global Claude Code skills directory:

```bash
# Clone the repo
git clone https://github.com/saviorhidc/claude-web-design-skills.git
cd claude-web-design-skills

# Copy skills to global Claude skills directory
cp -r skills/* ~/.claude/skills/

# Copy agent to your project's agents directory
cp agents/security-reviewer.md .claude/agents/
```

Then either:
- **Global**: Merge the contents of `CLAUDE.md` into `~/.claude/CLAUDE.md` to apply the behavioral guidelines everywhere
- **Per-project**: Copy `CLAUDE.md` to your project root (or merge it into your existing `CLAUDE.md`)

### Option C: Symlink (keeps skills auto-updating when you `git pull`)

Create a named symlink **per skill** so Claude Code finds `~/.claude/skills/<skill-name>/SKILL.md`. (A single symlink to the parent `skills/` directory does **not** work — the loader expects each skill at its own top-level path.)

```bash
# macOS / Linux — per-skill symlink loop
git submodule add https://github.com/saviorhidc/claude-web-design-skills.git .skills
cd .skills
for dir in skills/*/; do
  skill=$(basename "$dir")
  ln -sf "$(pwd)/$dir" ~/.claude/skills/"$skill"
done
```

### Windows (PowerShell) equivalent — Option B

```powershell
# Clone, then copy each skill directory into the global skills dir
git clone https://github.com/saviorhidc/claude-web-design-skills.git
cd claude-web-design-skills
Get-ChildItem skills -Directory | ForEach-Object {
  Copy-Item -Recurse -Path $_.FullName -Destination "$HOME\.claude\skills\$($_.Name)" -Force
}
# Verify: run claude plugin list to see installed skills
```

### Verify installation

**Step 1 — Confirm the plugin is registered:**
```bash
claude plugin list
# Expected: claude-web-design-skills listed with its skills
```

**Step 2 — Smoke test (optional):** Open a new Claude Code session and send:
> "Design a landing page hero section"

If the skill is active, Claude will respond with structured design thinking (aesthetic brief, typography, color palette) rather than generic output.

> **User vs project scope:** Skills install to `~/.claude/skills/` (global — available in every project). The `security-reviewer` agent installs to `.claude/agents/` (per-project — intentional: different projects may need different agent configurations). Copy it to each project where you want automated security review.

---

## Stack Compatibility

These skills are optimized for:
- **Framework:** Next.js 14+ (App Router)
- **Styling:** Tailwind CSS 3.4 (tested); Tailwind v4 partially applicable — `@theme` and OKLCH syntax not yet covered in examples
- **Components:** shadcn/ui
- **Animation:** Framer Motion
- **Backend:** Supabase (RLS patterns included)
- **Deploy:** Vercel

The core prompting and security patterns apply to any React/TypeScript project.

### Dependencies

Most skills are pure Markdown and ship no runtime dependencies. The exception is `screenshot-workflow`, which uses Puppeteer. Its dependency is pinned in `skills/screenshot-workflow/package.json` — there is no root `package.json`. If you intend to run `screenshot.mjs`, install Puppeteer per-skill:

```bash
cd skills/screenshot-workflow
npm install
```

---

## Reference

The `reference/` folder contains the full Perplexity research documents:

| File | Topic |
|------|-------|
| `01-ai-frontend-landscape.md` | AI frontend tool landscape 2025–2026 |
| `02-design-systems-for-ai.md` | Tailwind, shadcn/ui, Framer Motion patterns for AI |
| `03-tool-comparison.md` | v0 vs Bolt vs Cursor vs Claude Code comparison matrix |
| `04-resources.md` | Videos, articles, libraries, learning path |

---

## Credits

- `frontend-design` skill based on [Anthropic's official frontend-design skill](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md)
- Structure inspired by [forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)
- Research conducted February 2026 using Perplexity AI deep research
- Security checklist grounded in [OWASP Top 10](https://owasp.org/www-project-top-ten/)

## Contributing

### Formatting

All Markdown files are formatted with Prettier (`proseWrap: always`) and checked with markdownlint. Run before committing:

```bash
npx prettier --write "**/*.md"
npx markdownlint "**/*.md" --ignore node_modules
```

## License

This pack is an MIT-licensed derivative of [Anthropic's official claude-web-design-skills](https://github.com/anthropics/claude-web-design-skills) (also MIT-licensed). See `LICENSE` for full terms.
