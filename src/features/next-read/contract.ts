import { bookById } from './catalog';

export const roles = ['Your match', 'A little sideways', 'The wild card'] as const;
export type Reaction = 'liked' | 'disliked' | 'skip';
export interface BookDetails { id: string; title: string; author: string; coverId: number | null; editionId: string | null; year: number | null; pages: number | null }
export interface Feedback { id: string; reaction: Reaction; book?: BookDetails }
export interface Pick { id: string; why: string; nudge: string; book?: BookDetails }
export interface Shelf { version: 1 | 2; phrases: string[]; title: string; picks: Pick[] }
export interface RecommendationRequest { phrases: string[]; feedback: Feedback[]; exclude: string[]; slot: number | null; excludeBooks?: BookDetails[] }

export function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === 'object' && !Array.isArray(value);
}
const boundedText = (value: unknown, max: number): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
export const isBookId = (value: unknown): value is string => typeof value === 'string' && (bookById.has(value) || /^OL[1-9]\d{0,11}W$/.test(value));
const optionalNumber = (value: unknown, max: number) => value === null || (typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= max);

export function parseBook(value: unknown): BookDetails | null {
	if (!isRecord(value) || !isBookId(value.id) || !boundedText(value.title, 220) || !boundedText(value.author, 200)) return null;
	if (!optionalNumber(value.coverId, 999999999999) || !optionalNumber(value.year, 2200) || !optionalNumber(value.pages, 20000)) return null;
	if (value.editionId !== null && (typeof value.editionId !== 'string' || !/^OL[1-9]\d{0,11}M$/.test(value.editionId))) return null;
	return { id: value.id, title: value.title, author: value.author, coverId: value.coverId as number | null, editionId: value.editionId as string | null, year: value.year as number | null, pages: value.pages as number | null };
}

export function legacyBook(id: string): BookDetails | undefined {
	const book = bookById.get(id);
	return book ? { id, title: book.title, author: book.author, coverId: null, editionId: null, year: null, pages: null } : undefined;
}

export function parseRequest(value: unknown): RecommendationRequest | null {
	if (!isRecord(value) || !Array.isArray(value.phrases) || value.phrases.length !== 3 || !value.phrases.every(v => boundedText(v, 70))) return null;
	if (!Array.isArray(value.feedback) || value.feedback.length > 100 || !value.feedback.every(v => isRecord(v) && isBookId(v.id) && ['liked', 'disliked', 'skip'].includes(String(v.reaction)) && (v.book === undefined ? bookById.has(v.id) : parseBook(v.book)?.id === v.id))) return null;
	if (!Array.isArray(value.exclude) || value.exclude.length > 100 || !value.exclude.every(isBookId)) return null;
	if (value.excludeBooks !== undefined && (!Array.isArray(value.excludeBooks) || value.excludeBooks.length > 100 || !value.excludeBooks.every(v => parseBook(v) && value.exclude instanceof Array && value.exclude.includes((v as BookDetails).id)))) return null;
	if (value.slot !== null && value.slot !== 0 && value.slot !== 1 && value.slot !== 2) return null;
	return { phrases: value.phrases.map(v => v.trim()), feedback: value.feedback.map(v => ({ id: v.id, reaction: v.reaction, ...(v.book ? { book: parseBook(v.book)! } : {}) })), exclude: [...new Set(value.exclude)], slot: value.slot as number | null, ...(value.excludeBooks ? { excludeBooks: (value.excludeBooks as unknown[]).map(v => parseBook(v)!) } : {}) };
}

export function parseShelf(value: unknown, count?: number): Shelf | null {
	if (!isRecord(value) || (value.version !== 1 && value.version !== 2) || !boundedText(value.title, 90)) return null;
	if (!Array.isArray(value.phrases) || value.phrases.length !== 3 || !value.phrases.every(v => boundedText(v, 70))) return null;
	if (!Array.isArray(value.picks) || value.picks.length < 1 || value.picks.length > 3 || (count !== undefined && value.picks.length !== count)) return null;
	if (!value.picks.every(v => isRecord(v) && isBookId(v.id) && boundedText(v.why, 400) && boundedText(v.nudge, 160) && (value.version === 1 ? bookById.has(v.id) : parseBook(v.book)?.id === v.id))) return null;
	if (new Set(value.picks.map(v => v.id)).size !== value.picks.length) return null;
	return { version: value.version, phrases: value.phrases as string[], title: value.title, picks: value.picks.map(v => ({ id: v.id, why: v.why, nudge: v.nudge, ...(value.version === 2 ? { book: parseBook(v.book)! } : {}) })) };
}

// The fragment stays in the browser; no account, public database, or history is
// needed to send an exact shelf. Treat the entire fragment as untrusted input.
export function encodeShelf(shelf: Shelf): string {
	return btoa(Array.from(new TextEncoder().encode(JSON.stringify(shelf)), b => String.fromCharCode(b)).join('')).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
}
export function decodeShelf(value: string): Shelf | null {
	if (!value || value.length > 18000 || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
	try {
		const bytes = Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/')), c => c.charCodeAt(0));
		return parseShelf(JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
	} catch { return null; }
}
