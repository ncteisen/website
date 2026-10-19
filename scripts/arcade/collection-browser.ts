import type { Game } from '../../src/games/arcade/collection/Game';
import { pilot } from './collection-pilot';
/** DEV-only UI harness. It drives the real pointer/keyboard handlers; never changes game state. */
export function installPlaytest(game: Game): void {
	const box = document.createElement('aside');
	box.style.cssText = 'position:fixed;bottom:5px;left:5px;z-index:20;max-width:330px;padding:8px;background:#fffe;color:#111;font:11px monospace';
	const duration = game.id === 'sarah-skis' || game.id === 'sarah-rolls' ? 45 : 15;
	const button = document.createElement('button'); button.textContent = `Run ${duration}-second control test`;
	const output = document.createElement('output'); output.style.cssText = 'display:block;white-space:pre-wrap'; box.append(button, output); document.body.append(box);
	let frame = 0, running = false, previous = 0, start = 0, frames = 0, longTasks = 0;
	let gaps: number[] = [], scores: number[] = [], games = 0;
	const key = (code: string, type = 'keydown') => window.dispatchEvent(new KeyboardEvent(type, { code, cancelable: true }));
	let observer: PerformanceObserver | undefined;
	if (PerformanceObserver.supportedEntryTypes.includes('longtask')) { observer = new PerformanceObserver(list => { longTasks += list.getEntries().length; }); observer.observe({ entryTypes: ['longtask'] }); }
	const tick = (now: number) => {
		if (!running) return;
		if (previous) gaps.push(now - previous); previous = now;
		const command = pilot(game.world);
		if (game.state === 'over') { scores.push(game.world.score); games++; game.start(); }
		else if (game.state === 'playing') {
			if (command.target !== undefined && game.world.kind === 'sarah-skis') {
				const difference = command.target - game.world.x;
				key('ArrowLeft', 'keyup'); key('ArrowRight', 'keyup');
				if (Math.abs(difference) > 3) key(difference < 0 ? 'ArrowLeft' : 'ArrowRight');
			} else if (command.axis !== undefined) {
				key('ArrowLeft', 'keyup'); key('ArrowRight', 'keyup');
				if (command.axis) key(command.axis < 0 ? 'ArrowLeft' : 'ArrowRight');
			}
			if (command.action) {
				const code = { up: 'ArrowUp', left: 'ArrowLeft', right: 'ArrowRight', down: 'ArrowDown', primary: 'Space', release: '' }[command.action]; if (code) { key(code); key(code, 'keyup'); }
			}
		}
		const seconds = (now - start) / 1000;
		const sorted = [...gaps].sort((a, b) => a - b);
		output.textContent = JSON.stringify({ game: game.id, state: game.state, seconds: +seconds.toFixed(1), fps: +((game.frames - frames) / Math.max(0.1, seconds)).toFixed(1), p95: +(sorted[Math.floor(sorted.length * 0.95)] || 0).toFixed(1), longTasks, score: game.world.score, completedRuns: games, scores }, null, 2);
		if (seconds >= duration || game.state === 'paused') { running = false; key('ArrowRight', 'keyup'); key('ArrowLeft', 'keyup'); key('Space', 'keyup'); game.pause(); button.disabled = false; return; }
		frame = requestAnimationFrame(tick);
	};
	button.addEventListener('click', () => { game.start(); start = performance.now(); previous = 0; frames = game.frames; gaps = []; scores = []; games = 0; longTasks = 0; running = true; button.disabled = true; frame = requestAnimationFrame(tick); });
	if (import.meta.hot) import.meta.hot.dispose(() => { running = false; cancelAnimationFrame(frame); observer?.disconnect(); box.remove(); });
}
