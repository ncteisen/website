import { FixedStepLoop } from '../../../arcade/FixedStepLoop';
import { readBest, saveBest } from '../../../arcade/storage';
import { World } from './World';
import { Renderer } from './Renderer';
import { InputHandler } from '../utils/InputHandler';
import { GameAudio } from '../../../arcade/GameAudio';
import { shareScore } from '../../../arcade/shareScore';
import { getGame } from '../../../arcade/catalog';

export type GameState = 'loading' | 'ready' | 'playing' | 'paused' | 'over';
const BEST_KEY = getGame('sarah-jumps').bestKey;

export class GameEngine {
	world = new World();
	state: GameState = 'loading';
	frames = 0;
	private best = readBest(BEST_KEY);
	private runBest = this.best;
	private destroyed = false;
	private events = new AbortController();
	private observer: ResizeObserver;
	private renderer: Renderer;
	private input: InputHandler;
	private audio = new GameAudio();
	private loop: FixedStepLoop;
	private canvas: HTMLCanvasElement;
	private panel: HTMLElement;
	private title: HTMLElement;
	private description: HTMLElement;
	private startButton: HTMLButtonElement;
	private pauseButton: HTMLButtonElement;
	private shareButton: HTMLButtonElement;
	private scoreLabel: HTMLElement;
	private bestLabel: HTMLElement;
	private status: HTMLElement;
	private previousScore = -1;

	constructor(private root: HTMLElement) {
		const find = <T extends HTMLElement>(selector: string) => {
			const element = root.querySelector<T>(selector);
			if (!element) throw new Error(`Missing game element: ${selector}`);
			return element;
		};
		this.canvas = find<HTMLCanvasElement>('canvas');
		this.panel = find('[data-panel]');
		this.title = find('[data-title]');
		this.description = find('[data-description]');
		this.startButton = find<HTMLButtonElement>('[data-start]');
		this.pauseButton = find<HTMLButtonElement>('[data-pause]');
		this.shareButton = find<HTMLButtonElement>('[data-share]');
		this.scoreLabel = find('[data-score]');
		this.bestLabel = find('[data-best]');
		this.status = find('[data-status]');
		this.renderer = new Renderer(this.canvas);
		this.loop = new FixedStepLoop(this.update, this.render);
		this.input = new InputHandler(this.canvas, root, () => this.state === 'playing', this.startGame, this.togglePause, () => this.state === 'ready');
		const signal = this.events.signal;
		this.startButton.addEventListener('click', this.startGame, { signal });
		this.pauseButton.addEventListener('click', this.togglePause, { signal });
		const soundButton = find<HTMLButtonElement>('[data-sound]');
		soundButton.addEventListener('click', () => {
			this.audio.enabled = !this.audio.enabled;
			soundButton.textContent = this.audio.enabled ? 'Sound on' : 'Sound off';
			soundButton.setAttribute('aria-pressed', String(this.audio.enabled));
			if (this.audio.enabled) this.audio.unlock();
		}, { signal });
		this.shareButton.addEventListener('click', async () => {
			this.shareButton.disabled = true;
			const message = await shareScore('sarah-jumps', this.world.score);
			if (!this.destroyed && this.state === 'over') this.status.textContent = message;
			this.shareButton.disabled = false;
		}, { signal });
		document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); }, { signal });
		window.addEventListener('blur', () => this.pause(), { signal });
		// A bfcache restore retains this instance; never leave an old loop running.
		window.addEventListener('pagehide', () => this.pause(), { signal });
		this.observer = new ResizeObserver(() => {
			this.world.setViewport(this.renderer.resize());
			this.renderer.render(this.world);
		});
		this.observer.observe(this.canvas);
		this.bestLabel.textContent = String(this.best);
		this.world.setViewport(this.renderer.resize());
		this.renderer.render(this.world);
	}

	async init(): Promise<void> {
		await this.renderer.ready;
		if (this.destroyed) return;
		this.state = 'ready';
		this.startButton.disabled = false;
		this.startButton.textContent = 'Play';
		this.renderer.render(this.world);
	}

	startGame = (): void => {
		if (this.destroyed || this.state === 'loading' || this.state === 'playing') return;
		this.audio.unlock();
		this.input.reset();
		if (this.state !== 'paused') {
			this.world = new World();
			this.world.setViewport(this.renderer.viewportHeight);
			this.runBest = this.best;
			this.renderer.reset();
			this.previousScore = -1;
		}
		this.state = 'playing';
		this.root.dataset.state = this.state;
		this.panel.hidden = true;
		this.status.textContent = '';
		this.pauseButton.disabled = false;
		this.pauseButton.textContent = 'Ⅱ';
		this.pauseButton.setAttribute('aria-label', 'Pause game');
		this.canvas.focus({ preventScroll: true });
		this.syncScore();
		this.loop.start();
	};

	private update = (dt: number): void => {
		if (this.state !== 'playing') return;
		const landing = this.world.update(dt, this.input.read());
		this.renderer.update(dt);
		if (landing) {
			this.renderer.bounce(this.world.player.x, landing.y);
			this.audio.play('jump');
		}
		this.syncScore();
		if (this.world.ended) this.endGame();
	};

	private render = (alpha: number): void => {
		this.frames++;
		this.renderer.render(this.world, alpha);
	};

	private syncScore(): void {
		if (this.previousScore === this.world.score) return;
		this.previousScore = this.world.score;
		this.scoreLabel.textContent = String(this.world.score);
		this.bestLabel.textContent = String(Math.max(this.best, this.world.score));
	}

	private saveRecord(): void {
		if (this.world.score <= this.best) return;
		this.best = this.world.score;
		saveBest(BEST_KEY, this.best);
	}

	pause(): void {
		if (this.state !== 'playing') return;
		this.state = 'paused';
		this.loop.stop();
		this.input.reset();
		this.saveRecord();
		this.showPanel('Paused', '', 'Resume');
		this.pauseButton.textContent = '▶';
		this.pauseButton.setAttribute('aria-label', 'Resume game');
	}

	private togglePause = (): void => {
		if (this.state === 'paused') this.startGame();
		else this.pause();
	};

	private endGame(): void {
		this.state = 'over';
		this.loop.stop();
		this.input.reset();
		this.audio.play('lose');
		this.saveRecord();
		this.pauseButton.disabled = true;
		this.showPanel(this.world.score > this.runBest ? 'New best' : 'Game over', `Score: ${this.world.score} · Best: ${this.best}`, 'Play again');
	}

	private showPanel(title: string, description: string, action: string): void {
		this.root.dataset.state = this.state;
		this.title.textContent = title;
		this.title.hidden = false;
		this.description.textContent = description;
		this.description.hidden = !description;
		this.startButton.textContent = action;
		this.shareButton.hidden = this.state !== 'over';
		this.panel.hidden = false;
		this.renderer.render(this.world);
		// Announce state changes without announcing every score tick.
		this.status.textContent = `${title} ${description}`;
		if (!document.hidden && document.hasFocus()) this.startButton.focus({ preventScroll: true });
	}

	cleanup(): void {
		this.destroyed = true;
		this.saveRecord();
		this.loop.stop();
		this.input.cleanup();
		this.events.abort();
		this.observer.disconnect();
		this.audio.cleanup();
	}
}
