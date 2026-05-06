import { describe, expect, it } from 'vitest';
import { compileCadYaml } from '../../src/core';
import { buildExportPayload } from '../../src/export';
import { parseCadYaml } from '../../src/core/tag-schema';

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
          position: [300, 370, -200]
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
});
