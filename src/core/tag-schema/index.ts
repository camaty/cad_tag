export type SupportedCadTag =
    | 'scene'
    | 'group'
    | 'bookshelf'
    | 'bed'
    | 'desk'
    | 'table'
    | 'chair'
    | 'cabinet'
    | 'shelf'
    | 'sofa'
    | 'stand-lamp'
    | 'house'
    | 'building'
    | 'skyscraper';

export type PartKind = 'box' | 'cylinder';

export interface Size3 {
    width: number;
    depth: number;
    height: number;
}

export interface Vector3Like {
    x: number;
    y: number;
    z: number;
}

export interface NormalizedNode {
    tag: SupportedCadTag;
    id: string;
    attrs: Record<string, string>;
    children: NormalizedNode[];
    sourceOrder: number;
    provenance: {
        lineHint: number;
    };
}

export interface TagDefinition {
    tag: SupportedCadTag;
    label: string;
    defaultSize: Size3;
    color: string;
    category: 'layout' | 'furniture' | 'lighting' | 'architecture';
    allowedChildren: SupportedCadTag[];
    exportMeaning: string;
    validationErrors: string[];
}

export class CadMarkupError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'CadMarkupError';
    }
}

const leafValidationErrors = [
    'width/depth/height must be positive dimensions with mm, cm, or m units when provided.',
    'Unknown attributes are preserved but only declared dimensions are used for solving.'
];

export const tagDefinitions: Record<SupportedCadTag, TagDefinition> = {
    scene: {
        tag: 'scene',
        label: 'Scene',
        defaultSize: { width: 0, depth: 0, height: 0 },
        color: '#0f172a',
        category: 'layout',
        allowedChildren: [
            'group',
            'bookshelf',
            'bed',
            'desk',
            'table',
            'chair',
            'cabinet',
            'shelf',
            'sofa',
            'stand-lamp',
            'house',
            'building',
            'skyscraper'
        ],
        exportMeaning: 'Top-level assembly scene.',
        validationErrors: ['scene must be the root element.']
    },
    group: {
        tag: 'group',
        label: 'Group',
        defaultSize: { width: 0, depth: 0, height: 0 },
        color: '#334155',
        category: 'layout',
        allowedChildren: [
            'group',
            'bookshelf',
            'bed',
            'desk',
            'table',
            'chair',
            'cabinet',
            'shelf',
            'sofa',
            'stand-lamp',
            'house',
            'building',
            'skyscraper'
        ],
        exportMeaning: 'Positional grouping container.',
        validationErrors: ['group may contain supported furniture or architecture tags.']
    },
    bookshelf: {
        tag: 'bookshelf',
        label: 'Bookshelf',
        defaultSize: { width: 900, depth: 320, height: 1800 },
        color: '#b7791f',
        category: 'furniture',
        allowedChildren: [],
        exportMeaning: 'Open storage shelving.',
        validationErrors: leafValidationErrors
    },
    bed: {
        tag: 'bed',
        label: 'Bed',
        defaultSize: { width: 1600, depth: 2100, height: 950 },
        color: '#64748b',
        category: 'furniture',
        allowedChildren: [],
        exportMeaning: 'Sleeping platform with headboard.',
        validationErrors: leafValidationErrors
    },
    desk: {
        tag: 'desk',
        label: 'Desk',
        defaultSize: { width: 1400, depth: 700, height: 740 },
        color: '#8b5e34',
        category: 'furniture',
        allowedChildren: [],
        exportMeaning: 'Work desk with tabletop and legs.',
        validationErrors: leafValidationErrors
    },
    table: {
        tag: 'table',
        label: 'Table',
        defaultSize: { width: 1500, depth: 850, height: 740 },
        color: '#9a6a3a',
        category: 'furniture',
        allowedChildren: [],
        exportMeaning: 'General purpose table.',
        validationErrors: leafValidationErrors
    },
    chair: {
        tag: 'chair',
        label: 'Chair',
        defaultSize: { width: 520, depth: 560, height: 900 },
        color: '#0f766e',
        category: 'furniture',
        allowedChildren: [],
        exportMeaning: 'Chair with seat and back.',
        validationErrors: leafValidationErrors
    },
    cabinet: {
        tag: 'cabinet',
        label: 'Cabinet',
        defaultSize: { width: 1200, depth: 450, height: 900 },
        color: '#7c3aed',
        category: 'furniture',
        allowedChildren: [],
        exportMeaning: 'Closed casework storage.',
        validationErrors: leafValidationErrors
    },
    shelf: {
        tag: 'shelf',
        label: 'Shelf',
        defaultSize: { width: 1200, depth: 300, height: 1800 },
        color: '#ca8a04',
        category: 'furniture',
        allowedChildren: [],
        exportMeaning: 'Standalone shelving unit.',
        validationErrors: leafValidationErrors
    },
    sofa: {
        tag: 'sofa',
        label: 'Sofa',
        defaultSize: { width: 2000, depth: 900, height: 850 },
        color: '#be185d',
        category: 'furniture',
        allowedChildren: [],
        exportMeaning: 'Upholstered sofa.',
        validationErrors: leafValidationErrors
    },
    'stand-lamp': {
        tag: 'stand-lamp',
        label: 'Stand Lamp',
        defaultSize: { width: 480, depth: 480, height: 1700 },
        color: '#f59e0b',
        category: 'lighting',
        allowedChildren: [],
        exportMeaning: 'Free-standing lamp.',
        validationErrors: leafValidationErrors
    },
    house: {
        tag: 'house',
        label: 'House',
        defaultSize: { width: 8000, depth: 6000, height: 4500 },
        color: '#3b82f6',
        category: 'architecture',
        allowedChildren: [],
        exportMeaning: 'Small residential envelope.',
        validationErrors: leafValidationErrors
    },
    building: {
        tag: 'building',
        label: 'Building',
        defaultSize: { width: 18000, depth: 14000, height: 24000 },
        color: '#2563eb',
        category: 'architecture',
        allowedChildren: [],
        exportMeaning: 'Mid-rise building envelope.',
        validationErrors: leafValidationErrors
    },
    skyscraper: {
        tag: 'skyscraper',
        label: 'Skyscraper',
        defaultSize: { width: 24000, depth: 22000, height: 80000 },
        color: '#1d4ed8',
        category: 'architecture',
        allowedChildren: [],
        exportMeaning: 'High-rise tower envelope.',
        validationErrors: leafValidationErrors
    }
};

const supportedTags = new Set(Object.keys(tagDefinitions));
const dimensionKeys = new Set(['width', 'depth', 'height', 'x', 'y', 'z', 'gap']);
const unitScaleMap: Record<string, number> = {
    mm: 1,
    cm: 10,
    m: 1000
};

export function parseDimension(rawValue: string | undefined, fallback: number): number {
    if (!rawValue) {
        return fallback;
    }

    const trimmed = rawValue.trim();
    const match = /^(?<value>-?\d+(?:\.\d+)?)(?<unit>mm|cm|m)?$/u.exec(trimmed);

    if (!match?.groups) {
        throw new CadMarkupError(`Unsupported dimension format: ${rawValue}`);
    }

    const scalar = Number.parseFloat(match.groups.value);
    const unit = match.groups.unit ?? 'mm';
    const scale = unitScaleMap[unit];

    if (!Number.isFinite(scalar) || scale === undefined) {
        throw new CadMarkupError(`Unsupported dimension unit: ${rawValue}`);
    }

    return scalar * scale;
}

export function assertPositiveSize(size: Size3, tag: SupportedCadTag): void {
    if (size.width <= 0 || size.depth <= 0 || size.height <= 0) {
        throw new CadMarkupError(`${tag} requires positive width, depth, and height.`);
    }
}

function isSupportedCadTag(tagName: string): tagName is SupportedCadTag {
    return supportedTags.has(tagName);
}

function extractAttrs(element: Element): Record<string, string> {
    const attrs: Record<string, string> = {};

    for (const attribute of Array.from(element.attributes)) {
        attrs[attribute.name] = attribute.value;
    }

    return attrs;
}

function getTagName(element: Element): SupportedCadTag {
    const normalizedName = element.tagName.toLowerCase();

    if (!isSupportedCadTag(normalizedName)) {
        throw new CadMarkupError(`Unsupported tag: <${normalizedName}>`);
    }

    return normalizedName;
}

export function parseCadMarkup(markup: string): NormalizedNode {
    const parser = new DOMParser();
    const documentNode = parser.parseFromString(markup, 'application/xml');
    const parserError = documentNode.querySelector('parsererror');

    if (parserError) {
        throw new CadMarkupError(parserError.textContent?.trim() ?? 'Malformed CAD markup.');
    }

    const rootElement = documentNode.documentElement;

    if (!rootElement) {
        throw new CadMarkupError('CAD markup must contain a root node.');
    }

    const idSet = new Set<string>();
    let sourceOrder = 0;

    const visit = (element: Element, parentTag?: SupportedCadTag): NormalizedNode => {
        const tag = getTagName(element);
        const definition = tagDefinitions[tag];

        if (parentTag && !tagDefinitions[parentTag].allowedChildren.includes(tag)) {
            throw new CadMarkupError(`<${tag}> is not allowed inside <${parentTag}>.`);
        }

        const attrs = extractAttrs(element);
        const id = attrs.id ?? `${tag}-${sourceOrder + 1}`;

        if (idSet.has(id)) {
            throw new CadMarkupError(`Duplicate id detected: ${id}`);
        }

        idSet.add(id);

        for (const [key, value] of Object.entries(attrs)) {
            if (dimensionKeys.has(key)) {
                parseDimension(value, 0);
            }
        }

        const childElements = Array.from(element.children);
        if (definition.allowedChildren.length === 0 && childElements.length > 0) {
            throw new CadMarkupError(`<${tag}> cannot contain child tags.`);
        }

        const currentOrder = sourceOrder;
        sourceOrder += 1;

        return {
            tag,
            id,
            attrs,
            children: childElements.map((child) => visit(child, tag)),
            sourceOrder: currentOrder,
            provenance: {
                lineHint: currentOrder + 1
            }
        };
    };

    const root = visit(rootElement);

    if (root.tag !== 'scene') {
        throw new CadMarkupError('The root CAD tag must be <scene>.');
    }

    return root;
}
