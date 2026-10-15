import { Skis } from './Skis';
import { Crossy } from './Crossy';
import { Stacks } from './Stacks';
import { Rolls } from './Rolls';
import type { CollectionId } from './core';
export type CollectionWorld = Skis | Crossy | Stacks | Rolls;
export function createWorld(id: CollectionId, random = Math.random): CollectionWorld {
	switch (id) {
		case 'sarah-skis': return new Skis(random);
		case 'crossy-sarah': return new Crossy(random);
		case 'sarah-stacks': return new Stacks(random);
		case 'sarah-rolls': return new Rolls(random);
	}
}
