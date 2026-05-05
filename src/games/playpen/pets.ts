export interface PlaypenPetManifest {
	id: string;
	displayName: string;
	description: string;
	spritePath: string;
}

export const PLAYPEN_PETS: readonly PlaypenPetManifest[] = [
	{
		id: 'gus',
		displayName: 'Gus',
		description: 'A lovable dope who adores his ball, sticks, and his sister Trudy.',
		spritePath: '/games/playpen/pets/gus/spritesheet.webp',
	},
	{
		id: 'moby',
		displayName: 'Moby',
		description: 'The cutest corgi in the world; silly, cuddly, energetic, and deeply loved.',
		spritePath: '/games/playpen/pets/moby/spritesheet.webp',
	},
	{
		id: 'hopkins',
		displayName: 'Hopkins',
		description: 'A shy but loving creature who slowly warms up, adores his brother Bugle, and is endearingly silly.',
		spritePath: '/games/playpen/pets/hopkins/spritesheet.webp',
	},
];
