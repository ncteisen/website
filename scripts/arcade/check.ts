import assert from 'node:assert/strict';
import { FixedStepLoop } from '../../src/games/arcade/FixedStepLoop';
import { games } from '../../src/games/arcade/catalog';
import { World, PLAYER_X, RADIUS, PIPE_WIDTH, PIPE_SPEED, PIPE_GAP, FLAP_VELOCITY, FLOOR } from '../../src/games/flappy-sarah/World';
import { FlapInput } from '../../src/games/flappy-sarah/FlapInput';

function seeded(seed: number): () => number {
	return () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
}
function steer(world: World): void {
	const target = world.pipes.find(pipe => pipe.x + PIPE_WIDTH > PLAYER_X - 20);
	if (target && world.y > target.center + 18 && world.velocity > 0) world.flap();
}
let totalPipes = 0;
let maxPipes = 0;
const viewportHeights = [595, 772, 950];
for (let seed = 1; seed <= 100; seed++) {
	const world = new World(seeded(seed), viewportHeights[seed % viewportHeights.length]);
	world.flap();
	for (let step = 0; step < 120 * 90; step++) {
		if (step % (120 * 20) === 0) {
			const height = viewportHeights[(seed + step / (120 * 20)) % viewportHeights.length];
			const relativeY = world.y - world.pipes[0].center;
			const before = { velocity: world.velocity, score: world.score, distance: world.distance };
			world.setViewport(height);
			assert.deepEqual({ velocity: world.velocity, score: world.score, distance: world.distance }, before, 'resizing preserves the flight');
			assert.ok(Math.abs(world.y - world.pipes[0].center - relativeY) < 1e-8, 'Sarah and pipes move together on resize');
		}
		steer(world);
		world.update(1 / 120);
		assert.equal(world.ended, false, `course ${seed} is flyable at step ${step}, score ${world.score}`);
		maxPipes = Math.max(maxPipes, world.pipes.length);
		assert.ok(world.pipes.length <= 4);
		for (const pipe of world.pipes) {
			assert.equal(pipe.gap, PIPE_GAP, 'pipe gaps stay consistent throughout a run');
			assert.ok(pipe.center - pipe.gap / 2 >= 65);
			assert.ok(pipe.center + pipe.gap / 2 <= world.floor - 65);
		}
	}
	assert.ok(world.score > 50, 'the run clears pipes');
	totalPipes += world.score;
}

let nextId = 0;
const callbacks = new Map<number, FrameRequestCallback>();
globalThis.requestAnimationFrame = callback => { callbacks.set(++nextId, callback); return nextId; };
globalThis.cancelAnimationFrame = id => { callbacks.delete(id); };
function atRefreshRate(hz: number) {
	const world = new World(seeded(123));
	let renders = 0;
	world.flap();
	const loop = new FixedStepLoop(dt => { steer(world); world.update(dt); }, () => renders++);
	loop.start();
	for (let i = 0; i <= hz * 20; i++) {
		const pending = [...callbacks.values()]; callbacks.clear();
		for (const callback of pending) callback(i * 1000 / hz);
	}
	loop.stop();
	assert.equal(renders, hz * 20 + 1);
	assert.equal(callbacks.size, 0);
	return { y: world.y, distance: world.distance, score: world.score };
}
const reference = atRefreshRate(60);
for (const hz of [30, 90, 120, 144]) assert.deepEqual(atRefreshRate(hz), reference);

const idle = new World();
for (let step = 0; step < 240; step++) idle.update(1 / 120);
assert.equal(idle.ended, true, 'missing flaps hits the ground');
const endedY = idle.y;
idle.flap(); idle.update(1);
assert.equal(idle.y, endedY, 'a finished run is frozen');
const ceiling = new World(); ceiling.y = RADIUS; ceiling.flap(); ceiling.update(1 / 120);
assert.equal(ceiling.ended, true, 'the ceiling is a collision');
const collision = new World();
collision.pipes = [{ x: PLAYER_X - 20, previousX: PLAYER_X - 20, center: 300, gap: 160, passed: false }];
collision.y = 205; collision.update(1 / 120);
assert.equal(collision.ended, true, 'pipe collisions end the run');
const clear = new World();
clear.pipes = [{ x: PLAYER_X - RADIUS - PIPE_WIDTH - 8, previousX: 0, center: 280, gap: 180, passed: false }];
clear.update(1 / 120);
assert.equal(clear.score, 1);
for (let i = 0; i < 10; i++) clear.update(1 / 120);
assert.equal(clear.score, 1, 'a pipe scores only once');
const tapping = new World(); tapping.flap(); tapping.flap();
assert.equal(tapping.velocity, FLAP_VELOCITY, 'impulses never stack');
const hop = new World(); hop.pipes = []; hop.flap();
const startY = hop.y;
let highestY = hop.y;
for (let step = 0; step < 26; step++) {
	hop.update(1 / 120);
	highestY = Math.min(highestY, hop.y);
}
assert.ok(startY - highestY >= 39 && startY - highestY <= 43, 'a tap gives a short, repeatable hop');
assert.ok(hop.velocity >= 0, 'the hop turns downward within 0.22 seconds');
const experienced = new World(); experienced.score = 100;
experienced.update(1 / 120);
assert.equal(experienced.distance, PIPE_SPEED / 120, 'scroll speed does not increase with score');
assert.equal(new Set(games.map(game => game.path)).size, games.length);
assert.equal(new Set(games.map(game => game.bestKey)).size, games.length, 'scores stay separate');
assert.equal(games.find(game => game.id === 'sarah-jumps')?.bestKey, 'sarahJumpsHighScore');

class ElementStub extends EventTarget { closest() { return null; } focus() {} }
class ButtonStub extends ElementStub {}
const windowStub = new EventTarget();
Object.assign(globalThis, { window: windowStub, HTMLElement: ElementStub, HTMLButtonElement: ButtonStub });
const canvas = new ElementStub();
const button = new ButtonStub();
let flaps = 0;
let pauses = 0;
const input = new FlapInput(canvas as unknown as HTMLCanvasElement, button as unknown as HTMLButtonElement, () => flaps++, () => pauses++);
function dispatch(target: EventTarget, type: string, values: Record<string, unknown>): Event {
	const event = new Event(type, { cancelable: true }); Object.assign(event, values); target.dispatchEvent(event); return event;
}
const touch = dispatch(button, 'pointerdown', { isPrimary: true, pointerType: 'touch', pointerId: 1 });
assert.ok(touch.defaultPrevented);
assert.equal(flaps, 1, 'touch starts on pointerdown');
dispatch(button, 'click', { detail: 1 });
assert.equal(flaps, 1, 'touch follow-up click cannot double-flap');
dispatch(canvas, 'pointerdown', { isPrimary: false, pointerType: 'touch' });
assert.equal(flaps, 1, 'a second finger does not accidentally flap');
dispatch(windowStub, 'keydown', { code: 'Space', repeat: false });
dispatch(windowStub, 'keydown', { code: 'Space', repeat: true });
assert.equal(flaps, 2, 'holding Space does not auto-flap');
dispatch(button, 'click', { detail: 0 });
assert.equal(flaps, 3, 'keyboard/accessibility activation works');
dispatch(windowStub, 'keydown', { code: 'KeyP', repeat: false });
assert.equal(pauses, 1);
input.cleanup();
dispatch(windowStub, 'keydown', { code: 'Space', repeat: false });
assert.equal(flaps, 3, 'disposing a game removes its input');
console.log(JSON.stringify({ passed: true, game: 'Flappy Sarah', refreshRates: [30, 60, 90, 120, 144], viewportHeights, seededCourses: 100, simulatedMinutes: 150, totalPipes, maxPipes }));
