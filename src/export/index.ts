import type { AssemblyGraph } from '../core/solver';

export interface ExportPayload {
    format: 'cad-tag-yaml-json';
    version: string;
    components: Array<{
        id: string;
        tag: string;
        partCount: number;
        dimensionsMm: {
            width: number;
            depth: number;
            height: number;
        };
        positionMm: {
            x: number;
            y: number;
            z: number;
        };
        parentId?: string;
    }>;
    joints: Array<{
        id: string;
        parentId: string;
        childId: string;
        socketId: string;
        type: string;
        value: number;
        limits: {
            min: number;
            max: number;
        };
    }>;
}

export function buildExportPayload(graph: AssemblyGraph): ExportPayload {
    return {
        format: 'cad-tag-yaml-json',
        version: graph.version,
        components: graph.components.map((component) => ({
            id: component.id,
            tag: component.tag,
            partCount: component.parts.length,
            dimensionsMm: component.size,
            positionMm: component.position,
            parentId: component.parentId
        })),
        joints: graph.joints.map((joint) => ({
            id: joint.id,
            parentId: joint.parentId,
            childId: joint.childId,
            socketId: joint.socketId,
            type: joint.jointType,
            value: joint.value,
            limits: joint.limits
        }))
    };
}
