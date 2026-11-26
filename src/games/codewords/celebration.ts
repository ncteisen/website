import type { Team } from './engine';

const layer = document.getElementById('celebration')!;
let timeout: number | undefined;
let cardEffects: HTMLElement[] = [];
let shake: Animation | undefined;

export function clearCelebration() {
	window.clearTimeout(timeout);
	layer.replaceChildren();
	shake?.cancel();
	for (const effect of cardEffects) effect.remove();
	cardEffects = [];
}

function confetti() {
	for (let i = 0; i < 72; i++) {
		const piece = document.createElement('i');
		piece.className = 'win-confetti';
		piece.style.left = `${(i + Math.random()) / 72 * 100}%`;
		piece.style.setProperty('--drift', `${Math.random() * 100 - 50}px`);
		piece.style.setProperty('--spin', `${Math.random() * 540 - 270}deg`);
		piece.style.animationDuration = `${1.7 + Math.random() * 0.7}s`;
		piece.style.animationDelay = `${Math.random() * 0.65}s`;
		layer.append(piece);
	}
}

function ripple(cards: HTMLButtonElement[], origin: number, team: Team) {
	const start = cards[origin].getBoundingClientRect();
	for (const card of cards) {
		const bounds = card.getBoundingClientRect();
		const distance = Math.hypot((bounds.x - start.x) / start.width, (bounds.y - start.y) / start.height);
		const ring = document.createElement('span');
		ring.className = `win-ring win-${team}`;
		ring.setAttribute('aria-hidden', 'true');
		ring.style.animationDelay = `${distance * 0.17}s`;
		card.append(ring);
		cardEffects.push(ring);
	}
}

function inkCoat() {
	const coat = document.createElement('span');
	coat.className = 'ink-coat';
	coat.setAttribute('aria-hidden', 'true');
	const drips = document.createElement('canvas');
	drips.width = 360;
	drips.height = 180;
	const ctx = drips.getContext('2d');
	if (ctx) {
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(0, 13);
		const runs = 4 + Math.floor(Math.random() * 4);
		const step = drips.width / runs;
		for (let i = 0; i < runs; i++) {
			const x = step * (i + 0.22 + Math.random() * 0.56);
			const tip = 28 + Math.random() ** 2 * 143;
			const width = 3 + Math.random() * 6;
			ctx.bezierCurveTo(x - width, 12, x - width, 18, x - width, tip - width);
			ctx.bezierCurveTo(x - width * 1.5, tip + width, x + width * 1.5, tip + width, x + width, tip - width);
			ctx.bezierCurveTo(x + width * 0.55, 28, x + width, 13, step * (i + 1), 13);
		}
		ctx.lineTo(drips.width, 0);
		ctx.closePath();
		const ink = ctx.createLinearGradient(0, 0, 0, drips.height);
		ink.addColorStop(0, '#08090b');
		ink.addColorStop(1, '#17181b');
		ctx.fillStyle = ink;
		ctx.fill();
	}
	drips.style.animationDelay = `${0.12 + Math.random() * 0.28}s`;
	coat.append(drips);
	return coat;
}

function inkBlast(cards: HTMLButtonElement[], origin: number) {
	const board = layer.getBoundingClientRect();
	const source = cards[origin].getBoundingClientRect();
	const x = source.left + source.width / 2 - board.left;
	const y = source.top + source.height / 2 - board.top;
	const radius = Math.hypot(Math.max(x, board.width - x), Math.max(y, board.height - y));
	const blast = document.createElement('div');
	blast.className = 'ink-blast';
	blast.style.left = `${x}px`;
	blast.style.top = `${y}px`;
	blast.style.setProperty('--blast-size', `${radius * 2}px`);
	for (let i = 0; i < 28; i++) {
		const fleck = document.createElement('i');
		fleck.style.setProperty('--angle', `${(i + Math.random()) / 28}turn`);
		fleck.style.setProperty('--travel', `${(0.12 + Math.random() * 0.48) * radius}px`);
		fleck.style.width = `${12 + Math.random() * 26}px`;
		blast.append(fleck);
	}
	layer.append(blast);
	for (const card of cards) {
		const coat = inkCoat();
		card.prepend(coat);
		cardEffects.push(coat);
	}
	shake = layer.parentElement!.animate([
		'none', 'translate(-6px, 3px) rotate(-0.4deg)', 'translate(6px, -4px) rotate(0.35deg)',
		'translate(-4px, -2px)', 'translate(3px, 2px)', 'translate(-2px, 1px)', 'none',
	].map(transform => ({ transform })), { duration: 420, easing: 'ease-out' });
}

export function showCardEffect(identity: Team | 'assassin', cards: HTMLButtonElement[], origin: number, message: string) {
	clearCelebration();
	layer.className = `win-${identity}`;
	if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		if (identity === 'assassin') inkBlast(cards, origin);
		else if (Math.random() < 0.5) confetti();
		else ripple(cards, origin, identity);
	}
	const badge = document.createElement('strong');
	badge.className = 'win-badge';
	badge.textContent = message;
	layer.append(badge);
	timeout = window.setTimeout(clearCelebration, 3200);
}
