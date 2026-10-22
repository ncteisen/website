import { FixedStepLoop } from '../FixedStepLoop';
import { GameAudio } from '../GameAudio';
import { getGame } from '../catalog';
import { readBest, saveBest } from '../storage';
import { cleanupFinish, finishRun } from '../finish';
import { createWorld, type CollectionWorld } from './worlds';
import { Renderer } from './Renderer';
import { Input } from './Input';
import type { Action, CollectionId } from './core';

type State = 'loading' | 'ready' | 'playing' | 'paused' | 'over';
export class Game {
	world: CollectionWorld;
	state: State = 'loading';
	frames = 0;
	private renderer: Renderer;
	private input: Input;
	private loop: FixedStepLoop;
	private audio = new GameAudio();
	private events = new AbortController();
	private observer: ResizeObserver;
	private best: number;
	private runBest = 0;
	private lastScore = -1;
	private lastEvent = 0;
	private destroyed = false;
	private canvas: HTMLCanvasElement;
	private startButton: HTMLButtonElement;
	private pauseButton: HTMLButtonElement;
	private panel: HTMLElement;
	private scoreLabel: HTMLElement;
	private bestLabel: HTMLElement;
	private title: HTMLElement;
	private description: HTMLElement;
	private status: HTMLElement;
	constructor(private root: HTMLElement, readonly id: CollectionId) {
		const find = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
		this.canvas = find('canvas'); this.startButton = find('[data-start]'); this.pauseButton = find('[data-pause]');
		this.panel = find('[data-panel]'); this.scoreLabel = find('[data-score]'); this.bestLabel = find('[data-best]');
		this.title = find('[data-title]'); this.description = find('[data-description]'); this.status = find('[data-status]');
		this.best = readBest(getGame(id).bestKey); this.bestLabel.textContent = String(this.best);
		this.world = createWorld(id); this.renderer = new Renderer(this.canvas);
		this.loop = new FixedStepLoop(this.update, this.render);
		this.input = new Input(this.canvas, root, id, this.action, this.wake, this.togglePause);
		const signal = this.events.signal;
		this.startButton.addEventListener('click', this.start, { signal });
		this.pauseButton.addEventListener('click', this.togglePause, { signal });
		const sound = find<HTMLButtonElement>('[data-sound]');
		sound.addEventListener('click', () => { this.audio.enabled = !this.audio.enabled; sound.textContent = this.audio.enabled ? 'Sound on' : 'Sound off'; sound.setAttribute('aria-pressed', String(this.audio.enabled)); if (this.audio.enabled) this.audio.unlock(); }, { signal });
		document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); }, { signal });
		window.addEventListener('blur', () => this.pause(), { signal }); window.addEventListener('pagehide', () => this.pause(), { signal });
		window.addEventListener('pageshow', this.refreshBest, { signal });
		window.addEventListener('storage', event => { if (!event.key || event.key === getGame(id).bestKey) this.refreshBest(); }, { signal });
		this.observer = new ResizeObserver(() => { this.renderer.resize(); this.render(); }); this.observer.observe(this.canvas);
		this.renderer.resize(); this.render();
	}
	async init(): Promise<void> {
		await this.renderer.ready; if (this.destroyed) return;
		this.state = 'ready'; this.startButton.disabled = false; this.startButton.textContent = 'Play'; this.render();
	}
	start = (): void => {
		if (this.destroyed || this.state === 'loading' || this.state === 'playing' || this.root.dataset.scoreEntry === 'required') return;
		this.refreshBest();
		if (this.state !== 'paused') { this.world = createWorld(this.id); this.runBest = this.best; this.lastEvent = 0; this.lastScore = -1; }
		this.audio.unlock(); this.state = 'playing'; this.root.dataset.state = this.state;
		this.panel.hidden = true; this.status.textContent = ''; this.pauseButton.disabled = false; this.pauseButton.textContent = 'Ⅱ'; this.pauseButton.setAttribute('aria-label', 'Pause game');
		this.canvas.focus({ preventScroll: true }); this.syncScore(); this.loop.start();
	};
	private wake = (): boolean => { const playing = this.state === 'playing'; if (this.state === 'ready' || this.state === 'paused') this.start(); return playing; };
	private action = (action: Action): void => { if (this.state === 'playing' || action === 'release') this.world.act(action); };
	private update = (dt: number): void => {
		if (this.state !== 'playing') return;
		this.world.update(dt, this.input.controls); this.syncScore();
		if (this.world.events !== this.lastEvent) { this.lastEvent = this.world.events; this.audio.play('jump'); }
		if (this.world.ended) {
			this.state = 'over'; this.loop.stop(); this.input.clear(); this.audio.play('lose'); this.save(); this.pauseButton.disabled = true;
			this.showPanel(this.world.score > this.runBest ? 'New best' : 'Game over', `${this.world.reason} Score: ${this.world.score} · Best: ${this.best}`, 'Play again');
			finishRun(this.root, this.id, this.world.score);
		}
	};
	private render = (): void => { this.frames++; this.renderer.render(this.world); };
	private syncScore(): void { if (this.world.score === this.lastScore) return; this.lastScore = this.world.score; this.scoreLabel.textContent = String(this.world.score); this.bestLabel.textContent = String(Math.max(this.best, this.world.score)); }
	private save(): void { this.best = saveBest(getGame(this.id).bestKey, Math.max(this.best, this.world.score)); this.bestLabel.textContent = String(this.best); }
	private refreshBest = (): void => { this.best = Math.max(this.best, readBest(getGame(this.id).bestKey)); this.bestLabel.textContent = String(Math.max(this.best, this.world.score)); };
	pause = (): void => {
		if (this.state !== 'playing') return;
		this.state = 'paused'; this.loop.stop(); this.input.clear(false);
		this.save(); this.pauseButton.textContent = '▶'; this.pauseButton.setAttribute('aria-label', 'Resume game'); this.showPanel('Paused', '', 'Resume');
	};
	private togglePause = (): void => { if (this.state === 'paused') this.start(); else this.pause(); };
	private showPanel(title: string, description: string, button: string): void {
		this.root.dataset.state = this.state; this.title.hidden = false; this.title.textContent = title;
		this.description.hidden = !description; this.description.textContent = description; this.startButton.textContent = button;
		this.panel.hidden = false; this.status.textContent = `${title}. ${description}`;
		this.render(); if (!document.hidden && document.hasFocus()) this.startButton.focus({ preventScroll: true });
	}
	cleanup(): void {
		cleanupFinish(this.root); this.destroyed = true; this.save(); this.loop.stop(); this.input.cleanup(); this.observer.disconnect(); this.events.abort(); this.audio.cleanup(); }
}
