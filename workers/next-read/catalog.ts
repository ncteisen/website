import { isRecord, legacyBook, type BookDetails, type RecommendationRequest } from '../../src/features/next-read/contract';

export interface Candidate { title: string; author: string }
export interface CatalogBook { book: BookDetails; evidence: string }
export interface CatalogQuery { groups: string[][] }
export interface SearchBook { book: BookDetails; subjects: string[]; authorKeys: string[]; exploratory: boolean }

export function searchQuery(query: CatalogQuery, maxPages: number | null) {
	// The model supplies words, never executable Solr syntax or URLs.
	const quote = (term: string) => `"${term.replace(/[\\"]/g, ' ')}"`;
	return query.groups.map(group => `(${group.map(quote).join(' OR ')})`).join(' AND ')
		+ (maxPages === null ? '' : ` AND number_of_pages_median:[1 TO ${maxPages}]`);
}

export function normalize(value: string) {
	return value.normalize('NFKD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}
function titleKey(value: string) { return normalize(value.split(':')[0]).replace(/^(the|a|an) /, ''); }
export function sameTitle(a: string, b: string) { return titleKey(a) === titleKey(b); }
export function sameAuthor(a: string, b: string) {
	const left = normalize(a).split(' '), right = normalize(b).split(' ');
	if (left.join('') === right.join('')) return true;
	if (left.length < 2 || right.length < 2 || left.at(-1) !== right.at(-1)) return false;
	return left.length === right.length && left.every((part, i) => part === right[i] || ((part.length === 1 || right[i].length === 1) && part[0] === right[i][0]));
}
const positive = (value: unknown, max: number) => typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= max ? value : null;
const text = (value: unknown, max: number) => typeof value === 'string' ? value.replace(/<[^>]*>/g, ' ').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/\s+/g, ' ').trim().slice(0, max) : '';

export function matchDocument(candidate: Candidate, value: unknown): BookDetails | null {
	if (!isRecord(value) || typeof value.key !== 'string' || !Array.isArray(value.author_name)) return null;
	const id = value.key.replace(/^\/works\//, '');
	if (!/^OL[1-9]\d{0,11}W$/.test(id)) return null;
	const author = value.author_name.find(name => typeof name === 'string' && sameAuthor(name, candidate.author));
	if (!author) return null;
	const editions = isRecord(value.editions) && Array.isArray(value.editions.docs) ? value.editions.docs.filter(isRecord) : [];
	const edition = editions.find(item => typeof item.title === 'string' && sameTitle(item.title, candidate.title));
	const title = edition?.title ?? value.title;
	if (typeof title !== 'string' || !sameTitle(title, candidate.title) || title.length > 220 || author.length > 200) return null;
	return {
		id, title, author,
		coverId: positive(edition?.cover_i, 999999999999) ?? positive(value.cover_i, 999999999999),
		editionId: typeof edition?.key === 'string' && /^\/books\/OL[1-9]\d{0,11}M$/.test(edition.key) ? edition.key.slice(7) : null,
		year: positive(value.first_publish_year, 2200), pages: positive(value.number_of_pages_median, 20000),
	};
}

export function excludedBook(book: BookDetails, input: RecommendationRequest) {
	if (input.exclude.includes(book.id) || input.feedback.some(item => item.id === book.id)) return true;
	const known = [...(input.excludeBooks || []), ...input.exclude.map(legacyBook), ...input.feedback.map(item => item.book || legacyBook(item.id))];
	return known.some(other => other && sameTitle(book.title, other.title) && sameAuthor(book.author, other.author));
}

export class Catalog {
	constructor(private db: D1Database, private fetcher: typeof fetch, private signal: AbortSignal) {}

	private async get(path: string) {
		this.signal.throwIfAborted();
		const cached = await this.db.prepare('SELECT value FROM catalog_cache WHERE key = ? AND expires > ?').bind(path, Date.now()).first<{ value: string }>();
		if (cached) return JSON.parse(cached.value) as unknown;
		// All instances share the same 1 request/second allowance. No IP rotation,
		// uncontrolled fan-out, or retries when the public catalog is unavailable.
		const now = Date.now();
		const gate = await this.db.prepare(`INSERT INTO catalog_gate (id, next_at) VALUES (1, ?)
			ON CONFLICT(id) DO UPDATE SET next_at = MAX(next_at, ?) + 1050
			WHERE next_at < ? RETURNING next_at`).bind(now + 1050, now, now + 8000).first<{ next_at: number }>();
		if (!gate) throw new Error('catalog busy');
		const delay = gate.next_at - 1050 - Date.now();
		if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay));
		this.signal.throwIfAborted();
		// Workerd's native fetch cannot be invoked as a method on this class.
		const fetcher = this.fetcher;
		const response = await fetcher(`https://openlibrary.org${path}`, {
			headers: { 'User-Agent': 'NextRead/2.0 (https://www.noaheisen.com/projects/next-read/)', Accept: 'application/json' },
			signal: AbortSignal.any([this.signal, AbortSignal.timeout(path.startsWith('/search') ? 15000 : 8000)]), redirect: 'manual',
		}).catch(() => { throw new Error('NEXT_READ_CATALOG_CONNECTION'); });
		if (!response.ok) throw new Error(`NEXT_READ_CATALOG_HTTP_${response.status}`);
		const raw = await response.text();
		if (raw.length > 1000000) throw new Error('catalog response too large');
		const data: unknown = JSON.parse(raw);
		await this.db.prepare('INSERT OR REPLACE INTO catalog_cache (key, value, expires) VALUES (?, ?, ?)').bind(path, raw, Date.now() + (path.startsWith('/search') ? 86400000 : 604800000)).run();
		return data;
	}

	async search(queries: CatalogQuery[], maxPages: number | null, input: RecommendationRequest): Promise<SearchBook[]> {
		const matches: SearchBook[] = [];
		let completed = 0;
		// Three complementary relevance searches plus a shuffled sample from the
		// same subject searches. Randomness changes discovery, never the fit rules.
		const lanes = [...queries.map(query => ({ q: searchQuery(query, maxPages), exploratory: false })),
			{ q: queries.map(query => `(${searchQuery(query, maxPages)})`).join(' OR '), exploratory: true }];
		for (const lane of lanes) {
			const params = new URLSearchParams({ q: lane.q, lang: 'en', limit: '20', fields: 'key,title,author_name,author_key,cover_i,first_publish_year,number_of_pages_median,subject,editions,editions.key,editions.title,editions.cover_i' });
			if (lane.exploratory) params.set('sort', 'random');
			try {
				const response = await this.get(`/search.json?${params}`);
				if (!isRecord(response) || !Array.isArray(response.docs)) continue;
				completed++;
				for (const doc of response.docs.slice(0, 20)) {
					if (!isRecord(doc) || !Array.isArray(doc.author_name) || !Array.isArray(doc.author_key)) continue;
					const edition = isRecord(doc.editions) && Array.isArray(doc.editions.docs) ? doc.editions.docs.find(isRecord) : null;
					const title = edition?.title || doc.title, author = doc.author_name[0];
					if (typeof title !== 'string' || typeof author !== 'string') continue;
					const book = matchDocument({ title, author }, doc);
					if (!book || excludedBook(book, input) || (maxPages !== null && (book.pages === null || book.pages > maxPages))) continue;
					if (matches.some(item => item.book.id === book.id || (sameTitle(item.book.title, book.title) && sameAuthor(item.book.author, book.author)))) continue;
					const subjects = (Array.isArray(doc.subject) ? doc.subject : []).filter(s => typeof s === 'string').slice(0, 30).map(s => text(s, 100));
					matches.push({ book, subjects, authorKeys: doc.author_key.filter(k => typeof k === 'string' && /^OL[1-9]\d*A$/.test(k)), exploratory: lane.exploratory });
				}
			} catch { this.signal.throwIfAborted(); /* Another search can still supply candidates. */ }
		}
		if (!completed) throw new Error('NEXT_READ_CATALOG_UNAVAILABLE');
		return matches;
	}

	async hydrate(matches: SearchBook[]): Promise<CatalogBook[]> {
		const verified: CatalogBook[] = [];
		for (const { book, subjects: searchSubjects, authorKeys } of matches.slice(0, 10)) {
			try {
				const work = await this.get(`/works/${book.id}.json`);
				if (!isRecord(work) || work.key !== `/works/${book.id}`) continue;
				const workAuthors = Array.isArray(work.authors) ? work.authors.filter(isRecord).map(a => isRecord(a.author) ? a.author.key : null) : [];
				if (!authorKeys.some(key => workAuthors.includes(`/authors/${key}`))) continue;
				const description = text(isRecord(work.description) ? work.description.value : work.description, 2600);
				const subjects = (Array.isArray(work.subjects) ? work.subjects : searchSubjects).filter(s => typeof s === 'string').slice(0, 40).map(s => text(s, 100));
				if (!description && subjects.length < 2) continue;
				const evidence = [description && `Description: ${description}`, subjects.length && `Subjects: ${subjects.join('; ')}`, book.pages && `Length: about ${book.pages} pages (catalog median; editions vary).`, book.year && `First published: ${book.year}.`].filter(Boolean).join('\n');
				verified.push({ book, evidence });
			} catch { this.signal.throwIfAborted(); /* A sparse or unavailable record cannot establish a fit. */ }
		}
		return verified;
	}
}
