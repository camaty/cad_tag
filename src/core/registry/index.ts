import { catalogFactories, type PartFactory } from '../catalog';
import { tagDefinitions, type SupportedCadTag, type TagDefinition } from '../tag-schema';

export interface RegistryEntry {
    version: string;
    definition: TagDefinition;
    createParts: PartFactory;
}

type RenderableCadTag = Exclude<SupportedCadTag, 'Scene' | 'Group'>;

const generatorTags: RenderableCadTag[] = [
    'Room',
    'Bookshelf',
    'Bed',
    'Desk',
    'Table',
    'Chair',
    'Cabinet',
    'Shelf',
    'Sofa',
    'StandLamp',
    'House',
    'Building',
    'Skyscraper',
    'KitchenBaseCabinet',
    'KitchenDrawer_W900',
    'KitchenDoor_W450_Left',
    'KitchenDoor_W450_Right',
    'PrimitiveBox',
    'PrimitiveCylinder',
    'MerryGoRound',
    'ChristmasTree'
];

export const registryVersion = '2.0.0';

export const cadRegistry = new Map<SupportedCadTag, RegistryEntry>(
    generatorTags.map((tag) => [
        tag,
        {
            version: registryVersion,
            definition: tagDefinitions[tag],
            createParts: catalogFactories[tag]
        }
    ])
);

export function getRegistryEntry(tag: SupportedCadTag): RegistryEntry {
    const entry = cadRegistry.get(tag);

    if (!entry) {
        throw new Error(`No registry entry for tag: ${tag}`);
    }

    return entry;
}
