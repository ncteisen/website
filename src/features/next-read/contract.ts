import { bookById } from './catalog';

export const roles = ['Your match', 'A little sideways', 'The wild card'] as const;
export type Reaction = 'liked' | 'disliked' | 'skip';
export interface Feedback { id: string; reaction: Reaction }
export interface Pick { id: string; why: string; nudge: string }
export interface Shelf { version: 1; phrases: string[]; title: string; picks: Pick[] }
export interface RecommendationRequest { phrases: string[]; feedback: Feedback[]; exclude: string[]; slot: number | null }

export function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}
const boundedText = (value: unknown, max: number): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= max;

export function parseRequest(value: unknown): RecommendationRequest | null {
	if (!isRecord(value) || !Array.isArray(value.phrases) || value.phrases.length !== 3 || !value.phrases.every(v => boundedText(v, 70))) return null;
	if (!Array.isArray(value.feedback) || value.feedback.length > 100 || !value.feedback.every(v => isRecord(v) && typeof v.id === 'string' && bookById.has(v.id) && ['liked', 'disliked', 'skip'].includes(String(v.reaction)))) return null;
	if (!Array.isArray(value.exclude) || value.exclude.length > 100 || !value.exclude.every(id => typeof id === 'string' && bookById.has(id))) return null;
	if (value.slot !== null && value.slot !== 0 && value.slot !== 1 && value.slot !== 2) return null;
	return { phrases: value.phrases.map(v => v.trim()), feedback: value.feedback as Feedback[], exclude: [...new Set(value.exclude)], slot: value.slot as number | null };
}

export function parseShelf(value: unknown, count = 3): Shelf | null {
	if (!isRecord(value) || value.version !== 1 || !boundedText(value.title, 90)) return null;
	if (!Array.isArray(value.phrases) || value.phrases.length !== 3 || !value.phrases.every(v => boundedText(v, 70))) return null;
	if (!Array.isArray(value.picks) || value.picks.length !== count) return null;
	if (!value.picks.every(v => isRecord(v) && typeof v.id === 'string' && bookById.has(v.id) && boundedText(v.why, 400) && boundedText(v.nudge, 160))) return null;
	if (new Set(value.picks.map(v => v.id)).size !== count) return null;
	return { version: 1, phrases: value.phrases as string[], title: value.title, picks: value.picks as Pick[] };
}

// The fragment stays in the browser; no account, public database, or history is
// needed to send an exact shelf. Treat the entire fragment as untrusted input.
export function encodeShelf(shelf: Shelf): string {
	return btoa(Array.from(new TextEncoder().encode(JSON.stringify(shelf)), b => String.fromCharCode(b)).join('')).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
export function decodeShelf(value: string): Shelf | null {
	if (!value || value.length > 12000 || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
	try {
		const bytes = Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
		return parseShelf(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
	} catch { return null; }
}
