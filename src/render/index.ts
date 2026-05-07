import {
    ACESFilmicToneMapping,
    AmbientLight,
    BoxGeometry,
    Color,
    CylinderGeometry,
    DirectionalLight,
    GridHelper,
    Group,
    HemisphereLight,
    MathUtils,
    Mesh,
    MeshStandardMaterial,
    PCFSoftShadowMap,
    PerspectiveCamera,
    Scene,
    SRGBColorSpace,
    WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ComponentPart } from '../core/catalog';
import type { ResolvedComponent } from '../core/solver';
import { clampUnitInterval, type MaterialConfig } from '../core/tag-schema';

function toMeters(value: number): number {
    return value / 1000;
}

function toRadians(value: number): number {
    return MathUtils.degToRad(value);
}

function disposeMesh(mesh: Mesh): void {
    mesh.geometry.dispose();

    if (Array.isArray(mesh.material)) {
        for (const material of mesh.material) {
            material.dispose();
        }
        return;
    }

    mesh.material.dispose();
}

function readClampedUnitInterval(value: number | undefined, fallback: number): number {
    if (value === undefined || Number.isNaN(value)) {
        return fallback;
    }

    return clampUnitInterval(value);
}

function resolveMaterialConfig(part: ComponentPart, materials: Record<string, MaterialConfig>): MaterialConfig {
    return {
        ...(materials.default ?? {}),
        ...(materials[part.id] ?? {})
    };
}

function createMesh(part: ComponentPart, materials: Record<string, MaterialConfig>): Mesh {
    const geometry = part.kind === 'cylinder'
        ? new CylinderGeometry(toMeters(part.size.width / 2), toMeters(part.size.width / 2), toMeters(part.size.height), 48)
        : new BoxGeometry(toMeters(part.size.width), toMeters(part.size.height), toMeters(part.size.depth));
    const materialConfig = resolveMaterialConfig(part, materials);

    const material = new MeshStandardMaterial({
        color: new Color(materialConfig.color ?? part.color),
        emissive: new Color(materialConfig.emissive ?? '#000000'),
        emissiveIntensity: materialConfig.emissiveIntensity ?? 0,
        metalness: readClampedUnitInterval(materialConfig.metalness, 0.18),
        roughness: readClampedUnitInterval(materialConfig.roughness, 0.62),
        opacity: readClampedUnitInterval(materialConfig.opacity, 1),
        transparent: materialConfig.transparent ?? false
    });

    const mesh = new Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(toMeters(part.position.x), toMeters(part.position.y), toMeters(part.position.z));
    if (part.rotation) {
        mesh.rotation.set(toRadians(part.rotation.x), toRadians(part.rotation.y), toRadians(part.rotation.z));
    }
    return mesh;
}

export class ThreePreview {
    private readonly renderer: WebGLRenderer;
    private readonly scene: Scene;
    private readonly camera: PerspectiveCamera;
    private readonly controls: OrbitControls;
    private readonly mountNode: HTMLElement;
    private readonly resizeObserver: ResizeObserver;
    private readonly assemblyGroup: Group;
    private animationFrame = 0;

    constructor(mountNode: HTMLElement) {
        this.mountNode = mountNode;
        this.renderer = new WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = SRGBColorSpace;
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.15;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = PCFSoftShadowMap;
        this.renderer.domElement.className = 'preview-canvas';
        this.mountNode.appendChild(this.renderer.domElement);

        this.scene = new Scene();
        this.scene.background = new Color('#e2e8f0');

        this.camera = new PerspectiveCamera(38, 1, 0.1, 500);
        this.camera.position.set(9, 8, 11);
        this.camera.lookAt(0, 1.5, 0);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.screenSpacePanning = true;
        this.controls.maxDistance = 180;
        this.controls.minDistance = 2.5;
        this.controls.target.set(0, 1.5, 0);

        const ambientLight = new AmbientLight('#ffffff', 0.7);
        const hemisphereLight = new HemisphereLight('#f8fafc', '#94a3b8', 1.1);
        const keyLight = new DirectionalLight('#ffffff', 3.8);
        keyLight.position.set(8, 12, 6);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(2048, 2048);
        keyLight.shadow.bias = -0.0002;

        const fillLight = new DirectionalLight('#dbeafe', 1.2);
        fillLight.position.set(-10, 9, -8);
        this.scene.add(ambientLight, hemisphereLight, keyLight, fillLight, new GridHelper(60, 40, '#94a3b8', '#cbd5e1'));

        this.assemblyGroup = new Group();
        this.scene.add(this.assemblyGroup);

        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.mountNode);
        this.resize();
        this.animate();
    }

    render(components: ResolvedComponent[]): void {
        this.assemblyGroup.traverse((object) => {
            if (object instanceof Mesh) {
                disposeMesh(object);
            }
        });
        this.assemblyGroup.clear();

        for (const component of components) {
            const componentGroup = new Group();
            componentGroup.position.set(toMeters(component.position.x), toMeters(component.position.y), toMeters(component.position.z));
            componentGroup.rotation.set(toRadians(component.rotation.x), toRadians(component.rotation.y), toRadians(component.rotation.z));

            for (const part of component.parts) {
                componentGroup.add(createMesh(part, component.materials));
            }

            this.assemblyGroup.add(componentGroup);
        }

        const maxExtent = Math.max(
            10,
            ...components.map((component) => Math.max(component.position.x + component.size.width, component.position.z + component.size.depth) / 1000)
        );
        this.camera.position.set(maxExtent * 0.8, Math.max(8, maxExtent * 0.55), maxExtent * 0.9);
        this.controls.target.set(maxExtent * 0.2, 2.2, maxExtent * 0.18);
        this.controls.update();
    }

    dispose(): void {
        window.cancelAnimationFrame(this.animationFrame);
        this.resizeObserver.disconnect();
        this.assemblyGroup.traverse((object) => {
            if (object instanceof Mesh) {
                disposeMesh(object);
            }
        });
        this.controls.dispose();
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

    private animate(): void {
        this.animationFrame = window.requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
