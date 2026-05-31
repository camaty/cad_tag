import { parseDocument } from 'yaml';

export type SupportedCadTag =
    | 'Scene'
    | 'Group'
    | 'Room'
    | 'Bookshelf'
    | 'Bed'
    | 'Desk'
    | 'Table'
    | 'Chair'
    | 'Cabinet'
    | 'Shelf'
    | 'Sofa'
    | 'StandLamp'
    | 'House'
    | 'Building'
    | 'Skyscraper'
    | 'KitchenBaseCabinet'
    | 'KitchenDrawer_W900'
    | 'KitchenDoor_W450_Left'
    | 'KitchenDoor_W450_Right'
    | 'PrimitiveBox'
    | 'PrimitiveCylinder';

export type PartKind = 'box' | 'cylinder';
export type JointType = 'fixed' | 'slider' | 'hinge';

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

export interface BoundingBoxSpec {
    size: Size3;
    position: Vector3Like;
}

export interface JointLimits {
    min: number;
    max: number;
}

export interface MaterialConfig {
    color?: string;
    metalness?: number;
    roughness?: number;
    emissive?: string;
    emissiveIntensity?: number;
    opacity?: number;
    transparent?: boolean;
}

export interface NormalizedSocket {
    id: string;
    position: Vector3Like;
    allowedTypes: SupportedCadTag[];
    jointType: JointType;
    axis: Vector3Like;
    limits: JointLimits;
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
    sockets: NormalizedSocket[];
    boundingBox: BoundingBoxSpec;
    materials: Record<string, MaterialConfig>;
}

export interface TagDefinition {
    tag: SupportedCadTag;
    label: string;
    defaultSize: Size3;
    color: string;
    category: 'layout' | 'furniture' | 'lighting' | 'architecture' | 'mechanism';
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

const furnitureTags: SupportedCadTag[] = [
    'Bookshelf',
    'Bed',
    'Desk',
    'Table',
    'Chair',
    'Cabinet',
    'Shelf',
    'Sofa',
    'StandLamp',
    'KitchenBaseCabinet',
    'PrimitiveBox',
    'PrimitiveCylinder'
];

const roomChildren: SupportedCadTag[] = [...furnitureTags, 'KitchenDrawer_W900', 'KitchenDoor_W450_Left', 'KitchenDoor_W450_Right'];
const houseChildren: SupportedCadTag[] = ['Room', ...roomChildren];
const sceneChildren: SupportedCadTag[] = ['Group', 'Room', ...roomChildren, 'House', 'Building', 'Skyscraper'];

const leafValidationErrors = [
    'width/depth/height must be positive dimensions in mm, cm, or m when provided.',
    'Sockets, limits, and child attachments must resolve to declared supported component types.'
];

export const tagDefinitions: Record<SupportedCadTag, TagDefinition> = {
    Scene: {
        tag: 'Scene',
        label: 'Scene',
        defaultSize: { width: 0, depth: 0, height: 0 },
        color: '#0f172a',
        category: 'layout',
        allowedChildren: sceneChildren,
        exportMeaning: 'Top-level YAML assembly scene.',
        validationErrors: ['Scene must be the root node when a YAML assembly contains multiple components.']
    },
    Group: {
        tag: 'Group',
        label: 'Group',
        defaultSize: { width: 0, depth: 0, height: 0 },
        color: '#334155',
        category: 'layout',
        allowedChildren: sceneChildren,
        exportMeaning: 'Logical YAML grouping container.',
        validationErrors: ['Group may contain supported furniture, rooms, and building nodes.']
    },
    Room: {
        tag: 'Room',
        label: 'Room',
        defaultSize: { width: 4800, depth: 3800, height: 2800 },
        color: '#38bdf8',
        category: 'architecture',
        allowedChildren: roomChildren,
        exportMeaning: 'Interior room volume hosting furniture and fixtures.',
        validationErrors: ['Room may contain furniture, lighting, and kitchen cabinet assemblies.']
    },
    Bookshelf: {
        tag: 'Bookshelf',
        label: 'Bookshelf',
        defaultSize: { width: 900, depth: 320, height: 1800 },
        color: '#b7791f',
        category: 'furniture',
        allowedChildren: [],
        exportMeaning: 'Open storage shelving.',
        validationErrors: leafValidationErrors
    },
    Bed: {
        tag: 'Bed',
        label: 'Bed',
        defaultSize: { width: 1600, depth: 2100, height: 950 },
        color: '#64748b',
        category: 'furniture',
        allowedChildren: [],
        exportMeaning: 'Sleeping platform with headboard.',
        validationErrors: leafValidationErrors
    },
    Desk: {
        tag: 'Desk',
        label: 'Desk',
        defaultSize: { width: 1400, depth: 700, height: 740 },
        color: '#8b5e34',
        category: 'furniture',
        allowedChildren: [],
        exportMeaning: 'Work desk with tabletop and legs.',
        validationErrors: leafValidationErrors
    },
    Table: {
        tag: 'Table',
        label: 'Table',
        defaultSize: { width: 1500, depth: 850, height: 740 },
        color: '#9a6a3a',
        category: 'furniture',
        allowedChildren: [],
        exportMeaning: 'General purpose table.',
        validationErrors: leafValidationErrors
    },
    Chair: {
        tag: 'Chair',
        label: 'Chair',
        defaultSize: { width: 520, depth: 560, height: 900 },
        color: '#0f766e',
        category: 'furniture',
        allowedChildren: [],
        exportMeaning: 'Chair with seat and back.',
        validationErrors: leafValidationErrors
    },
    Cabinet: {
        tag: 'Cabinet',
        label: 'Cabinet',
        defaultSize: { width: 1200, depth: 450, height: 900 },
        color: '#7c3aed',
        category: 'furniture',
        allowedChildren: [],
        exportMeaning: 'Closed casework storage.',
        validationErrors: leafValidationErrors
    },
    Shelf: {
        tag: 'Shelf',
        label: 'Shelf',
        defaultSize: { width: 1200, depth: 300, height: 1800 },
        color: '#ca8a04',
        category: 'furniture',
        allowedChildren: [],
        exportMeaning: 'Standalone shelving unit.',
        validationErrors: leafValidationErrors
    },
    Sofa: {
        tag: 'Sofa',
        label: 'Sofa',
        defaultSize: { width: 2000, depth: 900, height: 850 },
        color: '#be185d',
        category: 'furniture',
        allowedChildren: [],
        exportMeaning: 'Upholstered sofa.',
        validationErrors: leafValidationErrors
    },
    StandLamp: {
        tag: 'StandLamp',
        label: 'Stand Lamp',
        defaultSize: { width: 480, depth: 480, height: 1700 },
        color: '#f59e0b',
        category: 'lighting',
        allowedChildren: [],
        exportMeaning: 'Free-standing lamp.',
        validationErrors: leafValidationErrors
    },
    House: {
        tag: 'House',
        label: 'House',
        defaultSize: { width: 8000, depth: 6000, height: 4500 },
        color: '#3b82f6',
        category: 'architecture',
        allowedChildren: houseChildren,
        exportMeaning: 'Residential envelope with nested rooms or furniture.',
        validationErrors: ['House may contain Room and furniture nodes.']
    },
    Building: {
        tag: 'Building',
        label: 'Building',
        defaultSize: { width: 18000, depth: 14000, height: 24000 },
        color: '#2563eb',
        category: 'architecture',
        allowedChildren: ['Room'],
        exportMeaning: 'Mid-rise building envelope.',
        validationErrors: ['Building may contain Room nodes when modeling floor plates.']
    },
    Skyscraper: {
        tag: 'Skyscraper',
        label: 'Skyscraper',
        defaultSize: { width: 24000, depth: 22000, height: 80000 },
        color: '#1d4ed8',
        category: 'architecture',
        allowedChildren: ['Room'],
        exportMeaning: 'High-rise tower envelope.',
        validationErrors: ['Skyscraper may contain Room nodes when modeling podium or floor modules.']
    },
    KitchenBaseCabinet: {
        tag: 'KitchenBaseCabinet',
        label: 'Kitchen Base Cabinet',
        defaultSize: { width: 900, depth: 650, height: 850 },
        color: '#f8fafc',
        category: 'mechanism',
        allowedChildren: ['KitchenDrawer_W900', 'KitchenDoor_W450_Left', 'KitchenDoor_W450_Right'],
        exportMeaning: 'Base cabinet carcass with URDF-style sockets for drawers and doors.',
        validationErrors: ['KitchenBaseCabinet sockets must declare slider or hinge joints with finite limits.']
    },
    KitchenDrawer_W900: {
        tag: 'KitchenDrawer_W900',
        label: 'Kitchen Drawer W900',
        defaultSize: { width: 840, depth: 540, height: 160 },
        color: '#cbd5e1',
        category: 'mechanism',
        allowedChildren: [],
        exportMeaning: 'Drawer module intended for slider mounting.',
        validationErrors: leafValidationErrors
    },
    KitchenDoor_W450_Left: {
        tag: 'KitchenDoor_W450_Left',
        label: 'Kitchen Door W450 Left',
        defaultSize: { width: 440, depth: 24, height: 620 },
        color: '#b45309',
        category: 'mechanism',
        allowedChildren: [],
        exportMeaning: 'Left-hinged cabinet door.',
        validationErrors: leafValidationErrors
    },
    KitchenDoor_W450_Right: {
        tag: 'KitchenDoor_W450_Right',
        label: 'Kitchen Door W450 Right',
        defaultSize: { width: 440, depth: 24, height: 620 },
        color: '#92400e',
        category: 'mechanism',
        allowedChildren: [],
        exportMeaning: 'Right-hinged cabinet door.',
        validationErrors: leafValidationErrors
    },
    PrimitiveBox: {
        tag: 'PrimitiveBox',
        label: 'Primitive Box',
        defaultSize: { width: 600, depth: 600, height: 18 },
        color: '#94a3b8',
        category: 'mechanism',
        allowedChildren: [],
        exportMeaning: 'Generic box primitive for deterministic structural composition.',
        validationErrors: ['PrimitiveBox dimensions and margins must produce non-floating placement in the solved graph.']
    },
    PrimitiveCylinder: {
        tag: 'PrimitiveCylinder',
        label: 'Primitive Cylinder',
        defaultSize: { width: 80, depth: 80, height: 800 },
        color: '#64748b',
        category: 'mechanism',
        allowedChildren: [],
        exportMeaning: 'Generic cylinder primitive for deterministic structural composition.',
        validationErrors: ['PrimitiveCylinder dimensions and margins must produce non-floating placement in the solved graph.']
    }
};

const supportedTags = new Set<SupportedCadTag>(Object.keys(tagDefinitions) as SupportedCadTag[]);
const useAliases: Record<string, SupportedCadTag> = {
    Bookshelf: 'Bookshelf',
    Bed: 'Bed',
    Desk: 'Desk',
    Table: 'Table',
    Chair: 'Chair',
    Cabinet: 'Cabinet',
    Shelf: 'Shelf',
    Sofa: 'Sofa',
    StandLamp: 'StandLamp',
    House: 'House',
    Building: 'Building',
    Skyscraper: 'Skyscraper',
    Room: 'Room',
    KitchenBaseCabinet: 'KitchenBaseCabinet',
    KitchenDrawer_W900: 'KitchenDrawer_W900',
    KitchenDoor_W450_Left: 'KitchenDoor_W450_Left',
    KitchenDoor_W450_Right: 'KitchenDoor_W450_Right',
    PrimitiveBox: 'PrimitiveBox',
    PrimitiveCylinder: 'PrimitiveCylinder',
    'ソフトクローズ引き出しユニット W900': 'KitchenDrawer_W900',
    '木目調キャビネット扉 左開き': 'KitchenDoor_W450_Left',
    '木目調キャビネット扉 右開き': 'KitchenDoor_W450_Right'
};

function isSupportedCadTag(tagName: string): tagName is SupportedCadTag {
    return supportedTags.has(tagName as SupportedCadTag);
}

export function resolveCadTag(rawType: string): SupportedCadTag {
    const normalizedType = useAliases[rawType] ?? rawType;
    if (!isSupportedCadTag(normalizedType)) {
        throw new CadMarkupError(`Unsupported component type: ${rawType}`);
    }

    return normalizedType;
}

function stringifyScalar(value: unknown): string {
    if (typeof value === 'string') {
        return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
        return `${value}`;
    }

    throw new CadMarkupError('Expected a scalar YAML value.');
}

function expectRecord(value: unknown, context: string): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new CadMarkupError(`${context} must be a YAML mapping.`);
    }

    return value as Record<string, unknown>;
}

function expectSequence(value: unknown, context: string): unknown[] {
    if (!Array.isArray(value)) {
        throw new CadMarkupError(`${context} must be a YAML sequence.`);
    }

    return value;
}

function getOptionalString(record: Record<string, unknown>, key: string): string | undefined {
    const value = record[key];
    if (value === undefined) {
        return undefined;
    }

    return stringifyScalar(value);
}

function parseOptionalFiniteNumber(value: unknown, context: string): number | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    const parsed = typeof value === 'number' ? value : Number.parseFloat(stringifyScalar(value));
    if (!Number.isFinite(parsed)) {
        throw new CadMarkupError(`${context} must be a finite number.`);
    }

    return parsed;
}

function parseOptionalBoolean(value: unknown, context: string): boolean | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    const normalized = stringifyScalar(value).trim().toLowerCase();
    if (normalized === 'true') {
        return true;
    }
    if (normalized === 'false') {
        return false;
    }

    throw new CadMarkupError(`${context} must be true or false.`);
}

export function clampUnitInterval(value: number): number {
    return Math.max(0, Math.min(1, value));
}

export function parseDimension(rawValue: string | number | undefined, fallback: number): number {
    if (rawValue === undefined || rawValue === null) {
        return fallback;
    }

    if (typeof rawValue === 'number') {
        if (!Number.isFinite(rawValue)) {
            throw new CadMarkupError(`Unsupported dimension value: ${rawValue}`);
        }
        return rawValue;
    }

    const trimmed = rawValue.trim();
    const match = /^(?<value>-?\d+(?:\.\d+)?)(?<unit>mm|cm|m)?$/u.exec(trimmed);

    if (!match?.groups) {
        throw new CadMarkupError(`Unsupported dimension format: ${rawValue}`);
    }

    const scalar = Number.parseFloat(match.groups.value);
    const unit = match.groups.unit ?? 'mm';
    const scaleMap: Record<string, number> = { mm: 1, cm: 10, m: 1000 };
    const scale = scaleMap[unit];

    if (!Number.isFinite(scalar) || scale === undefined) {
        throw new CadMarkupError(`Unsupported dimension unit: ${rawValue}`);
    }

    return scalar * scale;
}

export function parseAngle(rawValue: string | number | undefined, fallback: number): number {
    if (rawValue === undefined || rawValue === null) {
        return fallback;
    }

    if (typeof rawValue === 'number') {
        return rawValue;
    }

    const trimmed = rawValue.trim();
    const match = /^(?<value>-?\d+(?:\.\d+)?)(deg)?$/u.exec(trimmed);
    if (!match?.groups) {
        throw new CadMarkupError(`Unsupported angle format: ${rawValue}`);
    }

    return Number.parseFloat(match.groups.value);
}

export function assertPositiveSize(size: Size3, tag: SupportedCadTag): void {
    if (size.width <= 0 || size.depth <= 0 || size.height <= 0) {
        throw new CadMarkupError(`${tag} requires positive width, depth, and height.`);
    }
}

function parseVector3(rawValue: unknown, context: string): Vector3Like {
    const values = expectSequence(rawValue, context);
    if (values.length !== 3) {
        throw new CadMarkupError(`${context} must contain exactly 3 values.`);
    }

    return {
        x: parseDimension(values[0] as string | number | undefined, 0),
        y: parseDimension(values[1] as string | number | undefined, 0),
        z: parseDimension(values[2] as string | number | undefined, 0)
    };
}

function parseAxis(rawValue: unknown, context: string): Vector3Like {
    const values = expectSequence(rawValue, context);
    if (values.length !== 3) {
        throw new CadMarkupError(`${context} must contain exactly 3 axis values.`);
    }

    const axis = {
        x: Number(values[0] ?? 0),
        y: Number(values[1] ?? 0),
        z: Number(values[2] ?? 0)
    };

    if (![axis.x, axis.y, axis.z].every((value) => Number.isFinite(value))) {
        throw new CadMarkupError(`${context} axis values must be finite numbers.`);
    }

    if (axis.x === 0 && axis.y === 0 && axis.z === 0) {
        throw new CadMarkupError(`${context} axis cannot be the zero vector.`);
    }

    return axis;
}

function readDefaultOrigin(size: Size3): Vector3Like {
    return {
        x: 0,
        y: size.height / 2,
        z: 0
    };
}

function parseBoundingBox(rawValue: unknown, fallbackSize: Size3): BoundingBoxSpec {
    if (rawValue === undefined) {
        return {
            size: fallbackSize,
            position: readDefaultOrigin(fallbackSize)
        };
    }

    const record = expectRecord(rawValue, 'bounding_box');
    const rawSize = expectSequence(record.size, 'bounding_box.size');
    if (rawSize.length !== 3) {
        throw new CadMarkupError('bounding_box.size must contain exactly 3 values.');
    }

    const size = {
        width: parseDimension(rawSize[0] as string | number | undefined, fallbackSize.width),
        height: parseDimension(rawSize[1] as string | number | undefined, fallbackSize.height),
        depth: parseDimension(rawSize[2] as string | number | undefined, fallbackSize.depth)
    };

    return {
        size,
        position: record.position ? parseVector3(record.position, 'bounding_box.position') : readDefaultOrigin(size)
    };
}

function parseSockets(rawValue: unknown, origin: Vector3Like): NormalizedSocket[] {
    if (rawValue === undefined) {
        return [];
    }

    return expectSequence(rawValue, 'sockets').map((entry, index) => {
        const record = expectRecord(entry, `sockets[${index}]`);
        const jointType = stringifyScalar(record.joint_type) as JointType;
        if (jointType !== 'slider' && jointType !== 'hinge' && jointType !== 'fixed') {
            throw new CadMarkupError(`Unsupported joint_type: ${record.joint_type}`);
        }

        const limitsRecord = expectRecord(record.limits ?? {}, `sockets[${index}].limits`);
        const limits = {
            min: parseAngle(limitsRecord.min as string | number | undefined, 0),
            max: parseAngle(limitsRecord.max as string | number | undefined, 0)
        };
        if (limits.min > limits.max) {
            throw new CadMarkupError(`Socket ${stringifyScalar(record.id ?? `socket-${index + 1}`)} has inverted limits.`);
        }

        const rawPosition = parseVector3(record.position, `sockets[${index}].position`);
        return {
            id: stringifyScalar(record.id ?? `socket-${index + 1}`),
            position: {
                x: rawPosition.x - origin.x,
                y: rawPosition.y - origin.y,
                z: rawPosition.z - origin.z
            },
            allowedTypes: expectSequence(record.allowed_types ?? [], `sockets[${index}].allowed_types`).map((allowedType) => resolveCadTag(stringifyScalar(allowedType))),
            jointType,
            axis: parseAxis(record.axis ?? [0, 0, 1], `sockets[${index}].axis`),
            limits
        };
    });
}

function parseMaterialConfig(rawValue: unknown, context: string): MaterialConfig {
    const record = expectRecord(rawValue, context);
    const config: MaterialConfig = {};
    const color = getOptionalString(record, 'color');
    const emissive = getOptionalString(record, 'emissive');
    const metalness = parseOptionalFiniteNumber(record.metalness, `${context}.metalness`);
    const roughness = parseOptionalFiniteNumber(record.roughness, `${context}.roughness`);
    const emissiveIntensity = parseOptionalFiniteNumber(record.emissiveIntensity, `${context}.emissiveIntensity`);
    const opacity = parseOptionalFiniteNumber(record.opacity, `${context}.opacity`);
    const transparent = parseOptionalBoolean(record.transparent, `${context}.transparent`);

    if (color) {
        config.color = color;
    }
    if (emissive) {
        config.emissive = emissive;
    }
    if (metalness !== undefined) {
        config.metalness = clampUnitInterval(metalness);
    }
    if (roughness !== undefined) {
        config.roughness = clampUnitInterval(roughness);
    }
    if (emissiveIntensity !== undefined) {
        config.emissiveIntensity = emissiveIntensity;
    }
    if (opacity !== undefined) {
        config.opacity = clampUnitInterval(opacity);
    }
    if (transparent !== undefined) {
        config.transparent = transparent;
    }

    return config;
}

function parseMaterials(rawValue: unknown, context: string): Record<string, MaterialConfig> {
    const record = expectRecord(rawValue, context);
    const materials: Record<string, MaterialConfig> = {};

    for (const [key, value] of Object.entries(record)) {
        materials[key] = parseMaterialConfig(value, `${context}.${key}`);
    }

    return materials;
}

function mergeMaterials(...materialMaps: Array<Record<string, MaterialConfig> | undefined>): Record<string, MaterialConfig> {
    const merged: Record<string, MaterialConfig> = {};

    for (const materialMap of materialMaps) {
        if (!materialMap) {
            continue;
        }

        for (const [key, value] of Object.entries(materialMap)) {
            merged[key] = {
                ...(merged[key] ?? {}),
                ...value
            };
        }
    }

    return merged;
}

interface ParseState {
    nextOrder: number;
}

function normalizeParameters(parameters: Record<string, unknown>, attrs: Record<string, string>): void {
    for (const [key, value] of Object.entries(parameters)) {
        if (value !== undefined) {
            attrs[key] = stringifyScalar(value);
        }
    }
}

function buildNode(rawValue: unknown, state: ParseState, parentTag?: SupportedCadTag): NormalizedNode {
    const record = expectRecord(rawValue, 'component');
    const rawType = getOptionalString(record, 'type') ?? getOptionalString(record, 'use');
    if (!rawType) {
        throw new CadMarkupError('Each YAML component must declare type or use.');
    }

    const tag = resolveCadTag(rawType);
    if (parentTag && !tagDefinitions[parentTag].allowedChildren.includes(tag)) {
        throw new CadMarkupError(`${tag} is not allowed inside ${parentTag}.`);
    }

    const sourceOrder = state.nextOrder;
    state.nextOrder += 1;

    const id = getOptionalString(record, 'id') ?? `${tag}-${sourceOrder + 1}`;
    const attrs: Record<string, string> = {
        type: tag
    };

    for (const key of [
        'name',
        'manufacturer',
        'description',
        'file',
        'attach_to',
        'material_body',
        'margin',
        'margin_x',
        'margin_y',
        'margin_z',
        'margin_left',
        'margin_right',
        'margin_top',
        'margin_bottom',
        'margin_front',
        'margin_back',
        'columns',
        'gap'
    ] as const) {
        const value = getOptionalString(record, key);
        if (value !== undefined) {
            attrs[key] = value;
        }
    }

    const parameters = record.parameters ? expectRecord(record.parameters, `${tag}.parameters`) : {};
    normalizeParameters(parameters, attrs);
    if (record.layout) {
        const layout = expectRecord(record.layout, `${tag}.layout`);
        normalizeParameters(layout, attrs);
    }

    if (record.visual) {
        const visualRecord = expectRecord(record.visual, `${tag}.visual`);
        const visualFile = getOptionalString(visualRecord, 'file');
        if (visualFile) {
            attrs.file = visualFile;
        }
    }

    const inlineMaterial = record.material ? { default: parseMaterialConfig(record.material, `${tag}.material`) } : undefined;
    const materials = record.materials ? parseMaterials(record.materials, `${tag}.materials`) : undefined;
    const visualMaterials = record.visual
        ? (() => {
            const visualRecord = expectRecord(record.visual, `${tag}.visual`);
            return visualRecord.materials ? parseMaterials(visualRecord.materials, `${tag}.visual.materials`) : undefined;
        })()
        : undefined;

    if (record.position) {
        const position = parseVector3(record.position, `${tag}.position`);
        attrs.x = `${position.x}`;
        attrs.y = `${position.y}`;
        attrs.z = `${position.z}`;
    }

    const definition = tagDefinitions[tag];
    const fallbackSize = {
        width: parseDimension(parameters.width as string | number | undefined, definition.defaultSize.width),
        depth: parseDimension(parameters.depth as string | number | undefined, definition.defaultSize.depth),
        height: parseDimension(parameters.height as string | number | undefined, definition.defaultSize.height)
    };
    if (tag !== 'Scene' && tag !== 'Group') {
        assertPositiveSize(fallbackSize, tag);
    }

    const boundingBox = parseBoundingBox(record.bounding_box, fallbackSize);
    const sockets = parseSockets(record.sockets, boundingBox.position);

    if (record.joint_value !== undefined) {
        attrs.joint_value = `${parseAngle(record.joint_value as string | number | undefined, 0)}`;
    }

    const children = record.components
        ? expectSequence(record.components, `${tag}.components`).map((child) => buildNode(child, state, tag))
        : [];

    return {
        tag,
        id,
        attrs,
        children,
        sourceOrder,
        provenance: {
            lineHint: sourceOrder + 1
        },
        sockets,
        boundingBox,
        materials: mergeMaterials(inlineMaterial, materials, visualMaterials)
    };
}

export function parseCadYaml(source: string): NormalizedNode {
    const documentNode = parseDocument(source);
    if (documentNode.errors.length > 0) {
        throw new CadMarkupError(documentNode.errors.map((error) => error.message).join('\n'));
    }

    const rootValue = documentNode.toJS();
    const state: ParseState = { nextOrder: 0 };
    const parsedRoot = buildNode(rootValue, state);

    if (parsedRoot.tag === 'Scene') {
        return parsedRoot;
    }

    return {
        tag: 'Scene',
        id: 'scene-root',
        attrs: { type: 'Scene' },
        children: [parsedRoot],
        sourceOrder: -1,
        provenance: {
            lineHint: 1
        },
        sockets: [],
        boundingBox: {
            size: { width: 0, depth: 0, height: 0 },
            position: { x: 0, y: 0, z: 0 }
        },
        materials: {}
    };
}

export const parseCadMarkup = parseCadYaml;
