---
name: cad-tag-grammar
description: "Designing and extending the CAD tag DSL for standard tags, custom tags, unit-aware attributes, registry contracts, and schema validation. Triggers: cad tag, custom tag, standard tag, schema, registry, markup parser, unit contract, fusion 360 mapping."
---
# cad-tag-grammar

## When to Use
Use this skill for work involving cad tag, custom tag, standard tag, schema, registry, markup parser, unit contract, fusion 360 mapping.

## Bundled Assets

- No bundled runtime helpers yet.
- Keep example markup, schema fixtures, and registry snapshots beside parser and schema tests once `src/` and `tests/` exist.

## Procedure

1. Start from a canonical normalized node record that preserves `tag`, `id`, `attrs`, `children`, source order, and provenance.
2. Separate standard-library tags from versioned custom tags. Standard tags represent reusable CAD structures such as carcasses, legs, frames, spans, rails, or shells. Custom tags wrap specialized procedural generators but still compile into the same semantic assembly model.
3. Every tag definition must declare required dimensions, default units, optional attributes, allowed child tags, attachment semantics, validation errors, and downstream export meaning.
4. Parse markup as strict XML or HTML-like structured input and reject malformed trees, duplicate ids, unknown units, or undeclared custom tags before any geometry work begins.
5. Resolve CSS-like semantic rules and tag attributes into one explicit parameter set. Avoid hidden fallback chains that make the same markup solve differently between browser preview and export.
6. When introducing Fusion-oriented tags or manufacturing-specific tags, map them to semantic parts, attachment frames, and material metadata rather than to renderer-only widgets.
7. Store round-trip fixtures for parse, normalize, validate, and serialize behavior so the language can evolve without breaking older assemblies.

If this skill includes bundled scripts or starter files, prefer those local assets over repeating long inline commands.

## Validation

After completing the procedure:
```sh
test -f package.json && npm run lint || printf 'lint not configured\n'
test -f package.json && npm run build || printf 'build not configured\n'
test -f package.json && npm run test || printf 'test not configured\n'
```