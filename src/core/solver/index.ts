import type { ComponentPart } from '../catalog';
import { getRegistryEntry } from '../registry';
import {
    CadMarkupError,
    assertPositiveSize,
    parseCadMarkup,
    parseDimension,
    tagDefinitions,
    type NormalizedNode,
    type Size3,
    type SupportedCadTag,
    type Vector3Like
} from '../tag-schema';

export interface ResolvedComponent {
    id: string;
    tag: Exclude<SupportedCadTag, 'scene' | 'group'>;
    label: string;
    size: Size3;
    position: Vector3Like;
    parts: ComponentPart[];
    metadata: Record<string, string>;
}

export interface AssemblyGraph {
    version: string;
    root: NormalizedNode;
    components: ResolvedComponent[];
    bounds: {
        width: number;
        depth: number;
        height: number;
    };
}

interface SolveContext {
    components: ResolvedComponent[];
}

function resolveSize(node: NormalizedNode): Size3 {
    const definition = tagDefinitions[node.tag];
    const size = {
        width: parseDimension(node.attrs.width, definition.defaultSize.width),
        depth: parseDimension(node.attrs.depth, definition.defaultSize.depth),
        height: parseDimension(node.attrs.height, definition.defaultSize.height)
    };

    if (node.tag !== 'scene' && node.tag !== 'group') {
        assertPositiveSize(size, node.tag);
    }

    return size;
}

function readOffset(node: NormalizedNode, key: 'x' | 'y' | 'z'): number | null {
    const rawValue = node.attrs[key];
    return rawValue ? parseDimension(rawValue, 0) : null;
}

function layoutChildren(node: NormalizedNode, parentOffset: Vector3Like, context: SolveContext): void {
    const rawGap = parseDimension(node.attrs.gap, 1200);
    if (rawGap <= 0) {
        throw new CadMarkupError(`gap must be a positive dimension; got ${node.attrs.gap ?? 'default'}.`);
    }
    const gap = rawGap;
    const rawColumns = Number.parseInt(node.attrs.columns ?? '4', 10);
    const columns = Number.isFinite(rawColumns) ? Math.max(1, rawColumns) : 4;

    node.children.forEach((child, index) => {
        if (child.tag === 'group') {
            const groupOffset = {
                x: parentOffset.x + (readOffset(child, 'x') ?? 0),
                y: parentOffset.y + (readOffset(child, 'y') ?? 0),
                z: parentOffset.z + (readOffset(child, 'z') ?? 0)
            };
            layoutChildren(child, groupOffset, context);
            return;
        }

        const size = resolveSize(child);
        const explicitX = readOffset(child, 'x');
        const explicitY = readOffset(child, 'y');
        const explicitZ = readOffset(child, 'z');
        const col = index % columns;
        const row = Math.floor(index / columns);
        const position = {
            x: parentOffset.x + (explicitX ?? col * gap * 2.8),
            y: parentOffset.y + (explicitY ?? size.height / 2),
            z: parentOffset.z + (explicitZ ?? row * gap * 2.4)
        };
        const childTag = child.tag as Exclude<SupportedCadTag, 'scene' | 'group'>;
        const entry = getRegistryEntry(childTag);
        const parts = entry.createParts(size, entry.definition.color);

        context.components.push({
            id: child.id,
            tag: childTag,
            label: entry.definition.label,
            size,
            position,
            parts,
            metadata: {
                exportMeaning: entry.definition.exportMeaning,
                registryVersion: entry.version
            }
        });
    });
}

function computeBounds(components: ResolvedComponent[]): { width: number; depth: number; height: number } {
    if (components.length === 0) {
        return { width: 0, depth: 0, height: 0 };
    }

    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minZ = Number.POSITIVE_INFINITY;
    let maxZ = Number.NEGATIVE_INFINITY;
    let maxY = 0;

    for (const component of components) {
        minX = Math.min(minX, component.position.x - component.size.width / 2);
        maxX = Math.max(maxX, component.position.x + component.size.width / 2);
        minZ = Math.min(minZ, component.position.z - component.size.depth / 2);
        maxZ = Math.max(maxZ, component.position.z + component.size.depth / 2);
        maxY = Math.max(maxY, component.position.y + component.size.height / 2);
    }

    return {
        width: maxX - minX,
        depth: maxZ - minZ,
        height: maxY
    };
}

export function solveMarkup(markup: string): AssemblyGraph {
    const root = parseCadMarkup(markup);
    const context: SolveContext = {
        components: []
    };

    layoutChildren(root, { x: 0, y: 0, z: 0 }, context);

    return {
        version: '1.0.0',
        root,
        components: context.components,
        bounds: computeBounds(context.components)
    };
}
