import type { SupportedCadTag } from '../core/tag-schema';

export const heroTagButtons: SupportedCadTag[] = [
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
];

const primitiveCabinetYaml = `type: KitchenBaseCabinet
id: KBC-900-STD
name: システムキッチン『ルミナス』 ベースキャビネット W900
manufacturer: Nitori-Mock
description: 上段にカトラリー用の引き出し、下段に両開きの収納を備えた標準的なベースユニット。
parameters:
    width: 900
    height: 850
    depth: 650
    material_body: メラミン化粧板（ホワイト）
    panel_thickness: 18

visual:
    file: assets/kitchen/kbc_900_body.glb

bounding_box:
    size: [900, 850, 650]
    position: [0, 425, 325]

layout:
    gap: 12

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
    - id: door_L
      use: 木目調キャビネット扉 左開き
      attach_to: hinge_door_bottom_left
    - id: door_R
      use: 木目調キャビネット扉 右開き
      attach_to: hinge_door_bottom_right
`;

const primitiveLayoutYaml = `type: Scene
id: primitive-layout-demo
layout:
    columns: 1
    gap: 1200
components:
    - type: Room
      id: workshop-room
      parameters:
        width: 4200
        depth: 3200
        height: 2600
      components:
        - type: PrimitiveBox
          id: base_plinth
          parameters:
            width: 1400
            depth: 620
            height: 80
          margin_left: 360
          margin_back: 260
          margin_bottom: 0
        - type: PrimitiveBox
          id: vertical_panel_left
          parameters:
            width: 18
            depth: 620
            height: 760
          margin_left: 360
          margin_back: 260
          margin_bottom: 80
        - type: PrimitiveBox
          id: vertical_panel_right
          parameters:
            width: 18
            depth: 620
            height: 760
          margin_left: 1742
          margin_back: 260
          margin_bottom: 80
        - type: PrimitiveBox
          id: countertop
          parameters:
            width: 1400
            depth: 650
            height: 30
          margin_left: 360
          margin_back: 260
          margin_bottom: 840
        - type: PrimitiveCylinder
          id: support_leg_front
          parameters:
            width: 40
            height: 760
          margin_left: 430
          margin_back: 820
          margin_bottom: 80
`;

export const scenarioPresets: Record<string, string> = {
    'Primitive kitchen assembly': primitiveCabinetYaml,
    'Primitive layout constraints': primitiveLayoutYaml
};
