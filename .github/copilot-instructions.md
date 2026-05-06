---
applyTo: "**"
---
# cad_tag — Project Instructions

A browser-first CAD tag environment for composing furniture, mechanisms, and buildings from deterministic, reusable HTML-like parametric assemblies. See [`AGENTS.md`](../AGENTS.md) and [`.github/ARCHITECTURE.md`](../.github/ARCHITECTURE.md) for full context.

## Non-negotiable constraints
- Never treat rendered Three.js meshes as source truth; the canonical source is the normalized tag and assembly graph.
- Every standard or custom tag must declare a deterministic size contract, default units, and validation errors before renderer or export integration.
- Keep furniture, mechanism, and building assemblies composable through the same attachment and constraint vocabulary instead of siloed ad hoc code paths.
- Custom tag registries must be explicit and versioned; do not execute arbitrary user code from markup.
- Geometry generation for ergonomic or structural components must be parameter driven and reproducible from serialized inputs.
- Do not couple structural analysis assumptions directly to the rendering layer; analysis consumes the canonical resolved assembly model.

## Source layout (`src/`)
- `src/core/tag-schema/` — canonical schema for standard tags, custom tags, units, and validation rules.
- `src/core/registry/` — built-in tags and versioned custom tag registration.
- `src/core/solver/` — deterministic dimension, clearance, and attachment solving.
- `src/core/catalog/` — ergonomic and catalog-grade procedural component generators.
- `src/render/` — Three.js preview compilation and inspection helpers.
- `src/export/` — Fusion-oriented or other downstream export adapters.
- `src/app/` — browser authoring UI and editor workflow.

## Verification commands
```sh
test -f package.json && npm run lint || printf 'lint not configured\n'    # Must pass before any commit
test -f package.json && npm run build || printf 'build not configured\n'   # Build output
test -f package.json && npm run test || printf 'test not configured\n'     # All tests
test -f package.json && npm run test:e2e || printf 'e2e tests not configured\n'  # End-to-end regression gate
```

## Autonomous pipeline

All agent work flows through five lanes in order. Every agent emits a structured lane event before and after each phase so state is machine-readable:

```
▶ [LANE:explore]   → ✓ [LANE:explore:complete]
▶ [LANE:plan]      → ✓ [LANE:plan:complete]
▶ [LANE:implement] → ✓ [LANE:implement:complete]
▶ [LANE:verify]    → ✓ [LANE:verify:complete]
▶ [LANE:review]    → ✓ [LANE:review:complete]
```

A `✗ [LANE:{name}:blocked]` event means the lane failed and needs attention before the pipeline can proceed.

## Agents available

| Agent | Purpose | Invoke |
|-------|---------|--------|
| `@CAD` | Full autonomous pipeline (explore→plan→implement→verify→review) | High-level tasks |
| `@Plan` | Design a plan, wait for approval, handoff to Implementer | Complex features |
| `@Explore` | Read-only codebase research and Q&A | Questions |
| `@Implementer` | Execute an approved plan (handoff only) | Via Plan |
| `@Reviewer` | Security + quality audit | After implementation |
| `@Verification` | Run lint / build / tests | Spot checks |

Prompt shortcuts in `.github/prompts/`:
- **Plan Change** — design a plan for a requested change
- **Implement Change** — run the full pipeline for a specific request
- **Verify Workspace** — run the narrowest relevant verification

## Environment awareness

Copilot can be triggered from multiple environments. Behave accordingly:

| Environment | Handoff buttons | Terminal | How to start |
|-------------|-----------------|----------|--------------|
| VS Code agent chat | ✓ available | ✓ full | `@CAD <task>` or use a prompt shortcut |
| GitHub.com browser agent | ✗ none | ✗ none | `@copilot <task>` in a repository |
| GitHub Issue (assigned) | ✗ none | ✗ sandboxed | Assign the issue to Copilot on github.com |
| GitHub Copilot Workspace | context-dependent | ✗ sandboxed | Open issue → "Open in Workspace" |

When running in a browser or issue context without handoff buttons: output the next agent's full prompt inline so the user can paste it or continue in the same session.