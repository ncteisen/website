import { isGame, isRun, normalizeNickname, SCORE_VERSION, SCORE_VERSIONS, UUID } from '../../src/games/arcade/score-contract';

interface Env {
	DB: D1Database;
	ALLOWED_ORIGINS: string;
	REQUEST_LIMIT: RateLimit;
	WRITE_LIMIT: RateLimit;
}

class ApiError extends Error {
	constructor(readonly status: number, message: string) { super(message); }
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
	if (!request.headers.get('Content-Type')?.startsWith('application/json')) throw new ApiError(415, 'Use JSON.');
	// Bound streamed input too; Content-Length alone is not a trustworthy limit.
	const reader = request.body?.getReader();
	if (!reader) throw new ApiError(400, 'Missing JSON.');
	const chunks: Uint8Array[] = [];
	let size = 0;
	while (true) {
		const { value, done } = await reader.read();
		if (done) break;
		size += value.length;
		if (size > 2048) { await reader.cancel(); throw new ApiError(413, 'Request too large.'); }
		chunks.push(value);
	}
	const bytes = new Uint8Array(size);
	let offset = 0;
	for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
	try {
		const value = JSON.parse(new TextDecoder().decode(bytes));
		if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
		return value;
	} catch { throw new ApiError(400, 'Invalid JSON.'); }
}

async function identity(request: Request) {
	const match = /^Bearer ([\da-f-]+)\.([\da-f]{64})$/i.exec(request.headers.get('Authorization') ?? '');
	if (!match || !UUID.test(match[1])) throw new ApiError(401, 'Choose a nickname to join.');
	const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(match[2]));
	return { id: match[1], hash: Array.from(new Uint8Array(hash), n => n.toString(16).padStart(2, '0')).join('') };
}

async function route(request: Request, env: Env): Promise<unknown> {
	const url = new URL(request.url);
	if (request.method === 'GET' && url.pathname === '/health') {
		await env.DB.prepare('SELECT id FROM players LIMIT 1').first();
		return { ok: true, version: SCORE_VERSION, scoreVersions: SCORE_VERSIONS };
	}
	if (request.method === 'GET' && url.pathname === '/leaderboard') {
		const game = url.searchParams.get('game');
		const period = url.searchParams.get('period') ?? 'all';
		if (!isGame(game) || !['all', 'week'].includes(period)) throw new ApiError(400, 'Invalid leaderboard.');
		const query = period === 'all'
			? `SELECT p.id AS playerId, p.nickname, b.score FROM bests b JOIN players p ON p.id = b.player_id
				WHERE b.game = ? AND b.version = ? AND p.blocked = 0
				ORDER BY b.score DESC, b.achieved_at, p.id LIMIT 20`
			: `WITH scores AS (
				SELECT player_id, MAX(score) AS score FROM runs
				WHERE game = ? AND version = ? AND created_at >= unixepoch() - 604800 GROUP BY player_id
			) SELECT p.id AS playerId, p.nickname, s.score FROM scores s JOIN players p ON p.id = s.player_id
				WHERE p.blocked = 0 ORDER BY s.score DESC, p.id LIMIT 20`;
		const { results } = await env.DB.prepare(query).bind(game, SCORE_VERSIONS[game]).all();
		return { entries: results };
	}
	if (request.method !== 'POST' || !['/players', '/runs'].includes(url.pathname)) throw new ApiError(404, 'Not found.');
	const auth = await identity(request);
	const player = await env.DB.prepare('SELECT token_hash, blocked FROM players WHERE id = ?')
		.bind(auth.id).first<{ token_hash: string; blocked: number }>();
	if (player ? player.token_hash !== auth.hash || player.blocked !== 0 : url.pathname === '/runs') {
		throw new ApiError(403, url.pathname === '/players' ? 'This player cannot be updated.' : 'This player cannot submit scores.');
	}
	// Public player IDs are not credentials. Invalid secrets must not spend the owner's quota.
	if (!(await env.WRITE_LIMIT.limit({ key: `player:${auth.id}` })).success) throw new ApiError(429, 'Please wait a minute before trying again.');
	const body = await readBody(request);
	if (url.pathname === '/players') {
		const nickname = normalizeNickname(body.nickname);
		if (!nickname) throw new ApiError(400, 'Use 1–20 letters, numbers, spaces or simple punctuation.');
		// Retry-safe registration; knowing someone's public ID never lets you rename them.
		await env.DB.prepare(`INSERT INTO players(id, token_hash, nickname) VALUES (?, ?, ?) ON CONFLICT(id) DO NOTHING`)
			.bind(auth.id, auth.hash, nickname).run();
		const result = await env.DB.prepare('UPDATE players SET nickname = ? WHERE id = ? AND token_hash = ? AND blocked = 0 RETURNING id')
			.bind(nickname, auth.id, auth.hash).first();
		if (!result) throw new ApiError(403, 'This player cannot be updated.');
		return { nickname };
	}
	if (!isRun(body)) throw new ApiError(400, 'Invalid score or outdated game version.');
	await env.DB.prepare('INSERT INTO runs(id, player_id, game, version, score) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING')
		.bind(body.id, auth.id, body.game, body.version, body.score).run();
	const saved = await env.DB.prepare('SELECT player_id, game, version, score FROM runs WHERE id = ?').bind(body.id).first();
	if (!saved || saved.player_id !== auth.id || saved.game !== body.game || saved.version !== body.version || saved.score !== body.score) {
		throw new ApiError(409, 'This run was already submitted with different details.');
	}
	return { saved: true };
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const origin = request.headers.get('Origin');
		const allowed = env.ALLOWED_ORIGINS.split(',').map(value => value.trim());
		const headers = new Headers({ 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff' });
		if (origin && !allowed.includes(origin)) return Response.json({ error: 'Origin not allowed.' }, { status: 403, headers });
		if (origin) headers.set('Access-Control-Allow-Origin', origin);
		headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
		headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
		headers.set('Access-Control-Max-Age', '86400');
		if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
		try {
			// Generous network cap allows shared Wi-Fi; the stricter write cap is per player.
			const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
			if (!(await env.REQUEST_LIMIT.limit({ key: `network:${ip}` })).success) throw new ApiError(429, 'Please wait a minute before trying again.');
			return Response.json(await route(request, env), { headers });
		} catch (error) {
			const status = error instanceof ApiError ? error.status : 503;
			if (status === 429) headers.set('Retry-After', '60');
			return Response.json({ error: error instanceof ApiError ? error.message : 'Scores are temporarily unavailable. Please try again.' }, { status, headers });
		}
	},
} satisfies ExportedHandler<Env>;
