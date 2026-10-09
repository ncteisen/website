// Private browsing, storage quotas, and corrupt values must never stop a game.
export function readBest(key: string): number {
	try {
		const value = Number(localStorage.getItem(key));
		return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
	} catch {
		return 0;
	}
}

export function saveBest(key: string, value: number): void {
	try { localStorage.setItem(key, String(value)); } catch { /* Keep this session's best. */ }
}
