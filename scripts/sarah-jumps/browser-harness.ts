import type { SarahJumps } from '../../src/games/sarah-jumps/js/SarahJumps';

/** Explicit local-only playtest controls. Removed from the production import graph. */
export function installPlaytest(game: SarahJumps): void {
	const box = document.createElement('aside');
	box.style.cssText = 'max-width:440px;margin:12px auto;padding:12px;background:#fff;color:#111;font:12px monospace';
	const button = document.createElement('button');
	button.textContent = 'Run 30-second playtest';
	const output = document.createElement('output');
	output.style.cssText = 'display:block;white-space:pre-wrap;margin-top:8px';
	box.append(button, output);
	document.body.append(box);
	let running = false;
	let frame = 0;
	let start = 0;
	let previous = 0;
	let launchY = 550;
	let lastLandings = 0;
	let oldFrames = 0;
	let lastReport = 0;
	let direction = 0;
	let gaps: number[] = [];
	let longTasks = 0;
	let observer: PerformanceObserver | undefined;
	if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
		observer = new PerformanceObserver(list => { longTasks += list.getEntries().length; });
		observer.observe({ entryTypes: ['longtask'] });
	}
	const steer = (axis: number) => {
		if (axis === direction) return;
		if (direction) window.dispatchEvent(new KeyboardEvent('keyup', { code: direction > 0 ? 'ArrowRight' : 'ArrowLeft' }));
		direction = axis;
		if (direction) window.dispatchEvent(new KeyboardEvent('keydown', { code: direction > 0 ? 'ArrowRight' : 'ArrowLeft', cancelable: true }));
	};
	const tick = (now: number) => {
		if (!running) return;
		const world = game.engine.world;
		if (previous) gaps.push(now - previous);
		previous = now;
		if (world.landings !== lastLandings) {
			lastLandings = world.landings;
			launchY = world.player.y;
		}
		const target = world.platforms.platforms.filter(platform => !platform.broken && platform.baseY < launchY - 20).sort((a, b) => b.baseY - a.baseY)[0];
		if (target) {
			const delta = target.x + target.width / 2 - world.player.x;
			steer(Math.abs(delta) < 5 ? 0 : Math.sign(delta));
		}
		if (now - lastReport > 500 || now - start >= 30000 || world.ended) {
			const ordered = [...gaps].sort((a, b) => a - b);
			output.textContent = JSON.stringify({
				state: game.engine.state, seconds: +((now - start) / 1000).toFixed(1),
				fps: +((game.engine.frames - oldFrames) * 1000 / Math.max(1, now - start)).toFixed(1),
				p95FrameMs: +(ordered[Math.floor(ordered.length * 0.95)] || 0).toFixed(1),
				longTasks, score: world.score, landings: world.landings, platforms: world.platforms.platforms.length,
				canvas: [document.querySelector('canvas')?.width, document.querySelector('canvas')?.height],
			}, null, 2);
			lastReport = now;
		}
		if (now - start >= 30000 || world.ended || game.engine.state !== 'playing') {
			running = false;
			steer(0);
			game.engine.pause();
			button.disabled = false;
			return;
		}
		frame = requestAnimationFrame(tick);
	};
	button.addEventListener('click', () => {
		if (running) return;
		game.engine.startGame();
		launchY = game.engine.world.player.y;
		lastLandings = game.engine.world.landings;
		oldFrames = game.engine.frames;
		gaps = []; longTasks = 0; previous = 0;
		start = performance.now(); lastReport = start;
		running = true; button.disabled = true;
		frame = requestAnimationFrame(tick);
	});
	if (import.meta.hot) import.meta.hot.dispose(() => {
		running = false; cancelAnimationFrame(frame); steer(0); observer?.disconnect(); box.remove();
	});
}
