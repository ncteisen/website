export type PetRunningSprite = 'running-left' | 'running-right';

export interface PetManifest {
	id: string;
	displayName: string;
	description: string;
	spritePath: string;
	groundOffsetY?: number;
	runningSprites?: {
		left: PetRunningSprite;
		right: PetRunningSprite;
	};
}

export const CODEX_PETS: readonly PetManifest[] = [
	{
		id: 'gus',
		displayName: 'Gus',
		description: 'A lovable dope who adores his ball, sticks, and his sister Trudy.',
		spritePath: '/games/pets/gus/spritesheet.webp',
		runningSprites: {
			left: 'running-right',
			right: 'running-left',
		},
	},
	{
		id: 'moby',
		displayName: 'Moby',
		description: 'The cutest corgi in the world.',
		spritePath: '/games/pets/moby/spritesheet.webp',
	},
	{
		id: 'hopkins',
		displayName: 'Hopkins',
		description: 'A shy but loving creature who slowly warms up, adores his brother Bugle, and is endearingly silly.',
		spritePath: '/games/pets/hopkins/spritesheet.webp',
	},
	{
		id: 'winnie',
		displayName: 'Winnie',
		description: 'The cutest mini aussie, shy at first but very loving and soft; her best friend is a cat named Steven.',
		spritePath: '/games/pets/winnie/spritesheet.webp',
	},
	{
		id: 'trudy',
		displayName: 'Trudy',
		description: 'Little wiener dog. Shy but spunky. Cuddlebug. The most perfect dog you will ever meet.',
		spritePath: '/games/pets/trudy/spritesheet.webp',
		groundOffsetY: 34,
	},
];
