import type { ComponentPart } from '../catalog';
import { getRegistryEntry, registryVersion } from '../registry';
import {
    CadMarkupError,
    type MaterialConfig,
    assertPositiveSize,
    parseAngle,
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
    const column = index % columns;
    const row = Math.floor(index / columns);

    return {
        position: {
            x: parentAnchor.x + (explicitX ?? column * gap * 2.8),
            y: parentAnchor.y + (explicitY ?? (child.tag === 'Scene' || child.tag === 'Group' ? 0 : size.height / 2)),
            z: parentAnchor.z + (explicitZ ?? row * gap * 2.4)
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

export function solveYamlDocument(source: string): AssemblyGraph {
    const root = parseCadYaml(source);
    const context: SolveContext = {
        components: [],
        joints: []
    };

    resolveNode(root, { position: zeroVector(), rotation: zeroVector() }, context);

    return {
        version: registryVersion,
        root,
        components: context.components,
        joints: context.joints,
        bounds: computeBounds(context.components)
    };
}

export const solveMarkup = solveYamlDocument;
