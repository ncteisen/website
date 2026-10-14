import { World, type Action } from './core';
export type Block = { x: number; width: number; level: number };
export type Offcut = Block & { y: number; vy: number; life: number };
export class Stacks extends World {
	readonly kind = 'sarah-stacks';
	blocks: Block[] = [{ x: 105, width: 190, level: 0 }];
	moving: Block = { x: 0, width: 190, level: 1 };
	direction = 1;
	combo = 0;
	cooldown = 0;
	offcuts: Offcut[] = [];
	get top(): Block { return this.blocks[this.blocks.length - 1]; }
	act(action: Action): void {
		if (action !== 'primary' || this.ended || this.cooldown > 0) return;
		const top = this.top;
		let left = Math.max(top.x, this.moving.x), right = Math.min(top.x + top.width, this.moving.x + this.moving.width);
		if (right - left < 8) { this.finish('Missed! Aim for the center of the last block.'); return; }
		if (Math.abs(this.moving.x - top.x) <= 6) {
			this.combo++;
			left = top.x; right = top.x + top.width;
			if (this.combo % 3 === 0) { left = Math.max(0, left - 8); right = Math.min(400, right + 8); }
			this.announce(this.combo % 3 === 0 ? 'Perfect ×3 · wider block!' : 'Perfect!');
		} else {
			this.combo = 0;
			const cutLeft = this.moving.x < top.x;
			this.offcuts.push({ x: cutLeft ? this.moving.x : right, width: this.moving.width - (right - left), level: this.moving.level, y: 0, vy: 0, life: 1.3 });
			this.events++;
		}
		this.blocks.push({ x: left, width: right - left, level: this.moving.level });
		this.score++;
		this.direction *= -1;
		this.moving = { x: this.direction > 0 ? 0 : 400 - (right - left), width: right - left, level: this.score + 1 };
		this.cooldown = 0.2;
		this.blocks = this.blocks.filter(block => block.level > this.score - 28);
	}
	protected step(dt: number): void {
		this.cooldown = Math.max(0, this.cooldown - dt);
		if (!this.cooldown) {
			this.moving.x += this.direction * (125 + Math.min(170, this.score * 7)) * dt;
			if (this.moving.x < 0) { this.moving.x = -this.moving.x; this.direction = 1; }
			if (this.moving.x + this.moving.width > 400) { this.moving.x = 800 - this.moving.width * 2 - this.moving.x; this.direction = -1; }
		}
		for (const cut of this.offcuts) { cut.vy += 850 * dt; cut.y += cut.vy * dt; cut.life -= dt; }
		this.offcuts = this.offcuts.filter(cut => cut.life > 0);
	}
}
