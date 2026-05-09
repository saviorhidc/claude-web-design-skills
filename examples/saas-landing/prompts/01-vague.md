# Prompt 01 — Vague

This is the kind of brief most users send. It's not *bad* — it's just thin. Claude has nothing to anchor on, so it produces the statistical average of every SaaS landing page in its training data.

## The prompt

```
Build me a landing page for a project management SaaS tool. Make it look professional and modern with a hero section, features, and pricing.
```

## What this typically produces

- **Font:** Inter (the "default" everyone reaches for)
- **Primary colour:** indigo-500, possibly with a purple→blue gradient
- **Hero:** centered headline, subheadline, two buttons ("Start Free Trial" + "Watch Demo")
- **Features section:** 3-column or 4-column grid of `rounded-xl` cards with Lucide icons in a tinted circle
- **Pricing:** three-tier card layout, middle tier scaled `1.05` and labeled "Most Popular"
- **CTA:** "Start Free Trial" possibly with a sparkles emoji
- **Footer:** four columns of links, social icons, copyright

The result is competent. It will not embarrass you. It is also indistinguishable from ten thousand other SaaS landing pages, because that is literally what the model averaged across to produce it.

## Why it goes generic

There is nothing in the prompt to push the output away from the centre of the distribution:
- No brand voice or positioning ("for whom?")
- No design direction ("what should it feel like?")
- No anti-patterns to avoid ("not another rounded card grid")
- No success criteria ("how will I know it's good?")

"Professional and modern" is a no-op — every SaaS template self-describes that way, so the term carries no signal. Compare with `02-spade.md`.
