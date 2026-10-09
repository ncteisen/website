import { birdSprite, createBirdAtlas } from './Sprite';
import { WIDTH, HEIGHT, PLAYER_X, PIPE_WIDTH, type World } from './World';

const mix = (a: number, b: number, alpha: number) => a + (b - a) * alpha;
const SPRITE_SIZE = birdSprite.size;
const DRAW_SIZE = birdSprite.drawSize;

export class Renderer {
	private ctx: CanvasRenderingContext2D;
	private sky!: CanvasGradient;
	private sprites?: HTMLCanvasElement;
	private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	readonly ready: Promise<void>;
	viewportHeight = HEIGHT;

	constructor(private canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext('2d', { alpha: false });
		if (!ctx) throw new Error('Canvas is unavailable');
		this.ctx = ctx;
		this.ready = createBirdAtlas().then(atlas => { this.sprites = atlas; }).catch(() => {
			// Keep the game playable with the fallback if an asset cannot load.
		});
	}

	resize(): number {
		const bounds = this.canvas.getBoundingClientRect();
		const scale = Math.min(window.devicePixelRatio || 1, 2) * bounds.width / WIDTH;
		this.viewportHeight = bounds.height / bounds.width * WIDTH;
		this.canvas.width = Math.max(1, Math.round(WIDTH * scale));
		this.canvas.height = Math.max(1, Math.round(this.viewportHeight * scale));
		this.ctx.setTransform(this.canvas.width / WIDTH, 0, 0, this.canvas.height / this.viewportHeight, 0, 0);
		this.ctx.imageSmoothingEnabled = false;
		this.sky = this.ctx.createLinearGradient(0, 0, 0, this.viewportHeight);
		this.sky.addColorStop(0, '#cbd9ee');
		this.sky.addColorStop(1, '#f6e7d7');
		return this.viewportHeight;
	}

	render(world: World, alpha = 1): void {
		const ctx = this.ctx;
		const floor = world.floor;
		const distance = mix(world.previousDistance, world.distance, alpha);
		ctx.fillStyle = this.sky;
		ctx.fillRect(0, 0, WIDTH, this.viewportHeight);
		ctx.fillStyle = '#fff8ea';
		ctx.beginPath(); ctx.arc(309, 115, 32, 0, Math.PI * 2); ctx.fill();
		ctx.fillStyle = '#ffffff70';
		for (let i = 0; i < 5; i++) {
			const x = ((i * 141 + 700 - distance * 0.15) % 560 + 560) % 560 - 80;
			const y = 160 + (i * 89) % 340;
			ctx.beginPath();
			ctx.ellipse(x, y, 52, 13, 0, 0, Math.PI * 2);
			ctx.ellipse(x + 12, y - 11, 24, 18, 0, 0, Math.PI * 2);
			ctx.fill();
		}
		for (const pipe of world.pipes) {
			const x = mix(pipe.previousX, pipe.x, alpha);
			if (x > WIDTH + 8 || x + PIPE_WIDTH < -8) continue;
			const top = pipe.center - pipe.gap / 2;
			const bottom = pipe.center + pipe.gap / 2;
			ctx.fillStyle = '#53698b';
			ctx.fillRect(x, 0, PIPE_WIDTH, top);
			ctx.fillRect(x, bottom, PIPE_WIDTH, floor - bottom);
			ctx.fillStyle = '#788dae';
			ctx.fillRect(x + 3, 0, PIPE_WIDTH - 9, top);
			ctx.fillRect(x + 3, bottom, PIPE_WIDTH - 9, floor - bottom);
			ctx.fillStyle = '#ffffff24';
			ctx.fillRect(x + 9, 0, 7, top);
			ctx.fillRect(x + 9, bottom, 7, floor - bottom);
			for (const y of [top - 18, bottom]) {
				ctx.fillStyle = '#53698b';
				ctx.beginPath(); ctx.roundRect(x - 4, y, PIPE_WIDTH + 8, 18, 3); ctx.fill();
				ctx.fillStyle = '#8d9fba'; ctx.fillRect(x - 1, y + 3, PIPE_WIDTH + 2, 4);
			}
		}
		ctx.fillStyle = '#c6b4a0'; ctx.fillRect(0, floor, WIDTH, this.viewportHeight - floor);
		ctx.fillStyle = '#ede2ca'; ctx.fillRect(0, floor, WIDTH, 5);
		ctx.fillStyle = '#aa97874d';
		for (let i = 0; i < 13; i++) ctx.fillRect(i * 36 - distance % 36, floor + 16, 18, 3);
		const y = mix(world.previousY, world.y, alpha);
		const resting = world.distance === 0 && world.velocity === 0;
		ctx.save();
		ctx.translate(PLAYER_X, y);
		if (!this.reducedMotion && !resting) ctx.rotate(Math.max(-0.35, Math.min(1.4, (world.flapAge - 0.18) * 3.5 - 0.35)));
		// Every tap restarts an up/middle/down/recovery wing stroke. The pose uses
		// simulation time, so it freezes on pause and is independent of FPS.
		const frame = this.reducedMotion || resting ? 3 : world.flapAge < 0.055 ? 0 : world.flapAge < 0.12 ? 1 : world.flapAge < 0.24 ? 2 : 3;
		if (this.sprites) ctx.drawImage(this.sprites, frame * SPRITE_SIZE, 0, SPRITE_SIZE, SPRITE_SIZE,
			-birdSprite.pivot.x * DRAW_SIZE / SPRITE_SIZE, -birdSprite.pivot.y * DRAW_SIZE / SPRITE_SIZE, DRAW_SIZE, DRAW_SIZE);
		else { ctx.fillStyle = '#de463c'; ctx.beginPath(); ctx.ellipse(0, 0, 13, 18, 0, 0, Math.PI * 2); ctx.fill(); }
		ctx.restore();
	}
}
