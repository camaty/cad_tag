import { compileCadMarkup } from '../core';
import { buildExportPayload } from '../export';
import { ThreePreview } from '../render';
import { heroTagButtons, scenarioPresets } from './presets';

export class CadEditorShell extends HTMLElement {
    private preview: ThreePreview | null = null;

    connectedCallback(): void {
        this.render();
        this.bindEvents();
        this.runCompile(scenarioPresets['XML kitchen assembly']);
    }

    disconnectedCallback(): void {
        this.preview?.dispose();
    }

    private render(): void {
        this.innerHTML = `
            <main class="layout-shell">
                <section class="hero-panel">
                    <div>
                        <p class="eyebrow">cad_tag</p>
                        <h1>XML タグで主要家具・部屋・家屋・機構を記述</h1>
                        <p class="hero-copy">canonical assembly graph を基準に、XML 上でプリミティブと URDF 風 joint/socket を合成し、floor / support / interference 検証で物理的に破綻しない 3D レイアウトを解決して Three.js でプレビューします。</p>
                    </div>
                    <div class="tag-grid" id="hero-tag-grid">
                        ${heroTagButtons.map((tag) => `<span class="tag-chip">${tag}</span>`).join('')}
                    </div>
                </section>
                <section class="workspace">
                    <div class="editor-column">
                        <div class="panel-header">
                            <h2>XML editor</h2>
                            <div id="preset-row" class="preset-row"></div>
                        </div>
                        <textarea id="markup-input" spellcheck="false"></textarea>
                        <div class="action-row">
                            <button id="solve-button" type="button">Solve XML assembly</button>
                            <div id="status-pill" class="status-pill">Ready</div>
                        </div>
                        <div class="notes-panel">
                            <h3>サポート範囲</h3>
                            <ul>
                                <li>XML ベースの scene / component 定義</li>
                                <li>PrimitiveBox / PrimitiveCylinder による複合構造</li>
                                <li>URDF 風 socket + slider / hinge + limits</li>
                                <li>margin ベースの非宙浮きレイアウト解決と過干渉検出</li>
                            </ul>
                        </div>
                    </div>
                    <div class="preview-column">
                        <div class="panel-header">
                            <h2>Three.js preview</h2>
                            <p class="meta-text">deterministic XML scene render / orbit drag + wheel zoom</p>
                        </div>
                        <div id="preview-root" class="preview-root"></div>
                        <div class="insight-grid">
                            <article>
                                <h3>Summary</h3>
                                <pre id="summary-output"></pre>
                            </article>
                            <article>
                                <h3>Export payload</h3>
                                <pre id="export-output"></pre>
                            </article>
                        </div>
                    </div>
                </section>
            </main>
        `;

        const previewRoot = this.querySelector<HTMLElement>('#preview-root');
        if (previewRoot) {
            try {
                this.preview = new ThreePreview(previewRoot);
            } catch (error) {
                this.preview = null;
                const message = error instanceof Error ? error.message : 'Preview unavailable';
                previewRoot.innerHTML = `<p class="meta-text">Three.js preview unavailable: ${message}</p>`;
            }
        }
    }

    private bindEvents(): void {
        const textarea = this.querySelector<HTMLTextAreaElement>('#markup-input');
        const solveButton = this.querySelector<HTMLButtonElement>('#solve-button');
        const presetRow = this.querySelector<HTMLElement>('#preset-row');

        if (!textarea || !solveButton || !presetRow) {
            return;
        }

        presetRow.replaceChildren();
        for (const label of Object.keys(scenarioPresets)) {
            const button = document.createElement('button');
            button.className = 'preset-button';
            button.type = 'button';
            button.textContent = label;
            button.dataset.preset = label;
            presetRow.appendChild(button);
        }

        textarea.value = scenarioPresets['XML kitchen assembly'];
        solveButton.addEventListener('click', () => this.runCompile(textarea.value));
        textarea.addEventListener('keydown', (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                this.runCompile(textarea.value);
            }
        });

        this.querySelectorAll<HTMLButtonElement>('.preset-button').forEach((button) => {
            button.addEventListener('click', () => {
                const preset = scenarioPresets[button.dataset.preset ?? 'XML kitchen assembly'];
                textarea.value = preset;
                this.runCompile(textarea.value);
            });
        });
    }

    private runCompile(source: string): void {
        const statusPill = this.querySelector<HTMLElement>('#status-pill');
        const summaryOutput = this.querySelector<HTMLElement>('#summary-output');
        const exportOutput = this.querySelector<HTMLElement>('#export-output');

        try {
            const result = compileCadMarkup(source);
            const exportPayload = buildExportPayload(result.graph);
            this.preview?.render(result.graph.components);

            if (statusPill) {
                statusPill.textContent = `Solved ${result.graph.components.length} components / ${result.graph.joints.length} joints`;
                statusPill.dataset.state = 'success';
            }

            if (summaryOutput) {
                summaryOutput.textContent = JSON.stringify(
                    {
                        componentCount: result.graph.components.length,
                        jointCount: result.graph.joints.length,
                        boundsMm: result.graph.bounds,
                        supportedTypes: [...new Set(result.graph.components.map((component) => component.tag))],
                        decodedMaterials: result.graph.components
                            .filter((component) => Object.keys(component.materials).length > 0)
                            .map((component) => ({
                                id: component.id,
                                tag: component.tag,
                                materials: component.materials
                            }))
                    },
                    null,
                    4
                );
            }

            if (exportOutput) {
                exportOutput.textContent = JSON.stringify(exportPayload, null, 4);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            if (statusPill) {
                statusPill.textContent = message;
                statusPill.dataset.state = 'error';
            }
            if (summaryOutput) {
                summaryOutput.textContent = message;
            }
            if (exportOutput) {
                exportOutput.textContent = '';
            }
        }
    }
}

customElements.define('cad-editor-shell', CadEditorShell);
