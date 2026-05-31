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

const primitiveCabinetXml = `<KitchenBaseCabinet
    id="KBC-900-STD"
    name="システムキッチン『ルミナス』 ベースキャビネット W900"
    manufacturer="Nitori-Mock"
    description="上段にカトラリー用の引き出し、下段に両開きの収納を備えた標準的なベースユニット。">
    <Parameters width="900" height="850" depth="650" material_body="メラミン化粧板（ホワイト）" panel_thickness="18" />
    <Visual file="assets/kitchen/kbc_900_body.glb" />
    <BoundingBox size="900 850 650" position="0 425 325" />
    <Layout gap="12" />
    <Sockets>
        <Socket id="slot_drawer_top" position="0 750 600" allowed_types="KitchenDrawer_W900" joint_type="slider" axis="0 0 1" min="0" max="450" />
        <Socket id="hinge_door_bottom_left" position="-435 350 600" allowed_types="KitchenDoor_W450_Left" joint_type="hinge" axis="0 1 0" min="0" max="110" />
        <Socket id="hinge_door_bottom_right" position="435 350 600" allowed_types="KitchenDoor_W450_Right" joint_type="hinge" axis="0 1 0" min="-110" max="0" />
    </Sockets>
    <Component id="drawer_1" use="ソフトクローズ引き出しユニット W900" attach_to="slot_drawer_top" />
    <Component id="door_L" use="木目調キャビネット扉 左開き" attach_to="hinge_door_bottom_left" />
    <Component id="door_R" use="木目調キャビネット扉 右開き" attach_to="hinge_door_bottom_right" />
</KitchenBaseCabinet>`;

const primitiveLayoutXml = `<Scene id="primitive-layout-demo">
    <Layout columns="1" gap="1200" />
    <Room id="workshop-room" width="4200" depth="3200" height="2600">
        <PrimitiveBox id="base_plinth" width="1400" depth="620" height="80" margin_left="360" margin_back="260" margin_bottom="0" />
        <PrimitiveBox id="vertical_panel_left" width="18" depth="620" height="760" margin_left="360" margin_back="260" margin_bottom="80" />
        <PrimitiveBox id="vertical_panel_right" width="18" depth="620" height="760" margin_left="1742" margin_back="260" margin_bottom="80" />
        <PrimitiveBox id="countertop" width="1400" depth="650" height="30" margin_left="360" margin_back="260" margin_bottom="840" />
        <PrimitiveCylinder id="support_leg_front" width="40" height="760" margin_left="430" margin_back="820" margin_bottom="80" />
    </Room>
</Scene>`;

const roomFurnitureXml = `<Scene id="room-furniture-demo">
    <Layout columns="1" gap="1200" />
    <Room id="living-room" width="5200" depth="4200" height="2800">
        <Sofa id="sofa" width="2100" depth="900" height="850" margin_left="420" margin_back="320" margin_bottom="0" />
        <Table id="low-table" width="1200" depth="650" height="420" margin_left="850" margin_back="1500" margin_bottom="0" />
        <StandLamp id="lamp" width="420" depth="420" height="1700" margin_left="3800" margin_back="360" margin_bottom="0" />
    </Room>
</Scene>`;

export const scenarioPresets: Record<string, string> = {
    'XML kitchen assembly': primitiveCabinetXml,
    'XML layout constraints': primitiveLayoutXml,
    'XML room furniture': roomFurnitureXml
};
