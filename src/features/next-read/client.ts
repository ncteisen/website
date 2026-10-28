import { bookById, type Book } from './catalog';
import { decodeShelf, encodeShelf, isRecord, parseShelf, roles, type Feedback, type Pick, type Reaction, type Shelf } from './contract';

const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const form = $<HTMLFormElement>('mood-form');
const fields = [1, 2, 3].map(n => $<HTMLInputElement>(`phrase-${n}`));
const grid = $('book-grid');
const api = document.body.dataset.api || '';
const storageKey = 'next-read:v1';
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
		if (Array.isArray(stored.saved)) saved = [...new Set(stored.saved.filter((id): id is string => typeof id === 'string' && bookById.has(id)))].slice(0, 100);
		if (Array.isArray(stored.feedback)) feedback = stored.feedback.filter((item): item is Feedback => isRecord(item) && typeof item.id === 'string' && bookById.has(item.id) && ['liked', 'disliked', 'skip'].includes(String(item.reaction))).slice(-100);
		if (Array.isArray(stored.seen)) seen = stored.seen.filter((id): id is string => typeof id === 'string' && bookById.has(id)).slice(-60);
	}
} catch { /* A blocked or damaged store should never prevent discovery. */ }

function persist() {
	$('saved-count').textContent = String(saved.length);
	$('taste-count').textContent = feedback.length ? `(${feedback.length})` : '';
	try { localStorage.setItem(storageKey, JSON.stringify({ saved, feedback, seen })); }
	catch { toast('Browser storage is unavailable. Your shelf will last for this visit.'); }
}

function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = ''): HTMLElementTagNameMap[K] {
	const node = document.createElement(tag);
	if (className) node.className = className;
	if (text) node.textContent = text;
	return node;
}

function bookLink(book: Book) {
	const link = element('a', '', 'Find this book ↗');
	link.href = `https://openlibrary.org/search?q=${encodeURIComponent(`${book.title} ${book.author}`)}`;
	link.target = '_blank';
	link.rel = 'noopener noreferrer';
	link.setAttribute('aria-label', `Find ${book.title} on Open Library`);
	return link;
}

function handleSave(id: string) {
	const wasSaved = saved.includes(id);
	saved = wasSaved ? saved.filter(item => item !== id) : [...saved, id];
	persist();
	for (const button of document.querySelectorAll<HTMLButtonElement>(`[data-save="${id}"]`)) {
		button.textContent = wasSaved ? '+ Save' : '✓ Saved';
		button.setAttribute('aria-pressed', String(!wasSaved));
	}
	toast(wasSaved ? 'Taken off your little shelf.' : 'A possibility, tucked away for later.');
}

function createCard(pick: Pick, slot: number) {
	const book = bookById.get(pick.id)!;
	const card = element('article', 'book-card');
	card.dataset.slot = String(slot);
	card.setAttribute('aria-label', `${roles[slot]}: ${book.title}`);
	const stage = element('div', 'card-stage');
	stage.setAttribute('aria-hidden', 'true');
	stage.append(element('span', 'card-number', `0${slot + 1} /`));
	const jacket = element('div', 'book-jacket');
	jacket.style.setProperty('--book-color', book.color);
	jacket.append(element('span', 'jacket-mark', ['✳', '✧', '☼'][slot]), element('span', 'jacket-title', book.title), element('span', 'jacket-author', book.author));
	stage.append(jacket);
	const body = element('div', 'card-body');
	const title = element('h3', '', book.title);
	title.tabIndex = -1;
	body.append(element('p', 'role-label', roles[slot]), title, element('p', 'book-author', book.author), element('p', 'book-kind', book.kind), element('p', 'book-why', pick.why), element('p', 'book-nudge', pick.nudge));
	const actions = element('div', 'book-actions');
	const save = element('button', 'save-book', saved.includes(book.id) ? '✓ Saved' : '+ Save');
	save.dataset.save = book.id;
	save.setAttribute('aria-pressed', String(saved.includes(book.id)));
	save.setAttribute('aria-label', `Save ${book.title}`);
	save.addEventListener('click', () => handleSave(book.id));
	actions.append(bookLink(book), save);
	body.append(actions);
	const reactions = element('div', 'card-reactions');
	reactions.append(element('p', '', 'BEEN THERE? LET’S TURN THE PAGE.'));
	const buttons = element('div', 'reaction-buttons');
	const options: [Reaction, string][] = [['liked', 'Read it · loved it'], ['disliked', 'Read it · not for me'], ['skip', 'Not interested']];
	for (const [reaction, label] of options) {
		const button = element('button', '', label);
		button.setAttribute('aria-label', `${label}: ${book.title}`);
		button.addEventListener('click', () => handleReaction(book.id, reaction, slot));
		buttons.append(button);
	}
	reactions.append(buttons);
	card.append(stage, body, reactions);
	return card;
}

function renderShelf(focus = false, slot: number | null = null) {
	if (!shelf) return;
	$('results').hidden = false;
	$('how-it-feels').hidden = true;
	$('shelf-title').textContent = shelf.title;
	$('shelf-phrases').textContent = shelf.phrases.join(' + ');
	$('shared-banner').hidden = !shared;
	if (slot !== null && grid.children.length === 3) grid.children[slot].replaceWith(createCard(shelf.picks[slot], slot));
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
	$('find-books').textContent = value ? 'Following the thread…' : 'Find my next read ↗';
	$('loading').hidden = !value || slot !== null;
	if (slot !== null) grid.children[slot]?.setAttribute('aria-busy', String(value));
	$('results').setAttribute('aria-busy', String(value));
}

async function handleRecommendation(slot: number | null = null) {
	if (busy) return;
	if (slot === null && !form.reportValidity()) return;
	const phrases = slot !== null && shelf ? [...shelf.phrases] : fields.map(input => input.value.trim());
	if (phrases.some(phrase => !phrase)) { toast('Three little ingredients, please.'); fields.find(field => !field.value.trim())?.focus(); return; }
	retrySlot = slot;
	$('error-box').hidden = true;
	$('request-status').textContent = slot === null ? '' : 'Taste note tucked away. Finding you a different book…';
	if (slot !== null) {
		const panel = grid.children[slot]?.querySelector('.card-reactions');
		panel?.querySelector('.retry-pick')?.remove();
		const note = panel?.querySelector('p');
		if (note) note.textContent = 'TASTE NOTE SAVED. FINDING ANOTHER POSSIBILITY…';
	}
	setBusy(true, slot);
	const lines = ['Wandering through the shelves…', 'Following a promising little thread…', 'Leaving room for a happy accident…'];
	let line = 0;
	$('loading-line').textContent = lines[0];
	const timer = window.setInterval(() => { $('loading-line').textContent = lines[++line % lines.length]; }, 3500);
	try {
		// Recent discoveries stay out of the next round. After a long session,
		// older unreacted-to books can return; explicit reactions never do.
		const currentIds = shelf?.picks.map(pick => pick.id) || [];
		const exclude = [...new Set([...seen.slice(-60), ...currentIds])];
		const response = await fetch(`${api}/recommend`, {
			method: 'POST', headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ phrases, feedback, exclude, slot }), signal: AbortSignal.timeout(40000),
		});
		const data: unknown = await response.json();
		if (!response.ok) throw new Error(isRecord(data) && typeof data.error === 'string' ? data.error : 'Something got lost between the shelves. Please try again.');
		const result = parseShelf(data, slot === null ? 3 : 1);
		if (!result) throw new Error('Those recommendations arrived a little scrambled. Try once more.');
		if (slot !== null && shelf) {
			shelf = { ...shelf, picks: shelf.picks.map((pick, index) => index === slot ? result.picks[0] : pick) };
		} else shelf = result;
		seen = [...new Set([...seen, ...result.picks.map(pick => pick.id)])].slice(-60);
		shared = false;
		history.replaceState(null, '', `${location.pathname}${location.search}`);
		persist();
		renderShelf(true, slot);
		$('request-status').textContent = slot === null ? 'Your little shelf is ready.' : 'A fresh possibility, with your taste note in mind.';
	} catch (error) {
		$('error-message').textContent = error instanceof Error && !['TypeError', 'TimeoutError', 'AbortError'].includes(error.name) ? error.message : 'The bookshop is taking a moment. Check your connection and try again; your shelf is safe.';
		$('error-box').hidden = false;
		$('request-status').textContent = slot === null ? '' : 'Your reaction is saved. Retry to replace this book.';
		if (slot !== null) {
			const panel = grid.children[slot]?.querySelector('.card-reactions');
			const note = panel?.querySelector('p');
			if (note) note.textContent = 'TASTE NOTE SAVED. A FRESH PICK COULDN’T LOAD.';
			const retry = element('button', 'text-button retry-pick', 'Retry this pick ↗');
			retry.addEventListener('click', () => { void handleRecommendation(slot); });
			panel?.append(retry);
			toast('Your reaction is saved. A new pick couldn’t load—try again.');
		}
	} finally {
		window.clearInterval(timer);
		setBusy(false, slot);
	}
}

function handleReaction(id: string, reaction: Reaction, slot: number) {
	if (busy) return;
	feedback = [...feedback.filter(item => item.id !== id), { id, reaction }].slice(-100);
	persist();
	void handleRecommendation(slot);
}

const moods = [
	['rainy Sundays', 'a little strange', 'found family'],
	['beautifully unhinged', 'bad decisions', 'make me laugh'],
	['somewhere far away', 'a real adventure', 'nonfiction'],
	['quiet longing', 'a city at night', 'beautiful sentences'],
	['an impossible place', 'secrets', 'under 300 pages'],
	['small wonders', 'the natural world', 'a change of perspective'],
];
const ingredients = [
	['rain on the windows', 'a train going nowhere', 'a midnight kitchen', 'an unfamiliar city', 'a very long winter', 'an overgrown garden', 'the edge of the world', 'a pocket universe'],
	['tender weirdness', 'delightfully petty', 'a very good secret', 'quiet rebellion', 'people being kind', 'laughing through it', 'a little melancholy', 'big questions'],
	['make me wonder', 'a soft landing', 'unlikely friends', 'one more chapter', 'beautiful sentences', 'true stories', 'a short escape', 'a second chance'],
];
function setMood(phrases: string[]) {
	fields.forEach((field, index) => { field.value = phrases[index]; });
	$('request-status').textContent = 'A mood, freshly dealt. Tweak anything, then find your next read.';
}
$('shuffle').addEventListener('click', () => setMood(ingredients.map(pool => pool[crypto.getRandomValues(new Uint32Array(1))[0] % pool.length])));
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-mood]')) button.addEventListener('click', () => setMood(moods[Number(button.dataset.mood)]));
form.addEventListener('submit', event => { event.preventDefault(); void handleRecommendation(); });
$('another-round').addEventListener('click', () => { if (shelf) fields.forEach((field, i) => { field.value = shelf!.phrases[i]; }); void handleRecommendation(); });
$('retry').addEventListener('click', () => { void handleRecommendation(retrySlot); });
$('remix').addEventListener('click', () => { if (shelf) setMood(shelf.phrases); void handleRecommendation(); });
$('reset-taste').addEventListener('click', () => { feedback = []; seen = []; persist(); toast('A fresh start. Your saved books are staying put.'); });

for (const close of document.querySelectorAll<HTMLButtonElement>('.close-dialog')) close.addEventListener('click', () => close.closest('dialog')?.close());
for (const dialog of document.querySelectorAll<HTMLDialogElement>('dialog')) dialog.addEventListener('click', event => { if (event.target === dialog) { const bounds = dialog.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close(); } });
$('about').addEventListener('click', () => $<HTMLDialogElement>('about-dialog').showModal());

function renderSaved() {
	const list = $('saved-list');
	list.replaceChildren();
	if (!saved.length) { list.append(element('p', 'empty-shelf', 'Nothing here yet. Save a book that catches your eye; we’ll hold your place.')); return; }
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
	$('share-mood-title').textContent = shelf.title;
	$('share-phrases').textContent = shelf.phrases.join(' + ');
	$('share-titles').replaceChildren(...shelf.picks.map((pick, i) => element('p', '', `${i + 1}. ${bookById.get(pick.id)!.title}`)));
	$('manual-link-label').hidden = true;
	$('copy-link').textContent = 'Copy shelf link ↗';
	$('native-share').hidden = typeof navigator.share !== 'function';
	$<HTMLDialogElement>('share-dialog').showModal();
});
$('copy-link').addEventListener('click', async () => {
	try { await navigator.clipboard.writeText(shareUrl()); $('copy-link').textContent = 'Copied. Pass it on! ✓'; }
	catch { $('manual-link-label').hidden = false; const input = $<HTMLInputElement>('manual-link'); input.value = shareUrl(); input.focus(); input.select(); }
});
$('native-share').addEventListener('click', async () => {
	try { await navigator.share({ title: `Next Read: ${shelf!.title}`, text: `My reading mood: ${shelf!.phrases.join(' + ')}. What’s yours?`, url: shareUrl() }); }
	catch (error) { if (!(error instanceof Error && error.name === 'AbortError')) $('copy-link').click(); }
});

function downloadPostcard() {
	if (!shelf) return;
	const canvas = document.createElement('canvas');
	canvas.width = 1200; canvas.height = 1500;
	const ctx = canvas.getContext('2d');
	if (!ctx) { $('download-card').textContent = 'Image unavailable — copy the link instead'; return; }
	const wrap = (text: string, x: number, y: number, width: number, lineHeight: number) => {
		let line = '';
		for (const word of text.split(/\s+/)) {
			// Split unusually long user-supplied words too.
			const pieces = ctx.measureText(word).width > width ? Array.from(word) : [word];
			for (const piece of pieces) {
				const space = pieces.length === 1 && line ? ' ' : '';
				if (ctx.measureText(line + space + piece).width > width && line) { ctx.fillText(line, x, y); y += lineHeight; line = piece; }
				else line += space + piece;
			}
		}
		if (line) ctx.fillText(line, x, y);
		return y + lineHeight;
	};
	ctx.fillStyle = '#f6f2e9'; ctx.fillRect(0, 0, 1200, 1500);
	ctx.fillStyle = '#243e35'; ctx.font = '28px "DM Sans", sans-serif'; ctx.fillText('NEXT READ / A LITTLE SHELF', 80, 100);
	ctx.font = '64px "DM Serif Display", Georgia, serif';
	const titleEnd = wrap(shelf.title, 80, 210, 1030, 73);
	ctx.font = '25px "DM Sans", sans-serif'; ctx.fillStyle = '#5d6d55';
	wrap(shelf.phrases.join('  +  '), 80, Math.max(315, titleEnd + 20), 1020, 36);
	const yStart = 540;
	shelf.picks.forEach((pick, index) => {
		const book = bookById.get(pick.id)!;
		const y = yStart + index * 260;
		ctx.fillStyle = ['#e6ebdb', '#f0e2e6', '#ede6d6'][index]; ctx.fillRect(60, y, 1080, 238);
		ctx.fillStyle = book.color; ctx.fillRect(86, y + 27, 125, 180);
		ctx.fillStyle = '#fff9e9'; ctx.font = '55px Georgia, serif'; ctx.fillText(['✳', '✧', '☼'][index], 121, y + 138);
		ctx.fillStyle = '#52634b'; ctx.font = '18px "DM Sans", sans-serif'; ctx.fillText(roles[index].toUpperCase(), 246, y + 49);
		ctx.fillStyle = '#243e35'; ctx.font = '38px "DM Serif Display", Georgia, serif';
		const end = wrap(book.title, 246, y + 103, 850, 43);
		ctx.font = '22px "DM Sans", sans-serif'; wrap(book.author, 246, end + 6, 830, 28);
	});
	ctx.fillStyle = '#243e35'; ctx.font = '25px "DM Serif Display", Georgia, serif'; ctx.fillText('Three little phrases. A whole other world.', 80, 1400);
	ctx.font = '20px "DM Sans", sans-serif'; ctx.fillText('noaheisen.com/projects/next-read', 80, 1440);
	canvas.toBlob(blob => {
		if (!blob) return;
		const url = URL.createObjectURL(blob);
		const link = element('a'); link.href = url; link.download = 'my-next-read.png'; document.body.append(link); link.click(); link.remove();
		window.setTimeout(() => URL.revokeObjectURL(url), 30000);
		$('download-card').textContent = 'Postcard saved ✓';
	});
}
$('download-card').addEventListener('click', downloadPostcard);

function loadSharedShelf() {
	if (!location.hash.startsWith('#shelf=')) return;
	const parsed = decodeShelf(location.hash.slice(7));
	if (!parsed) { toast('This shelf link is incomplete. Make a fresh mood below.'); return; }
	shelf = parsed; shared = true;
	fields.forEach((field, index) => { field.value = parsed.phrases[index]; });
	renderShelf();
	$('request-status').textContent = 'A friend’s mood, ready to explore. Scroll down to their picks.';
}
window.addEventListener('hashchange', loadSharedShelf);
$('saved-count').textContent = String(saved.length);
$('taste-count').textContent = feedback.length ? `(${feedback.length})` : '';
loadSharedShelf();
