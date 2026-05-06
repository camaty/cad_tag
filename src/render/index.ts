import {
    AmbientLight,
    BoxGeometry,
    Color,
    CylinderGeometry,
    DirectionalLight,
    GridHelper,
    Group,
    Mesh,
    MeshStandardMaterial,
    PerspectiveCamera,
    Scene,
    WebGLRenderer
} from 'three';
import type { ResolvedComponent } from '../core/solver';
import type { ComponentPart } from '../core/catalog';

function toMeters(value: number): number {
    return value / 1000;
}

function createMesh(part: ComponentPart): Mesh {
    const geometry = part.kind === 'cylinder'
        ? new CylinderGeometry(toMeters(part.size.width / 2), toMeters(part.size.width / 2), toMeters(part.size.height), 24)
        : new BoxGeometry(toMeters(part.size.width), toMeters(part.size.height), toMeters(part.size.depth));

    const material = new MeshStandardMaterial({
        color: new Color(part.color),
        metalness: 0.12,
        roughness: 0.8
    });

    const mesh = new Mesh(geometry, material);
    mesh.position.set(toMeters(part.position.x), toMeters(part.position.y), toMeters(part.position.z));
    return mesh;
}

export class ThreePreview {
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    private readonly camera: PerspectiveCamera;
    private readonly mountNode: HTMLElement;
    private readonly resizeObserver: ResizeObserver;
    private readonly assemblyGroup: Group;

    constructor(mountNode: HTMLElement) {
        this.mountNode = mountNode;
        this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.domElement.className = 'preview-canvas';
        this.mountNode.appendChild(this.renderer.domElement);

        this.scene = new Scene();
        this.scene.background = new Color('#e2e8f0');

        this.camera = new PerspectiveCamera(38, 1, 0.1, 500);
        this.camera.position.set(9, 8, 11);
        this.camera.lookAt(0, 1.5, 0);

        const ambientLight = new AmbientLight('#ffffff', 1.4);
        const keyLight = new DirectionalLight('#ffffff', 3.2);
        keyLight.position.set(8, 12, 6);
        this.scene.add(ambientLight, keyLight, new GridHelper(60, 40, '#94a3b8', '#cbd5e1'));

        this.assemblyGroup = new Group();
        this.scene.add(this.assemblyGroup);

        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.mountNode);
        this.resize();
        this.renderer.render(this.scene, this.camera);
    }

    render(components: ResolvedComponent[]): void {
        this.assemblyGroup.clear();

        for (const component of components) {
            const componentGroup = new Group();
            componentGroup.position.set(toMeters(component.position.x), 0, toMeters(component.position.z));

            for (const part of component.parts) {
                componentGroup.add(createMesh(part));
            }

            this.assemblyGroup.add(componentGroup);
        }

        const maxExtent = Math.max(
            10,
            ...components.map((component) => Math.max(component.position.x + component.size.width, component.position.z + component.size.depth) / 1000)
        );
        this.camera.position.set(maxExtent * 0.8, Math.max(8, maxExtent * 0.55), maxExtent * 0.9);
        this.camera.lookAt(maxExtent * 0.2, 2.2, maxExtent * 0.18);
        this.renderer.render(this.scene, this.camera);
    }

    dispose(): void {
        this.resizeObserver.disconnect();
        this.renderer.dispose();
        this.mountNode.innerHTML = '';
    }

    private resize(): void {
        const width = Math.max(320, this.mountNode.clientWidth);
        const height = Math.max(360, this.mountNode.clientHeight || 520);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}
