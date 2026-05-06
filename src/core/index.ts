import { solveYamlDocument, type AssemblyGraph } from './solver';

export interface CompileResult {
    graph: AssemblyGraph;
    exported: string;
}

export function compileCadYaml(source: string): CompileResult {
    const graph = solveYamlDocument(source);

    return {
        graph,
        exported: JSON.stringify(
            {
                version: graph.version,
                bounds: graph.bounds,
                joints: graph.joints,
                components: graph.components.map((component) => ({
                    id: component.id,
                    tag: component.tag,
                    label: component.label,
                    size: component.size,
                    position: component.position,
                    rotation: component.rotation,
                    metadata: component.metadata,
                    partCount: component.parts.length,
                    parentId: component.parentId,
                    attachment: component.attachment
                }))
            },
            null,
            4
        )
    };
}

export const compileCadMarkup = compileCadYaml;
