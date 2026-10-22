import { games } from './catalog';
import { getPlayer, loadLeaderboard } from './scores';
import { renderRankings } from './rankings';

export function initCabinets(): void {
	const toggle = document.querySelector<HTMLButtonElement>('[data-flip-scores]');
	const cabinets = document.querySelector<HTMLElement>('[data-cabinets]');
	if (!toggle || !cabinets) return;
	let showingScores = false;
	let revision = 0;
	toggle.addEventListener('click', () => {
		showingScores = !showingScores;
		const current = ++revision;
		cabinets.dataset.scores = String(showingScores);
		toggle.setAttribute('aria-pressed', String(showingScores));
		toggle.querySelector('[data-flip-label]')!.textContent = showingScores ? 'Back to games' : 'High scores';
		for (const game of games) {
			const card = cabinets.querySelector<HTMLElement>(`[data-cabinet="${game.id}"]`)!;
			const front = card.querySelector<HTMLElement>('.card-front')!;
			const back = card.querySelector<HTMLElement>('[data-card-back]')!;
			front.inert = showingScores; front.setAttribute('aria-hidden', String(showingScores));
			back.inert = !showingScores; back.setAttribute('aria-hidden', String(!showingScores));
			if (!showingScores) continue;
			const status = card.querySelector<HTMLElement>('[data-card-status]')!;
			const list = card.querySelector<HTMLOListElement>('[data-card-scores]')!;
			status.textContent = 'Loading scores…'; list.replaceChildren();
			void loadLeaderboard(game.id, 'all').then(data => {
				if (current !== revision) return;
				// Home cards show the actual top five; the full board highlights your place.
				renderRankings(list, data.entries.slice(0, 5), getPlayer()?.id);
				status.textContent = data.entries.length ? '' : 'No scores yet. Set the first.';
			}).catch(() => {
				if (current === revision) status.textContent = 'Scores unavailable. Open full rankings to retry.';
			});
		}
	});
}
