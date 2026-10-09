import assert from 'node:assert/strict';
import { FixedStepLoop } from '../../src/games/arcade/FixedStepLoop.ts';
import { Player, GRAVITY, JUMP_SPEED } from '../../src/games/sarah-jumps/js/entities/Player.ts';
import { Platform } from '../../src/games/sarah-jumps/js/entities/Platform.ts';
import { World } from '../../src/games/sarah-jumps/js/core/World.ts';
import { InputHandler } from '../../src/games/sarah-jumps/js/utils/InputHandler.ts';
import { readBest, saveBest } from '../../src/games/arcade/storage.ts';

function seeded(seed: number): () => number {
	return () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; };
}

let callbacks = new Map<number, FrameRequestCallback>();
let nextId = 0;
globalThis.requestAnimationFrame = callback => { callbacks.set(++nextId, callback); return nextId; };
globalThis.cancelAnimationFrame = id => { callbacks.delete(id); };
function frame(time: number): void {
	const pending = [...callbacks.values()]; callbacks.clear();
	for (const callback of pending) callback(time);
}
function runAt(hz: number): { x: number; y: number; renders: number } {
	callbacks.clear();
	const player = new Player();
	let renders = 0;
	const loop = new FixedStepLoop(dt => player.update(dt, { axis: 0, target: 280 }), () => renders++);
	loop.start(); loop.start();
	for (let i = 0; i <= hz * 2; i++) frame(i * 1000 / hz);
	loop.stop();
	assert.equal(callbacks.size, 0, 'stop cancels the only scheduled frame');
	assert.equal(renders, hz * 2 + 1, 'render every refresh, including phones and high-refresh displays');
	return { x: player.x, y: player.y, renders };
}
const reference = runAt(60);
for (const hz of [30, 90, 120, 144]) {
	const result = runAt(hz);
	assert.equal(result.x, reference.x);
	assert.ok(Math.abs(result.y - reference.y) < 1e-8, `same physics at ${hz}Hz`);
}
let updates = 0;
const loop = new FixedStepLoop(() => updates++, () => {});
loop.start(); frame(0); frame(10000);
assert.equal(updates, 12, 'a long stall has bounded catch-up');
loop.stop(); loop.start(); frame(20000);
assert.equal(updates, 12, 'resume resets elapsed time');
loop.stop();

const player = new Player();
const platform = new Platform(150, 500, 100);
player.previousY = 480; player.y = 540; player.velocityY = 1000;
assert.ok(player.landingTime(platform) !== null, 'fast falls cannot tunnel through a platform');
player.velocityY = -200;
assert.equal(player.landingTime(platform), null, 'jump through platforms while rising');
player.velocityY = 300; player.previousY = 503;
assert.equal(player.landingTime(platform), null, 'no landing from below');
player.previousY = 480; player.previousX = player.x = 320;
assert.equal(player.landingTime(platform), null, 'nearby misses stay misses');
const crumble = new Platform(150, 500, 100, 'dissolving');
crumble.land();
player.previousX = player.x = 200;
assert.equal(player.landingTime(crumble), null, 'a crumbled platform cannot be reused');
const moving = new Platform(310, 300, 80, 'horizontal');
for (let i = 0; i < 10000; i++) {
	moving.update(1 / 120);
	assert.ok(moving.x >= 8 && moving.x + moving.width <= 392, 'moving platforms stay visible');
}

// Drive the next landing through the same steering model, across many seeded courses.
let totalLandings = 0;
let maxPlatforms = 0;
for (let seed = 1; seed <= 100; seed++) {
	const world = new World(seeded(seed));
	let launchY = world.player.y;
	for (let step = 0; step < 120 * 90; step++) {
		const target = world.platforms.platforms.filter(p => !p.broken && p.baseY < launchY - 20).sort((a, b) => b.baseY - a.baseY)[0];
		assert.ok(target, 'a next platform always exists');
		const landing = world.update(1 / 120, { axis: 0, target: target.x + target.width / 2 });
		if (landing) { launchY = landing.baseY; totalLandings++; }
		assert.equal(world.ended, false, `course ${seed} remains reachable, step ${step}`);
		maxPlatforms = Math.max(maxPlatforms, world.platforms.platforms.length);
		assert.ok(world.platforms.platforms.length < 16, 'platform count stays bounded');
	}
	assert.ok(world.score > 60, 'the run climbs rather than bouncing on one platform');
}
const abandoned = new World(seeded(5));
for (let i = 0; i < 120 * 20; i++) abandoned.update(1 / 120, { axis: -1, target: null });
assert.equal(abandoned.ended, true, 'missing a landing ends the run');
const apex = JUMP_SPEED * JUMP_SPEED / (2 * GRAVITY);

// Exercise the real input handler with a scaled/offset canvas and pointer lifecycle.
class ElementStub extends EventTarget {
	left = 40;
	width = 200;
	captured = new Set<number>();
	getBoundingClientRect() { return { left: this.left, width: this.width }; }
	querySelectorAll() { return []; }
	closest() { return null; }
	focus() {}
	setPointerCapture(id: number) { this.captured.add(id); }
	hasPointerCapture(id: number) { return this.captured.has(id); }
	releasePointerCapture(id: number) { this.captured.delete(id); }
}
const windowStub = new EventTarget();
Object.assign(globalThis, { window: windowStub, HTMLElement: ElementStub, HTMLButtonElement: class extends ElementStub {} });
const canvas = new ElementStub();
const input = new InputHandler(canvas as unknown as HTMLCanvasElement, canvas as unknown as HTMLElement, () => true, () => {}, () => {});
function dispatch(target: EventTarget, type: string, values: Record<string, unknown>): Event {
	const event = new Event(type, { cancelable: true });
	Object.assign(event, values); target.dispatchEvent(event); return event;
}
dispatch(canvas, 'pointerdown', { pointerId: 1, pointerType: 'touch', clientX: 90 });
assert.equal(input.read().target, 100, 'touch coordinates scale to logical world coordinates');
dispatch(canvas, 'pointerdown', { pointerId: 2, pointerType: 'touch', clientX: 210 });
assert.equal(input.read().target, 100, 'a second touch does not steal an active drag');
dispatch(windowStub, 'pointercancel', { pointerId: 1 });
assert.equal(input.read().target, null, 'cancelled touches never leave steering stuck');
canvas.left = 10;
dispatch(windowStub, 'scroll', {});
dispatch(canvas, 'pointerdown', { pointerId: 3, pointerType: 'touch', clientX: 110 });
assert.equal(input.read().target, 200, 'coordinates remain correct after scrolling');
dispatch(windowStub, 'pointerup', { pointerId: 3 });
assert.equal(input.read().target, null, 'releasing outside the canvas clears steering');
const arrow = dispatch(windowStub, 'keydown', { code: 'ArrowRight' });
assert.equal(arrow.defaultPrevented, true, 'arrows do not scroll the page during play');
assert.equal(input.read().axis, 1);
dispatch(windowStub, 'blur', {});
assert.equal(input.read().axis, 0, 'switching apps clears held keys');
input.cleanup();
dispatch(windowStub, 'keydown', { code: 'ArrowLeft' });
assert.equal(input.read().axis, 0, 'cleanup removes input listeners');

Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('Storage blocked'); } });
assert.equal(readBest('best'), 0);
assert.doesNotThrow(() => saveBest('best', 10));
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => 'corrupt' } });
assert.equal(readBest('best'), 0, 'invalid saved scores never become NaN');
console.log(JSON.stringify({ passed: true, refreshRates: [30, 60, 90, 120, 144], seededCourses: 100, simulatedMinutes: 150, totalLandings, maxPlatforms, jumpApex: apex.toFixed(1) }));
