import type { ArcadeGameId } from './catalog';
import { isRun, isStoredRun, normalizeNickname, SCORE_VERSIONS, UUID, type Leaderboard, type Run } from './score-contract';

const API = (import.meta.env.PUBLIC_ARCADE_API_URL ?? 'https://sarah-arcade-scores.astro-test.workers.dev').replace(/\/$/, '');
const PLAYER_KEY = 'sarahArcade.player.v1';
const RUN_PREFIX = 'sarahArcade.run.v1.';
interface Player { id: string; token: string; nickname: string; }
interface PendingRun { run: Run; queuedAt: number; }
let memoryPlayer: Player | null = null;
let playerWritePending = false;
let playerStorageSnapshot: string | null | undefined;
const memoryRuns = new Map<string, PendingRun>();
// A readable record can survive removeItem failure. Do not post it again this session.
const retiredRunIds = new Set<string>();
let flushing: Promise<void> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let retryDelay = 15_000;
let message = '';

export const scoresConfigured = Boolean(API);
export function scoreMessage(): string { return message; }
function announce(value: string): void {
	message = value;
	window.dispatchEvent(new CustomEvent('arcade:scores'));
}

export function getPlayer(): Player | null {
	try {
		const stored = localStorage.getItem(PLAYER_KEY);
		if (playerWritePending && (playerStorageSnapshot === undefined || stored === playerStorageSnapshot)) {
			// A readable old value must not undo a rename whose write failed. Retry persistence.
			if (memoryPlayer) storePlayer(memoryPlayer);
			return memoryPlayer;
		}
		const saved = JSON.parse(stored ?? 'null');
		if (saved && UUID.test(saved.id) && /^[\da-f]{64}$/.test(saved.token) && normalizeNickname(saved.nickname)) {
			memoryPlayer = saved;
			playerWritePending = false;
		}
		playerStorageSnapshot = stored;
	} catch { /* Session-only identity when storage is unavailable. */ }
	return memoryPlayer;
}

function storePlayer(player: Player): boolean {
	memoryPlayer = player;
	try {
		const stored = JSON.stringify(player);
		localStorage.setItem(PLAYER_KEY, stored); playerStorageSnapshot = stored; playerWritePending = false;
		return true;
	} catch { playerWritePending = true; return false; }
}

function pendingRuns(): PendingRun[] {
	const entries = new Map(memoryRuns);
	try {
		// Snapshot keys before pruning so removals cannot skip the next stored entry.
		const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i));
		for (const key of keys) {
			if (!key?.startsWith(RUN_PREFIX)) continue;
			const id = key.slice(RUN_PREFIX.length);
			if (retiredRunIds.has(id)) { removeRun(id); continue; }
			try {
				const saved = JSON.parse(localStorage.getItem(key)!);
				const run: unknown = saved?.run;
				if (isStoredRun(run) && key === RUN_PREFIX + run.id && Number.isFinite(saved.queuedAt)
					&& run.version >= SCORE_VERSIONS[run.game]) {
					entries.set(run.id, { run, queuedAt: saved.queuedAt });
					continue;
				}
			} catch { /* Corrupt and retired records cannot be posted by this bundle. */ }
			try { localStorage.removeItem(key); } catch { /* Storage may be read-only. */ }
		}
	} catch { /* Retain the in-memory queue. */ }
	const ordered = [...entries.values()].sort((a, b) => a.queuedAt - b.queuedAt);
	for (const old of ordered.slice(0, -50)) removeRun(old.run.id);
	// Preserve newer-version records from another tab, but never submit them under older rules.
	return ordered.slice(-50).filter(entry => isRun(entry.run));
}

function removeRun(id: string): void {
	memoryRuns.delete(id);
	retiredRunIds.add(id);
	try {
		localStorage.removeItem(RUN_PREFIX + id);
		retiredRunIds.delete(id);
	} catch { /* Suppress the durable record until storage allows deletion. */ }
}

class RequestError extends Error {
	constructor(readonly status: number, message: string) { super(message); }
}

async function request<T = unknown>(path: string, player?: Player, body?: unknown): Promise<T> {
	const response = await fetch(API + path, {
		method: body ? 'POST' : 'GET',
		headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(player ? { Authorization: `Bearer ${player.id}.${player.token}` } : {}) },
		body: body ? JSON.stringify(body) : undefined,
		signal: AbortSignal.timeout(8000),
		credentials: 'omit',
		referrerPolicy: 'no-referrer',
	});
	const data = await response.json();
	if (!response.ok) throw new RequestError(response.status, data.error ?? 'Please try again.');
	return data;
}

export async function setNickname(value: string): Promise<{ persistent: boolean }> {
	const nickname = normalizeNickname(value);
	if (!nickname) throw new Error('Use 1–20 letters, numbers, spaces or simple punctuation.');
	const player = getPlayer() ?? {
		id: crypto.randomUUID(),
		token: Array.from(crypto.getRandomValues(new Uint8Array(32)), n => n.toString(16).padStart(2, '0')).join(''),
		nickname,
	};
	const persistent = storePlayer({ ...player, nickname });
	// A rename during an existing request must be sent after that request finishes.
	if (flushing) await flushing;
	await flushScores();
	return { persistent };
}

/** Called once at game over, never from pause, cleanup, or the animation tick. */
export function recordRun(game: ArcadeGameId, score: number): void {
	try {
		const run: Run = { id: crypto.randomUUID(), game, score, version: SCORE_VERSIONS[game] };
		if (!isRun(run)) return;
		const entry = { run, queuedAt: Date.now() };
		memoryRuns.set(run.id, entry);
		try { localStorage.setItem(RUN_PREFIX + run.id, JSON.stringify(entry)); } catch { /* Retry in this session. */ }
		// Bound offline storage. Keep the latest 50 completed runs, not arbitrary local high scores.
		pendingRuns();
		if (!getPlayer()) announce('Choose a nickname to post your score.');
		else void flushScores();
	} catch { /* Score tracking must never prevent retrying a game. */ }
}

async function sync(): Promise<void> {
	pendingRuns(); // Also prune retired records when loading a page before nickname opt-in.
	const player = getPlayer();
	if (!player || !API) return;
	clearTimeout(retryTimer);
	try {
		announce('Saving…');
		await request('/players', player, { nickname: player.nickname });
		let rejected = false;
		while (pendingRuns().length) {
			const entry = pendingRuns()[0];
			try {
				await request('/runs', player, entry.run);
				removeRun(entry.run.id);
			} catch (error) {
				if (error instanceof RequestError && [400, 409].includes(error.status)) {
					removeRun(entry.run.id); rejected = true;
				} else throw error;
			}
		}
		retryDelay = 15_000;
		announce(rejected ? 'A score could not be posted. Your local best is still saved.' : `Saved as ${player.nickname}.`);
	} catch (error) {
		if (error instanceof RequestError && [401, 403].includes(error.status)) {
			announce(error.message);
			return;
		}
		announce('Waiting to sync. Your scores will retry automatically.');
		retryTimer = setTimeout(() => { void flushScores(); }, retryDelay);
		retryDelay = Math.min(retryDelay * 2, 120_000);
	}
}

export function flushScores(): Promise<void> {
	if (flushing) return flushing;
	// Serialize across tabs where supported; run IDs also make server retries idempotent.
	flushing = (navigator.locks ? navigator.locks.request('sarahArcade.sync', sync) : sync())
		.finally(() => { flushing = null; });
	return flushing;
}

export async function loadLeaderboard(game: ArcadeGameId, period: 'all' | 'week'): Promise<Leaderboard> {
	if (!API) throw new Error('Leaderboards aren’t connected yet. You can still play and save your best on this device.');
	try { return await request<Leaderboard>(`/leaderboard?game=${encodeURIComponent(game)}&period=${period}`); }
	catch { throw new Error('Couldn’t load scores. Check your connection and refresh.'); }
}

export function initScores(): void {
	window.addEventListener('online', () => { void flushScores(); });
	window.addEventListener('pageshow', () => { void flushScores(); });
	void flushScores();
}
