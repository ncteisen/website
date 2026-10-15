import assert from 'node:assert/strict';
import { randomUUID, randomBytes } from 'node:crypto';
import { createTestHarness } from 'wrangler';

const runtime = createTestHarness({ workers: [{ configPath: 'workers/arcade/wrangler.jsonc' }] });
try {
	await runtime.listen();
	const worker = runtime.getWorker();
	await worker.applyD1Migrations('DB');
	const { DB: db } = await worker.getEnv();
	const player = () => ({ id: randomUUID(), secret: randomBytes(32).toString('hex') });
	const alice = player(), bob = player();
	const headers = p => ({ 'Content-Type': 'application/json', Origin: 'https://noaheisen.com', ...(p ? { Authorization: `Bearer ${p.id}.${p.secret}` } : {}) });
	async function send(path, p, body, extra = {}) {
		return runtime.fetch(`https://scores.example${path}`, {
			method: body ? 'POST' : 'GET', headers: headers(p), ...(body ? { body: JSON.stringify(body) } : {}), ...extra,
		});
	}
	const run = (game, score) => ({ id: randomUUID(), game, score, version: 1 });
	const board = async (game = 'sarah-jumps', period = 'all') => (await (await send(`/leaderboard?game=${game}&period=${period}`)).json()).entries;
	assert.equal((await send('/health')).status, 200);
	assert.equal((await send('/players', alice, { nickname: ' Alice ' })).status, 200);
	assert.equal((await send('/players', bob, { nickname: 'Bob' })).status, 200);
	assert.equal((await send('/players', alice, { nickname: '<script>' })).status, 400);
	assert.equal((await send('/players', { ...alice, secret: bob.secret }, { nickname: 'Stolen' })).status, 403);
	assert.equal((await send('/runs', null, run('sarah-jumps', 12))).status, 401);
	assert.equal((await send('/runs', player(), run('sarah-jumps', 12))).status, 403);
	for (const invalid of [run('unknown', 1), run('sarah-jumps', -1), run('sarah-jumps', 1.5), run('sarah-jumps', 10_000_001), { ...run('sarah-jumps', 1), version: 2 }]) {
		assert.equal((await send('/runs', alice, invalid)).status, 400);
	}
	const first = run('sarah-jumps', 20);
	assert.equal((await send('/runs', alice, first)).status, 200);
	assert.equal((await send('/runs', alice, first)).status, 200);
	assert.equal((await db.prepare('SELECT COUNT(*) AS n FROM runs').first()).n, 1, 'Retry must not duplicate a run');
	assert.equal((await send('/runs', alice, { ...first, score: 90 })).status, 409);
	assert.equal((await send('/runs', bob, first)).status, 409);
	assert.equal((await board())[0].score, 20, 'Conflicting retry must not inflate best');
	await send('/runs', alice, run('sarah-jumps', 5));
	await send('/runs', bob, run('sarah-jumps', 30));
	assert.deepEqual((await board()).map(entry => [entry.nickname, entry.score]), [['Bob', 30], ['Alice', 20]]);
	await send('/players', alice, { nickname: 'Álice' });
	assert.equal((await board())[1].nickname, 'Álice', 'Renaming preserves scores');
	await send('/runs', alice, run('flappy-sarah', 7));
	assert.equal((await board('flappy-sarah')).length, 1, 'Games have separate leaderboards');
	await db.prepare('UPDATE runs SET created_at = unixepoch() - 700000 WHERE id = ?').bind(first.id).run();
	assert.equal((await board('sarah-jumps', 'week')).find(entry => entry.playerId === alice.id).score, 5, 'Weekly board excludes old best');
	assert.equal((await board()).find(entry => entry.playerId === alice.id).score, 20, 'All-time board retains old best');
	await db.prepare('UPDATE players SET blocked = 1 WHERE id = ?').bind(bob.id).run();
	assert.equal((await board()).length, 1, 'Moderation hides blocked players');
	assert.equal((await send('/runs', bob, run('sarah-jumps', 99))).status, 403);
	assert.equal((await send('/leaderboard?game=invalid')).status, 400);
	assert.equal((await send('/leaderboard?game=sarah-jumps&period=invalid')).status, 400);
	const allowed = await send('/leaderboard?game=sarah-jumps');
	assert.equal(allowed.headers.get('Access-Control-Allow-Origin'), 'https://noaheisen.com');
	const denied = await send('/health', null, null, { headers: { Origin: 'https://unrelated.example' } });
	assert.equal(denied.status, 403);
	assert.equal(denied.headers.get('Access-Control-Allow-Origin'), null);
	assert.equal((await send('/runs', alice, null, { method: 'OPTIONS' })).status, 204);
	assert.equal((await send('/players', alice, null, { method: 'POST', body: '{broken' })).status, 400);
	assert.equal((await send('/players', alice, { nickname: 'a'.repeat(3000) })).status, 413);
	const limited = player();
	for (let i = 0; i < 65; i++) {
		const response = await send('/players', limited, { nickname: 'Limit test' });
		if (i === 64) { assert.equal(response.status, 429); assert.equal(response.headers.get('Retry-After'), '60'); }
	}
	console.log('Score API checks passed: identity, validation, retries, rankings, periods, moderation, CORS, body limits and throttling.');
} finally {
	await runtime.close();
}
