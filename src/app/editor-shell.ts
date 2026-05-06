import { compileCadMarkup } from '../core';
import { buildExportPayload } from '../export';
import { ThreePreview } from '../render';

const fullCoverageMarkup = `<scene id="showcase" columns="4" gap="2.8m">
    <bookshelf id="bookshelf-demo" width="1000mm" height="1900mm" />
    <bed id="bed-demo" width="1600mm" depth="2200mm" />
    <desk id="desk-demo" width="1400mm" depth="700mm" />
    <table id="table-demo" width="1500mm" depth="850mm" />
    <chair id="chair-demo" width="520mm" depth="560mm" />
    <cabinet id="cabinet-demo" width="1200mm" depth="450mm" />
    <shelf id="shelf-demo" width="1300mm" depth="320mm" />
    <sofa id="sofa-demo" width="2000mm" depth="900mm" />
    <stand-lamp id="lamp-demo" height="1700mm" />
    <house id="house-demo" width="7m" depth="6m" height="4.6m" />
    <building id="building-demo" width="18m" depth="14m" height="26m" />
    <skyscraper id="tower-demo" width="24m" depth="20m" height="80m" />
</scene>`;

const interiorMarkup = `<scene id="interior" columns="3" gap="2.3m">
    <desk id="work-desk" width="1600mm" depth="750mm" />
    <chair id="work-chair" width="560mm" depth="580mm" />
    <bookshelf id="study-shelf" width="1100mm" height="1850mm" />
    <sofa id="living-sofa" width="2200mm" depth="920mm" />
    <table id="coffee-table" width="1100mm" depth="600mm" height="420mm" />
    <stand-lamp id="living-lamp" height="1750mm" />
    <bed id="guest-bed" width="1400mm" depth="2050mm" />
    <cabinet id="media-cabinet" width="1500mm" depth="400mm" />
    <shelf id="display-shelf" width="900mm" depth="300mm" />
</scene>`;

const cityMarkup = `<scene id="city" columns="3" gap="16m">
    <house id="house-01" width="8m" depth="6m" height="4.5m" />
    <building id="building-01" width="18m" depth="14m" height="24m" />
    <skyscraper id="tower-01" width="24m" depth="20m" height="80m" />
    <house id="house-02" width="7m" depth="5.5m" height="4.1m" />
    <building id="building-02" width="16m" depth="12m" height="20m" />
    <skyscraper id="tower-02" width="20m" depth="18m" height="68m" />
</scene>`;

const presets: Record<string, string> = {
    'Full coverage': fullCoverageMarkup,
    'Interior layout': interiorMarkup,
    'City skyline': cityMarkup
};

export class CadEditorShell extends HTMLElement {
    private preview: ThreePreview | null = null;

    connectedCallback(): void {
        this.render();
        this.bindEvents();
        this.runCompile(fullCoverageMarkup);
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
                        <h1>CADタグを最小構成で横断対応する Vite playground</h1>
                        <p class="hero-copy">canonical assembly graph を基準に、家具・照明・建築タグを XML 風マークアップから解決してプレビューします。</p>
                    </div>
                    <div class="tag-grid">
                        <span>bookshelf</span>
                        <span>bed</span>
                        <span>desk</span>
                        <span>table</span>
                        <span>chair</span>
                        <span>cabinet</span>
                        <span>shelf</span>
                        <span>sofa</span>
                        <span>stand-lamp</span>
                        <span>house</span>
                        <span>building</span>
                        <span>skyscraper</span>
                    </div>
                </section>
                <section class="workspace">
                    <div class="editor-column">
                        <div class="panel-header">
                            <h2>Markup editor</h2>
                            <div id="preset-row" class="preset-row"></div>
                        </div>
                        <textarea id="markup-input" spellcheck="false"></textarea>
                        <div class="action-row">
                            <button id="solve-button" type="button">Solve scene</button>
                            <div id="status-pill" class="status-pill">Ready</div>
                        </div>
                        <div class="notes-panel">
                            <h3>サポート範囲</h3>
                            <ul>
                                <li>単位: mm / cm / m</li>
                                <li>root は <code>&lt;scene&gt;</code></li>
                                <li>明示的 registry version と export meaning を保持</li>
                                <li>レンダリングは assembly graph から再構築</li>
                            </ul>
                        </div>
                    </div>
                    <div class="preview-column">
                        <div class="panel-header">
                            <h2>Three.js preview</h2>
                            <p class="meta-text">deterministic scene render</p>
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
            this.preview = new ThreePreview(previewRoot);
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
        for (const label of Object.keys(presets)) {
            const button = document.createElement('button');
            button.className = 'preset-button';
            button.type = 'button';
            button.textContent = label;
            button.dataset.preset = label;
            presetRow.appendChild(button);
        }

        textarea.value = fullCoverageMarkup;
        solveButton.addEventListener('click', () => this.runCompile(textarea.value));
        textarea.addEventListener('keydown', (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                this.runCompile(textarea.value);
            }
        });

        this.querySelectorAll<HTMLButtonElement>('.preset-button').forEach((button) => {
            button.addEventListener('click', () => {
                const preset = presets[button.dataset.preset ?? 'Full coverage'];
                textarea.value = preset;
                this.runCompile(textarea.value);
            });
        });
    }

    private runCompile(markup: string): void {
        const statusPill = this.querySelector<HTMLElement>('#status-pill');
        const summaryOutput = this.querySelector<HTMLElement>('#summary-output');
        const exportOutput = this.querySelector<HTMLElement>('#export-output');

        try {
            const result = compileCadMarkup(markup);
            const exportPayload = buildExportPayload(result.graph);
            this.preview?.render(result.graph.components);

            if (statusPill) {
                statusPill.textContent = `Solved ${result.graph.components.length} components`;
                statusPill.dataset.state = 'success';
            }

            if (summaryOutput) {
                summaryOutput.textContent = JSON.stringify(
                    {
                        componentCount: result.graph.components.length,
                        boundsMm: result.graph.bounds,
                        supportedTags: [...new Set(result.graph.components.map((component) => component.tag))]
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
