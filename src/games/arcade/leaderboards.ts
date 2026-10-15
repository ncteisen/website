import { getGame, type ArcadeGameId } from './catalog';
import { flushScores, getPlayer, initScores, loadLeaderboard, scoreMessage, scoresConfigured, setNickname } from './scores';

export function initLeaderboards(): void {
	const dialog = document.querySelector<HTMLDialogElement>('[data-leaderboards]');
	if (!dialog) return;
	const find = <T extends HTMLElement>(selector: string) => dialog.querySelector<T>(selector)!;
	const form = find<HTMLFormElement>('[data-nickname-form]');
	const nickname = find<HTMLInputElement>('input[name="nickname"]');
	const submit = form.querySelector<HTMLButtonElement>('button')!;
	let game = dialog.dataset.initialGame as ArcadeGameId;
	const gamePicker = find('[data-game-picker]');
	const gameToggle = find<HTMLButtonElement>('[data-choose-game]');
	const gameOptions = find('[data-game-options]');
	const gameButtons = dialog.querySelectorAll<HTMLButtonElement>('[data-board-game]');
	const periods = dialog.querySelectorAll<HTMLButtonElement>('[data-board-period]');
	let period: 'all' | 'week' = 'all';
	const results = find('[data-board-results]');
	const playerSummary = find('[data-player-summary]');
	const playerName = find('[data-player-name]');
	const list = find<HTMLOListElement>('[data-board-list]');
	const status = find('[data-board-status]');
	const profile = find('[data-profile-status]');
	let revision = 0;
	let opener: HTMLElement | null = null;
	let storageWarning = '';
	let editingNickname = false;

	function closeGamePicker(): void {
		gameOptions.hidden = true;
		gameToggle.setAttribute('aria-expanded', 'false');
	}
	function selectGame(id: ArcadeGameId): void {
		game = id;
		find('[data-current-game]').textContent = getGame(id).title;
		gameToggle.setAttribute('aria-label', `Change game, currently ${getGame(id).title}`);
		for (const button of gameButtons) button.setAttribute('aria-pressed', String(button.dataset.boardGame === id));
		closeGamePicker();
	}

	function updateProfile(): void {
		const player = getPlayer();
		if (document.activeElement !== nickname) nickname.value = player?.nickname ?? '';
		submit.textContent = 'Save';
		playerSummary.hidden = !player || editingNickname;
		form.hidden = Boolean(player) && !editingNickname;
		playerName.textContent = player?.nickname ?? '';
		// The compact identity already confirms the saved name; keep feedback for pending/error states.
		profile.textContent = storageWarning || (scoreMessage().startsWith('Saved as ') ? '' : scoreMessage());
		for (const label of document.querySelectorAll<HTMLElement>('[data-score-sync]')) {
			label.textContent = scoreMessage();
			label.dataset.saved = String(scoreMessage().startsWith('Saved as '));
		}
	}
	async function refresh(): Promise<void> {
		const current = ++revision;
		status.textContent = 'Loading scores…';
		results.dataset.view = 'loading';
		list.replaceChildren();
		try {
			const data = await loadLeaderboard(game, period);
			if (current !== revision) return;
			const player = getPlayer();
			let rank = 0;
			let previousScore = -1;
			data.entries.forEach((entry, index) => {
				if (entry.score !== previousScore) rank = index + 1;
				previousScore = entry.score;
				const row = document.createElement('li');
				row.dataset.rank = String(rank);
				const position = document.createElement('span'); position.className = 'board-rank'; position.textContent = String(rank);
				const name = document.createElement('span'); name.className = 'board-name'; name.textContent = entry.nickname;
				const score = document.createElement('strong'); score.textContent = entry.score.toLocaleString();
				if (entry.playerId === player?.id) {
					row.dataset.you = '';
					const you = document.createElement('span'); you.className = 'board-you'; you.textContent = 'you'; name.append(you);
				}
				row.append(position, name, score); list.append(row);
			});
			results.dataset.view = data.entries.length ? 'ready' : 'empty';
			status.textContent = data.entries.length ? '' : 'No scores yet.';
		} catch (error) {
			if (current === revision) { results.dataset.view = 'error'; status.textContent = error instanceof Error ? error.message : 'Couldn’t load scores. Try refreshing.'; }
		}
	}

	for (const button of document.querySelectorAll<HTMLElement>('[data-open-board]')) {
		button.addEventListener('click', () => {
			opener = button;
			const activeGame = document.querySelector<HTMLElement>('.game[data-state="playing"]');
			activeGame?.querySelector<HTMLButtonElement>('[data-pause]')?.click();
			selectGame((button.dataset.openBoard || dialog.dataset.initialGame) as ArcadeGameId);
			editingNickname = false;
			updateProfile(); dialog.showModal(); void refresh();
		});
	}
	find('[data-close-board]').addEventListener('click', () => dialog.close());
	let backdropPressed = false;
	const isBackdrop = (event: MouseEvent): boolean => {
		const bounds = dialog.getBoundingClientRect();
		return event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right
			|| event.clientY < bounds.top || event.clientY > bounds.bottom);
	};
	dialog.addEventListener('pointerdown', event => { backdropPressed = isBackdrop(event); });
	dialog.addEventListener('close', () => { revision++; closeGamePicker(); opener?.focus({ preventScroll: true }); });
	// Game shortcuts listen on window; let the dialog own all keyboard interaction, including Escape.
	dialog.addEventListener('keydown', event => event.stopPropagation());
	dialog.addEventListener('keyup', event => event.stopPropagation());
	gameToggle.addEventListener('click', () => {
		const open = gameOptions.hidden;
		gameOptions.hidden = !open;
		gameToggle.setAttribute('aria-expanded', String(open));
	});
	for (const button of gameButtons) button.addEventListener('click', () => {
		selectGame(button.dataset.boardGame as ArcadeGameId);
		gameToggle.focus({ preventScroll: true });
		void refresh();
	});
	dialog.addEventListener('keydown', event => {
		if (event.key === 'Escape' && !gameOptions.hidden) { event.preventDefault(); closeGamePicker(); gameToggle.focus({ preventScroll: true }); }
	});
	dialog.addEventListener('click', event => {
		const dismiss = backdropPressed && isBackdrop(event);
		backdropPressed = false;
		if (dismiss) { dialog.close(); return; }
		if (event.target instanceof Node && !gamePicker.contains(event.target)) closeGamePicker();
	});
	for (const button of periods) button.addEventListener('click', () => {
		period = button.dataset.boardPeriod as 'all' | 'week';
		for (const option of periods) option.setAttribute('aria-pressed', String(option === button));
		void refresh();
	});
	find('[data-edit-nickname]').addEventListener('click', () => { editingNickname = true; updateProfile(); nickname.focus(); nickname.select(); });
	find('[data-refresh-board]').addEventListener('click', async () => { await flushScores(); await refresh(); });
	form.addEventListener('submit', async event => {
		event.preventDefault(); submit.disabled = true; storageWarning = '';
		try {
			const result = await setNickname(nickname.value);
			editingNickname = false;
			if (!result.persistent) storageWarning = 'Browser storage is unavailable. Keep this tab open to retain your player and retry scores.';
			updateProfile(); await refresh();
		} catch (error) { profile.textContent = error instanceof Error ? error.message : 'Couldn’t save your nickname.'; }
		finally { submit.disabled = false; }
	});
	window.addEventListener('arcade:scores', () => { updateProfile(); if (dialog.open && scoreMessage().startsWith('Saved')) void refresh(); });
	window.addEventListener('storage', updateProfile);
	if (!scoresConfigured) { submit.disabled = true; profile.textContent = 'Leaderboards aren’t connected yet.'; }
	initScores();
}
