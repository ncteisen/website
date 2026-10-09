import { getGame, type ArcadeGameId } from './catalog';

/** Sharing is an explicit secondary action; it never interrupts a retry. */
export async function shareScore(gameId: ArcadeGameId, score: number): Promise<string> {
	const game = getGame(gameId);
	const text = `I scored ${score} in ${game.title}! Can you beat it?`;
	const url = `https://www.noaheisen.com${game.path}`;
	try {
		if (navigator.share) {
			await navigator.share({ title: game.title, text, url });
			return 'Score shared.';
		}
		await navigator.clipboard.writeText(`${text}\n${url}`);
		return 'Score copied!';
	} catch (error) {
		return error instanceof Error && error.name === 'AbortError' ? '' : 'Could not share. Try again.';
	}
}
