import { solveMarkup, type AssemblyGraph } from './solver';

export interface CompileResult {
    graph: AssemblyGraph;
    exported: string;
}

export function compileCadMarkup(markup: string): CompileResult {
    const graph = solveMarkup(markup);

    return {
        graph,
        exported: JSON.stringify(
            {
                version: graph.version,
                bounds: graph.bounds,
                components: graph.components.map((component) => ({
                    id: component.id,
                    tag: component.tag,
                    label: component.label,
                    size: component.size,
                    position: component.position,
                    metadata: component.metadata,
                    partCount: component.parts.length
                }))
            },
            null,
            4
        )
    };
}
