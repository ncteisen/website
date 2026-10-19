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
		touchHint: 'Hold and slide your finger to steer.',
		keyboardHint: '← → or A / D to steer · P to pause',
		canvasLabel: 'Sarah Jumps playfield. Keep a finger on the game and slide to steer, or use left and right arrows or A and D. P pauses.',
	},
	{
		id: 'flappy-sarah',
		title: 'Flappy Sarah',
		path: '/projects/flappy-sarah/',
		description: 'Tap to fly through the gaps.',
		bestKey: 'flappySarahHighScore',
		input: 'flap',
		touchHint: 'Tap anywhere in the game to flap.',
		keyboardHint: 'Space or ↑ to flap · P to pause',
		canvasLabel: 'Flappy Sarah playfield. Tap, click, or press Space or Up to flap. P pauses.',
	},
	{
		id: "sarah-skis",
		title: "Sarah Skis",
		path: "/projects/sarah-skis/",
		description: "Carve through gates. Outrun the yeti.",
		bestKey: "sarahSkisHighScore",
		input: "ski",
		touchHint: "Hold and slide to steer through the flags.",
		keyboardHint: "← → or A / D to steer · P to pause",
		instructions: "Slide to steer. Pass flags for bonuses, dodge rolling snowballs, and use blue ramps to jump over hazards.",
		canvasLabel: "Sarah Skis playfield. Slide to steer. Pass flags for bonuses. Edge arrows warn of rolling snowballs; blue ramps jump over hazards. P pauses."
	},
	{
		id: "crossy-sarah",
		title: "Crossy Sarah",
		path: "/projects/crossy-sarah/",
		description: "Dodge traffic. Hop across the river.",
		bestKey: "crossySarahHighScore",
		input: "hop",
		touchHint: "Tap to hop forward. Swipe to change direction.",
		keyboardHint: "Arrow keys or WASD to hop · P to pause",
		instructions: "Tap to hop forward; swipe left, right, or down. Land on logs and watch the railway signals.",
		canvasLabel: "Crossy Sarah playfield. Tap to hop forward; swipe left, right, or down. Land on logs and watch the railway signals. P pauses."
	},
	{
		id: "sarah-stacks",
		title: "Sarah Stacks",
		path: "/projects/sarah-stacks/",
		description: "Stack a tower. Make every drop count.",
		bestKey: "sarahStacksHighScore",
		input: "stack",
		touchHint: "Tap when the blocks line up.",
		keyboardHint: "Space to drop · P to pause",
		instructions: "Tap to drop the moving block. Three perfect drops in a row make your block wider.",
		canvasLabel: "Sarah Stacks playfield. Tap to drop the moving block. Three perfect drops in a row make your block wider. P pauses."
	},
	{
		id: "sarah-rolls",
		title: "Sarah Rolls",
		path: "/projects/sarah-rolls/",
		description: "Time the gates. Escape crumbling ledges.",
		bestKey: "sarahRollsHighScore",
		input: "roll",
		touchHint: "Hold the right or left half of the game to roll.",
		keyboardHint: "← → or A / D to roll · P to pause",
		instructions: "Hold either side to roll; release to brake. Wait for green at red gates. Keep moving on striped ledges—they crumble. Chain stars for up to ×5.",
		canvasLabel: "Sarah Rolls playfield. Hold either side to roll; release to brake. Wait for green at red gates. Striped ledges crumble after landing. Golden springs launch farther; chain stars for up to five times the points. P pauses."
	},
] as const;

export type ArcadeGameId = typeof games[number]['id'];
export function getGame(id: ArcadeGameId) { return games.find(game => game.id === id)!; }
