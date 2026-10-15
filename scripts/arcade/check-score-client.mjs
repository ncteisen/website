import assert from 'node:assert/strict';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { build } from 'esbuild';

const { outputFiles } = await build({
	entryPoints: ['src/games/arcade/scores.ts'], bundle: true, write: false, format: 'iife', globalName: 'client',
	define: { 'import.meta.env.PUBLIC_ARCADE_API_URL': '"https://scores.example"' },
});

function setup({ denyStorage = false } = {}) {
	const values = new Map();
	const timers = new Map();
	const submitted = new Map();
	const attempts = [];
	let offline = false, loseResponse = false, timerId = 0;
	const storage = {
		getItem: key => { if (denyStorage) throw new Error(); return values.get(key) ?? null; },
		setItem: (key, value) => { if (denyStorage) throw new Error(); values.set(key, value); },
		removeItem: key => values.delete(key),
		key: index => [...values.keys()][index],
		get length() { return values.size; },
	};
	const context = vm.createContext({
		window: new EventTarget(), localStorage: storage, navigator: {}, crypto: webcrypto, CustomEvent, AbortSignal,
		setTimeout: callback => { timers.set(++timerId, callback); return timerId; }, clearTimeout: id => timers.delete(id),
		fetch: async (url, options) => {
			if (offline) throw new TypeError('Offline');
			const body = options.body && JSON.parse(options.body);
			if (url.endsWith('/runs')) {
				attempts.push(body);
				submitted.set(body.id, body);
				if (loseResponse) { loseResponse = false; throw new TypeError('Connection lost after server saved'); }
			}
			return Response.json(url.endsWith('/players') ? { nickname: body.nickname } : { saved: true });
		},
	});
	vm.runInContext(outputFiles[0].text, context);
	return { client: context.client, values, timers, submitted, attempts,
		setOffline: value => { offline = value; }, loseResponse: () => { loseResponse = true; } };
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
console.log('Score client checks passed: opt-in, identity persistence, offline queue, lost-response retries and storage denial.');
