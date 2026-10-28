import assert from 'node:assert/strict';
import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createTestHarness } from 'wrangler';

const directory = await mkdtemp(join(tmpdir(), 'next-read-check-'));
const runtime = createTestHarness({ workers: [{ configPath: 'workers/next-read/wrangler.jsonc' }] });
try {
	for (const [name, input] of [['worker', 'workers/next-read/index.ts'], ['contract', 'src/features/next-read/contract.ts'], ['catalog', 'src/features/next-read/catalog.ts'], ['lookup', 'workers/next-read/catalog.ts'], ['discovery', 'workers/next-read/discovery.ts']]) {
		await build({ entryPoints: [input], bundle: true, platform: 'node', format: 'esm', outfile: join(directory, `${name}.mjs`) });
	}
	const { createHandler, buildPrompt, eligibleBooks } = await import(pathToFileURL(join(directory, 'worker.mjs')));
	const { parseRequest, parseShelf, encodeShelf, decodeShelf } = await import(pathToFileURL(join(directory, 'contract.mjs')));
	const { books } = await import(pathToFileURL(join(directory, 'catalog.mjs')));
	const { matchDocument, excludedBook } = await import(pathToFileURL(join(directory, 'lookup.mjs')));
	const { parseDiscovery, selectGrounded } = await import(pathToFileURL(join(directory, 'discovery.mjs')));
	assert.equal(new Set(books.map(b => b.id)).size, books.length);
	assert(books.length >= 80);
	const input = { phrases: ['rainy Sundays', 'a little strange', 'found family'], feedback: [], exclude: [], slot: null };
	assert(parseRequest(input));
	for (const bad of [null, {}, { ...input, phrases: ['one'] }, { ...input, phrases: ['a', 'b', ' '] }, { ...input, phrases: ['a'.repeat(71), 'b', 'c'] }, { ...input, slot: 3 }, { ...input, feedback: [{ id: 'piranesi', reaction: 'maybe' }] }, { ...input, exclude: ['imaginary-book'] }]) assert.equal(parseRequest(bad), null);
	const exclusions = { ...input, feedback: [{ id: 'piranesi', reaction: 'liked' }, { id: 'earthsea', reaction: 'skip' }], exclude: ['invisible-cities'] };
	assert(!eligibleBooks(exclusions).some(b => ['piranesi', 'earthsea', 'invisible-cities'].includes(b.id)));
	const prompt = JSON.parse(buildPrompt({ ...exclusions, slot: 2 }));
	assert.deepEqual(prompt.requestedRoles, ['The wild card']);
	assert.equal(prompt.reader.reactions[0].reaction, 'liked');
	const shelf = { version: 1, title: 'Étrange & cozy 📚', phrases: ['雨', 'queer joy', '<script>alert(1)</script>'], picks: books.slice(0, 3).map(b => ({ id: b.id, why: 'A connection to your mood.', nudge: 'An honest caveat.' })) };
	assert.deepEqual(decodeShelf(encodeShelf(shelf)), shelf, 'Unicode and literal HTML survive as text, without losing shared picks');
	for (const invalid of ['', '!!!!', 'A'.repeat(13000), encodeShelf({ ...shelf, version: 2 }), encodeShelf({ ...shelf, picks: [...shelf.picks.slice(0, 2), shelf.picks[0]] }), encodeShelf({ ...shelf, picks: shelf.picks.map(p => ({ ...p, id: 'made-up' })) })]) assert.equal(decodeShelf(invalid), null);
	assert.equal(parseShelf({ ...shelf, title: 'a'.repeat(91) }), null);
	await runtime.listen();
	const worker = runtime.getWorker();
	await worker.applyD1Migrations('DB');
	const { DB } = await worker.getEnv();
	const env = { DB, OPENAI_API_KEY: 'test-only', OPENAI_MODEL: 'gpt-5.4', ALLOWED_ORIGINS: 'https://www.noaheisen.com', DAILY_LIMIT: '100', NETWORK_DAILY_LIMIT: '100', REQUEST_LIMIT: { limit: async () => ({ success: true }) } };
	let calls = 0;
	const provider = async (url, init) => {
		calls++;
		assert.equal(url, 'https://api.openai.com/v1/responses');
		const body = JSON.parse(init.body);
		assert.equal(body.store, false);
		assert.equal(body.reasoning.effort, 'low');
		assert.equal(body.max_output_tokens, 2000);
		assert.equal(body.text.format.strict, true);
		const request = JSON.parse(body.input);
		const picks = request.catalog.slice(0, request.requestedRoles.length).map(book => ({ id: book.id, why: 'A specific connection.', nudge: 'Go slowly.' }));
		return Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ title: 'A reading mood', picks }) }] }] });
	};
	const handle = createHandler(provider);
	const send = (body = input, overrides = {}, environment = env, handler = handle) => handler(new Request('https://example.test/recommend', { method: 'POST', headers: { Origin: 'https://www.noaheisen.com', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' }, body: JSON.stringify(body), ...overrides }), environment);
	assert.equal((await send({}, { headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' } })).status, 403);
	assert.equal((await send({}, { body: '{bad' })).status, 400);
	assert.equal((await send({}, { body: 'x'.repeat(16001) })).status, 413);
	assert.equal((await send(input, {}, { ...env, OPENAI_API_KEY: undefined })).status, 503);
	assert.equal((await send(input, {}, { ...env, REQUEST_LIMIT: { limit: async () => ({ success: false }) } })).status, 429);
	assert.equal(calls, 0, 'Rejected requests must not spend model tokens');
	const first = await send(exclusions);
	assert.equal(first.status, 200);
	assert.equal(first.headers.get('Access-Control-Allow-Origin'), 'https://www.noaheisen.com');
	const result = await first.json();
	assert(parseShelf(result));
	assert(!result.picks.some(p => ['piranesi', 'earthsea', 'invisible-cities'].includes(p.id)));
	const replacement = await (await send({ ...input, slot: 1 })).json();
	assert.equal(replacement.picks.length, 1);
	const corrupt = createHandler(async () => Response.json({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify({ title: 'Bad result', picks: shelf.picks.map(p => ({ ...p, id: 'piranesi' })) }) }] }] }));
	assert.equal((await send(input, {}, env, corrupt)).status, 503, 'Duplicate or excluded model IDs must fail closed');
	const unavailable = createHandler(async () => { throw new Error('secret provider detail'); });
	const failure = await send(input, {}, env, unavailable);
	assert.equal(failure.status, 503);
	assert(!(await failure.text()).includes('secret'));
	await DB.prepare('DELETE FROM usage').run();
	calls = 0;
	const concurrent = await Promise.all(Array.from({ length: 12 }, () => send(input, {}, { ...env, DAILY_LIMIT: '5' })));
	assert.equal(concurrent.filter(r => r.status === 200).length, 5, 'The global daily cap is atomic, including concurrent calls');
	assert.equal(concurrent.filter(r => r.status === 429).length, 7);
	assert.equal(calls, 5);
	await DB.prepare('DELETE FROM usage').run();
	assert.equal((await send(input, {}, { ...env, NETWORK_DAILY_LIMIT: '1' })).status, 200);
	assert.equal((await send(input, {}, { ...env, NETWORK_DAILY_LIMIT: '1' })).status, 429);
	// These invented fixture titles are only test data; production must resolve
	// actual records and compare external evidence before accepting any title.
	const documents = ['The Far Shore', 'Quiet Islands', 'Winter Passage'].map((title, i) => ({
		key: `/works/OL${1001 + i}W`, title, author_name: [`Author ${i}`], author_key: [`OL${2001 + i}A`],
		cover_i: 100 + i, number_of_pages_median: 140 + i * 20, first_publish_year: 1980,
		editions: { docs: [{ key: `/books/OL${3001 + i}M`, title, cover_i: 200 + i }] },
	}));
	const plan = { requirements: [{ phrase: 0, text: 'An island setting', strict: true }, { phrase: 1, text: 'Solitude', strict: false }, { phrase: 2, text: 'A short book', strict: true }], maxPages: 250, candidates: documents.map(doc => ({ title: doc.title, author: doc.author_name[0] })) };
	assert(parseDiscovery(plan));
	assert.equal(parseDiscovery({ ...plan, requirements: plan.requirements.slice(0, 2) }), null);
	const description = 'A sailor lives alone on a remote island. A short novel.';
	const verified = documents.map((doc, i) => ({ book: matchDocument(plan.candidates[i], doc), evidence: `Description: ${description}\nLength: about ${doc.number_of_pages_median} pages (catalog median; editions vary).` }));
	const picksFor = records => records.map(({ book }) => ({ id: book.id, why: 'A sailor lives alone on an island.', nudge: 'Length varies by edition.', checks: [
		{ requirement: 0, verdict: 'supported', support: 'on a remote island' },
		{ requirement: 1, verdict: 'supported', support: 'lives alone' },
		{ requirement: 2, verdict: 'supported', support: `Length: about ${book.pages} pages` },
	] }));
	assert.equal(matchDocument({ title: 'Invented', author: 'Author 0' }, documents[0]), null);
	assert.equal(matchDocument({ title: documents[0].title, author: 'Wrong Person' }, documents[0]), null);
	assert.equal(matchDocument(plan.candidates[0], { ...documents[0], key: 'https://evil.example/book' }), null);
	const translated = matchDocument(plan.candidates[0], { ...documents[0], title: 'Original language title' });
	assert.equal(translated.title, 'The Far Shore', 'A matching edition establishes a translated title');
	assert.equal(translated.coverId, 200, 'Prefer the cover of the matched edition');
	assert(excludedBook(translated, { ...input, exclude: ['OL999W'], excludeBooks: [{ ...translated, id: 'OL999W' }] }), 'Duplicate works/editions are excluded by title and author too');
	const expandedShelf = selectGrounded({ picks: picksFor(verified) }, plan, verified, input);
	assert.equal(expandedShelf.picks.length, 3);
	assert.deepEqual(decodeShelf(encodeShelf(expandedShelf)), expandedShelf);
	assert(parseRequest({ ...input, feedback: [{ id: translated.id, reaction: 'liked', book: translated }] }));
	assert.equal(parseRequest({ ...input, feedback: [{ id: translated.id, reaction: 'liked' }] }), null);
	assert.equal(parseShelf({ ...expandedShelf, picks: expandedShelf.picks.map(p => ({ ...p, book: { ...p.book, coverId: 'https://evil.example/image' } })) }), null);
	for (const verdict of ['partial', 'unknown', 'contradicted']) {
		const picks = picksFor(verified);
		picks[0].checks[0].verdict = verdict;
		assert.equal(selectGrounded({ picks }, plan, verified, input).picks.length, 2, `A ${verdict} hard constraint must drop the book`);
	}
	const inventedEvidence = picksFor(verified).slice(0, 1);
	inventedEvidence[0].checks[0].support = 'A fabricated scene at sea.';
	assert.equal(selectGrounded({ picks: inventedEvidence }, plan, verified, input), null);
	const missingMood = picksFor(verified).slice(0, 1);
	missingMood[0].checks[1] = { requirement: 1, verdict: 'unknown', support: '' };
	assert.equal(selectGrounded({ picks: missingMood }, plan, verified, input), null, 'A missing soft preference must not be excused just to fill three slots');
	assert.equal(selectGrounded({ picks: picksFor(verified) }, { ...plan, maxPages: 100 }, verified, input), null);
	assert.equal(selectGrounded({ picks: [] }, plan, verified, input), null);
	assert.equal(selectGrounded({ picks: picksFor(verified).slice(0, 1) }, plan, verified, input).picks.length, 1, 'Do not pad an evidenced single match');
	let expandedCalls = 0, catalogCalls = 0;
	const expandedProvider = async (_url, init) => {
		expandedCalls++;
		const body = JSON.parse(init.body);
		assert.equal(body.store, false);
		const payload = JSON.parse(body.input);
		const generated = body.text.format.name === 'discover_books' ? plan : { picks: picksFor(payload.catalog).slice(0, payload.reader.count) };
		return Response.json({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify(generated) }] }] });
	};
	const catalogProvider = async function (url, init) {
		assert.equal(this, undefined, 'Native Worker fetch must not receive a class instance as this');
		assert.equal(init.redirect, 'manual', 'Workerd supports manual redirects; non-200 responses are rejected');
		catalogCalls++;
		const parsed = new URL(url);
		assert.equal(parsed.origin, 'https://openlibrary.org');
		if (parsed.pathname === '/search.json') return Response.json({ docs: documents });
		const doc = documents.find(d => parsed.pathname === `${d.key}.json`);
		assert(doc);
		return Response.json({ key: doc.key, description, subjects: ['Islands', 'Fiction'], authors: [{ author: { key: `/authors/${doc.author_key[0]}` } }] });
	};
	const expandedHandler = createHandler(expandedProvider, catalogProvider);
	const sendExpanded = (body = input, environment = env) => expandedHandler(new Request('https://example.test/recommend-v2', { method: 'POST', headers: { Origin: 'https://www.noaheisen.com', 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), environment);
	await DB.prepare('DELETE FROM usage').run();
	const expandedResponse = await sendExpanded();
	assert.equal(expandedResponse.status, 200);
	assert.equal((await expandedResponse.json()).version, 2);
	assert.equal(expandedCalls, 2);
	assert.equal(catalogCalls, 4);
	const replacementV2 = await (await sendExpanded({ ...input, slot: 1, exclude: [translated.id], excludeBooks: [translated] })).json();
	assert.equal(replacementV2.picks.length, 1);
	assert.notEqual(replacementV2.picks[0].id, translated.id);
	assert.equal(catalogCalls, 4, 'Public catalog responses are reused across requests');
	await DB.prepare('DELETE FROM usage').run();
	expandedCalls = 0;
	const parallel = await Promise.all(Array.from({ length: 6 }, () => sendExpanded(input, { ...env, DAILY_LIMIT: '5' })));
	assert.equal(parallel.filter(r => r.status === 200).length, 2);
	assert.equal(parallel.filter(r => r.status === 429).length, 4);
	assert.equal(expandedCalls, 4, 'Reserve both stages atomically, never spend past the model-call cap');
	console.log('Next Read checks passed: legacy compatibility, open-catalog identity, evidence and constraint checks, covers, shares, exclusions, replacements, caching, failures, CORS and atomic two-stage budgets.');
} finally {
	await runtime.close();
	await rm(directory, { recursive: true, force: true });
}
