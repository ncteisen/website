import assert from 'node:assert/strict';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { build } from 'esbuild';

const { outputFiles } = await build({
	entryPoints: ['src/games/arcade/scores.ts'], bundle: true, write: false, format: 'iife', globalName: 'client',
	define: { 'import.meta.env.PUBLIC_ARCADE_API_URL': '"https://scores.example"' },
});

function setup({ denyStorage = false, values = new Map(), runStatus = 200 } = {}) {
	const timers = new Map();
	const submitted = new Map();
	const attempts = [];
	const playerAttempts = [];
	let offline = false, loseResponse = false, denyWrites = false, denyRemoves = false, timerId = 0;
	let beforeNextPlayer;
	const storage = {
		getItem: key => { if (denyStorage) throw new Error(); return values.get(key) ?? null; },
		setItem: (key, value) => { if (denyStorage || denyWrites) throw new Error(); values.set(key, value); },
		removeItem: key => { if (denyStorage || denyRemoves) throw new Error(); return values.delete(key); },
		key: index => [...values.keys()][index],
		get length() { return values.size; },
	};
	const context = vm.createContext({
		window: new EventTarget(), localStorage: storage, navigator: {}, crypto: webcrypto, CustomEvent, AbortSignal,
		setTimeout: callback => { timers.set(++timerId, callback); return timerId; }, clearTimeout: id => timers.delete(id),
		fetch: async (url, options) => {
			if (offline) throw new TypeError('Offline');
			const body = options.body && JSON.parse(options.body);
			if (url.endsWith('/players')) {
				playerAttempts.push(body);
				const before = beforeNextPlayer; beforeNextPlayer = undefined; await before?.();
			}
			if (url.endsWith('/runs')) {
				attempts.push(body);
				if (attempts.length > 100) throw new Error('Run submission did not terminate');
				if (runStatus !== 200) return Response.json({ error: 'Rejected run' }, { status: runStatus });
				submitted.set(body.id, body);
				if (loseResponse) { loseResponse = false; throw new TypeError('Connection lost after server saved'); }
			}
			return Response.json(url.endsWith('/players') ? { nickname: body.nickname } : { saved: true });
		},
	});
	vm.runInContext(outputFiles[0].text, context);
	return { client: context.client, values, timers, submitted, attempts, playerAttempts,
		setOffline: value => { offline = value; }, setDenyWrites: value => { denyWrites = value; },
		setDenyRemoves: value => { denyRemoves = value; },
		beforeNextPlayer: callback => { beforeNextPlayer = callback; }, loseResponse: () => { loseResponse = true; } };
}

const test = setup();
test.client.recordRun('flappy-sarah', 4);
assert.equal(test.submitted.size, 0, 'No public posting before nickname opt-in');
await test.client.setNickname(' Sarah ');
assert.equal(test.client.getPlayer().nickname, 'Sarah');
assert.equal(test.submitted.size, 1, 'Joining posts the completed run');
const originalId = test.client.getPlayer().id;
await test.client.setNickname('Sarah K');
assert.equal(test.client.getPlayer().id, originalId, 'Nickname changes retain the identity');
test.setOffline(true);
test.client.recordRun('sarah-jumps', 99);
await test.client.flushScores();
assert.equal(test.submitted.size, 1);
assert.match(test.client.scoreMessage(), /Waiting to sync/);
assert.ok([...test.values.keys()].some(key => key.startsWith('sarahArcade.run.')), 'Offline run is durable');
test.setOffline(false);
test.loseResponse();
await test.client.flushScores();
await test.client.flushScores();
assert.equal(test.submitted.size, 2, 'Lost response retry retains the same run ID');
assert.equal(test.attempts.at(-1).id, test.attempts.at(-2).id);
assert.equal([...test.values.keys()].filter(key => key.startsWith('sarahArcade.run.')).length, 0);
assert.equal(test.timers.size, 0, 'Successful sync clears retry timer');
assert.match(test.client.scoreMessage(), /Saved as Sarah K/);
await assert.rejects(() => test.client.setNickname('<b>bad</b>'));
const ephemeral = setup({ denyStorage: true });
ephemeral.client.recordRun('sarah-stacks', 3);
assert.equal((await ephemeral.client.setNickname('Guest')).persistent, false);
assert.equal(ephemeral.submitted.size, 1, 'Storage denial does not stop play or session score submission');
const versions = setup();
for (const game of ['sarah-skis', 'sarah-rolls', 'sarah-stacks', 'sarah-jumps']) versions.client.recordRun(game, 20);
await versions.client.setNickname('Version test');
assert.deepEqual([...versions.submitted.values()].map(run => [run.game, run.version]), [['sarah-skis', 2], ['sarah-rolls', 2], ['sarah-stacks', 2], ['sarah-jumps', 1]], 'Only changed games use new leaderboard versions');

const playerKey = 'sarahArcade.player.v1', runPrefix = 'sarahArcade.run.v1.';
const partialStorage = setup();
await partialStorage.client.setNickname('Before');
partialStorage.setDenyWrites(true);
assert.equal((await partialStorage.client.setNickname('After')).persistent, false);
assert.equal(partialStorage.client.getPlayer().nickname, 'After', 'Readable old storage must not roll back an unsaved session rename');
assert.equal(partialStorage.playerAttempts.at(-1).nickname, 'After', 'The intended nickname is sent even when persistence fails');
partialStorage.setDenyWrites(false);
partialStorage.client.getPlayer();
assert.equal(JSON.parse(partialStorage.values.get(playerKey)).nickname, 'After', 'A pending session rename persists when storage recovers');
partialStorage.setDenyWrites(true);
await partialStorage.client.setNickname('Pending');
const otherTab = { ...JSON.parse(partialStorage.values.get(playerKey)), nickname: 'Other tab' };
partialStorage.values.set(playerKey, JSON.stringify(otherTab));
assert.equal(partialStorage.client.getPlayer().nickname, 'Other tab', 'A later external identity change replaces the failed-write snapshot');

const overlapping = setup();
await overlapping.client.setNickname('Initial');
let releaseRequest, markStarted;
const heldRequest = new Promise(resolve => { releaseRequest = resolve; });
const startedRequest = new Promise(resolve => { markStarted = resolve; });
overlapping.beforeNextPlayer(() => { markStarted(); return heldRequest; });
const firstSync = overlapping.client.flushScores();
await startedRequest;
overlapping.setDenyWrites(true);
const pendingRename = overlapping.client.setNickname('During save');
releaseRequest();
await Promise.all([firstSync, pendingRename]);
assert.equal(overlapping.playerAttempts.at(-1).nickname, 'During save', 'A failed-write rename is sent after the older in-flight request');
assert.equal(overlapping.client.getPlayer().nickname, 'During save');

for (const runStatus of [200, 400, 409]) {
	const readOnlyRemoval = setup({ runStatus });
	readOnlyRemoval.client.recordRun('sarah-jumps', 14);
	const storedRunKey = [...readOnlyRemoval.values.keys()].find(key => key.startsWith(runPrefix));
	readOnlyRemoval.setDenyRemoves(true);
	await readOnlyRemoval.client.setNickname('Read only removal');
	assert.equal(readOnlyRemoval.attempts.length, 1, `HTTP ${runStatus} retires a run despite removeItem failure`);
	assert.ok(readOnlyRemoval.values.has(storedRunKey), 'The fixture retains the readable durable record');
	await readOnlyRemoval.client.flushScores();
	assert.equal(readOnlyRemoval.attempts.length, 1, 'Later syncs do not reimport retired durable records');
	assert.equal(readOnlyRemoval.timers.size, 0, 'Deletion failure does not schedule upload retries');
	readOnlyRemoval.setDenyRemoves(false);
	await readOnlyRemoval.client.flushScores();
	assert.equal(readOnlyRemoval.values.has(storedRunKey), false, 'Retired records are deleted when storage recovers');
	assert.equal(readOnlyRemoval.attempts.length, 1, 'Storage recovery does not submit the retired run again');
}

const queueValues = new Map();
const enqueue = (game, version, score, queuedAt) => {
	const run = { id: webcrypto.randomUUID(), game, version, score };
	queueValues.set(runPrefix + run.id, JSON.stringify({ run, queuedAt })); return run;
};
for (let i = 0; i < 50; i++) enqueue('sarah-skis', 1, i, i);
queueValues.set(runPrefix + 'corrupt', '{broken');
const queue = setup({ values: queueValues });
await queue.client.flushScores();
assert.equal(queueValues.size, 0, 'Page-load sync prunes retired and malformed runs even before opt-in');
for (let i = 0; i < 60; i++) enqueue('sarah-skis', 2, i, i);
const future = enqueue('sarah-stacks', 3, 100, Date.now() + 1000);
queue.client.recordRun('sarah-jumps', 10);
assert.equal(queueValues.size, 50, 'Queue bounds include valid future-version records');
assert.ok(queueValues.has(runPrefix + future.id), 'An older tab preserves newer-version runs');
await queue.client.setNickname('Queue test');
assert.equal(queue.submitted.size, 49, 'Only current-version retained runs are submitted');
assert.deepEqual([...queueValues.keys()].filter(key => key.startsWith(runPrefix)), [runPrefix + future.id]);
assert.ok([...queue.submitted.values()].every(run => run.version !== 3), 'Future records are never relabelled or submitted with older rules');

await import('./check-best-storage.mjs');
console.log('Score client checks passed: opt-in, identity persistence, offline queue, lost-response retries, version cleanup, storage denial, partial-write recovery and failed-deletion retirement.');
