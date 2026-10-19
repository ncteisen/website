import assert from 'node:assert/strict';
import { Skis } from '../../src/games/arcade/collection/Skis';
import { idleControls } from '../../src/games/arcade/collection/core';
import { pilot } from './collection-pilot';

function seeded(seed: number) { return () => { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; }; }

// Reach and sustain the hardest course using both control schemes. The final
// course alternates the largest possible turns and supplies no helpful ramps.
for (const keyboard of [false, true]) {
	for (let seed = 1; seed <= 51; seed++) {
		let randomCalls = 0;
		const world = new Skis(seed <= 50 ? seeded(seed) : () => [0, 1, 1, 1][randomCalls++ % 4]);
		const opening = world.rows[0];
		const openingSpeed = world.speed;
		const openingSpacing = world.rows[1].at - opening.at;
		let previousSpeed = world.speed;
		for (let step = 0; step < 180 * 120; step++) {
			const target = pilot(world).target!;
			const controls = idleControls();
			if (keyboard) controls.axis = Math.abs(target - world.x) > 3 ? Math.sign(target - world.x) : 0;
			else controls.target = target;
			world.update(1 / 120, controls);
			assert.ok(!world.ended, `ski course ${seed} stays traversable with ${keyboard ? 'keyboard' : 'drag'} at ${world.time.toFixed(1)}s: ${world.reason}`);
			assert.ok(world.speed >= previousSpeed && world.speed <= 420, 'speed increases smoothly to a safe cap');
			assert.ok(world.speed - previousSpeed < 0.03, 'no abrupt speed jumps');
			assert.ok(world.rows.length <= 10 && world.tracks.length < 100 && world.snowballs.length <= 2, 'late-game objects stay bounded');
			for (const ball of world.snowballs) {
				assert.ok(world.rows.every(row => Math.abs(row.at - ball.at) >= 179), 'snowballs have room to dodge between tree rows');
			}
			previousSpeed = world.speed;
		}
		const late = world.rows.at(-1)!;
		assert.ok(world.speed > openingSpeed * 1.8, 'long runs become substantially faster');
		const regularSpacings = world.rows.slice(1).map((row, i) => row.at - world.rows[i].at).filter(spacing => spacing < 360);
		assert.ok(regularSpacings.every(spacing => spacing < openingSpacing * 0.8), 'late tree rows arrive closer together outside snowball clearings');
		assert.ok(late.gateHalfWidth < opening.gateHalfWidth * 0.75, 'late gates demand more precise steering');
		assert.ok(late.trees[1] - late.center < opening.trees[1] - opening.center, 'trees tighten the passage');
		assert.ok(world.pursuit < 0.1, 'consistent gates can still hold off the yeti');
	}
}

const untouched = new Skis(seeded(42));
const visible = untouched.rows.map(({ crossed, ...row }) => row);
for (let i = 0; i < 120; i++) untouched.update(1 / 120, idleControls());
assert.deepEqual(untouched.rows.slice(0, visible.length).map(({ crossed, ...row }) => row), visible, 'visible course geometry never changes');

const avoidGates = new Skis(() => 0.5);
avoidGates.x = 18;
for (let i = 0; i < 90 * 120 && !avoidGates.ended; i++) avoidGates.update(1 / 120, idleControls());
assert.match(avoidGates.reason, /yeti/, 'skiing outside every gate cannot evade the challenge indefinitely');

// At maximum difficulty, the rendered gate width also defines its bonus zone.
for (const offset of [37, 39]) {
	const world = new Skis(() => 0.5);
	world.distance = 40000;
	world.update(1 / 120, idleControls());
	const row = world.rows.find(row => row.at > world.distance + 25)!;
	world.rows = [row];
	world.distance = row.at - 1;
	world.x = row.center + offset;
	const bonus = world.bonus;
	world.update(1 / 120, idleControls());
	assert.equal(world.bonus - bonus, offset < row.gateHalfWidth ? 10 : 0, 'gate bonus matches the narrowed flags');
}
assert.equal(new Skis().speed, 225, 'retry starts at opening difficulty');
assert.equal(new Skis().snowballs.length, 0, 'opening stretch has no snowballs');

for (const direction of [-1, 1]) {
	for (const airborne of [false, true]) {
		const world = new Skis(() => 0.5);
		world.rows = [];
		world.snowballs = [{ at: 1, crossingX: world.x, direction }];
		world.air = airborne ? 0.5 : 0;
		world.update(1 / 120, idleControls());
		assert.equal(world.ended, !airborne, 'snowballs hit grounded skiers but ramps let them jump over');
		if (!airborne) {
			assert.match(world.reason, /Snowball/);
			const frozen = JSON.stringify(world);
			world.update(1, idleControls());
			assert.equal(JSON.stringify(world), frozen, 'snowballs freeze at game over');
		}
	}
	const world = new Skis(() => 0.5);
	const ball = { at: 100, crossingX: 200, direction };
	const before = world.snowballX(ball);
	world.distance = 100;
	assert.equal(world.snowballX(ball), 200, 'snowball crosses its fixed target at the skier');
	world.x = 50;
	assert.equal(world.snowballX(ball), 200, 'snowballs do not home in after steering');
	world.distance = 200;
	assert.ok((world.snowballX(ball) - before) * direction > 0, 'snowballs roll in the announced direction');
}
console.log(JSON.stringify({ passed: true, skisProgression: { courses: 51, secondsPerRun: 180, controls: ['drag', 'keyboard'], maximumSpeed: 420 } }));
