---
name: deterministic-assembly-solver
description: "Resolving dimensions, clearances, constraints, and attachment frames into one canonical assembly graph that later feeds rendering, export, and structural analysis. Triggers: solver, dimensions, constraints, layout, assembly, deterministic, attachments, structural analysis."
---
# deterministic-assembly-solver

## When to Use
Use this skill for work involving solver, dimensions, constraints, layout, assembly, deterministic, attachments, structural analysis.

## Bundled Assets

- No bundled runtime helpers yet.
- Keep golden solve fixtures, canonical graph snapshots, and error-case matrices in `tests/unit/` and `tests/integration/` once the test tree exists.

## Procedure

1. Normalize all physical dimensions into a single internal unit system, preferably millimeters, before any layout or geometry decision is made.
2. Compile markup and registry definitions into a canonical part graph containing semantic part kinds, reference frames, clearances, and attachment intents.
3. Apply defaults, catalog rules, ergonomic constraints, and explicit user overrides in a deterministic order. The same input must always produce the same solved output.
4. Reject ambiguous, cyclic, under-constrained, or over-constrained assemblies. Do not silently guess between alternative structures.
5. Keep the solver pure with respect to rendering. It should emit analysis-ready dimensions, joints, and metadata; renderer adapters can consume the result later.
6. Record attachment frames, load paths, spans, and support conditions in the solved model so future structural-analysis modules do not need to reverse engineer mesh geometry.
7. Maintain golden fixtures for representative furniture, mechanism, and building assemblies and rerun them whenever solver precedence changes.

If this skill includes bundled scripts or starter files, prefer those local assets over repeating long inline commands.

## Validation

After completing the procedure:
```sh
test -f package.json && npm run lint || printf 'lint not configured\n'
test -f package.json && npm run build || printf 'build not configured\n'
test -f package.json && npm run test || printf 'test not configured\n'
```