import { World, clamp, type Controls } from './core';
export type Ledge = { x: number; width: number; y: number; star: boolean; bumper?: boolean; phase?: number };
export class Rolls extends World {
	readonly kind = 'sarah-rolls';
	x = 85;
	y = 426;
	vx = 0;
	vy = 0;
	angle = 0;
	camera = 0;
	furthest = 85;
	bonus = 0;
	ground: Ledge | null = null;
	ledges: Ledge[] = [{ x: -100, width: 360, y: 450, star: false }];
	constructor(random = Math.random) { super(random); this.ground = this.ledges[0]; this.populate(); }
	act(): void {}
	bumperY(ledge: Ledge): number { return ledge.y - 105 + Math.sin(this.time * 2.2 + (ledge.phase || 0)) * 32; }
	private populate(): void {
		while (this.ledges[this.ledges.length - 1].x < this.x + 1100) {
			const last = this.ledges[this.ledges.length - 1];
			this.ledges.push({ x: last.x + last.width + 60 + this.random() * 25, width: 185 + this.random() * 60, y: clamp(last.y + (this.random() - 0.5) * 70, 390, 490), star: true, bumper: this.random() < 0.35 && last.x > 500, phase: this.random() * Math.PI * 2 });
		}
		this.ledges = this.ledges.filter(ledge => ledge.x + ledge.width > this.camera - 160);
	}
	protected step(dt: number, controls: Controls): void {
		this.vx = clamp(this.vx + controls.axis * 740 * dt, -250, 250);
		if (!controls.axis) this.vx *= Math.exp(-(this.ground ? 4 : 2.5) * dt);
		const previousY = this.y;
		this.vy += 900 * dt;
		this.x += this.vx * dt;
		this.y += this.vy * dt;
		this.angle += this.vx / 24 * dt;
		this.ground = null;
		for (const ledge of this.ledges) {
			if (this.vy >= 0 && previousY + 24 <= ledge.y + 1 && this.y + 24 >= ledge.y && this.x > ledge.x - 8 && this.x < ledge.x + ledge.width + 8) {
				this.y = ledge.y - 24; this.vy = 0; this.ground = ledge;
				if (this.vx > 70 && this.x > ledge.x + ledge.width - 48) { this.vy = -430; this.ground = null; this.events++; }
			}
			if (ledge.bumper && Math.hypot(this.x - (ledge.x + 110), this.y - this.bumperY(ledge)) < 35) this.finish('Bumper! Release to brake and roll underneath.');
			if (ledge.star && Math.hypot(this.x - (ledge.x + 55), this.y - (ledge.y - 80)) < 42) { ledge.star = false; this.bonus += 25; this.announce('Star +25'); }
		}
		this.furthest = Math.max(this.furthest, this.x);
		this.camera = Math.max(this.camera, this.x - 120);
		this.score = Math.floor((this.furthest - 85) / 10) + this.bonus;
		if (this.y > 760 || this.x < this.camera - 35) this.finish('Keep your speed over the spring pads.');
		this.populate();
	}
}
