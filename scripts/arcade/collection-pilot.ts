import type { CollectionWorld } from '../../src/games/arcade/collection/worlds';
import type { Action } from '../../src/games/arcade/collection/core';
import type { Crossy } from '../../src/games/arcade/collection/Crossy';
export type Pilot = { target?: number; axis?: number; action?: Action };
function safe(world: Crossy, row: number, x: number, time: number): boolean {
	const lane = world.lanes.find(lane => lane.row === row);
	if (!lane || x < 20 || x > 380) return false;
	if (lane.kind === 'grass') return true;
	const objects = world.objects(lane, time);
	if (lane.kind === 'river') return objects.some(start => x > start + 18 && x < start + lane.width - 18);
	return !objects.some(start => x + 22 > start && x - 22 < start + (lane.kind === 'rail' ? 310 : lane.width));
}
export function pilot(world: CollectionWorld): Pilot {
	switch (world.kind) {
		case 'sarah-skis': return { target: (world.rows.find(row => row.at > world.distance + 25) || world.rows[0]).center };
		case 'sarah-rolls': return { axis: world.ledges.some(ledge => ledge.bumper && world.x >= ledge.x && world.x < ledge.x + 135 && world.y < ledge.y - 55) ? 0 : 1 };
		case 'sarah-stacks': return { action: !world.cooldown && Math.abs(world.moving.x - world.top.x) < 2 ? 'primary' : undefined };
		case 'crossy-sarah': {
			if (world.hop > 0) return {};
			if (safe(world, world.row + 1, world.x, world.time + 0.15) && safe(world, world.row + 1, world.x, world.time + 0.38)) return { action: 'up' };
			for (const direction of [-1, 1]) {
				const x = world.x + direction * 50;
				if (safe(world, world.row, x, world.time + 0.15) && safe(world, world.row + 1, x, world.time + 0.33) && safe(world, world.row + 1, x, world.time + 0.5)) return { action: direction < 0 ? 'left' : 'right' };
			}
			return {};
		}
	}
}
