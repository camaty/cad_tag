import type { PartKind, Size3, SupportedCadTag, Vector3Like } from '../tag-schema';

export interface ComponentPart {
    id: string;
    kind: PartKind;
    size: Size3;
    position: Vector3Like;
    rotation?: Vector3Like;
    color: string;
}

export type PartFactory = (size: Size3, color: string) => ComponentPart[];
type LeafCadTag = Exclude<SupportedCadTag, 'scene' | 'group'>;

const half = (value: number): number => value / 2;

function createBox(id: string, size: Size3, position: Vector3Like, color: string): ComponentPart {
    return {
        id,
        kind: 'box',
        size,
        position,
        color
    };
}

function createCylinder(id: string, diameter: number, height: number, position: Vector3Like, color: string): ComponentPart {
    return {
        id,
        kind: 'cylinder',
        size: {
            width: diameter,
            depth: diameter,
            height
        },
        position,
        color
    };
}

export const catalogFactories: Record<LeafCadTag, PartFactory> = {
    bookshelf: (size, color) => {
        const sideThickness = Math.max(18, size.width * 0.03);
        const shelfThickness = Math.max(18, size.height * 0.015);
        const shelfCount = 5;
        const gap = (size.height - shelfThickness * shelfCount) / (shelfCount - 1);
        const parts: ComponentPart[] = [
            createBox('left-side', { width: sideThickness, depth: size.depth, height: size.height }, { x: -half(size.width) + half(sideThickness), y: half(size.height), z: 0 }, color),
            createBox('right-side', { width: sideThickness, depth: size.depth, height: size.height }, { x: half(size.width) - half(sideThickness), y: half(size.height), z: 0 }, color)
        ];

        for (let index = 0; index < shelfCount; index += 1) {
            parts.push(
                createBox(
                    `shelf-${index + 1}`,
                    { width: size.width - sideThickness * 2, depth: size.depth, height: shelfThickness },
                    { x: 0, y: shelfThickness / 2 + index * gap + index * shelfThickness, z: 0 },
                    color
                )
            );
        }

        return parts;
    },
    shelf: (size, color) => {
        const post = Math.max(24, size.width * 0.03);
        const tiers = 4;
        const shelfThickness = Math.max(18, size.height * 0.012);
        const gap = (size.height - shelfThickness * tiers) / (tiers - 1);
        const parts: ComponentPart[] = [];
        const postX = half(size.width) - half(post);
        const postZ = half(size.depth) - half(post);

        for (const x of [-postX, postX]) {
            for (const z of [-postZ, postZ]) {
                parts.push(createBox(`post-${x}-${z}`, { width: post, depth: post, height: size.height }, { x, y: half(size.height), z }, color));
            }
        }

        for (let index = 0; index < tiers; index += 1) {
            parts.push(
                createBox(
                    `tier-${index + 1}`,
                    { width: size.width, depth: size.depth, height: shelfThickness },
                    { x: 0, y: shelfThickness / 2 + index * gap + index * shelfThickness, z: 0 },
                    color
                )
            );
        }

        return parts;
    },
    bed: (size, color) => {
        const frameHeight = size.height * 0.35;
        return [
            createBox('frame', { width: size.width, depth: size.depth, height: frameHeight }, { x: 0, y: frameHeight / 2, z: 0 }, color),
            createBox('mattress', { width: size.width * 0.94, depth: size.depth * 0.95, height: size.height * 0.2 }, { x: 0, y: frameHeight + size.height * 0.1, z: 0 }, '#e2e8f0'),
            createBox('headboard', { width: size.width, depth: size.depth * 0.06, height: size.height - frameHeight }, { x: 0, y: frameHeight + (size.height - frameHeight) / 2, z: -half(size.depth) + size.depth * 0.03 }, color)
        ];
    },
    desk: (size, color) => {
        const topThickness = 40;
        const legWidth = 60;
        const legHeight = size.height - topThickness;
        const legX = half(size.width) - legWidth;
        const legZ = half(size.depth) - legWidth;
        const parts: ComponentPart[] = [
            createBox('top', { width: size.width, depth: size.depth, height: topThickness }, { x: 0, y: legHeight + topThickness / 2, z: 0 }, color)
        ];

        for (const x of [-legX, legX]) {
            for (const z of [-legZ, legZ]) {
                parts.push(createBox(`leg-${x}-${z}`, { width: legWidth, depth: legWidth, height: legHeight }, { x, y: legHeight / 2, z }, color));
            }
        }

        return parts;
    },
    table: (size, color) => catalogFactories.desk(size, color),
    chair: (size, color) => {
        const seatHeight = size.height * 0.48;
        const seatThickness = 40;
        const legWidth = 40;
        const backHeight = size.height - seatHeight;
        const legX = half(size.width) - legWidth;
        const legZ = half(size.depth) - legWidth;
        return [
            createBox('seat', { width: size.width, depth: size.depth * 0.9, height: seatThickness }, { x: 0, y: seatHeight, z: 0 }, color),
            createBox('back', { width: size.width, depth: 35, height: backHeight }, { x: 0, y: seatHeight + backHeight / 2, z: -half(size.depth) + 20 }, color),
            ...[-legX, legX].flatMap((x) =>
                [-legZ, legZ].map((z) => createBox(`leg-${x}-${z}`, { width: legWidth, depth: legWidth, height: seatHeight }, { x, y: seatHeight / 2, z }, color))
            )
        ];
    },
    cabinet: (size, color) => {
        const shell = 24;
        return [
            createBox('body', size, { x: 0, y: half(size.height), z: 0 }, color),
            createBox('left-door', { width: size.width / 2 - shell, depth: 24, height: size.height - shell * 2 }, { x: -size.width / 4, y: half(size.height), z: half(size.depth) - 12 }, '#c4b5fd'),
            createBox('right-door', { width: size.width / 2 - shell, depth: 24, height: size.height - shell * 2 }, { x: size.width / 4, y: half(size.height), z: half(size.depth) - 12 }, '#ddd6fe')
        ];
    },
    sofa: (size, color) => {
        const armWidth = size.width * 0.12;
        const seatHeight = size.height * 0.45;
        return [
            createBox('base', { width: size.width, depth: size.depth, height: seatHeight }, { x: 0, y: seatHeight / 2, z: 0 }, color),
            createBox('back', { width: size.width, depth: size.depth * 0.15, height: size.height - seatHeight }, { x: 0, y: seatHeight + (size.height - seatHeight) / 2, z: -half(size.depth) + size.depth * 0.075 }, color),
            createBox('left-arm', { width: armWidth, depth: size.depth, height: size.height * 0.7 }, { x: -half(size.width) + armWidth / 2, y: size.height * 0.35, z: 0 }, color),
            createBox('right-arm', { width: armWidth, depth: size.depth, height: size.height * 0.7 }, { x: half(size.width) - armWidth / 2, y: size.height * 0.35, z: 0 }, color)
        ];
    },
    'stand-lamp': (size, color) => {
        const poleHeight = size.height * 0.7;
        return [
            createCylinder('base', size.width * 0.7, size.height * 0.08, { x: 0, y: size.height * 0.04, z: 0 }, '#78350f'),
            createCylinder('pole', size.width * 0.08, poleHeight, { x: 0, y: poleHeight / 2 + size.height * 0.08, z: 0 }, color),
            createCylinder('shade', size.width * 0.55, size.height * 0.22, { x: 0, y: poleHeight + size.height * 0.18, z: 0 }, '#fde68a')
        ];
    },
    house: (size, color) => {
        const roofHeight = size.height * 0.28;
        const wallHeight = size.height - roofHeight;
        return [
            createBox('walls', { width: size.width, depth: size.depth, height: wallHeight }, { x: 0, y: wallHeight / 2, z: 0 }, color),
            createBox('roof-main', { width: size.width * 1.05, depth: size.depth * 1.05, height: roofHeight }, { x: 0, y: wallHeight + roofHeight / 2, z: 0 }, '#ef4444')
        ];
    },
    building: (size, color) => [
        createBox('tower', size, { x: 0, y: half(size.height), z: 0 }, color),
        createBox('podium', { width: size.width * 1.2, depth: size.depth * 1.2, height: size.height * 0.18 }, { x: 0, y: size.height * 0.09, z: 0 }, '#60a5fa')
    ],
    skyscraper: (size, color) => [
        createBox('core', { width: size.width * 0.55, depth: size.depth * 0.55, height: size.height }, { x: 0, y: half(size.height), z: 0 }, color),
        createBox('shell', { width: size.width, depth: size.depth, height: size.height * 0.82 }, { x: 0, y: size.height * 0.41, z: 0 }, '#93c5fd'),
        createBox('crown', { width: size.width * 0.4, depth: size.depth * 0.4, height: size.height * 0.12 }, { x: 0, y: size.height * 0.88 + size.height * 0.06, z: 0 }, '#bfdbfe')
    ]
};
