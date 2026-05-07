import { compileCadYaml } from '../core';
import { buildExportPayload } from '../export';
import { ThreePreview } from '../render';
import { buildTagPreset, heroTagButtons, scenarioPresets, type HeroTagButton } from './presets';

export class CadEditorShell extends HTMLElement {
    private preview: ThreePreview | null = null;

    connectedCallback(): void {
        this.render();
        this.bindEvents();
        this.runCompile(scenarioPresets['YAML full coverage']);
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
                        <h1>HTML風タグではなく YAML で主要家具・部屋・家屋・機構を記述</h1>
                        <p class="hero-copy">canonical assembly graph を基準に、YAML シーン/部品定義から家具・部屋・家屋・URDF 風 slider / hinge 機構を解決して Three.js でプレビューします。ヘッダーのタグ名をクリックすると、その YAML プリセットを即座に読み込めます。</p>
                    </div>
                    <div class="tag-grid" id="hero-tag-grid">
                        ${heroTagButtons.map((tag) => `<button class="tag-chip" type="button" data-tag="${tag}">${tag}</button>`).join('')}
                    </div>
                </section>
                <section class="workspace">
                    <div class="editor-column">
                        <div class="panel-header">
                            <h2>YAML editor</h2>
                            <div id="preset-row" class="preset-row"></div>
                        </div>
                        <textarea id="markup-input" spellcheck="false"></textarea>
                        <div class="action-row">
                            <button id="solve-button" type="button">Solve YAML assembly</button>
                            <div id="status-pill" class="status-pill">Ready</div>
                        </div>
                        <div class="notes-panel">
                            <h3>サポート範囲</h3>
                            <ul>
                                <li>YAML ベースの scene / component 定義</li>
                                <li>主要家具、Room、House、Building、Skyscraper</li>
                                <li>URDF 風 socket + slider / hinge + limits</li>
                                <li>レンダリングは assembly graph から再構築</li>
                            </ul>
                        </div>
                    </div>
                    <div class="preview-column">
                        <div class="panel-header">
                            <h2>Three.js preview</h2>
                            <p class="meta-text">deterministic YAML scene render / orbit drag + wheel zoom</p>
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
        const heroTagGrid = this.querySelector<HTMLElement>('#hero-tag-grid');

        if (!textarea || !solveButton || !presetRow || !heroTagGrid) {
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

        textarea.value = scenarioPresets['YAML full coverage'];
        solveButton.addEventListener('click', () => this.runCompile(textarea.value));
        textarea.addEventListener('keydown', (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                this.runCompile(textarea.value);
            }
        });

        this.querySelectorAll<HTMLButtonElement>('.preset-button').forEach((button) => {
            button.addEventListener('click', () => {
                const preset = scenarioPresets[button.dataset.preset ?? 'YAML full coverage'];
                textarea.value = preset;
                this.runCompile(textarea.value);
            });
        });

        heroTagGrid.querySelectorAll<HTMLButtonElement>('.tag-chip').forEach((button) => {
            button.addEventListener('click', () => {
                const tag = button.dataset.tag;
                if (!tag) {
                    return;
                }

                textarea.value = buildTagPreset(tag as HeroTagButton);
                this.runCompile(textarea.value);
            });
        });
    }

    private runCompile(source: string): void {
        const statusPill = this.querySelector<HTMLElement>('#status-pill');
        const summaryOutput = this.querySelector<HTMLElement>('#summary-output');
        const exportOutput = this.querySelector<HTMLElement>('#export-output');

        try {
            const result = compileCadYaml(source);
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
