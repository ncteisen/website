import type { FlappySarah } from '../../src/games/flappy-sarah/FlappySarah';
import { PLAYER_X, PIPE_WIDTH } from '../../src/games/flappy-sarah/World';

/** Local-only endurance check, driven through the real input handler. */
export function installPlaytest(game: FlappySarah): void {
	const box = document.createElement('aside');
	box.style.cssText = 'max-width:440px;margin:12px auto;padding:12px;background:#fff;color:#111;font:12px monospace';
	const button = document.createElement('button');
	button.textContent = 'Run 30-second flight test';
	const output = document.createElement('output');
	output.style.cssText = 'display:block;white-space:pre-wrap;margin-top:8px';
	box.append(button, output);
	document.body.append(box);
	let running = false;
	let frame = 0;
	let start = 0;
	let previous = 0;
	let oldFrames = 0;
	let lastReport = 0;
	let gaps: number[] = [];
	let longTasks = 0;
	let observer: PerformanceObserver | undefined;
	if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
		observer = new PerformanceObserver(list => { longTasks += list.getEntries().length; });
		observer.observe({ entryTypes: ['longtask'] });
	}
	const tick = (now: number) => {
		if (!running) return;
		const world = game.world;
		if (previous) gaps.push(now - previous);
		previous = now;
		const target = world.pipes.find(pipe => pipe.x + PIPE_WIDTH > PLAYER_X - 20);
		if (target && world.y > target.center + 18 && world.velocity > 0) {
			window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', cancelable: true }));
			window.dispatchEvent(new KeyboardEvent('keyup', { code: 'Space' }));
		}
		if (now - lastReport > 500 || now - start >= 30000 || world.ended) {
			const ordered = [...gaps].sort((a, b) => a - b);
			output.textContent = JSON.stringify({ state: game.state, seconds: +((now - start) / 1000).toFixed(1), fps: +((game.frames - oldFrames) * 1000 / Math.max(1, now - start)).toFixed(1), p95FrameMs: +(ordered[Math.floor(ordered.length * 0.95)] || 0).toFixed(1), longTasks, score: world.score, pipes: world.pipes.length }, null, 2);
			lastReport = now;
		}
		if (now - start >= 30000 || world.ended || game.state !== 'playing') {
			running = false;
			game.pause();
			button.disabled = false;
			return;
		}
		frame = requestAnimationFrame(tick);
	};
	button.addEventListener('click', () => {
		if (running) return;
		game.startGame();
		oldFrames = game.frames;
		gaps = []; longTasks = 0; previous = 0;
		start = performance.now(); lastReport = start;
		running = true; button.disabled = true;
		frame = requestAnimationFrame(tick);
	});
	if (import.meta.hot) import.meta.hot.dispose(() => { running = false; cancelAnimationFrame(frame); observer?.disconnect(); box.remove(); });
}
