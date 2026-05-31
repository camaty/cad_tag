import { describe, expect, it } from 'vitest';
import { heroTagButtons, scenarioPresets } from '../../src/app/presets';
import { compileCadMarkup, compileCadYaml } from '../../src/core';
import { buildExportPayload } from '../../src/export';
import { parseCadXml, parseCadYaml } from '../../src/core/tag-schema';

describe('cad yaml parsing', () => {
    it('parses a supported scene with furniture, room, and building coverage', () => {
        const graph = compileCadYaml(`type: Scene
id: root
components:
    - type: Bookshelf
      id: a
    - type: Bed
      id: b
    - type: Desk
      id: c
    - type: Table
      id: d
    - type: Chair
      id: e
    - type: Cabinet
      id: f
    - type: Shelf
      id: g
    - type: Sofa
      id: h
    - type: StandLamp
      id: i
    - type: Room
      id: room
    - type: House
      id: j
    - type: Building
      id: k
    - type: Skyscraper
      id: l
`).graph;

        expect(graph.components).toHaveLength(13);
        expect(new Set(graph.components.map((component) => component.tag))).toEqual(
            new Set([
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
                'Skyscraper'
            ])
        );
    });

    it('supports kitchen sockets, aliases, and URDF-style joints', () => {
        const graph = compileCadYaml(`type: KitchenBaseCabinet
id: cabinet
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
components:
    - id: drawer_1
      use: ソフトクローズ引き出しユニット W900
      attach_to: slot_drawer_top
      joint_value: 250
    - id: door_L
      use: 木目調キャビネット扉 左開き
      attach_to: hinge_door_bottom_left
      joint_value: 90
`).graph;

        expect(graph.components.map((component) => component.id)).toEqual(['cabinet', 'drawer_1', 'door_L']);
        expect(graph.joints).toHaveLength(2);
        expect(graph.joints[0]?.jointType).toBe('slider');
        expect(graph.joints[0]?.value).toBe(250);
        expect(graph.joints[1]?.jointType).toBe('hinge');
        expect(graph.components[2]?.rotation.y).toBe(90);
    });

    it('rejects unsupported component types and invalid joint types', () => {
        expect(() => parseCadYaml('type: Window\nid: bad\n')).toThrow(/Unsupported component type/);

        expect(() =>
            parseCadYaml(`type: KitchenBaseCabinet
id: cabinet
sockets:
    - id: bad
      position: [0, 0, 0]
      allowed_types: [KitchenDrawer_W900]
      joint_type: orbital
      axis: [0, 0, 1]
      limits:
        min: 0
        max: 1
`)
        ).toThrow(/Unsupported joint_type/);
    });

    it('keeps unit-aware dimensions deterministic in YAML parameters', () => {
        const graph = compileCadYaml(`type: House
id: house
parameters:
    width: 8m
    depth: 650cm
    height: 4.8m
`).graph;
        expect(graph.components[0]?.size).toEqual({
            width: 8000,
            depth: 6500,
            height: 4800
        });
    });

    it('keeps nested room offsets and export payload deterministic', () => {
        const graph = compileCadYaml(`type: Scene
id: root
components:
    - type: Room
      id: room
      position: [2000, 1400, 1000]
      components:
        - type: Desk
          id: desk
          position: [300, -1030, -200]
`).graph;
        expect(graph.components[0]?.tag).toBe('Room');
        expect(graph.components[1]?.position.x).toBe(2300);
        expect(graph.components[1]?.position.z).toBe(800);

        const payload = buildExportPayload(graph);
        expect(payload.components[1]?.partCount).toBe(graph.components[1]?.parts.length);
        expect(payload.components[1]?.dimensionsMm.width).toBe(graph.components[1]?.size.width);
    });

    it('exports joint metadata', () => {
        const graph = compileCadYaml(`type: KitchenBaseCabinet
id: cabinet
sockets:
    - id: drawer
      position: [0, 600, 250]
      allowed_types: [KitchenDrawer_W900]
      joint_type: slider
      axis: [0, 0, 1]
      limits:
        min: 0
        max: 300
components:
    - id: drawer-1
      type: KitchenDrawer_W900
      attach_to: drawer
      joint_value: 120
`).graph;
        const payload = buildExportPayload(graph);
        expect(payload.joints).toHaveLength(1);
        expect(payload.joints[0]?.value).toBe(120);
    });

    it('decodes YAML material settings into the solved graph and export payload', () => {
        const graph = compileCadYaml(`type: Cabinet
id: cabinet
material:
    color: '#7c3aed'
    metalness: 0.2
    roughness: 0.33
materials:
    left-door:
        color: '#c4b5fd'
        roughness: 0.18
`).graph;

        expect(graph.components[0]?.materials.default).toEqual({
            color: '#7c3aed',
            metalness: 0.2,
            roughness: 0.33
        });
        expect(graph.components[0]?.materials['left-door']).toEqual({
            color: '#c4b5fd',
            roughness: 0.18
        });

        const payload = buildExportPayload(graph);
        expect(payload.components[0]?.materials).toEqual(graph.components[0]?.materials);
    });

    it('parses XML CAD tags and aliases into the normalized assembly graph', () => {
        const graph = compileCadMarkup(`<KitchenBaseCabinet id="cabinet" width="900" height="850" depth="650">
    <BoundingBox size="900 850 650" position="0 425 325" />
    <Sockets>
        <Socket id="slot_drawer_top" position="0 750 600" allowed_types="KitchenDrawer_W900" joint_type="slider" axis="0 0 1" min="0" max="450" />
        <Socket id="hinge_door_bottom_left" position="-435 350 600" allowed_types="KitchenDoor_W450_Left" joint_type="hinge" axis="0 1 0" min="0" max="110" />
    </Sockets>
    <Component id="drawer_1" use="ソフトクローズ引き出しユニット W900" attach_to="slot_drawer_top" joint_value="250" />
    <Component id="door_L" use="木目調キャビネット扉 左開き" attach_to="hinge_door_bottom_left" joint_value="90" />
</KitchenBaseCabinet>`).graph;

        expect(graph.components.map((component) => component.id)).toEqual(['cabinet', 'drawer_1', 'door_L']);
        expect(graph.joints.map((joint) => joint.jointType)).toEqual(['slider', 'hinge']);
        expect(graph.components[2]?.rotation.y).toBe(90);
    });

    it('rejects malformed XML and duplicate XML ids before solving', () => {
        expect(() => parseCadXml('<Scene><Desk id="a"></Scene>')).toThrow(/XML|tag|Malformed/u);
        expect(() =>
            parseCadXml(`<Scene id="root">
    <Desk id="duplicate" />
    <Chair id="duplicate" />
</Scene>`)
        ).toThrow(/Duplicate component id/);

        expect(() =>
            parseCadYaml(`type: Scene
id: root
components:
    - type: Desk
      id: duplicate
    - type: Chair
      id: duplicate
`)
        ).toThrow(/Duplicate component id/);
    });

    it('rejects floating parts and excessive structural interference', () => {
        expect(() =>
            compileCadMarkup(`<Room id="room" width="3000" depth="2400" height="2600">
    <PrimitiveBox id="floating" width="600" depth="600" height="100" margin_left="200" margin_back="200" margin_bottom="300" />
</Room>`)
        ).toThrow(/floating/);

        expect(() =>
            compileCadMarkup(`<Room id="room" width="3000" depth="2400" height="2600">
    <PrimitiveBox id="left" width="800" depth="800" height="400" margin_left="200" margin_back="200" />
    <PrimitiveBox id="right" width="800" depth="800" height="400" margin_left="240" margin_back="200" />
</Room>`)
        ).toThrow(/interfere excessively/);
    });

    it('rejects cabinet door depth interference', () => {
        expect(() =>
            compileCadMarkup(`<KitchenBaseCabinet id="cabinet" width="900" height="850" depth="650">
    <BoundingBox size="900 850 650" position="0 425 325" />
    <Sockets>
        <Socket id="bad-door" position="-435 350 325" allowed_types="KitchenDoor_W450_Left" joint_type="hinge" axis="0 1 0" min="0" max="110" />
    </Sockets>
    <KitchenDoor_W450_Left id="door" attach_to="bad-door" />
</KitchenBaseCabinet>`)
        ).toThrow(/depth direction/);
    });

    it('keeps the advertised header tags while emphasizing XML primitive assembly presets', () => {
        expect(heroTagButtons).toEqual([
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
        ]);
        expect(scenarioPresets['XML kitchen assembly']).toContain('<KitchenBaseCabinet');
        expect(scenarioPresets['XML layout constraints']).toContain('<PrimitiveBox');
        expect(scenarioPresets['XML layout constraints']).toContain('margin_bottom');
        expect(scenarioPresets['XML room furniture']).toContain('<Sofa');
    });

    it('supports primitive composition and keeps nested parts grounded with margin-based placement', () => {
        const graph = compileCadYaml(`type: Room
id: room
parameters:
    width: 3000
    depth: 2400
    height: 2600
components:
    - type: PrimitiveBox
      id: base
      parameters:
        width: 1200
        depth: 600
        height: 80
      margin_left: 200
      margin_back: 160
      margin_bottom: 0
    - type: PrimitiveBox
      id: side_panel
      parameters:
        width: 18
        depth: 600
        height: 720
      margin_left: 200
      margin_back: 160
      margin_bottom: 80
`).graph;

        expect(graph.components.map((component) => component.tag)).toEqual(['Room', 'PrimitiveBox', 'PrimitiveBox']);
        const room = graph.components[0]!;
        const base = graph.components[1]!;
        const panel = graph.components[2]!;
        const roomBaseY = room.position.y - room.size.height / 2;
        expect(base.position.y - base.size.height / 2).toBe(roomBaseY);
        expect(panel.position.y - panel.size.height / 2).toBe(roomBaseY + 80);
    });
});
