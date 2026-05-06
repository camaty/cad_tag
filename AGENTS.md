# AGENTS.md

## Overview

- **cad_tag** is a browser-first CAD tag environment for composing furniture, mechanisms, and buildings from deterministic, reusable HTML-like parametric assemblies.
- Tech stack: TypeScript, Three.js, Web Components, DOM/XML-style parsing, parametric CAD DSL, browser-based editing.
- The main deliverables are in `dist/`.

## Why This Repo Is Structured This Way

The system converts HTML-like CAD tags into a normalized semantic assembly graph, resolves units and constraints deterministically, then fans out to renderer, exporter, and later structural-analysis adapters. Standard tags capture recurring CAD structures, while custom tags register procedural generators with explicit dimension contracts so a given input size resolves to one canonical structure. The browser editor, preview renderer, Fusion-oriented export layer, and future structural checks must all operate on that same canonical graph rather than on ad hoc mesh state.

## File Structure

```text
cad_tag/
├── AGENTS.md
├── .github/
│   ├── ARCHITECTURE.md
│   ├── agents/
│   ├── instructions/
│   ├── prompts/
│   └── skills/
├── .vscode/
│   └── settings.json
├── src/
│   ├── app/
│   ├── core/
│   │   ├── assembly/
│   │   ├── catalog/
│   │   ├── registry/
│   │   └── solver/
│   ├── export/
│   └── render/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── dist/
```

## Working Model

- Most feature work flows through `src/main.ts`, `src/app/editor-shell.ts`, and `src/core/index.ts`.
- Changes to core logic may affect multiple subsystems — read the relevant source files before planning.
- `src/` and `tests/` (or equivalent) must be updated together when behavior changes.

## Clawable Workflow

All Copilot agent work flows through five lanes in order. Every agent emits a structured lane event before and after each phase:

| Lane | Agent | Emits |
|------|-------|-------|
| explore | `@Explore` | `▶/✓ [LANE:explore]` |
| plan | `@Plan` | `▶/✓ [LANE:plan]` |
| implement | `@Implementer` | `▶/✓ [LANE:implement:step:{N}]` |
| verify | `@Verification` | `▶/✓ [LANE:verify:{command}]` |
| review | `@Reviewer` | `▶/✓ [LANE:review]` |

Use `@CAD` to run the full pipeline autonomously. Use individual agents for targeted work.

When working from a GitHub Issue, paste the issue body or URL to `@CAD` (VS Code) or use the **Issue From GitHub** prompt shortcut.

## How To Verify Changes

- `npm install` installs dependencies once the package manifest exists.
- `test -f package.json && npm run lint || printf 'lint not configured\n'` runs linting.
- `test -f package.json && npm run build || printf 'build not configured\n'` builds the project.
- `test -f package.json && npm run test || printf 'test not configured\n'` runs all tests.
- `test -f package.json && npm run test:e2e || printf 'e2e tests not configured\n'` runs the end-to-end regression gate (required before merge).

## Read These When Relevant

- `README.md` — public API and usage
- `.github/ARCHITECTURE.md` — full component map and data flows
- Any `.github/` or future `docs/` entries for subsystem deep-dives

## Repo-Specific Constraints

- Never treat rendered Three.js meshes as source truth; the canonical source is the normalized tag and assembly graph.
- Every standard or custom tag must declare a deterministic size contract, default units, and validation errors before renderer or export integration.
- Keep furniture, mechanism, and building assemblies composable through the same attachment and constraint vocabulary instead of siloed ad hoc code paths.
- Custom tag registries must be explicit and versioned; do not execute arbitrary user code from markup.
- Geometry generation for ergonomic or structural components must be parameter driven and reproducible from serialized inputs.
- Do not couple structural analysis assumptions directly to the rendering layer; analysis consumes the canonical resolved assembly model.