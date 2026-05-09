# Security Policy

## Scope

This skill pack ships markdown templates that influence Claude's code generation. Security vulnerabilities include:

- Template code that would cause Claude to generate insecure patterns (SQL injection, XSS, missing auth, IDOR)
- Agent prompts that could be exploited via prompt injection
- Install instructions that could expose users to supply-chain attacks

## Reporting a vulnerability

Please **do not open a public GitHub issue** for security vulnerabilities.

Report privately via:
- Email: security@saviorhidc.dev (response within 72 hours)
- GitHub Security Advisories: https://github.com/saviorhidc/claude-web-design-skills/security/advisories

Include:
- Which skill or agent is affected
- The vulnerable pattern (quote the line from SKILL.md)
- What a user copying that pattern would produce in their codebase
- A suggested fix (optional but appreciated)

## Response

We aim to respond within 48 hours and publish a fix within 7 days for Critical issues.

## Supply Chain Security

This repository uses the following measures:
- Dependencies pinned via `package-lock.json`
- `npm audit` run in CI on every push
- No automatic dependency auto-merge without human review
