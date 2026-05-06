---
description: "Implement a scoped change in cad_tag using the generated agent workflow"
name: "Implement Change"
argument-hint: "Feature, bugfix, or refactor request"
agent: "CAD"
---
Implement the requested change in cad_tag.

Requirements:
- Read [AGENTS.md](../../AGENTS.md) and respect project constraints
- Keep changes tightly scoped to the user request
- Run test -f package.json && npm run lint || printf 'lint not configured\n', test -f package.json && npm run build || printf 'build not configured\n', and the narrowest relevant tests before finishing
- If the task is ambiguous or risky, stop and ask a clarifying question before editing
- Report any verification that could not be run