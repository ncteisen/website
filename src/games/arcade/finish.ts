import type { ArcadeGameId } from './catalog';
import { flushScores, getPlayer, loadLeaderboard, recordRun, scoreMessage, setNickname } from './scores';
import { rankedEntries, renderRankings } from './rankings';

const sessions = new WeakMap<HTMLElement, FinishScreen>();

/** One shared initials step for all six games; skipped runs are never posted. */
export function finishRun(root: HTMLElement, game: ArcadeGameId, score: number): void {
	let screen = sessions.get(root);
	if (!screen) { screen = new FinishScreen(root, game); sessions.set(root, screen); }
	screen.show(score);
}

export function cleanupFinish(root: HTMLElement): void {
	sessions.get(root)?.cleanup();
	sessions.delete(root);
}

class FinishScreen {
	private find = <T extends HTMLElement>(selector: string) => this.root.querySelector<T>(selector)!;
	private form: HTMLFormElement;
	private initials: HTMLInputElement;
	private revision = 0;
	private requestRevision = 0;
	private events = new AbortController();
	private score = 0;
	private persistent = true;
	constructor(private root: HTMLElement, private game: ArcadeGameId) {
		const signal = this.events.signal;
		this.form = this.find('[data-initials-form]');
		this.initials = this.find('input[name="initials"]');
		this.initials.addEventListener('input', () => {
			this.initials.value = this.initials.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 3);
		}, { signal });
		// Letter entry and Enter belong to the form, never the game shortcuts.
		this.find('[data-finish]').addEventListener('keydown', event => event.stopPropagation(), { signal });
		this.find('[data-finish]').addEventListener('keyup', event => event.stopPropagation(), { signal });
		this.form.addEventListener('submit', this.handleSubmit, { signal });
		this.find('[data-skip-score]').addEventListener('click', () => {
			if (this.root.dataset.scoreEntry !== 'required') return;
			this.root.dataset.scoreEntry = 'skipped';
			this.showRankings();
			this.find('[data-finish-sync]').textContent = '';
			void this.refresh(this.revision);
		}, { signal });
		this.find('[data-finish-refresh]').addEventListener('click', () => { void this.refresh(this.revision, true); }, { signal });
		window.addEventListener('arcade:scores', () => {
			if (this.root.dataset.state === 'over' && this.root.dataset.scoreEntry === 'complete') {
				this.updateSync();
				if (scoreMessage().startsWith('Saved as ')) void this.refresh(this.revision);
			}
		}, { signal });
	}
	cleanup(): void { this.revision++; this.events.abort(); }
	show(score: number): void {
		this.revision++;
		this.score = score;
		this.root.dataset.scoreEntry = 'required';
		this.find('[data-finish]').hidden = false;
		this.find('[data-finish-title]').textContent = this.find('[data-title]').textContent;
		this.find('[data-finish-score]').textContent = score.toLocaleString();
		this.find('[data-finish-ranking]').hidden = true;
		this.form.hidden = false;
		this.initials.value = /^[A-Z]{3}$/.test(getPlayer()?.nickname ?? '') ? getPlayer()!.nickname : '';
		this.find<HTMLButtonElement>('[data-start]').disabled = true;
		this.initials.focus({ preventScroll: true });
		this.initials.select();
	}
	private handleSubmit = async (event: SubmitEvent): Promise<void> => {
		event.preventDefault();
		if (this.root.dataset.scoreEntry !== 'required' || !/^[A-Z]{3}$/.test(this.initials.value)) return;
		const revision = this.revision;
		// Identity is stored synchronously; the existing durable queue handles network failures.
		const saving = setNickname(this.initials.value);
		recordRun(this.game, this.score);
		this.root.dataset.scoreEntry = 'complete';
		this.showRankings();
		this.updateSync();
		const result = await saving;
		if (revision !== this.revision) return;
		this.persistent = result.persistent;
		this.updateSync();
		await this.refresh(revision);
	};
	private showRankings(): void {
		this.form.hidden = true;
		this.find('[data-finish-ranking]').hidden = false;
		this.find('[data-finish-standing]').textContent = 'Loading scores…';
		this.find('[data-finish-list]').replaceChildren();
		const play = this.find<HTMLButtonElement>('[data-start]');
		play.disabled = false; play.focus({ preventScroll: true });
	}
	private updateSync(): void {
		this.find('[data-finish-sync]').textContent = !this.persistent
			? `${scoreMessage()} Keep this tab open; browser storage is unavailable.`
			: scoreMessage();
	}
	private async refresh(revision: number, sync = false): Promise<void> {
		const requestRevision = ++this.requestRevision;
		const status = this.find('[data-finish-standing]');
		try {
			if (sync) await flushScores();
			const data = await loadLeaderboard(this.game, 'all');
			if (revision !== this.revision || requestRevision !== this.requestRevision) return;
			const player = getPlayer();
			renderRankings(this.find('[data-finish-list]'), data.entries, player?.id);
			const own = rankedEntries(data.entries).find(entry => entry.playerId === player?.id);
			const skipped = this.root.dataset.scoreEntry === 'skipped';
			const saved = !skipped && scoreMessage().startsWith('Saved as ');
			status.textContent = own ? `Your best: #${own.rank}${own.score === this.score && saved ? ' · This run!' : ''}`
				: skipped ? (data.entries.length ? '' : 'No ranked scores yet')
				: !saved ? 'Score pending · rankings update after sync'
				: data.entries.length ? 'Outside the top 20' : 'No ranked scores yet';
		} catch {
			if (revision === this.revision && requestRevision === this.requestRevision) status.textContent = 'Rankings unavailable. Try refreshing.';
		}
	}
}
