import assert from 'node:assert/strict';
import { build, transform } from 'esbuild';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { importProof } from '../manga/import-proof.mjs';

const scratch = mkdtempSync(join(tmpdir(), 'website-checks-'));
try {
	const bundle = async (entry, name) => {
		const outfile = join(scratch, `${name}.mjs`);
		await build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile,
			define: { 'import.meta.env': '{}' } });
		return { module: await import(pathToFileURL(outfile).href), outfile };
	};
	const { module: dates, outfile: dateFile } = await bundle('src/lib/dates.ts', 'dates');
	assert.equal(dates.formatDate('2026-10-15'), 'Oct 15, 2026');
	assert.equal(dates.formatActivityDate({ start_date: '2026-01-01T01:00:00Z', start_date_local: '2025-12-31T17:00:00Z' }), 'Dec 31, 2025');
	assert.equal(dates.formatDate('bad-date'), 'Unknown date');
	const dateProbe = `import { formatDate } from ${JSON.stringify(pathToFileURL(dateFile).href)}; console.log(['2026-10-15','2026-01-01T01:00:00Z','2026-01-01T23:00:00'].map(formatDate));`;
	const outputs = ['UTC', 'America/Los_Angeles', 'Asia/Tokyo'].map(TZ => execFileSync(process.execPath, ['--input-type=module', '-e', dateProbe], { env: { ...process.env, TZ }, encoding: 'utf8' }));
	assert.equal(new Set(outputs).size, 1, 'dates must not depend on the build timezone');

	const { module: maps } = await bundle('src/lib/activityMaps.ts', 'maps');
	const route = '_p~iF~ps|U_ulLnnqC_mqNvxq`@';
	assert.deepEqual(maps.decodeActivityPolyline(route), [[38.5,-120.2],[40.7,-120.95],[43.252,-126.453]]);
	for (const invalid of ['_', '_p~iF', '\u0000', '~~~~~~~~~~~~?', '?'.repeat(200001)]) assert.throws(() => maps.decodeActivityPolyline(invalid));
	const element = polyline => ({ dataset: { polyline }, hidden: false, closest: () => null });
	const failed = element(route);
	globalThis.document = { querySelectorAll: () => [failed] };
	await maps.initActivityMaps('.maps', async () => { throw new Error('blocked chunk'); });
	assert.equal(failed.hidden, true);
	const invalid = element('_'), broken = element(route), valid = element(route);
	globalThis.document.querySelectorAll = () => [invalid, broken, valid];
	let rendered = 0;
	await maps.initActivityMaps('.maps', async () => ({
		map: el => { if (el === broken) throw new Error('card failure'); return { attributionControl: { setPrefix() {} }, fitBounds() { rendered++; }, remove() {} }; },
		tileLayer: () => ({ addTo() {} }),
		polyline: () => ({ addTo: () => ({ getBounds: () => [] }) }),
	}));
	assert.equal(rendered, 1, 'one corrupt or failed map must not suppress the next card');
	assert.equal(valid.dataset.initialized, 'true');
	const filtered = element(route);
	let hiddenByFilter = false;
	filtered.closest = () => hiddenByFilter ? {} : null;
	globalThis.document.querySelectorAll = () => [filtered];
	await maps.initActivityMaps('.maps', async () => { hiddenByFilter = true; return {}; });
	assert.equal(filtered.dataset.initialized, undefined, 'a map hidden during loading must remain eligible for later initialization');
	delete globalThis.document;

	// Exercise the actual homepage event wiring without loading optional maps.
	const homepage = readFileSync('src/pages/index.astro', 'utf8');
	assert.match(homepage, /class="career-head" aria-expanded="false" aria-controls=/);
	assert.match(homepage, /class="career-details"[^>]+hidden/);
	assert.equal((homepage.match(/<a class="review-card-link" href=/g) || []).length, 2);
	const classes = new Set();
	const button = { addEventListener: (_, callback) => button.click = callback, setAttribute: (key, value) => button[key] = value };
	const details = { hidden: true };
	const career = { querySelector: selector => selector === '.career-head' ? button : details, classList: { toggle: name => { if (classes.delete(name)) return false; classes.add(name); return true; } } };
	let ready;
	const context = vm.createContext({ document: { addEventListener: (_, callback) => ready = callback, querySelectorAll: selector => selector === '[data-career]' ? [career] : [] }, window: { __STATS_DATA__: {} }, initActivityMaps: async () => {} });
	const script = homepage.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*;\s*$/gm, '');
	vm.runInContext((await transform(script, { loader: 'ts' })).code, context);
	ready(); button.click(); assert.equal(details.hidden, false); assert.equal(button['aria-expanded'], 'true');
	button.click(); assert.equal(details.hidden, true); assert.equal(button['aria-expanded'], 'false');

	// Use actual legacy room handlers to solve twice in one session.
	const story = [], commands = [];
	const legacy = vm.createContext({ view: { add_paragraph: text => story.push(text), add_command: text => commands.push(text) }, console });
	for (const name of ['Room1','Room2','Room3','Room4','Controller']) vm.runInContext(readFileSync(`public/old/projects/p1/js/${name}.js`, 'utf8'), legacy);
	vm.runInContext('var controller = new Controller(view)', legacy);
	const run = command => vm.runInContext(`controller.run(${JSON.stringify(command)})`, legacy);
	const solve = () => ['door','introspect','door','open walkman','take cd','break cd','cut hand','sign wall','look'].forEach(run);
	solve(); assert.equal(story.filter(text => text.includes('Congratulations')).length, 1);
	run('restart');
	assert.equal(vm.runInContext('controller.room2.key || controller.room3.cut_hand', legacy), false);
	run('door'); run('door'); assert.equal(vm.runInContext('controller.room', legacy), 2, 'locked puzzle resets');
	run('go back'); solve(); assert.equal(story.filter(text => text.includes('Congratulations')).length, 2);
	const typed = '<img src=x onerror=alert(1)><script>alert(1)</script>';
	run(typed); assert.equal(commands.at(-1), `> ${typed}`);
	// Exercise the view sink: only a paragraph's text setter receives command input.
	const renderedCommands = [];
	const view = {};
	const dom = { ready: fn => fn.call(view), keyup() {} };
	legacy.document = view;
	legacy.$ = value => value === '<p>' ? { text(text) { this.textContent = text; return this; } } : value === '#old_text' ? { append: value => renderedCommands.push(value) } : dom;
	vm.runInContext(readFileSync('public/old/projects/p1/js/p1_main.js', 'utf8'), legacy);
	view.add_command(typed);
	assert.equal(renderedCommands.at(-1).textContent, typed);
	assert.equal(typeof renderedCommands.at(-1), 'object', 'commands never reach jQuery as an HTML string');

	// Failed imports leave every file referenced by the current manifest intact.
	const root = join(scratch, 'manga');
	const data = join(root, 'src/data');
	const output = join(root, 'public/writing/to-sleep-perchance-to-dream/manga/proof');
	mkdirSync(data, { recursive: true }); mkdirSync(output, { recursive: true });
	writeFileSync(join(data, 'sleep_manga.json'), 'old manifest'); writeFileSync(join(output, 'page-00.webp'), 'old page');
	const source = join(scratch, 'source.pdf'); writeFileSync(source, 'synthetic proof');
	const options = { root, getPageCount: () => 2, render: (_, dir) => { for (const page of [1, 2]) writeFileSync(join(dir, `page-${page}.png`), `render ${page}`); }, encode: async (_, stage, name) => { if (name === 'page-01') throw new Error('encoder failed'); for (const suffix of ['', '-800']) writeFileSync(join(stage, `${name}${suffix}.webp`), 'new page'); return { width: 1600, height: 2400 }; } };
	await assert.rejects(importProof(source, options), /encoder failed/);
	assert.equal(readFileSync(join(data, 'sleep_manga.json'), 'utf8'), 'old manifest');
	assert.equal(readFileSync(join(output, 'page-00.webp'), 'utf8'), 'old page');
	assert.deepEqual(readdirSync(output), ['page-00.webp']);
	options.encode = async (_, stage, name) => { for (const suffix of ['', '-800']) writeFileSync(join(stage, `${name}${suffix}.webp`), name); return { width: 1600, height: 2400 }; };
	assert.equal(await importProof(source, options), 2);
	const manifest = JSON.parse(readFileSync(join(data, 'sleep_manga.json')));
	assert.equal(manifest.pages.length, 2);
	for (const page of manifest.pages) for (const path of [page.image, page.smallImage]) assert.ok(readFileSync(join(root, 'public', path)).length);
	assert.equal(await importProof(source, options), 2, 'repeat imports reuse a complete immutable revision');
	assert.equal(readFileSync(join(output, 'page-00.webp'), 'utf8'), 'old page');
	console.log('Site checks passed: deterministic dates, isolated maps, keyboard disclosures/links, literal legacy input/replay, transactional manga import.');
} finally {
	rmSync(scratch, { recursive: true, force: true });
}
