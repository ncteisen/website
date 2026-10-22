import { games, type ArcadeGameId } from './catalog';

// Keep unaffected games on their existing boards when a game's rules change.
export const SCORE_VERSION = 1;
export const SCORE_VERSIONS: Record<ArcadeGameId, number> = {
	'sarah-jumps': SCORE_VERSION,
	'flappy-sarah': SCORE_VERSION,
	'sarah-skis': 2,
	'crossy-sarah': SCORE_VERSION,
	'sarah-stacks': 2,
	'sarah-rolls': 2,
};
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export interface Run {
	id: string;
	game: ArcadeGameId;
	score: number;
	version: number;
}
export interface LeaderboardEntry { playerId: string; nickname: string; score: number; }
export interface Leaderboard { entries: LeaderboardEntry[]; }

export function normalizeNickname(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const name = value.normalize('NFKC').trim().replace(/\s+/g, ' ');
	// Allow international names, numbers, spaces and simple punctuation. No markup or control characters.
	return /^[\p{L}\p{M}\p{N} ._'’-]{1,20}$/u.test(name) && /[\p{L}\p{N}]/u.test(name) ? name : null;
}

export function isGame(value: unknown): value is ArcadeGameId {
	return games.some(game => game.id === value);
}

/** Stored records may use older or newer rules than this page's current bundle. */
export function isStoredRun(value: unknown): value is Run {
	if (!value || typeof value !== 'object') return false;
	const run = value as Run;
	return typeof run.id === 'string' && UUID.test(run.id) && isGame(run.game)
		&& Number.isSafeInteger(run.score) && run.score >= 0 && run.score <= 10_000_000
		&& Number.isSafeInteger(run.version) && run.version >= 1;
}

export function isRun(value: unknown): value is Run {
	return isStoredRun(value) && value.version === SCORE_VERSIONS[value.game];
}
