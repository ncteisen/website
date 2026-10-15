import { games, type ArcadeGameId } from './catalog';

// Bump when scoring or difficulty changes enough to need a fresh leaderboard.
export const SCORE_VERSION = 1;
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

export function isRun(value: unknown): value is Run {
	if (!value || typeof value !== 'object') return false;
	const run = value as Run;
	return typeof run.id === 'string' && UUID.test(run.id) && isGame(run.game)
		&& Number.isSafeInteger(run.score) && run.score >= 0 && run.score <= 10_000_000
		&& run.version === SCORE_VERSION;
}
