import { createGame, isPack, normalizeSeed, parseSave, remaining, restoreGame, toggleCard, type Pack } from './engine';

const el = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const seedInput = el<HTMLInputElement>('seed');
const packInput = el<HTMLSelectElement>('word-pack');
const storageKey = 'codewords.game.v2';
const labels = { red: 'Red', blue: 'Blue', neutral: 'Bystander', assassin: 'Assassin' };
let spy = false;
let deadline: number | null = null;
let saved: ReturnType<typeof parseSave> = null;
try { saved = parseSave(localStorage.getItem(storageKey)) ?? parseSave(localStorage.getItem('codewords.game.v1')); } catch {}
const params = new URLSearchParams(location.search);
const requestedSeed = normalizeSeed(params.get('board') || '');
const requestedPack = params.get('pack') || 'classic';
const pack = isPack(requestedPack) ? requestedPack : 'classic';
let game = saved && (!requestedSeed || saved.seed === requestedSeed && saved.pack === pack)
	? restoreGame(saved) : createGame(requestedSeed || randomSeed(), pack);

function randomSeed() {
	return String(crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000).padStart(6, '0');
}

function announce(message: string) { el('announcement').textContent = message; }

function save() {
	try {
		localStorage.setItem(storageKey, JSON.stringify({ version: 2, seed: game.seed, pack: game.pack,
			selected: game.cards.flatMap((card, index) => card.selected ? [index] : []),
		}));
	} catch { announce('This browser could not save your selections.'); }
}

const cards = game.cards.map((_, index) => {
	const card = document.createElement('button');
	card.className = 'card';
	card.type = 'button';
	card.innerHTML = '<span class="card-word"></span><span class="card-check" aria-hidden="true">✓</span>';
	card.addEventListener('click', () => {
		game = toggleCard(game, index);
		render();
		save();
		const selected = game.cards[index];
		announce(`${selected.word}: ${selected.selected ? `${labels[selected.identity]}, marked` : 'unmarked'}.`);
	});
	card.addEventListener('keydown', event => {
		if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault();
	});
	el('board').append(card);
	return card;
});

function render() {
	for (const team of ['red', 'blue'] as const) {
		const count = remaining(game, team);
		el(`${team}-score`).textContent = String(count);
		el(`${team}-score`).parentElement!.setAttribute('aria-label', `${labels[team]}: ${count} remaining`);
	}
	el('spymaster').setAttribute('aria-pressed', String(spy));
	el('spymaster').textContent = spy ? 'Hide key' : 'Spymaster';
	el('board').classList.toggle('spy', spy);
	cards.forEach((card, index) => {
		const data = game.cards[index];
		const visible = spy || data.selected;
		card.className = ['card', visible ? data.identity : '', data.selected ? 'selected' : '', spy && !data.selected ? 'key' : '', data.word.length > 8 ? 'long' : ''].filter(Boolean).join(' ');
		card.setAttribute('aria-pressed', String(data.selected));
		card.setAttribute('aria-label', `${data.word}${visible ? `, ${labels[data.identity]}` : ''}, ${data.selected ? 'marked' : 'unmarked'}`);
		card.querySelector('.card-word')!.textContent = data.word;
	});
}

function syncFields() {
	seedInput.value = game.seed;
	packInput.value = game.pack;
	const url = new URL(location.href);
	url.search = new URLSearchParams({ board: game.seed, pack: game.pack, v: '1' }).toString();
	history.replaceState(null, '', url);
	updateHint();
}

function updateHint() {
	const pending = normalizeSeed(seedInput.value) !== game.seed || packInput.value !== game.pack;
	el('board-hint').textContent = pending ? 'Press Load to apply the seed and word set.' : 'Same seed + word set = same board.';
}

function loadBoard(seed: string, pack: Pack) {
	if (game.seed !== seed || game.pack !== pack) {
		game = createGame(seed, pack);
		deadline = null;
		renderTimer();
	}
	syncFields();
	render();
	save();
}

el('board-form').addEventListener('submit', event => {
	event.preventDefault();
	const seed = normalizeSeed(seedInput.value);
	if (seed && isPack(packInput.value)) loadBoard(seed, packInput.value);
});
seedInput.addEventListener('input', updateHint);
packInput.addEventListener('change', updateHint);
el('new-game').addEventListener('click', () => loadBoard(randomSeed(), game.pack));
el('spymaster').addEventListener('click', () => { spy = !spy; render(); });
// Keep a returning tab from exposing the key; local marks are preserved.
document.addEventListener('visibilitychange', () => { if (document.hidden && spy) { spy = false; render(); } });
window.addEventListener('pagehide', () => { spy = false; });
window.addEventListener('pageshow', () => render());
document.addEventListener('keydown', event => { if (event.key === 'Escape' && spy) { spy = false; render(); } });

function renderTimer() {
	const seconds = deadline === null ? 30 : Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
	el('timer-label').textContent = `0:${String(seconds).padStart(2, '0')}`;
	el('timer').classList.toggle('running', deadline !== null);
	el('timer').classList.toggle('expired', seconds === 0);
	el('timer').setAttribute('aria-label', deadline === null ? 'Start 30-second timer' : 'Cancel timer');
	if (deadline !== null && seconds === 0) {
		deadline = null;
		el('timer').classList.remove('running');
		el('timer').classList.add('expired');
		el('timer').setAttribute('aria-label', 'Restart 30-second timer');
		announce('Time’s up.');
	}
}
el('timer').addEventListener('click', () => {
	deadline = deadline === null ? Date.now() + 30_000 : null;
	el('timer').classList.remove('expired');
	renderTimer();
});
setInterval(() => { if (deadline !== null) renderTimer(); }, 250);

syncFields();
render();
save();
