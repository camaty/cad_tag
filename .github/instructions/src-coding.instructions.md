---
description: "Use when writing or editing source files in src/. Covers linting rules, formatting, naming conventions, import ordering, and cad_tag-specific code patterns."
applyTo: "src/**/*.{ts,tsx,js,jsx}"
---
# Source Code Conventions (`src/**/*.{ts,tsx,js,jsx}`)

## Naming
- Files and folders: kebab-case for folders, camelCase for helper modules, PascalCase for classes and custom element constructors.
- Semantic CAD tag names: PascalCase for part tags such as `Cabinet`, `SeatShell`, and `DrawerGroup`; lower-kebab-case for custom registry ids and preset names.
- Use descriptive names for geometric frames, dimensions, constraints, and materials; avoid one-letter variables outside trivial math loops.

## Import Ordering
- Platform and built-in imports first.
- External packages second.
- Internal aliases or relative imports third.
- Side-effect imports last and rare.

## Formatting
- 4-space indentation in browser scripts and TypeScript modules to match the reference HTML prototype.
- Single quotes in TypeScript and JavaScript unless external formats require double quotes.
- Semicolons required.
- LF line endings.
- Prefer immutable data transforms for geometry specs; isolate Three.js scene mutation inside renderer adapters.
Formatter: **Prettier**

## Architecture Patterns

### Never edit `dist/` directly
All changes must go in `src/` or permitted directories. `dist/` is generated output.

The system converts HTML-like CAD tags into a normalized semantic assembly graph, resolves units and constraints deterministically, then fans out to renderer, exporter, and later structural-analysis adapters. Standard tags capture recurring CAD structures, while custom tags register procedural generators with explicit dimension contracts so a given input size resolves to one canonical structure. The browser editor, preview renderer, Fusion-oriented export layer, and future structural checks must all operate on that same canonical graph rather than on ad hoc mesh state.

## Verification
After changes:
```sh
test -f package.json && npm run lint || printf 'lint not configured\n'
test -f package.json && npm run build || printf 'build not configured\n'
test -f package.json && npm run test:unit || printf 'unit tests not configured\n'
```