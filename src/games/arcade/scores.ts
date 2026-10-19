import type { ArcadeGameId } from './catalog';
import { isRun, normalizeNickname, SCORE_VERSIONS, UUID, type Leaderboard, type Run } from './score-contract';

const API = (import.meta.env.PUBLIC_ARCADE_API_URL ?? 'https://sarah-arcade-scores.astro-test.workers.dev').replace(/\/$/, '');
const PLAYER_KEY = 'sarahArcade.player.v1';
const RUN_PREFIX = 'sarahArcade.run.v1.';
interface Player { id: string; token: string; nickname: string; }
interface PendingRun { run: Run; queuedAt: number; }
let memoryPlayer: Player | null = null;
const memoryRuns = new Map<string, PendingRun>();
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
		const saved = JSON.parse(localStorage.getItem(PLAYER_KEY) ?? 'null');
		if (saved && UUID.test(saved.id) && /^[\da-f]{64}$/.test(saved.token) && normalizeNickname(saved.nickname)) memoryPlayer = saved;
	} catch { /* Session-only identity when storage is unavailable. */ }
	return memoryPlayer;
}

function storePlayer(player: Player): boolean {
	memoryPlayer = player;
	try { localStorage.setItem(PLAYER_KEY, JSON.stringify(player)); return true; } catch { return false; }
}

function pendingRuns(): PendingRun[] {
	const entries = new Map(memoryRuns);
	try {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key?.startsWith(RUN_PREFIX)) continue;
			try {
				const saved = JSON.parse(localStorage.getItem(key)!);
				if (isRun(saved?.run) && key === RUN_PREFIX + saved.run.id && Number.isFinite(saved.queuedAt)) entries.set(saved.run.id, saved);
			} catch { /* Ignore a corrupt queue entry. */ }
		}
	} catch { /* Retain the in-memory queue. */ }
	return [...entries.values()].sort((a, b) => a.queuedAt - b.queuedAt);
}

function removeRun(id: string): void {
	memoryRuns.delete(id);
	try { localStorage.removeItem(RUN_PREFIX + id); } catch { /* Already removed in memory. */ }
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
		for (const old of pendingRuns().slice(0, -50)) removeRun(old.run.id);
		if (!getPlayer()) announce('Choose a nickname to post your score.');
		else void flushScores();
	} catch { /* Score tracking must never prevent retrying a game. */ }
}

async function sync(): Promise<void> {
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
