import assert from 'node:assert/strict';
import { createWorld, type CollectionWorld } from '../../src/games/arcade/collection/worlds';
import { type CollectionId, idleControls } from '../../src/games/arcade/collection/core';
import { FixedStepLoop } from '../../src/games/arcade/FixedStepLoop';
import { Skis } from '../../src/games/arcade/collection/Skis';
import { Crossy } from '../../src/games/arcade/collection/Crossy';
import { Stacks } from '../../src/games/arcade/collection/Stacks';
import { Rolls } from '../../src/games/arcade/collection/Rolls';
import { pilot } from './collection-pilot';

const ids: CollectionId[] = ['sarah-skis', 'crossy-sarah', 'sarah-stacks', 'sarah-rolls'];
function seeded(seed: number) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; }; }
function drive(world: CollectionWorld, dt: number) {
	const command = pilot(world), controls = idleControls();
	controls.axis = command.axis || 0; controls.target = command.target ?? null;
	if (command.action) world.act(command.action);
	world.update(dt, controls);
}
const reports = [];
for (const id of ids) {
	let minScore = Infinity, runsEnded = 0;
	for (let seed = 1; seed <= 50; seed++) {
		const world = createWorld(id, seeded(seed));
		for (let i = 0; i < 120 * 60 && !world.ended; i++) {
			drive(world, 1 / 120);
			assert.ok(Number.isFinite(world.score) && world.score >= 0);
			if (world.kind === 'sarah-skis') assert.ok(world.rows.length < 10 && world.tracks.length < 100);
			if (world.kind === 'crossy-sarah') assert.ok(world.lanes.length < 35);
			if (world.kind === 'sarah-stacks') assert.ok(world.blocks.length <= 28 && world.offcuts.length <= 8);
			if (world.kind === 'sarah-rolls') assert.ok(world.ledges.length < 10 && Number.isFinite(world.y));
		}
		if (world.ended) runsEnded++;
		minScore = Math.min(minScore, world.score);
		if (id !== 'crossy-sarah') assert.equal(world.ended, false, `${id} course ${seed} must be traversable at ${world.time.toFixed(1)}s: ${world.reason}`);
		assert.ok(world.score > 5, `${id} course ${seed} makes progress`);
	}
	reports.push({ game: id, seeds: 50, secondsPerRun: 60, minScore, runsEnded });
}
// Display refresh must never change the outcome of a fixed sequence of controls.
let nextId = 0;
const callbacks = new Map<number, FrameRequestCallback>();
globalThis.requestAnimationFrame = callback => { callbacks.set(++nextId, callback); return nextId; };
globalThis.cancelAnimationFrame = id => { callbacks.delete(id); };
function atRate(id: CollectionId, hz: number) {
	const world = createWorld(id, seeded(42)); let renders = 0;
	const seconds = id === 'sarah-skis' ? 120 : 12;
	const loop = new FixedStepLoop(dt => drive(world, dt), () => renders++);
	loop.start();
	for (let i = 0; i <= hz * seconds; i++) { const pending = [...callbacks.values()]; callbacks.clear(); for (const callback of pending) callback(i * 1000 / hz); }
	loop.stop(); assert.equal(callbacks.size, 0); assert.equal(renders, hz * seconds + 1);
	return JSON.stringify(world);
}
for (const id of ids) { const reference = atRate(id, 60); for (const hz of [30, 90, 120, 144]) assert.equal(atRate(id, hz), reference, `${id} is stable at ${hz} Hz`); }
const skis = new Skis(() => 0.5); skis.x = skis.rows[0].trees[0]; skis.distance = skis.rows[0].at - 1; skis.update(1/120, idleControls()); assert.ok(skis.ended, 'trees collide');
const airborne = new Skis(() => 0.5); airborne.x = airborne.rows[0].trees[0]; airborne.distance = airborne.rows[0].at - 1; airborne.air = 0.5; airborne.update(1/120, idleControls()); assert.ok(!airborne.ended, 'ramps clear trees');
const crossy = new Crossy(() => 0.5); crossy.row = 3; const road = crossy.lanes.find(l => l.row === 3)!; road.phase = crossy.x; crossy.update(1/120, idleControls()); assert.ok(crossy.ended, 'cars collide');
const river = new Crossy(() => 0.5); river.row = 6; const water = river.lanes.find(l => l.row === 6)!; water.phase = 50; river.x = 220; river.update(1/120, idleControls()); assert.ok(river.ended, 'water between logs is a collision');
const stack = new Stacks(); stack.moving.x = 399; stack.act('primary'); assert.ok(stack.ended, 'a missed drop ends the run');
const perfect = new Stacks(); perfect.top.width = 160; perfect.moving.width = 160;
for (let i=0;i<3;i++) { perfect.cooldown = 0; perfect.moving.x = perfect.top.x; perfect.act('primary'); }
assert.equal(perfect.top.width, 176, 'three perfect drops restore lost width');
const longStack = new Stacks();
for (let i = 0; i < 120 * 180; i++) {
	longStack.update(1 / 120, idleControls());
	assert.ok(longStack.moving.x >= 0 && longStack.moving.x + longStack.moving.width <= 400, 'moving blocks stay inside the playfield');
	assert.ok(longStack.top.width <= 190, 'perfect bonuses cannot grow beyond the starting width');
	// Include pauses between legal drops, rather than dropping immediately at every cooldown.
	if (longStack.time > longStack.score * 1.5 && !longStack.cooldown && Math.abs(longStack.moving.x - longStack.top.x) < 2) longStack.act('primary');
}
assert.ok(longStack.score > 80 && !longStack.ended, 'perfect stacks remain playable well past the old full-width boundary');
const wideStack = new Stacks(); wideStack.moving.width = 400;
for (let i = 0; i < 240; i++) { wideStack.update(1 / 120, idleControls()); assert.equal(wideStack.moving.x, 0, 'zero travel never sends a block offscreen'); }
const narrowTravel = new Stacks(); narrowTravel.moving.width = 399;
for (let i = 0; i < 240; i++) {
	narrowTravel.update(1 / 120, idleControls());
	assert.ok(narrowTravel.moving.x >= 0 && narrowTravel.moving.x <= 1, 'multiple edge crossings in one tick stay bounded');
}
const roll = new Rolls(); roll.y = 800; roll.update(1/120, idleControls()); assert.ok(roll.ended, 'falling below the course ends a run');
for (const world of [skis, crossy, river, stack, roll]) { const snapshot = JSON.stringify(world); world.act('primary'); world.update(1, idleControls()); assert.equal(JSON.stringify(world), snapshot, 'finished worlds stay frozen'); }
console.log(JSON.stringify({ passed: true, collection: reports, refreshRates: [30,60,90,120,144] }));

await import('./collection-input-check');
await import('./skis-check');
await import('./rolls-check');
