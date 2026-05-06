import { compileCadYaml } from '../core';
import { buildExportPayload } from '../export';
import { ThreePreview } from '../render';

const fullCoverageYaml = `type: Scene
id: showcase
name: YAML showroom
layout:
    columns: 4
    gap: 2800
components:
    - type: Bookshelf
      id: bookshelf-demo
      parameters:
        width: 1000
        height: 1900
    - type: Bed
      id: bed-demo
      parameters:
        width: 1600
        depth: 2200
    - type: Desk
      id: desk-demo
      parameters:
        width: 1400
        depth: 700
    - type: Table
      id: table-demo
      parameters:
        width: 1500
        depth: 850
    - type: Chair
      id: chair-demo
      parameters:
        width: 520
        depth: 560
    - type: Cabinet
      id: cabinet-demo
      parameters:
        width: 1200
        depth: 450
    - type: Shelf
      id: shelf-demo
      parameters:
        width: 1300
        depth: 320
    - type: Sofa
      id: sofa-demo
      parameters:
        width: 2000
        depth: 900
    - type: StandLamp
      id: lamp-demo
      parameters:
        height: 1700
    - type: Room
      id: room-demo
      parameters:
        width: 5000
        depth: 3800
        height: 2800
    - type: House
      id: house-demo
      parameters:
        width: 7000
        depth: 6000
        height: 4600
    - type: Building
      id: building-demo
      parameters:
        width: 18000
        depth: 14000
        height: 26000
    - type: Skyscraper
      id: tower-demo
      parameters:
        width: 24000
        depth: 20000
        height: 80000
`;

const roomAndHouseYaml = `type: Scene
id: home-layout
name: Room and house layout
layout:
    columns: 2
    gap: 12000
components:
    - type: Room
      id: study-room
      parameters:
        width: 5200
        depth: 4200
        height: 2800
      components:
        - type: Desk
          id: study-desk
          position: [-1100, 370, -900]
        - type: Chair
          id: study-chair
          position: [-1100, 450, -200]
        - type: Bookshelf
          id: study-bookshelf
          position: [1500, 900, -1300]
        - type: StandLamp
          id: study-lamp
          position: [1700, 850, 1200]
    - type: House
      id: compact-house
      parameters:
        width: 8600
        depth: 6800
        height: 4800
      components:
        - type: Room
          id: living-room
          position: [-1600, 1400, -600]
          parameters:
            width: 4200
            depth: 3600
            height: 2800
          components:
            - type: Sofa
              id: living-sofa
              position: [0, 425, 800]
            - type: Table
              id: coffee-table
              position: [0, 370, -300]
        - type: Room
          id: bed-room
          position: [1600, 1400, -600]
          parameters:
            width: 3200
            depth: 3600
            height: 2800
          components:
            - type: Bed
              id: house-bed
              position: [0, 475, 200]
            - type: Cabinet
              id: wardrobe
              position: [1000, 450, -1000]
`;

const mechanismYaml = `type: KitchenBaseCabinet
id: KBC-900-STD
name: システムキッチン『ルミナス』 ベースキャビネット W900
manufacturer: Nitori-Mock
description: 上段にカトラリー用の引き出し、下段に両開きの収納を備えた標準的なベースユニット。
parameters:
    width: 900
    height: 850
    depth: 650
    material_body: メラミン化粧板（ホワイト）
visual:
    file: assets/kitchen/kbc_900_body.glb
bounding_box:
    size: [900, 850, 650]
    position: [0, 425, 325]
sockets:
    - id: slot_drawer_top
      position: [0, 750, 600]
      allowed_types: [KitchenDrawer_W900]
      joint_type: slider
      axis: [0, 0, 1]
      limits:
        min: 0
        max: 450
    - id: hinge_door_bottom_left
      position: [-435, 350, 600]
      allowed_types: [KitchenDoor_W450_Left]
      joint_type: hinge
      axis: [0, 1, 0]
      limits:
        min: 0
        max: 110
    - id: hinge_door_bottom_right
      position: [435, 350, 600]
      allowed_types: [KitchenDoor_W450_Right]
      joint_type: hinge
      axis: [0, 1, 0]
      limits:
        min: -110
        max: 0
components:
    - id: drawer_1
      use: ソフトクローズ引き出しユニット W900
      attach_to: slot_drawer_top
      joint_value: 280
    - id: door_L
      use: 木目調キャビネット扉 左開き
      attach_to: hinge_door_bottom_left
      joint_value: 92
    - id: door_R
      use: 木目調キャビネット扉 右開き
      attach_to: hinge_door_bottom_right
      joint_value: -92
`;

const presets: Record<string, string> = {
    'YAML full coverage': fullCoverageYaml,
    'Rooms and house': roomAndHouseYaml,
    'Kitchen mechanism': mechanismYaml
};

export class CadEditorShell extends HTMLElement {
    private preview: ThreePreview | null = null;

    connectedCallback(): void {
        this.render();
        this.bindEvents();
        this.runCompile(fullCoverageYaml);
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
                        <p class="hero-copy">canonical assembly graph を基準に、YAML シーン/部品定義から家具・部屋・家屋・URDF 風 slider / hinge 機構を解決して Three.js でプレビューします。</p>
                    </div>
                    <div class="tag-grid">
                        <span>Bookshelf</span>
                        <span>Bed</span>
                        <span>Desk</span>
                        <span>Table</span>
                        <span>Chair</span>
                        <span>Cabinet</span>
                        <span>Shelf</span>
                        <span>Sofa</span>
                        <span>StandLamp</span>
                        <span>Room</span>
                        <span>House</span>
                        <span>Building</span>
                        <span>Skyscraper</span>
                        <span>KitchenBaseCabinet</span>
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
                            <p class="meta-text">deterministic YAML scene render</p>
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
        for (const label of Object.keys(presets)) {
            const button = document.createElement('button');
            button.className = 'preset-button';
            button.type = 'button';
            button.textContent = label;
            button.dataset.preset = label;
            presetRow.appendChild(button);
        }

        textarea.value = fullCoverageYaml;
        solveButton.addEventListener('click', () => this.runCompile(textarea.value));
        textarea.addEventListener('keydown', (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                this.runCompile(textarea.value);
            }
        });

        this.querySelectorAll<HTMLButtonElement>('.preset-button').forEach((button) => {
            button.addEventListener('click', () => {
                const preset = presets[button.dataset.preset ?? 'YAML full coverage'];
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
                        supportedTypes: [...new Set(result.graph.components.map((component) => component.tag))]
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
