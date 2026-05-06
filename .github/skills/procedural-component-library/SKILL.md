---
name: procedural-component-library
description: "Authoring ergonomic and catalog-grade procedural components such as seat shells, cabinet carcasses, drawer systems, joinery, and building assemblies as reusable custom tags. Triggers: procedural model, ergonomic seat, cabinet, catalog component, generator, furniture, building, custom tag library."
---
# procedural-component-library

## When to Use
Use this skill for work involving procedural model, ergonomic seat, cabinet, catalog component, generator, furniture, building, custom tag library.

## Bundled Assets

- No bundled runtime helpers yet.
- Keep anthropometric references, catalog dimension presets, and preview scene fixtures near the generator and its tests once the source tree exists.

## Procedure

1. Encode anthropometric, joinery, or catalog constraints explicitly in parameters and guard rules. Do not treat hand-tuned mesh edits as reusable design logic.
2. Define each procedural component in terms of physical inputs such as span, thickness, radius, support condition, comfort target, or manufacturing rule.
3. Emit semantic subparts, anchor frames, and metadata together with preview geometry so the component can participate in assembly solving, export, and later structural checks.
4. Register the generator as a versioned custom tag with a documented schema, default presets, and validation failures for out-of-range parameters.
5. For design-sensitive parts such as seat shells or catalog-grade cabinets, capture proportion and silhouette checks through rendered fixtures or curated presets so visual quality can be reviewed consistently.
6. Keep Fusion-oriented export metadata, material hints, and manufacturing assumptions adjacent to the generator contract rather than scattering them across UI code.
7. When a component becomes stable, promote it into the standard or curated registry only after parser, solver, and rendered regression coverage all exist.

If this skill includes bundled scripts or starter files, prefer those local assets over repeating long inline commands.

## Validation

After completing the procedure:
```sh
test -f package.json && npm run lint || printf 'lint not configured\n'
test -f package.json && npm run build || printf 'build not configured\n'
test -f package.json && npm run test || printf 'test not configured\n'
```