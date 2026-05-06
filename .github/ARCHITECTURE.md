# cad_tag Architecture

This document is the initial architecture scaffold for `cad_tag`. Keep it aligned with the real source tree as implementation lands.

## Goal

`cad_tag` is intended to let users describe furniture, mechanisms, and buildings with HTML-like tags, combine standard and custom components, preview the result in the browser, and eventually hand the resolved structure to CAD/export and structural-analysis workflows.

## Canonical Pipeline

1. Markup and style input enter as CAD tags plus optional CSS-like semantic rules.
2. The parser converts the input into a normalized node tree with explicit ids, units, attributes, and tag provenance.
3. The registry resolves each standard tag or custom tag generator into a semantic component definition.
4. The deterministic solver produces one canonical assembly graph with dimensions, attachments, clearances, reference frames, and metadata.
5. Downstream adapters read that graph to render preview geometry, export CAD-oriented data, and later compute structural properties.

The assembly graph is the only source of truth shared by rendering, authoring, export, and verification.

## Planned Layers

### `src/core/tag-schema/`

- Defines standard tags, custom tag contracts, attribute schemas, allowed child structures, and unit rules.
- Rejects ambiguous or under-specified markup before geometry generation.

### `src/core/registry/`

- Registers built-in furniture, mechanism, and building components.
- Hosts versioned custom tag definitions and their procedural generators.

### `src/core/solver/`

- Normalizes units to millimeters.
- Applies defaults, ergonomic constraints, catalog rules, attachment rules, and explicit overrides in deterministic order.
- Produces canonical part dimensions, joints, and analysis-ready metadata.

### `src/core/catalog/`

- Stores reusable procedural parts such as seat shells, cabinet carcasses, drawer systems, frames, stairs, and wall assemblies.
- Keeps design rules near the generator code rather than hiding them in UI presets.

### `src/render/`

- Compiles the resolved assembly graph into preview geometry and scene metadata.
- Never mutates the canonical model in place.

### `src/export/`

- Maps canonical assemblies into Fusion-oriented or other downstream interchange formats.
- Preserves ids, attachment semantics, materials, and manufacturing metadata.

### `src/app/`

- Hosts the browser editor and catalog-driven authoring workflow.
- The UI edits parameters and markup, then requests a fresh solve; it does not patch raw meshes directly.

## Invariants

- One set of dimensions must yield one resolved structure.
- Unit conversion happens once and becomes explicit in the solved model.
- Standard tags and custom tags use the same attachment vocabulary.
- Render output, exported output, and structural-analysis input must agree on ids, transforms, and dimensions.
- Procedural geometry must be reproducible from serialized parameters.

## Planned Verification Surface

- Unit tests for parsing, schema validation, unit normalization, and constraint solving.
- Integration tests for markup-to-assembly and assembly-to-render/export pipelines.
- Browser regression tests for catalog presets, editor interactions, and rendered previews.
- Golden fixtures for representative assemblies such as cabinets, chairs, tables, frames, stairs, and wall modules.

## Known Future Extensions

- Structural analysis adapters consuming the canonical assembly graph.
- Fusion 360 oriented export bindings.
- Snapshot or image-based evaluation for design quality and proportional review.
- Knowledge capture around ergonomic generators and catalog-grade procedural parts.