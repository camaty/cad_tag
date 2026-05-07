import type { SupportedCadTag } from '../core/tag-schema';

const headerTags = [
    'Bookshelf',
    'Bed',
    'Desk',
    'Table',
    'Chair',
    'Cabinet',
    'Shelf',
    'Sofa',
    'StandLamp',
    'Room',
    'House',
    'Building',
    'Skyscraper',
    'KitchenBaseCabinet'
] as const satisfies readonly SupportedCadTag[];

export const heroTagButtons: SupportedCadTag[] = [...headerTags];
export type HeroTagButton = (typeof headerTags)[number];

const baseMaterialsYaml = `material:
    color: '#8b5cf6'
    metalness: 0.18
    roughness: 0.42`;

const componentPresets: Record<HeroTagButton, string> = {
    Bookshelf: `type: Bookshelf
id: bookshelf-demo
parameters:
    width: 1000
    height: 1900
    depth: 320
${baseMaterialsYaml}
materials:
    shelf-3:
        color: '#fbbf24'`,
    Bed: `type: Bed
id: bed-demo
parameters:
    width: 1600
    depth: 2200
${baseMaterialsYaml}`,
    Desk: `type: Desk
id: desk-demo
parameters:
    width: 1400
    depth: 700
${baseMaterialsYaml}
materials:
    top:
        color: '#a16207'
        roughness: 0.36`,
    Table: `type: Table
id: table-demo
parameters:
    width: 1500
    depth: 850
${baseMaterialsYaml}`,
    Chair: `type: Chair
id: chair-demo
${baseMaterialsYaml}`,
    Cabinet: `type: Cabinet
id: cabinet-demo
parameters:
    width: 1200
    depth: 450
material:
    color: '#6d28d9'
    metalness: 0.08
    roughness: 0.34
materials:
    left-door:
        color: '#c4b5fd'
        roughness: 0.22
    right-door:
        color: '#ddd6fe'
        roughness: 0.18`,
    Shelf: `type: Shelf
id: shelf-demo
parameters:
    width: 1300
    depth: 320
${baseMaterialsYaml}`,
    Sofa: `type: Sofa
id: sofa-demo
parameters:
    width: 2000
    depth: 900
material:
    color: '#db2777'
    roughness: 0.86`,
    StandLamp: `type: StandLamp
id: lamp-demo
parameters:
    height: 1700
material:
    color: '#f59e0b'
    emissive: '#fff7cc'
    emissiveIntensity: 0.7
    roughness: 0.38`,
    Room: `type: Room
id: room-demo
parameters:
    width: 5000
    depth: 3800
    height: 2800
material:
    color: '#38bdf8'
    roughness: 0.92
components:
    - type: Desk
      id: room-desk
      position: [-1000, 370, -800]
    - type: Chair
      id: room-chair
      position: [-1000, 450, -100]`,
    House: `type: House
id: house-demo
parameters:
    width: 7000
    depth: 6000
    height: 4600
materials:
    default:
        color: '#60a5fa'
        roughness: 0.84
    roof-main:
        color: '#ef4444'
        roughness: 0.62`,
    Building: `type: Building
id: building-demo
parameters:
    width: 18000
    depth: 14000
    height: 26000
material:
    color: '#2563eb'
    metalness: 0.28
    roughness: 0.26`,
    Skyscraper: `type: Skyscraper
id: tower-demo
parameters:
    width: 24000
    depth: 20000
    height: 80000
materials:
    default:
        color: '#1d4ed8'
        metalness: 0.32
        roughness: 0.18
    shell:
        color: '#93c5fd'
        opacity: 0.82
        transparent: true`,
    KitchenBaseCabinet: `type: KitchenBaseCabinet
id: KBC-900-STD
name: システムキッチン『ルミナス』 ベースキャビネット W900
parameters:
    width: 900
    height: 850
    depth: 650
material:
    color: '#f8fafc'
    roughness: 0.44
materials:
    toe-kick:
        color: '#64748b'
    top-rail:
        color: '#cbd5e1'
sockets:
    - id: slot_drawer_top
      position: [0, 750, 600]
      allowed_types: [KitchenDrawer_W900]
      joint_type: slider
      axis: [0, 0, 1]
      limits:
        min: 0
        max: 450
components:
    - id: drawer_1
      type: KitchenDrawer_W900
      attach_to: slot_drawer_top
      joint_value: 280
      material:
        color: '#cbd5e1'
        metalness: 0.1
        roughness: 0.28`
};

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
      material:
        color: '#8b5cf6'
        roughness: 0.38
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

const mechanismYaml = componentPresets.KitchenBaseCabinet;

export const scenarioPresets: Record<string, string> = {
    'YAML full coverage': fullCoverageYaml,
    'Rooms and house': roomAndHouseYaml,
    'Kitchen mechanism': mechanismYaml
};

export function buildTagPreset(tag: HeroTagButton): string {
    return componentPresets[tag];
}
