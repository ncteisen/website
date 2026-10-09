/** Add a game here and its page to list it in the arcade. URLs and bests stay per-game. */
export const ARCADE_PATH = '/projects/sarah-arcade/';
export const games = [
	{
		id: 'sarah-jumps',
		title: 'Sarah Jumps',
		path: '/projects/sarah-jumps/',
		description: 'Jump between platforms.',
		bestKey: 'sarahJumpsHighScore',
		input: 'steer',
		touchHint: 'Drag to steer, or hold an arrow.',
		keyboardHint: '← → or A / D to steer · P to pause',
		canvasLabel: 'Sarah Jumps playfield. Use left and right arrows or A and D to steer. P pauses.',
	},
	{
		id: 'flappy-sarah',
		title: 'Flappy Sarah',
		path: '/projects/flappy-sarah/',
		description: 'Tap to fly through the gaps.',
		bestKey: 'flappySarahHighScore',
		input: 'flap',
		touchHint: 'Tap the game or button to flap.',
		keyboardHint: 'Space or ↑ to flap · P to pause',
		canvasLabel: 'Flappy Sarah playfield. Tap, click, or press Space or Up to flap. P pauses.',
	},
] as const;

export type ArcadeGameId = typeof games[number]['id'];
export function getGame(id: ArcadeGameId) { return games.find(game => game.id === id)!; }
