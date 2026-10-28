import { books } from './catalog';
import { decodeShelf, encodeShelf, isRecord, legacyBook, parseBook, parseShelf, type BookDetails, type Feedback, type Pick, type Reaction, type Shelf } from './contract';
import { createWaitingNote } from './loading';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const form = $<HTMLFormElement>('mood-form');
const fields = [1, 2, 3].map(n => $<HTMLInputElement>(`phrase-${n}`));
const grid = $('book-grid');
const api = document.body.dataset.api || '';
const storageKey = 'next-read:v1';
const bookById = new Map<string, BookDetails>(books.map(book => [book.id, legacyBook(book.id)!]));
let shelf: Shelf | null = null;
let busy = false;
let retrySlot: number | null = null;
let toastTimer = 0;
let feedback: Feedback[] = [];
let saved: string[] = [];
let seen: string[] = [];
let shared = false;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function toast(message: string) {
	window.clearTimeout(toastTimer);
	$('toast').textContent = message;
	$('toast').hidden = false;
	toastTimer = window.setTimeout(() => { $('toast').hidden = true; }, 4200);
}

try {
	const stored: unknown = JSON.parse(localStorage.getItem(storageKey) || '{}');
	if (isRecord(stored)) {
		if (Array.isArray(stored.books)) for (const raw of stored.books.slice(0, 300)) { const book = parseBook(raw); if (book) bookById.set(book.id, book); }
		if (Array.isArray(stored.saved)) saved = [...new Set(stored.saved.filter((id): id is string => typeof id === 'string' && bookById.has(id)))].slice(0, 100);
		if (Array.isArray(stored.feedback)) feedback = stored.feedback.filter((item): item is Feedback => isRecord(item) && typeof item.id === 'string' && bookById.has(item.id) && ['liked', 'disliked', 'skip'].includes(String(item.reaction))).slice(-100);
		if (Array.isArray(stored.seen)) seen = stored.seen.filter((id): id is string => typeof id === 'string' && bookById.has(id)).slice(-60);
	}
} catch { /* A blocked or damaged store should never prevent discovery. */ }

function persist() {
	$('saved-count').textContent = String(saved.length);
	$('taste-count').textContent = feedback.length ? `(${feedback.length})` : '';
	const retained = [...new Set([...saved, ...seen, ...feedback.map(item => item.id)])].map(id => bookById.get(id)).filter(Boolean);
	try { localStorage.setItem(storageKey, JSON.stringify({ saved, feedback, seen, books: retained })); }
	catch { toast('Browser storage is unavailable. Saved books and preferences will last for this visit only.'); }
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text) node.textContent = text;
	return node;
}

function bookLink(book: BookDetails) {
	const link = element('a', '', 'Find an edition');
	link.href = /^OL\d+W$/.test(book.id) ? `https://openlibrary.org/works/${book.id}` : `https://openlibrary.org/search?q=${encodeURIComponent(`${book.title} ${book.author}`)}`;
	link.target = '_blank';
	link.rel = 'noopener noreferrer';
	link.setAttribute('aria-label', `Find ${book.title} on Open Library`);
	return link;
}

function handleSave(id: string) {
	const wasSaved = saved.includes(id);
	saved = wasSaved ? saved.filter(item => item !== id) : [...saved, id].slice(-100);
	persist();
	for (const button of document.querySelectorAll<HTMLButtonElement>(`[data-save="${id}"]`)) {
		button.textContent = wasSaved ? 'Save' : 'Saved';
		button.setAttribute('aria-pressed', String(!wasSaved));
	}
	toast(wasSaved ? 'Removed from saved books.' : 'Book saved.');
}

function createCard(pick: Pick, slot: number) {
	const book = bookById.get(pick.id)!;
	const card = element('article', 'book-entry');
	card.dataset.slot = String(slot);
	card.setAttribute('aria-label', book.title);
	const number = element('span', 'entry-number', String(slot + 1));
	number.setAttribute('aria-hidden', 'true');
	const body = element('div', 'book-body');
	if (book.coverId) {
		const cover = element('img', 'book-cover');
		cover.alt = '';
		cover.width = 92; cover.height = 138;
		cover.loading = 'lazy'; cover.decoding = 'async'; cover.referrerPolicy = 'no-referrer';
		cover.addEventListener('error', () => cover.remove(), { once: true });
		cover.addEventListener('load', () => { if (cover.naturalWidth < 2) cover.remove(); }, { once: true });
		cover.src = `https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg?default=false`;
		body.append(cover);
	}
	const title = element('h3', '', book.title);
	title.tabIndex = -1;
	body.append(title, element('p', 'book-author', book.author), element('p', 'book-why', pick.why), element('p', 'book-nudge', pick.nudge));
	const actions = element('div', 'book-actions');
	const save = element('button', 'text-button save-book', saved.includes(book.id) ? 'Saved' : 'Save');
	save.dataset.save = book.id;
	save.setAttribute('aria-pressed', String(saved.includes(book.id)));
	save.setAttribute('aria-label', 'Save ' + book.title);
	save.addEventListener('click', () => handleSave(book.id));
	actions.append(bookLink(book), save);
	body.append(actions);
	const reactions = element('div', 'card-reactions');
	reactions.append(element('p'));
	const buttons = element('div', 'reaction-buttons');
	buttons.setAttribute('role', 'group');
	buttons.setAttribute('aria-label', 'Your response to ' + book.title);
	const options: [Reaction, string][] = [['liked', 'Read and liked'], ['disliked', 'Read and disliked'], ['skip', 'Not interested']];
	for (const [reaction, label] of options) {
		const button = element('button', 'text-button', label);
		button.setAttribute('aria-label', label + ': ' + book.title);
		button.addEventListener('click', () => handleReaction(book.id, reaction, slot));
		buttons.append(button);
	}
	reactions.append(buttons);
	card.append(number, body, reactions);
	return card;
}

function renderShelf(focus = false, slot: number | null = null) {
	if (!shelf) return;
	for (const pick of shelf.picks) if (pick.book) bookById.set(pick.id, pick.book);
	$('results').hidden = false;
	$('shelf-title').textContent = ['', 'One suggestion', 'Two suggestions', 'Three suggestions'][shelf.picks.length];
	$('match-note').textContent = shelf.picks.length < 3 ? 'Fewer than three this time. I couldn’t verify enough close matches to fill the list.' : '';
	$('shelf-phrases').textContent = shelf.phrases.join(' / ');
	$('shared-banner').hidden = !shared;
	if (slot !== null && grid.children.length === shelf.picks.length) grid.children[slot].replaceWith(createCard(shelf.picks[slot], slot));
	else grid.replaceChildren(...shelf.picks.map(createCard));
	if (focus) {
		const target = slot === null ? $('shelf-title') : grid.children[slot].querySelector('h3')!;
		(target as HTMLElement).focus({ preventScroll: true });
		if (slot === null) $('results').scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start' });
	}
}

function setBusy(value: boolean, slot: number | null) {
	busy = value;
	for (const control of document.querySelectorAll<HTMLButtonElement | HTMLInputElement>('#mood-form button, #mood-form input, #shuffle, #another-round, #remix, #reset-taste, .reaction-buttons button, #share-shelf')) control.disabled = value;
	$('find-books').textContent = value ? 'Choosing books…' : 'Find books';
	$('request-status').classList.toggle('waiting-announcement', value);
	$('loading').hidden = !value || slot !== null;
	if (value) {
		const note = createWaitingNote(slot !== null);
		if (slot === null) $('loading').replaceChildren(note);
		else grid.children[slot]?.querySelector('.card-reactions')?.append(note);
		note.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'nearest' });
	} else {
		$('loading').replaceChildren();
		grid.querySelector('.waiting-note')?.remove();
	}
	if (slot !== null) grid.children[slot]?.setAttribute('aria-busy', String(value));
	$('results').setAttribute('aria-busy', String(value));
}

async function handleRecommendation(slot: number | null = null) {
	if (busy) return;
	if (slot === null && !form.reportValidity()) return;
	const phrases = slot !== null && shelf ? [...shelf.phrases] : fields.map(input => input.value.trim());
	if (phrases.some(phrase => !phrase)) { toast('Please enter all three words or phrases.'); fields.find(field => !field.value.trim())?.focus(); return; }
	retrySlot = slot;
	$('error-box').hidden = true;
	$('request-status').textContent = slot === null ? 'Choosing books…' : 'Finding a replacement…';
	if (slot !== null) {
		const panel = grid.children[slot]?.querySelector('.card-reactions');
		panel?.querySelector('.retry-pick')?.remove();
		const note = panel?.querySelector('p');
		if (note) note.textContent = 'Preference saved. Finding a replacement…';
	}
	setBusy(true, slot);
	try {
		// Recent discoveries stay out of the next round. After a long session,
		// older unreacted-to books can return; explicit reactions never do.
		const currentIds = shelf?.picks.map(pick => pick.id) || [];
		const exclude = [...new Set([...seen.slice(-60), ...currentIds])];
		const response = await fetch(`${api}/recommend-v2`, {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ phrases, feedback: feedback.map(item => ({ ...item, book: bookById.get(item.id) })), exclude, excludeBooks: exclude.map(id => bookById.get(id)).filter(Boolean), slot }), signal: AbortSignal.timeout(85000),
		});
		const data: unknown = await response.json();
		if (!response.ok) throw new Error(isRecord(data) && typeof data.error === 'string' ? data.error : 'Recommendations are unavailable. Please try again.');
		const result = parseShelf(data, slot === null ? undefined : 1);
		if (!result) throw new Error('The recommendations could not be read. Please try again.');
		for (const pick of result.picks) if (pick.book) bookById.set(pick.id, pick.book);
		if (slot !== null && shelf) {
			shelf = { ...shelf, version: 2, picks: shelf.picks.map((pick, index) => index === slot ? result.picks[0] : { ...pick, book: bookById.get(pick.id)! }) };
		} else shelf = result;
		seen = [...new Set([...seen, ...result.picks.map(pick => pick.id)])].slice(-60);
		shared = false;
		history.replaceState(null, '', `${location.pathname}${location.search}`);
		persist();
		renderShelf(true, slot);
		$('request-status').textContent = slot === null ? 'Recommendations ready.' : 'Recommendation replaced.';
	} catch (error) {
		$('error-message').textContent = error instanceof Error && !['TypeError', 'TimeoutError', 'AbortError'].includes(error.name) ? error.message : 'Could not connect. Please try again. Your current list is unchanged.';
		$('error-box').hidden = false;
		$('request-status').textContent = slot === null ? '' : 'Your reaction is saved. Retry to replace this book.';
		if (slot !== null) {
			const panel = grid.children[slot]?.querySelector('.card-reactions');
			const note = panel?.querySelector('p');
			if (note) note.textContent = 'Preference saved. A replacement could not be loaded.';
			const retry = element('button', 'text-button retry-pick', 'Try again');
			retry.addEventListener('click', () => { void handleRecommendation(slot); });
			panel?.append(retry);
			toast('Preference saved. Please retry the replacement.');
		}
	} finally {
		setBusy(false, slot);
	}
}

function handleReaction(id: string, reaction: Reaction, slot: number) {
	if (busy) return;
	feedback = [...feedback.filter(item => item.id !== id), { id, reaction }].slice(-100);
	persist();
	void handleRecommendation(slot);
}

const ingredients = [
	['a remote island', 'Paris in winter', 'a small town', 'the sea', 'a long train journey', 'an old house', 'a changing city', 'a family dinner'],
	['an unreliable narrator', 'an old friendship', 'a scientific obsession', 'dry humour', 'family secrets', 'an impossible decision', 'solitude', 'starting over'],
	['something short', 'no easy answers', 'nonfiction', 'spare prose', 'a slow pace', 'a good mystery', 'letters and diaries', 'something hopeful'],
];
function setMood(phrases: string[]) {
	fields.forEach((field, index) => { field.value = phrases[index]; });
	$('request-status').textContent = 'Change any of these, or find books as they are.';
}
$('shuffle').addEventListener('click', () => setMood(ingredients.map(pool => pool[crypto.getRandomValues(new Uint32Array(1))[0] % pool.length])));
form.addEventListener('submit', event => { event.preventDefault(); void handleRecommendation(); });
$('another-round').addEventListener('click', () => { if (shelf) fields.forEach((field, i) => { field.value = shelf!.phrases[i]; }); void handleRecommendation(); });
$('retry').addEventListener('click', () => { void handleRecommendation(retrySlot); });
$('remix').addEventListener('click', () => { if (shelf) setMood(shelf.phrases); void handleRecommendation(); });
$('reset-taste').addEventListener('click', () => { feedback = []; seen = []; persist(); toast('Preferences cleared. Saved books kept.'); });

for (const close of document.querySelectorAll<HTMLButtonElement>('.close-dialog')) close.addEventListener('click', () => close.closest('dialog')?.close());
for (const dialog of document.querySelectorAll<HTMLDialogElement>('dialog')) dialog.addEventListener('click', event => { if (event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); } });
$('about').addEventListener('click', () => $<HTMLDialogElement>('about-dialog').showModal());

function renderSaved() {
	const list = $('saved-list');
	list.replaceChildren();
	if (!saved.length) { list.append(element('p', 'empty-shelf', 'No saved books yet.')); return; }
	for (const id of [...saved].reverse()) {
		const book = bookById.get(id)!;
		const row = element('div', 'saved-item');
		const details = element('div');
		details.append(element('h3', '', book.title), element('p', '', book.author), bookLink(book));
		const remove = element('button', 'text-button', 'Remove');
		remove.setAttribute('aria-label', `Remove ${book.title} from saved books`);
		remove.addEventListener('click', () => { handleSave(id); renderSaved(); $<HTMLDialogElement>('saved-dialog').focus(); });
		row.append(details, remove); list.append(row);
	}
}
$('open-saved').addEventListener('click', () => { renderSaved(); $<HTMLDialogElement>('saved-dialog').showModal(); });

function shareUrl() { return `${location.origin}${location.pathname}#shelf=${encodeShelf(shelf!)}`; }
$('share-shelf').addEventListener('click', () => {
	if (!shelf) return;
	$('share-phrases').textContent = shelf.phrases.join(' / ');
	$('share-titles').replaceChildren(...shelf.picks.map(pick => {
		const book = bookById.get(pick.id)!;
		const entry = element('p', '', book.title);
		entry.append(element('span', '', book.author));
		return entry;
	}));
	$('manual-link-label').hidden = true;
	$('copy-link').textContent = 'Copy link';
	$('native-share').hidden = typeof navigator.share !== 'function';
	$<HTMLDialogElement>('share-dialog').showModal();
});
$('copy-link').addEventListener('click', async () => {
	try { await navigator.clipboard.writeText(shareUrl()); $('copy-link').textContent = 'Link copied'; }
	catch { $('manual-link-label').hidden = false; const input = $<HTMLInputElement>('manual-link'); input.value = shareUrl(); input.focus(); input.select(); }
});
$('native-share').addEventListener('click', async () => {
	try { await navigator.share({ title: 'Next Read', text: `Book recommendations for ${shelf!.phrases.join(', ')}`, url: shareUrl() }); }
	catch (error) { if (!(error instanceof Error && error.name === 'AbortError')) $('copy-link').click(); }
});

function downloadReadingList() {
	if (!shelf) return;
	const canvas = document.createElement('canvas');
	canvas.width = 1200;
	const ctx = canvas.getContext('2d');
	if (!ctx) { $('download-card').textContent = 'Image unavailable; use the link'; return; }
	const linesFor = (text: string, width: number) => {
		const lines: string[] = [];
		let line = '';
		for (const word of text.split(/\s+/)) {
			if (ctx.measureText(word).width > width) {
				if (line) { lines.push(line); line = ''; }
				for (const character of word) {
					if (ctx.measureText(line + character).width > width) { lines.push(line); line = ''; }
					line += character;
				}
			} else if (ctx.measureText(line ? line + ' ' + word : word).width > width) {
				lines.push(line); line = word;
			} else line = line ? line + ' ' + word : word;
		}
		if (line) lines.push(line);
		return lines;
	};
	ctx.font = 'italic 27px Georgia';
	const phrases = linesFor(shelf.phrases.join(' / '), 1000);
	const entries = shelf.picks.map(pick => {
		const book = bookById.get(pick.id)!;
		ctx.font = '42px Georgia'; const title = linesFor(book.title, 1000);
		ctx.font = '25px Georgia'; const author = linesFor(book.author, 1000);
		ctx.font = '27px Georgia'; const why = linesFor(pick.why, 1000);
		return { title, author, why, height: title.length * 50 + author.length * 32 + why.length * 40 + 105 };
	});
	canvas.height = 295 + phrases.length * 38 + entries.reduce((sum, entry) => sum + entry.height, 0) + 100;
	ctx.fillStyle = '#f7f5f0'; ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = '#302d28'; ctx.font = '48px Georgia'; ctx.fillText('Next Read', 90, 110);
	ctx.strokeStyle = '#302d28'; ctx.beginPath(); ctx.moveTo(90, 151); ctx.lineTo(1110, 151); ctx.stroke();
	let y = 213;
	ctx.font = 'italic 27px Georgia'; ctx.fillStyle = '#746f65';
	for (const line of phrases) { ctx.fillText(line, 90, y); y += 38; }
	y += 67;
	for (const entry of entries) {
		ctx.fillStyle = '#302d28'; ctx.font = '42px Georgia';
		for (const line of entry.title) { ctx.fillText(line, 90, y); y += 50; }
		ctx.fillStyle = '#746f65'; ctx.font = '25px Georgia';
		for (const line of entry.author) { ctx.fillText(line, 90, y); y += 32; }
		y += 20;
		ctx.fillStyle = '#302d28'; ctx.font = '27px Georgia';
		for (const line of entry.why) { ctx.fillText(line, 90, y); y += 40; }
		y += 22;
		ctx.strokeStyle = '#d8d3c8'; ctx.beginPath(); ctx.moveTo(90, y); ctx.lineTo(1110, y); ctx.stroke();
		y += 63;
	}
	ctx.fillStyle = '#746f65'; ctx.font = '20px Arial'; ctx.fillText('noaheisen.com/projects/next-read', 90, y);
	canvas.toBlob(blob => {
		if (!blob) return;
		const url = URL.createObjectURL(blob);
		const link = element('a'); link.href = url; link.download = 'next-read-list.png'; document.body.append(link); link.click(); link.remove();
		window.setTimeout(() => URL.revokeObjectURL(url), 30000);
		$('download-card').textContent = 'Reading list saved';
	});
}
$('download-card').addEventListener('click', downloadReadingList);

function loadSharedShelf() {
	if (!location.hash.startsWith('#shelf=')) return;
	const parsed = decodeShelf(location.hash.slice(7));
	if (!parsed) { toast('This shared list is incomplete. You can still find books using the form.'); return; }
	shelf = parsed; shared = true;
	fields.forEach((field, index) => { field.value = parsed.phrases[index]; });
	renderShelf();
	$('request-status').textContent = 'Shared recommendations are below.';
}
window.addEventListener('hashchange', loadSharedShelf);
$('saved-count').textContent = String(saved.length);
$('taste-count').textContent = feedback.length ? `(${feedback.length})` : '';
loadSharedShelf();
