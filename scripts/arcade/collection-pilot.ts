import type { CollectionWorld } from '../../src/games/arcade/collection/worlds';
import type { Action } from '../../src/games/arcade/collection/core';
import type { Crossy } from '../../src/games/arcade/collection/Crossy';
import type { Rolls } from '../../src/games/arcade/collection/Rolls';
export type Pilot = { target?: number; axis?: number; action?: Action };
function rollAxis(world: Rolls): number {
	if (!world.ground) {
		const landing = world.ledges.find(ledge => ledge.x > world.launchX);
		if (!landing) return 1;
		const fall = world.vy * world.vy + 1800 * (landing.y - 24 - world.y);
		if (fall < 0) return 1;
		const seconds = Math.max(0.04, (-world.vy + Math.sqrt(fall)) / 900);
		const target = landing.x + (landing.bumper ? 45 : landing.width * 0.4);
		const desired = (target - world.x) / seconds;
		return world.vx > desired + 18 ? (seconds < 0.25 ? -1 : 0) : 1;
	}
	const ledge = world.ground;
	if (ledge.bumper && world.x < world.bumperX(ledge) + 40) {
		const distance = world.bumperX(ledge) - world.x;
		if (distance < 45 && world.vx > 120) return 1; // Once committed to a safe opening, clear the gate.
		const clear = world.gateOpen(ledge);
		if (!clear && distance < Math.max(65, world.vx * world.vx / 1480 + 48)) return world.vx > 5 ? -1 : 0;
	}
	return 1;
}
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
		case 'sarah-skis': {
			const row = world.rows.find(row => row.at > world.distance + 25) || world.rows[0];
			const ball = world.snowballs.find(ball => ball.at - world.distance > -45 && ball.at - world.distance < Math.min(150, world.speed * 0.55));
			return { target: ball ? ball.crossingX - ball.direction * 52 : row.center };
		}
		case 'sarah-rolls': return { axis: rollAxis(world) };
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
