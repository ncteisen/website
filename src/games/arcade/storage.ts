// Private browsing, storage quotas, and corrupt values must never stop a game.
export function readBest(key: string): number {
	try {
		const value = Number(localStorage.getItem(key));
		return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
	} catch {
		return 0;
	}
}

export function saveBest(key: string, value: number): number {
	// Another open game may have saved a higher best since this controller mounted.
	const best = Math.max(readBest(key), Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0);
	try { localStorage.setItem(key, String(best)); } catch { /* Keep this session's best. */ }
	return best;
}
