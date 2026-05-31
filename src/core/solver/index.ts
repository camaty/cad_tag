import type { ComponentPart } from '../catalog';
import { getRegistryEntry, registryVersion } from '../registry';
import {
    CadMarkupError,
    type MaterialConfig,
    assertPositiveSize,
    parseAngle,
    parseCadXml,
    parseCadYaml,
    parseDimension,
    tagDefinitions,
    type JointLimits,
    type JointType,
    type NormalizedNode,
    type NormalizedSocket,
    type Size3,
    type SupportedCadTag,
    type Vector3Like
} from '../tag-schema';

export interface ResolvedJoint {
    id: string;
    parentId: string;
    childId: string;
    socketId: string;
    jointType: JointType;
    axis: Vector3Like;
    limits: JointLimits;
    value: number;
}

export interface ResolvedComponent {
    id: string;
    tag: Exclude<SupportedCadTag, 'Scene' | 'Group'>;
    label: string;
    size: Size3;
    position: Vector3Like;
    rotation: Vector3Like;
    parts: ComponentPart[];
    metadata: Record<string, string>;
    materials: Record<string, MaterialConfig>;
    sockets: NormalizedSocket[];
    parentId?: string;
    attachment?: ResolvedJoint;
}

export interface AssemblyGraph {
    version: string;
    root: NormalizedNode;
    components: ResolvedComponent[];
    joints: ResolvedJoint[];
    bounds: {
        width: number;
        depth: number;
        height: number;
    };
}

interface SolveContext {
    components: ResolvedComponent[];
    joints: ResolvedJoint[];
}

interface PlacementSpec {
    position: Vector3Like;
    rotation: Vector3Like;
    parentId?: string;
    attachment?: ResolvedJoint;
}

interface LayoutMargins {
    left: number;
    right: number;
    top: number;
    bottom: number;
    front: number;
    back: number;
}

// Keep broad spacing at root scenes so large furniture/building presets do not overlap in preview.
const ROOT_FLOW_X_SPACING_MULTIPLIER = 2.8;
const ROOT_FLOW_Z_SPACING_MULTIPLIER = 2.4;
const STRUCTURE_TOLERANCE_MM = 0.001;
const MIN_SUPPORT_OVERLAP_RATIO = 0.01;
const MAX_COMPONENT_INTERFERENCE_RATIO = 0.05;

function zeroVector(): Vector3Like {
    return { x: 0, y: 0, z: 0 };
}

function resolveSize(node: NormalizedNode): Size3 {
    const definition = tagDefinitions[node.tag];
    const size = {
        width: parseDimension(node.attrs.width, node.boundingBox.size.width || definition.defaultSize.width),
        depth: parseDimension(node.attrs.depth, node.boundingBox.size.depth || definition.defaultSize.depth),
        height: parseDimension(node.attrs.height, node.boundingBox.size.height || definition.defaultSize.height)
    };

    if (node.tag !== 'Scene' && node.tag !== 'Group') {
        assertPositiveSize(size, node.tag);
    }

    return size;
}

function readOffset(node: NormalizedNode, key: 'x' | 'y' | 'z'): number | null {
    const rawValue = node.attrs[key];
    return rawValue ? parseDimension(rawValue, 0) : null;
}

function readGap(node: NormalizedNode): number {
    const rawGap = parseDimension(node.attrs.gap, 1200);
    if (rawGap <= 0) {
        throw new CadMarkupError(`gap must be a positive dimension; got ${node.attrs.gap ?? 'default'}.`);
    }

    return rawGap;
}

function readColumns(node: NormalizedNode): number {
    const rawColumns = Number.parseInt(node.attrs.columns ?? '4', 10);
    return Number.isFinite(rawColumns) ? Math.max(1, rawColumns) : 4;
}

function readJointValue(node: NormalizedNode): number {
    return parseAngle(node.attrs.joint_value, 0);
}

function readMargins(node: NormalizedNode): LayoutMargins {
    const margin = parseDimension(node.attrs.margin, 0);
    const marginX = parseDimension(node.attrs.margin_x, margin);
    const marginY = parseDimension(node.attrs.margin_y, margin);
    const marginZ = parseDimension(node.attrs.margin_z, margin);

    return {
        left: parseDimension(node.attrs.margin_left, marginX),
        right: parseDimension(node.attrs.margin_right, marginX),
        top: parseDimension(node.attrs.margin_top, marginY),
        bottom: parseDimension(node.attrs.margin_bottom, marginY),
        front: parseDimension(node.attrs.margin_front, marginZ),
        back: parseDimension(node.attrs.margin_back, marginZ)
    };
}

function addVectors(left: Vector3Like, right: Vector3Like): Vector3Like {
    return {
        x: left.x + right.x,
        y: left.y + right.y,
        z: left.z + right.z
    };
}

function scaleVector(vector: Vector3Like, scalar: number): Vector3Like {
    return {
        x: vector.x * scalar,
        y: vector.y * scalar,
        z: vector.z * scalar
    };
}

function axisToRotation(axis: Vector3Like, angle: number): Vector3Like {
    const rotation = zeroVector();
    if (axis.x !== 0) {
        rotation.x = angle;
    }
    if (axis.y !== 0) {
        rotation.y = angle;
    }
    if (axis.z !== 0) {
        rotation.z = angle;
    }

    return rotation;
}

function clampToLimits(value: number, limits: JointLimits): number {
    if (value < limits.min || value > limits.max) {
        throw new CadMarkupError(`Joint value ${value} is outside limits ${limits.min}..${limits.max}.`);
    }

    return value;
}

function createComponent(node: NormalizedNode, placement: PlacementSpec, context: SolveContext): ResolvedComponent {
    const tag = node.tag as Exclude<SupportedCadTag, 'Scene' | 'Group'>;
    const size = resolveSize(node);
    const entry = getRegistryEntry(tag);
    const parts = entry.createParts(size, entry.definition.color);
    const component: ResolvedComponent = {
        id: node.id,
        tag,
        label: entry.definition.label,
        size,
        position: placement.position,
        rotation: placement.rotation,
        parts,
        sockets: node.sockets,
        materials: node.materials,
        parentId: placement.parentId,
        attachment: placement.attachment,
        metadata: {
            exportMeaning: entry.definition.exportMeaning,
            registryVersion: entry.version,
            ...(node.attrs.name ? { name: node.attrs.name } : {}),
            ...(node.attrs.manufacturer ? { manufacturer: node.attrs.manufacturer } : {}),
            ...(node.attrs.description ? { description: node.attrs.description } : {}),
            ...(node.attrs.file ? { visualFile: node.attrs.file } : {})
        }
    };

    context.components.push(component);
    if (placement.attachment) {
        context.joints.push(placement.attachment);
    }

    return component;
}

function resolveChildPlacement(
    child: NormalizedNode,
    index: number,
    containerNode: NormalizedNode,
    parentAnchor: Vector3Like,
    parentComponent?: ResolvedComponent
): PlacementSpec {
    const attachTo = child.attrs.attach_to;
    if (attachTo) {
        if (!parentComponent) {
            throw new CadMarkupError(`${child.id} declares attach_to without a parent component.`);
        }

        const socket = parentComponent.sockets.find((candidate) => candidate.id === attachTo);
        if (!socket) {
            throw new CadMarkupError(`${child.id} references unknown socket ${attachTo}.`);
        }
        if (!socket.allowedTypes.includes(child.tag)) {
            throw new CadMarkupError(`${child.tag} is not allowed on socket ${socket.id}.`);
        }

        const jointValue = clampToLimits(readJointValue(child), socket.limits);
        const sliderOffset = socket.jointType === 'slider' ? scaleVector(socket.axis, jointValue) : zeroVector();
        const position = addVectors(parentComponent.position, addVectors(socket.position, sliderOffset));
        const attachment: ResolvedJoint = {
            id: `${parentComponent.id}:${socket.id}:${child.id}`,
            parentId: parentComponent.id,
            childId: child.id,
            socketId: socket.id,
            jointType: socket.jointType,
            axis: socket.axis,
            limits: socket.limits,
            value: jointValue
        };

        return {
            position,
            rotation: socket.jointType === 'hinge' ? axisToRotation(socket.axis, jointValue) : zeroVector(),
            parentId: parentComponent.id,
            attachment
        };
    }

    const gap = readGap(containerNode);
    const columns = readColumns(containerNode);
    const size = child.tag === 'Scene' || child.tag === 'Group' ? { width: 0, depth: 0, height: 0 } : resolveSize(child);
    const explicitX = readOffset(child, 'x');
    const explicitY = readOffset(child, 'y');
    const explicitZ = readOffset(child, 'z');
    const margins = readMargins(child);
    const column = index % columns;
    const row = Math.floor(index / columns);
    const defaultXFromAnchor = column * gap * ROOT_FLOW_X_SPACING_MULTIPLIER + column * margins.right + margins.left;
    const defaultZFromAnchor = row * gap * ROOT_FLOW_Z_SPACING_MULTIPLIER + row * margins.front + margins.back;

    if (!parentComponent) {
        return {
            position: {
                x: parentAnchor.x + (explicitX ?? defaultXFromAnchor),
                y: parentAnchor.y + (explicitY ?? (child.tag === 'Scene' || child.tag === 'Group' ? 0 : size.height / 2 + margins.bottom)),
                z: parentAnchor.z + (explicitZ ?? defaultZFromAnchor)
            },
            rotation: zeroVector(),
            parentId: undefined
        };
    }

    const parentBaseY = parentComponent.position.y - parentComponent.size.height / 2;
    const parentMinX = parentComponent.position.x - parentComponent.size.width / 2;
    const parentMinZ = parentComponent.position.z - parentComponent.size.depth / 2;
    const hasExplicitMarginX = child.attrs.margin_left !== undefined || child.attrs.margin_right !== undefined || child.attrs.margin_x !== undefined || child.attrs.margin !== undefined;
    const hasExplicitMarginZ = child.attrs.margin_front !== undefined || child.attrs.margin_back !== undefined || child.attrs.margin_z !== undefined || child.attrs.margin !== undefined;
    const defaultChildX = parentMinX + margins.left + size.width / 2 + (hasExplicitMarginX ? 0 : column * (size.width + gap + margins.right));
    const defaultChildY = parentBaseY + margins.bottom + size.height / 2;
    const defaultChildZ = parentMinZ + margins.back + size.depth / 2 + (hasExplicitMarginZ ? 0 : row * (size.depth + gap + margins.front));
    const resolvedX = explicitX ?? (defaultChildX - parentAnchor.x);
    const resolvedY = explicitY ?? (defaultChildY - parentAnchor.y);
    const resolvedZ = explicitZ ?? (defaultChildZ - parentAnchor.z);

    return {
        position: {
            x: parentAnchor.x + resolvedX,
            y: parentAnchor.y + resolvedY,
            z: parentAnchor.z + resolvedZ
        },
        rotation: zeroVector(),
        parentId: parentComponent?.id
    };
}

function resolveNode(node: NormalizedNode, placement: PlacementSpec, context: SolveContext): void {
    if (node.tag === 'Scene' || node.tag === 'Group') {
        node.children.forEach((child, index) => {
            const childPlacement = resolveChildPlacement(child, index, node, placement.position);
            resolveNode(child, childPlacement, context);
        });
        return;
    }

    const component = createComponent(node, placement, context);
    node.children.forEach((child, index) => {
        const childPlacement = resolveChildPlacement(child, index, node, component.position, component);
        resolveNode(child, childPlacement, context);
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

function componentBottom(component: ResolvedComponent): number {
    return component.position.y - component.size.height / 2;
}

function componentTop(component: ResolvedComponent): number {
    return component.position.y + component.size.height / 2;
}

function overlapLength(minA: number, maxA: number, minB: number, maxB: number): number {
    return Math.max(0, Math.min(maxA, maxB) - Math.max(minA, minB));
}

function xzOverlapArea(left: ResolvedComponent, right: ResolvedComponent): number {
    const overlapX = overlapLength(
        left.position.x - left.size.width / 2,
        left.position.x + left.size.width / 2,
        right.position.x - right.size.width / 2,
        right.position.x + right.size.width / 2
    );
    const overlapZ = overlapLength(
        left.position.z - left.size.depth / 2,
        left.position.z + left.size.depth / 2,
        right.position.z - right.size.depth / 2,
        right.position.z + right.size.depth / 2
    );

    return overlapX * overlapZ;
}

function componentsTouchVertically(upper: ResolvedComponent, lower: ResolvedComponent): boolean {
    return Math.abs(componentBottom(upper) - componentTop(lower)) <= STRUCTURE_TOLERANCE_MM;
}

function isAncestorPair(left: ResolvedComponent, right: ResolvedComponent, componentsById: Map<string, ResolvedComponent>): boolean {
    let currentParentId = left.parentId;
    while (currentParentId) {
        if (currentParentId === right.id) {
            return true;
        }
        currentParentId = componentsById.get(currentParentId)?.parentId;
    }

    currentParentId = right.parentId;
    while (currentParentId) {
        if (currentParentId === left.id) {
            return true;
        }
        currentParentId = componentsById.get(currentParentId)?.parentId;
    }

    return false;
}

function hasSupport(component: ResolvedComponent, components: ResolvedComponent[], componentsById: Map<string, ResolvedComponent>): boolean {
    const bottom = componentBottom(component);
    const parent = component.parentId ? componentsById.get(component.parentId) : undefined;
    const supportFloorY = parent ? componentBottom(parent) : 0;
    if (bottom < supportFloorY - STRUCTURE_TOLERANCE_MM) {
        throw new CadMarkupError(`${component.id} penetrates below its support floor.`);
    }
    if (Math.abs(bottom - supportFloorY) <= STRUCTURE_TOLERANCE_MM) {
        return true;
    }

    const footprintArea = component.size.width * component.size.depth;
    return components.some((candidate) => {
        if (candidate.id === component.id || candidate.id === component.parentId || candidate.parentId !== component.parentId) {
            return false;
        }
        if (!componentsTouchVertically(component, candidate)) {
            return false;
        }

        return xzOverlapArea(component, candidate) / footprintArea >= MIN_SUPPORT_OVERLAP_RATIO;
    });
}

function validateGrounding(components: ResolvedComponent[]): void {
    const componentsById = new Map(components.map((component) => [component.id, component]));
    for (const component of components) {
        if (component.attachment) {
            continue;
        }
        if (!hasSupport(component, components, componentsById)) {
            throw new CadMarkupError(`${component.id} is floating without floor or member support.`);
        }
    }
}

function intersectionVolume(left: ResolvedComponent, right: ResolvedComponent): number {
    const overlapX = overlapLength(
        left.position.x - left.size.width / 2,
        left.position.x + left.size.width / 2,
        right.position.x - right.size.width / 2,
        right.position.x + right.size.width / 2
    );
    const overlapY = overlapLength(componentBottom(left), componentTop(left), componentBottom(right), componentTop(right));
    const overlapZ = overlapLength(
        left.position.z - left.size.depth / 2,
        left.position.z + left.size.depth / 2,
        right.position.z - right.size.depth / 2,
        right.position.z + right.size.depth / 2
    );

    return overlapX * overlapY * overlapZ;
}

function isDoorTag(tag: SupportedCadTag): boolean {
    return tag === 'KitchenDoor_W450_Left' || tag === 'KitchenDoor_W450_Right';
}

function validateDoorDepthClearance(child: ResolvedComponent, parent: ResolvedComponent): void {
    if (!isDoorTag(child.tag)) {
        return;
    }

    const minimumFrontZoneCenter = parent.position.z + parent.size.depth / 4;
    if (child.position.z < minimumFrontZoneCenter) {
        throw new CadMarkupError(`${child.id} interferes with ${parent.id} in the depth direction.`);
    }
}

function validateInterference(components: ResolvedComponent[]): void {
    const componentsById = new Map(components.map((component) => [component.id, component]));
    for (const component of components) {
        const parent = component.parentId ? componentsById.get(component.parentId) : undefined;
        if (parent) {
            validateDoorDepthClearance(component, parent);
        }
    }

    for (let leftIndex = 0; leftIndex < components.length; leftIndex += 1) {
        const left = components[leftIndex]!;
        for (let rightIndex = leftIndex + 1; rightIndex < components.length; rightIndex += 1) {
            const right = components[rightIndex]!;
            if (isAncestorPair(left, right, componentsById)) {
                continue;
            }
            if (left.attachment || right.attachment) {
                continue;
            }
            if (tagDefinitions[left.tag].category === 'architecture' || tagDefinitions[right.tag].category === 'architecture') {
                continue;
            }

            const volume = intersectionVolume(left, right);
            if (volume <= STRUCTURE_TOLERANCE_MM) {
                continue;
            }

            const smallerVolume = Math.min(left.size.width * left.size.depth * left.size.height, right.size.width * right.size.depth * right.size.height);
            if (volume / smallerVolume > MAX_COMPONENT_INTERFERENCE_RATIO) {
                throw new CadMarkupError(`${left.id} and ${right.id} interfere excessively.`);
            }
        }
    }
}

function validateResolvedStructure(components: ResolvedComponent[]): void {
    validateGrounding(components);
    validateInterference(components);
}

export function solveYamlDocument(source: string): AssemblyGraph {
    const root = parseCadYaml(source);
    const context: SolveContext = {
        components: [],
        joints: []
    };

    resolveNode(root, { position: zeroVector(), rotation: zeroVector() }, context);
    validateResolvedStructure(context.components);

    return {
        version: registryVersion,
        root,
        components: context.components,
        joints: context.joints,
        bounds: computeBounds(context.components)
    };
}

export function solveXmlDocument(source: string): AssemblyGraph {
    const root = parseCadXml(source);
    const context: SolveContext = {
        components: [],
        joints: []
    };

    resolveNode(root, { position: zeroVector(), rotation: zeroVector() }, context);
    validateResolvedStructure(context.components);

    return {
        version: registryVersion,
        root,
        components: context.components,
        joints: context.joints,
        bounds: computeBounds(context.components)
    };
}

export const solveMarkup = solveXmlDocument;
