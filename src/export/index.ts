import type { AssemblyGraph } from '../core/solver';

export interface ExportPayload {
    format: 'cad-tag-json';
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
    }>;
}

export function buildExportPayload(graph: AssemblyGraph): ExportPayload {
    return {
        format: 'cad-tag-json',
        version: graph.version,
        components: graph.components.map((component) => ({
            id: component.id,
            tag: component.tag,
            partCount: component.parts.length,
            dimensionsMm: component.size
        }))
    };
}
