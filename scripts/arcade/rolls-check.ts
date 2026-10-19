import assert from 'node:assert/strict';
import { Rolls } from '../../src/games/arcade/collection/Rolls';
import { idleControls } from '../../src/games/arcade/collection/core';
import { pilot } from './collection-pilot';

function seeded(seed: number) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; }; }

let boosts = 0, bestMultiplier = 1;
let fullThrottleLosses = 0, timedGateWaits = 0, crumbledLedges = 0;
for (let seed = 1; seed <= 50; seed++) {
	const world = new Rolls(seeded(seed));
	let previousBoost = 0, previousScore = 0;
	for (let step = 0; step < 180 * 120; step++) {
		const controls = idleControls(); controls.axis = pilot(world).axis!;
		world.update(1 / 120, controls);
		if (world.boostTime > previousBoost) boosts++;
		previousBoost = world.boostTime;
		if (world.ground?.bumper && controls.axis <= 0) timedGateWaits++;
		if (world.ledges.some(ledge => ledge.collapsed)) crumbledLedges++;
		bestMultiplier = Math.max(bestMultiplier, world.multiplier);
		assert.ok(!world.ended, `roll course ${seed} remains reachable at ${world.time.toFixed(1)}s: ${world.reason}`);
		assert.ok(world.score >= previousScore && Number.isFinite(world.score), 'score never runs backward');
		assert.ok(world.multiplier <= 5 && world.multiplier >= 1);
		assert.ok(world.sparks.length <= 36 && world.ledges.length < 10, 'effects and course stay bounded');
		assert.ok(world.ledges.every(ledge => ledge.stars.length <= 3));
		assert.ok(world.ledges.every(ledge => !ledge.bumper || (ledge.width >= 300 && ledge.crumble === undefined)), 'timing gates always have a safe waiting platform');
		previousScore = world.score;
	}
	const reckless = new Rolls(seeded(seed));
	for (let step = 0; step < 60 * 120 && !reckless.ended; step++) reckless.update(1 / 120, { axis: 1, target: null, held: true });
	if (reckless.ended) fullThrottleLosses++;
}
assert.ok(boosts > 100, 'long runs exercise repeated super springs');
assert.equal(bestMultiplier, 5, 'full star multiplier is achievable');
assert.ok(fullThrottleLosses >= 40, 'holding right alone should lose most courses within a minute');
assert.ok(timedGateWaits > 100, 'successful runs must actively brake and wait at gates');
assert.ok(crumbledLedges > 100, 'long courses exercise disappearing platforms');

const crumble = new Rolls(() => 0.5);
crumble.ledges[0].crumble = 0;
for (let i = 0; i < 103; i++) crumble.update(1 / 120, idleControls());
assert.ok(crumble.ledges[0].collapsed && crumble.ground === null, 'striped floor collapses after its visible countdown');
for (let i = 0; i < 120 && !crumble.ended; i++) crumble.update(1 / 120, idleControls());
assert.ok(crumble.ended, 'waiting on a collapsed ledge leads to a fall');

const chain = new Rolls(() => 0.5);
const opening = chain.ledges[0];
opening.stars = Array.from({ length: 4 }, () => ({ x: chain.x, y: chain.y, collected: false, missed: false }));
chain.update(1 / 120, idleControls());
assert.equal(chain.bonus, 50, 'first three stars give ten each and the fourth gives twenty');
chain.update(1 / 120, idleControls());
assert.equal(chain.bonus, 50, 'collected stars cannot be farmed');
opening.stars.push({ x: chain.x - 50, y: chain.y - 100, collected: false, missed: false });
chain.update(1 / 120, idleControls());
assert.equal(chain.multiplier, 1, 'missing a star resets the chain without ending the run');
assert.ok(!chain.ended);

for (const boost of [false, true]) {
	const world = new Rolls(() => 0.5);
	const ledge = world.ledges[0]; ledge.boost = boost;
	world.x = ledge.x + ledge.width - 40; world.vx = 200;
	world.update(1 / 120, idleControls());
	assert.ok(world.vy < -400 && world.ground === null, 'spring launches automatically');
	assert.equal(world.boostTime > 0, boost, 'only golden springs grant a speed boost');
	if (boost) assert.equal(world.vx, 320);
}
const brake = new Rolls(() => 0.5); brake.vx = 250;
for (let i = 0; i < 30; i++) brake.update(1 / 120, idleControls());
assert.ok(brake.vx < 100, 'release still brakes promptly on the ground');
console.log(JSON.stringify({ passed: true, rolls: { seeds: 50, secondsPerRun: 180, boosts, bestMultiplier, fullThrottleLosses, checks: ['star chain', 'miss reset', 'one-time collection', 'spring launches', 'timed gates', 'crumbling floors', 'braking', 'bounded effects'] } }));
