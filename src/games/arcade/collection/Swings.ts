import { World, type Action } from './core';
export type Anchor = { x: number; y: number };
export class Swings extends World {
	readonly kind = 'sarah-swings';
	x = 80;
	y = 300;
	vx = 230;
	vy = 0;
	camera = 0;
	furthest = 80;
	anchors: Anchor[] = [];
	attached: Anchor | null = null;
	length = 0;
	held = false;
	lastAnchor: Anchor | null = null;
	private nextX = 220;
	constructor(random = Math.random) { super(random); this.populate(); }
	private populate(): void {
		while (this.nextX < this.x + 1000) { this.anchors.push({ x: this.nextX, y: 105 + this.random() * 65 }); this.nextX += 210; }
		this.anchors = this.anchors.filter(anchor => anchor.x > this.camera - 200 || anchor === this.attached);
	}
	candidate(): Anchor | undefined {
		return this.anchors.find(anchor => anchor !== this.lastAnchor && anchor.x > this.x - 20 && anchor.x < this.x + 270 && Math.hypot(anchor.x - this.x, anchor.y - this.y) < 315);
	}
	act(action: Action): void {
		if (this.ended) return;
		if (action === 'primary') this.held = true;
		if (action === 'release') { this.held = false; this.lastAnchor = this.attached || this.lastAnchor; this.attached = null; }
	}
	protected step(dt: number): void {
		if (this.held && !this.attached) {
			const anchor = this.candidate();
			if (anchor) { this.attached = anchor; this.length = Math.min(245, Math.hypot(this.x - anchor.x, this.y - anchor.y)); this.events++; }
		}
		const speed = Math.hypot(this.vx, this.vy);
		if (speed > 520) { this.vx *= 520 / speed; this.vy *= 520 / speed; }
		this.vy += (this.time < 0.5 ? 200 : 830) * dt;
		this.x += this.vx * dt;
		this.y += this.vy * dt;
		if (this.attached) {
			const dx = this.x - this.attached.x, dy = this.y - this.attached.y;
			const distance = Math.hypot(dx, dy);
			const nx = dx / distance, ny = dy / distance;
			this.x = this.attached.x + nx * this.length; this.y = this.attached.y + ny * this.length;
			const radial = this.vx * nx + this.vy * ny;
			this.vx -= nx * radial; this.vy -= ny * radial;
			// A small forward pump keeps the first swing approachable on a phone.
			this.vx += ny * 85 * dt; this.vy -= nx * 85 * dt;
		}
		this.furthest = Math.max(this.furthest, this.x);
		this.camera = Math.max(this.camera, this.x - 120);
		this.score = Math.floor((this.furthest - 80) / 10);
		if (this.y > 590 || this.x < this.camera - 40) this.finish('Release on the upswing, then hold for the next rope.');
		if (this.y < 45) { this.y = 45; this.vy = Math.max(0, this.vy); }
		this.populate();
	}
}
