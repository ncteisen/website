import type { LeaderboardEntry } from './score-contract';

/** Competition ranks: tied scores share a place, with the next place skipped. */
export function rankedEntries(entries: LeaderboardEntry[]) {
	let rank = 0;
	return entries.map((entry, index) => {
		if (index === 0 || entry.score !== entries[index - 1].score) rank = index + 1;
		return { ...entry, rank };
	});
}

export function renderRankings(list: HTMLOListElement, entries: LeaderboardEntry[], playerId?: string, limit = 5): void {
	const ranked = rankedEntries(entries);
	const visible = ranked.slice(0, limit);
	const own = ranked.find(entry => entry.playerId === playerId);
	if (own && !visible.includes(own)) visible[visible.length - 1] = own;
	list.replaceChildren(...visible.map(entry => {
		const row = document.createElement('li');
		if (entry.playerId === playerId) row.dataset.you = '';
		const rank = document.createElement('span'); rank.textContent = String(entry.rank).padStart(2, '0');
		const name = document.createElement('span'); name.textContent = entry.nickname;
		const score = document.createElement('strong'); score.textContent = entry.score.toLocaleString();
		row.append(rank, name, score);
		return row;
	}));
}
