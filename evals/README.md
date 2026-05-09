# Evals

This directory contains evaluation corpora for testing skill behavior and security patterns.

## Structure

- `skill-trigger/` — Prompts that should and should not trigger each skill
- `security/` — Vulnerable code snippets for testing security-reviewer detection

## Running Evals

Evals are manual — run each prompt and record whether the expected skill activated and whether the output was correct.

### Results Table

Record results in this format after each eval run:

| Date | Prompt file | Expected skill | Actual skill triggered | Output quality | Pass/Fail | Notes |
|------|-------------|---------------|----------------------|----------------|-----------|-------|
| YYYY-MM-DD | skill-trigger/trigger-prompts.md | frontend-design | frontend-design | ✓ aesthetic brief included | ✅ PASS | |
| YYYY-MM-DD | security/vulnerable-snippets.md | security-reviewer | security-reviewer | ✓ flagged CSP issue | ✅ PASS | |

## Adding New Evals

1. Add prompt to the appropriate subdirectory
2. Label with: `# [ID] — [expected-skill] — [pass/fail-criteria]`
3. Run against current version and record in the results table above
4. Commit results alongside the eval file
