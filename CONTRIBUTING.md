# Contributing

## Adding a new skill

1. Create a directory: `skills/<skill-name>/`
2. Create `skills/<skill-name>/SKILL.md` with frontmatter:
   ```yaml
   ---
   name: <skill-name>   # MUST match directory name exactly
   description: ...     # Single sentence; mutually exclusive with other skills' triggers
   ---
   ```
3. Only `name` and `description` are valid frontmatter keys — any others are ignored.
4. Run the CI frontmatter validator locally before opening a PR.

## Adding a new agent

1. Create `agents/<agent-name>.md`
2. Valid frontmatter keys: `name`, `description`, `tools`, `model` only.
3. Include a prompt-injection defense section if the agent reads user-controlled content.
4. Add an IDOR/authorization check if the agent reviews API code.

## Security issues

See `SECURITY.md` for the vulnerability disclosure policy.
