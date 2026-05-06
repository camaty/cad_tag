---
description: "Use when writing or editing test files. Covers cad_tag test pyramid structure, coverage targets, Vitest + Playwright syntax, helpers, and test runner details."
applyTo: "tests/**"
---
# Testing Conventions (`tests/**`)

## Test Pyramid

```text
tests/
├── unit/         parser, schema, unit normalization, solver, generator tests
├── integration/  registry → assembly graph → renderer/export pipeline tests
└── e2e/          browser editor flows, catalog presets, and scene regression checks
```

## Commands

```sh
test -f package.json && npm run test || printf 'test not configured\n'                      # All tests
test -f package.json && npm run test:unit || printf 'unit tests not configured\n'          # Unit only (fast, no build required)
test -f package.json && npm run test:integration || printf 'integration tests not configured\n'  # Integration (run after test -f package.json && npm run build || printf 'build not configured\n')
```

## Coverage Targets
- Geometry compiler and solver layers should stay above 85% statement coverage once tests exist.
- Every new standard tag or procedural component needs at least one solver test and one rendered or fixture-based regression check.

## Test Framework: `Vitest + Playwright`

## File / Test Structure

- Test files should mirror source ownership so parser, registry, solver, renderer, and export failures remain isolated.
- `describe` blocks should name the module or tag family under test.
- `it` or `test` blocks should describe deterministic outcomes such as dimension resolution, attachment placement, or validation failures.

## Helpers
- `tests/helpers/` — shared utilities for fixtures, scene snapshots, and geometry assertions.
- Import from helpers rather than duplicating setup code.

## Anti-Patterns
- Do not write tests that depend on animation timing or camera easing values.
- Do not assert exact floating-point equality for computed geometry; use epsilon tolerances.
- Do not import from `dist/` in tests — import from `src/` directly.
- Do not skip flaky render regressions silently — stabilize or document them.