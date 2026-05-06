import { catalogFactories, type PartFactory } from '../catalog';
import { tagDefinitions, type SupportedCadTag, type TagDefinition } from '../tag-schema';

export interface RegistryEntry {
    version: string;
    definition: TagDefinition;
    createParts: PartFactory;
}

type LeafCadTag = Exclude<SupportedCadTag, 'scene' | 'group'>;

const generatorTags: LeafCadTag[] = [
    'bookshelf',
    'bed',
    'desk',
    'table',
    'chair',
    'cabinet',
    'shelf',
    'sofa',
    'stand-lamp',
    'house',
    'building',
    'skyscraper'
];

export const registryVersion = '1.0.0';

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
