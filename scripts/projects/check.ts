import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { dateMyGlobeEvents } from '../../src/data/dateMyGlobeEvents';
import { applyGlobeConstraint, hasGlobeConflict, initialGlobeRange, nextGlobeEvent, parseGlobeAnswers, type GlobeClue } from '../../src/lib/dateMyGlobeChecklist';
import { nextTrainingProbabilities, nextTrainingProbability } from '../../src/lib/llmTraining';
import { PetsHabitat } from '../../src/games/pets/PetsHabitat';

const events = dateMyGlobeEvents.filter((event) => event.includeInChecklist && event.beforeMap && event.afterMap);
const byId = new Map(events.map((event) => [event.id, event]));
const replay = (shared: string) => parseGlobeAnswers(shared, byId).reduce(
	(range, { event, answer }) => applyGlobeConstraint(range, event, answer),
	initialGlobeRange<typeof events[number]>(1500, 2026),
);

// Shared answers may arrive in any order; retain the tightest real bounds and
// never turn an empty intersection into a fabricated exact-year result.
for (const shared of ['eswatini-name:y,serbia-2006:n', 'serbia-2006:n,eswatini-name:y']) {
	const range = replay(shared);
	assert.equal(hasGlobeConflict(range), true);
	assert.deepEqual([range.earliestYear, range.latestYear], [2018, 2006]);
	assert.equal(range.lowerBoundEvent?.id, 'eswatini-name');
	assert.equal(range.upperBoundEvent?.id, 'serbia-2006');
	assert.equal(nextGlobeEvent(events, new Set(), range), null);
}
const tight = replay('eswatini-name:y,ghana-independence:y,serbia-2006:n,czechia-name:n');
assert.equal(tight.lowerBoundEvent?.id, 'eswatini-name');
assert.equal(tight.upperBoundEvent?.id, 'serbia-2006');

// A retained formal name is not evidence against a recent globe.
const optional = replay('eswatini-name:y,czechia-name:n');
assert.deepEqual([optional.earliestYear, optional.latestYear], [2018, 2026]);
assert.equal(optional.upperBoundEvent, null);
assert.equal(hasGlobeConflict(optional), false);
const afterOptional = replay('czechia-name:n');
assert.equal(afterOptional.latestYear, 2026);
const askedAllButNewest = new Set(events.filter((event) => event.id !== 'eswatini-name').map((event) => event.id));
assert.equal(nextGlobeEvent(events, askedAllButNewest, afterOptional)?.id, 'eswatini-name');

// Events within one year can straddle a globe's map date. Do not impose an
// invented within-year ordering or incorrectly exclude the whole year.
const sameYear = replay('czechoslovakia:y,eritrea-independence:n');
assert.deepEqual([sameYear.earliestYear, sameYear.latestYear], [1993, 1993]);
assert.equal(hasGlobeConflict(sameYear), false);
const sameYearCandidates: GlobeClue[] = [{ id: 'a', year: 1993 }, { id: 'b', year: 1993 }];
assert.equal(nextGlobeEvent(sameYearCandidates, new Set(['a']), initialGlobeRange(1993, 1993))?.id, 'b');

assert.deepEqual(parseGlobeAnswers('missing:y,eswatini-name:bad,eswatini-name:y:extra,eswatini-name:y,eswatini-name:n,czechia-name:u', byId)
	.map(({ event, answer }) => [event.id, answer]), [['eswatini-name', 'yes'], ['czechia-name', 'unsure']]);

// Exercise the actual catalog through the same selection function as the UI.
// Every synthetic date must remain in the final conservative interval.
for (let year = 1500; year <= 2026; year += 1) {
	let range = initialGlobeRange<typeof events[number]>(1500, 2026);
	const asked = new Set<string>();
	let event;
	while ((event = nextGlobeEvent(events, asked, range))) {
		assert(!asked.has(event.id));
		asked.add(event.id);
		range = applyGlobeConstraint(range, event, event.year <= year ? 'yes' : 'no');
		assert.equal(hasGlobeConflict(range), false);
		assert(asked.size <= events.length);
	}
	assert(range.earliestYear <= year && range.latestYear >= year, `lost year ${year}`);
}
let unsureRange = initialGlobeRange<typeof events[number]>(1500, 2026);
const unsureIds = new Set<string>();
let unsureEvent;
while ((unsureEvent = nextGlobeEvent(events, unsureIds, unsureRange))) {
	unsureIds.add(unsureEvent.id);
	unsureRange = applyGlobeConstraint(unsureRange, unsureEvent, 'unsure');
}
assert.equal(unsureIds.size, events.length);
assert.deepEqual([unsureRange.earliestYear, unsureRange.latestYear], [1500, 2026]);

assert.deepEqual([true, false, false].map((correct) => nextTrainingProbability(0.01, correct)), [8.01, 0.005, 0.005]);
assert.equal(nextTrainingProbability(0, false), 0);
assert.equal(nextTrainingProbability(0.001, false), 0.0005);
assert.equal(nextTrainingProbability(33, false), 29);
assert.deepEqual(nextTrainingProbabilities([89, 5, 5], 0), [95, 2.5, 2.5]);
for (const start of [0.01, 33]) {
	let probabilities = [start, start, start];
	for (let step = 0; step < 30; step += 1) {
		const next = nextTrainingProbabilities(probabilities, 0);
		assert(next[0] >= probabilities[0]);
		assert(next[1] < probabilities[1] && next[2] < probabilities[2]);
		assert(next.reduce((sum, value) => sum + value, 0) <= 100);
		probabilities = next;
	}
}

// Exercise the actual page formatter and Step handler: numerical regressions
// alone would miss a visual floor that enlarges a shrinking probability bar.
const trainingPage = readFileSync('src/pages/projects/llms-101.astro', 'utf8');
const trainingSourceBlock = (start: string, end: string) => {
	const from = trainingPage.indexOf(start);
	const to = trainingPage.indexOf(end);
	assert(from >= 0 && to > from, 'Training UI source markers must exist in order');
	return trainingPage.slice(from, to);
};
class TrainingElement {
	dataset: { trainingProbability: string; trainingCorrect: string };
	properties = new Map<string, string>([['--probability-width', '0.5%'], ['--mini-probability-width', '0.5%']]);
	style = { setProperty: (name: string, value: string) => this.properties.set(name, value) };
	textContent = '';
	valueElement?: TrainingElement;
	constructor(probability: number, correct = false) {
		this.dataset = { trainingProbability: String(probability), trainingCorrect: String(correct) };
	}
	querySelector() { return this.valueElement; }
}
const trainingCandidates = [new TrainingElement(0.01, true), new TrainingElement(0.01), new TrainingElement(0.01)];
for (const candidate of trainingCandidates) candidate.valueElement = new TrainingElement(0);
let handleTrainingStep: (() => void) | undefined;
runInNewContext(
	trainingSourceBlock('const setTrainingCandidateProbability =', 'const resetActiveTrainingProbabilities =')
		+ trainingSourceBlock("trainingStep?.addEventListener('click'", "trainingReset?.addEventListener('click'"),
	{
		HTMLElement: TrainingElement,
		getTrainingCandidates: () => trainingCandidates,
		nextTrainingProbabilities,
		trainingStep: { addEventListener: (type: string, callback: () => void) => {
			assert.equal(type, 'click');
			handleTrainingStep = callback;
		} },
		replayTrainingAnimation: () => {},
	},
);
assert(handleTrainingStep, 'Training Step must register its click handler');
handleTrainingStep();
assert.deepEqual(trainingCandidates.map((candidate) => Number(candidate.dataset.trainingProbability)), [8.01, 0.005, 0.005]);
assert.deepEqual(trainingCandidates.map((candidate) => Number.parseFloat(candidate.valueElement!.textContent)), [8.01, 0.005, 0.005]);
for (const property of ['--probability-width', '--mini-probability-width']) {
	assert.deepEqual(trainingCandidates.map((candidate) => Number.parseFloat(candidate.properties.get(property)!)), [8.01, 0.005, 0.005]);
}
for (let step = 0; step < 30; step += 1) handleTrainingStep();
for (const candidate of trainingCandidates) {
	const probability = Number(candidate.dataset.trainingProbability);
	assert(probability > 0, 'Display rounding must not quantize persisted training state');
	assert.equal(Number.parseFloat(candidate.properties.get('--probability-width')!), probability);
	assert.equal(Number.parseFloat(candidate.properties.get('--mini-probability-width')!), probability);
}
assert.equal(Number(trainingCandidates[0].dataset.trainingProbability), 96);
assert(Number(trainingCandidates[1].dataset.trainingProbability) < 0.0001);

// Use the real habitat class with synthetic canvas/image/browser APIs. No
// assets or network are loaded; public pause/resume is observed through RAF.
const activeFrames = new Map<number, FrameRequestCallback>();
const pendingImages: FakeImage[] = [];
let frameId = 0;
let observedWidth = 860;
const drawWidths: number[] = [];
const context = new Proxy({}, { get: (_target, key) => {
	if (key === 'createLinearGradient') return () => ({ addColorStop() {} });
	if (key === 'clearRect') return (_x: number, _y: number, width: number) => drawWidths.push(width);
	return () => {};
} });
class FakeCanvas {
	width = 860;
	height = 538;
	parentElement = {};
	getContext() { return context; }
	getBoundingClientRect() { return { width: observedWidth, height: 538 }; }
	dispatchEvent() { return true; }
}
class FakeImage {
	onload?: () => void;
	onerror?: () => void;
	set src(_value: string) { pendingImages.push(this); }
}
const canvas = new FakeCanvas();
const globals = { document: { getElementById: () => canvas }, HTMLCanvasElement: FakeCanvas, Image: FakeImage,
	CustomEvent: class { constructor(public type: string) {} },
	window: { devicePixelRatio: 1, addEventListener() {}, removeEventListener() {},
		requestAnimationFrame(callback: FrameRequestCallback) { activeFrames.set(++frameId, callback); return frameId; },
		cancelAnimationFrame(id: number) { activeFrames.delete(id); },
	},
};
const originalGlobals = new Map(Object.keys(globals).map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
for (const [key, value] of Object.entries(globals)) Object.defineProperty(globalThis, key, { value, configurable: true });
const manifest = [{ id: 'fixture', displayName: 'Fixture', description: 'Synthetic test pet', spritePath: '/fixture.webp' }];
const settle = () => new Promise<void>((resolve) => setImmediate(resolve));
try {
	const habitat = new PetsHabitat('pets', manifest);
	habitat.start();
	habitat.start();
	assert.equal(pendingImages.length, 1, 'Repeated startup cannot duplicate image loads/actors');
	pendingImages.shift()!.onload!();
	await settle();
	assert.equal(activeFrames.size, 1);
	habitat.pause();
	assert.equal(activeFrames.size, 0);
	observedWidth = 430;
	habitat.resume();
	habitat.resume();
	assert.equal(activeFrames.size, 1, 'Repeated pageshow cannot create parallel animation loops');
	assert.equal(drawWidths.at(-1), 430, 'Restoration redraws at the current viewport size');
	const [id, tick] = [...activeFrames][0];
	activeFrames.delete(id);
	tick(performance.now() + 16);
	assert.equal(activeFrames.size, 1, 'Animation continues after restoration');
	habitat.cleanup();
	habitat.resume();
	habitat.start();
	assert.equal(activeFrames.size, 0, 'Final disposal cannot restart');

	const loadingHabitat = new PetsHabitat('pets', manifest);
	loadingHabitat.start();
	loadingHabitat.pause();
	pendingImages.shift()!.onload!();
	await settle();
	assert.equal(activeFrames.size, 0, 'Loading completion must not unpause a cached page');
	loadingHabitat.resume();
	assert.equal(activeFrames.size, 1, 'A restored page starts after images have loaded');
	loadingHabitat.cleanup();

	const disposedDuringLoad = new PetsHabitat('pets', manifest);
	disposedDuringLoad.start();
	disposedDuringLoad.cleanup();
	pendingImages.shift()!.onload!();
	await settle();
	assert.equal(activeFrames.size, 0, 'Late image completion cannot resurrect a disposed habitat');
} finally {
	for (const [key, descriptor] of originalGlobals) {
		if (descriptor) Object.defineProperty(globalThis, key, descriptor);
		else Reflect.deleteProperty(globalThis, key);
	}
}

console.log('Project checks passed: Globe conflicts, optional names, shared-state validation, same-year clues, 527 catalog date runs, LLM fractional steps and rendered bar widths, and Pets pause/restore/loading lifecycle.');
