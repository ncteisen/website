import jumpingSprite from '../../assets/sprites/player-jumping.png';
import peakingSprite from '../../assets/sprites/player-peaking.png';
import jumpingFlipped from '../../assets/sprites/player-jumping-flipped.png';
import peakingFlipped from '../../assets/sprites/player-peaking-flipped.png';
import { WORLD_WIDTH, WORLD_HEIGHT } from '../entities/Player.ts';
import type { World } from './World.ts';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const colors = { normal: '#598b62', horizontal: '#b67934', vertical: '#498594', dissolving: '#a76d8f' };

export class Renderer {
	private ctx: CanvasRenderingContext2D;
	private sky: CanvasGradient;
	private sprites = [new Image(), new Image(), new Image(), new Image()];
	private particles = Array.from({ length: 30 }, () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0 }));
	private nextParticle = 0;
	readonly ready: Promise<void>;
	viewportHeight = WORLD_HEIGHT;
	readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	constructor(readonly canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext('2d', { alpha: false });
		if (!ctx) throw new Error('Canvas is unavailable');
		this.ctx = ctx;
		this.sky = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
		this.sky.addColorStop(0, '#c3e4eb');
		this.sky.addColorStop(1, '#f3f4df');
		this.ready = Promise.all([jumpingSprite, peakingSprite, jumpingFlipped, peakingFlipped].map((asset, index) => {
			const sprite = this.sprites[index];
			return new Promise<void>(resolve => {
				sprite.onload = () => resolve();
				sprite.onerror = () => resolve();
				sprite.src = asset.src;
			});
		})).then(() => undefined);
	}

	resize(): number {
		const bounds = this.canvas.getBoundingClientRect();
		// Keep square world pixels while allowing the visible sky to grow taller.
		const scale = Math.min(window.devicePixelRatio || 1, 2) * bounds.width / WORLD_WIDTH;
		this.viewportHeight = bounds.height / bounds.width * WORLD_WIDTH;
		const width = Math.max(1, Math.round(WORLD_WIDTH * scale));
		const height = Math.max(1, Math.round(this.viewportHeight * scale));
		if (this.canvas.width !== width || this.canvas.height !== height) {
			this.canvas.width = width;
			this.canvas.height = height;
		}
		this.ctx.setTransform(width / WORLD_WIDTH, 0, 0, height / this.viewportHeight, 0, 0);
		this.ctx.imageSmoothingEnabled = false;
		this.sky = this.ctx.createLinearGradient(0, 0, 0, this.viewportHeight);
		this.sky.addColorStop(0, '#c3e4eb');
		this.sky.addColorStop(1, '#f3f4df');
		return this.viewportHeight;
	}

	bounce(x: number, y: number): void {
		if (this.reducedMotion) return;
		for (let i = 0; i < 6; i++) {
			const particle = this.particles[this.nextParticle++ % this.particles.length];
			Object.assign(particle, { x, y, vx: (i - 2.5) * 26, vy: -35 - (i % 3) * 15, life: 0.28 });
		}
	}

	update(dt: number): void {
		for (const particle of this.particles) {
			if (particle.life <= 0) continue;
			particle.life -= dt;
			particle.x += particle.vx * dt;
			particle.y += particle.vy * dt;
			particle.vy += 280 * dt;
		}
	}

	reset(): void { for (const particle of this.particles) particle.life = 0; }

	render(world: World, alpha = 1): void {
		const ctx = this.ctx;
		const camera = lerp(world.previousCamera, world.camera, alpha) + this.viewportHeight - WORLD_HEIGHT;
		ctx.fillStyle = this.sky;
		ctx.fillRect(0, 0, WORLD_WIDTH, this.viewportHeight);
		// Cheap parallax shapes; no blur, filters, or full-screen translucent layers.
		ctx.fillStyle = '#ffffff66';
		for (let i = 0; i < 5; i++) {
			const x = ((i * 137 + 35) % 460) - 30;
			const y = ((i * 153 + camera * 0.2) % 780) - 90;
			ctx.beginPath();
			ctx.ellipse(x, y, 65, 17, 0, 0, Math.PI * 2);
			ctx.ellipse(x + 20, y - 12, 31, 21, 0, 0, Math.PI * 2);
			ctx.fill();
		}
		for (const platform of world.platforms.platforms) {
			const x = lerp(platform.previousX, platform.x, alpha);
			const y = lerp(platform.previousY, platform.y, alpha) + camera;
			if (y < -20 || y > this.viewportHeight + 10) continue;
			const sink = this.reducedMotion ? 0 : platform.pulse * 3;
			ctx.globalAlpha = platform.fade;
			ctx.fillStyle = '#254b3c26';
			ctx.beginPath(); ctx.roundRect(x, y + 4 + sink, platform.width, 12, 6); ctx.fill();
			ctx.fillStyle = colors[platform.type];
			ctx.beginPath(); ctx.roundRect(x, y + sink, platform.width, 12, 6); ctx.fill();
			ctx.fillStyle = '#ffffff45';
			ctx.fillRect(x + 9, y + 2 + sink, platform.width - 18, 2);
			if (platform.type !== 'normal') {
				ctx.fillStyle = '#fff'; ctx.font = 'bold 12px system-ui'; ctx.textAlign = 'center';
				ctx.fillText(platform.type === 'horizontal' ? '↔' : platform.type === 'vertical' ? '↕' : '· · ·', x + platform.width / 2, y + 10 + sink);
			}
		}
		ctx.globalAlpha = 1;
		ctx.fillStyle = '#f9fff0';
		for (const particle of this.particles) {
			if (particle.life <= 0) continue;
			ctx.globalAlpha = particle.life / 0.28;
			ctx.fillRect(particle.x - 2, particle.y + camera, 4, 4);
		}
		ctx.globalAlpha = 1;
		const player = world.player;
		const x = lerp(player.previousX, player.x, alpha);
		const y = lerp(player.previousY, player.y, alpha) + camera;
		const sprite = this.sprites[(player.facingLeft ? 0 : 2) + (player.velocityY < -100 ? 0 : 1)];
		const stretch = this.reducedMotion ? 0 : Math.max(0, 1 - player.bounceAge / 0.13) * 4;
		if (sprite.complete && sprite.naturalWidth) ctx.drawImage(sprite, x - 28 + stretch / 2, y - 56 - stretch, 56 - stretch, 56 + stretch);
		else {
			ctx.fillStyle = '#a76d8f';
			ctx.beginPath(); ctx.roundRect(x - 14, y - 38, 28, 38, 10); ctx.fill();
		}
	}
}
