import { World, clamp, type Controls } from './core';
export type RollStar = { x: number; y: number; collected: boolean; missed: boolean };
export type Ledge = { x: number; width: number; y: number; stars: RollStar[]; boost?: boolean; bumper?: boolean; phase?: number; crumble?: number; collapsed?: boolean };
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
	streak = 0;
	boostTime = 0;
	springPulse = 0;
	launchX = 85;
	sparks: { x: number; y: number; vx: number; vy: number; life: number }[] = [];
	ground: Ledge | null = null;
	ledges: Ledge[] = [{ x: -100, width: 360, y: 450, stars: [] }];
	private generated = 0;
	constructor(random = Math.random) { super(random); this.ground = this.ledges[0]; this.populate(); }
	act(): void {}
	get multiplier(): number { return Math.min(5, 1 + Math.floor(this.streak / 3)); }
	bumperX(ledge: Ledge): number { return ledge.x + 160; }
	bumperY(ledge: Ledge, time = this.time): number { return ledge.y - 83 + Math.sin(time * 2.2 + (ledge.phase || 0)) * 45; }
	gateOpen(ledge: Ledge): boolean { return [0, 0.2, 0.4, 0.6, 0.8].every(ahead => ledge.y - this.bumperY(ledge, this.time + ahead) > 68); }
	private populate(): void {
		while (this.ledges[this.ledges.length - 1].x < this.x + 1100) {
			const last = this.ledges[this.ledges.length - 1];
			// Place stars along the spring's flight arc; braking trades the streak for safety.
			last.stars = [0.2, 0.42, 0.64].map(time => ({
				x: last.x + last.width - 48 + time * (last.boost ? 320 : 250),
				y: last.y - 24 - (last.boost ? 470 : 430) * time + 450 * time * time,
				collected: false, missed: false,
			}));
			this.generated++;
			const difficulty = clamp((this.generated - 4) / 28, 0, 1);
			const gap = (last.boost ? 130 : 60) + this.random() * 25;
			const width = 205 - difficulty * 55 + this.random() * 35;
			const y = clamp(last.y + (this.random() - 0.5) * (70 + difficulty * 25), 390, 490);
			// Deliberate sections: a boost landing, a stop-and-go gate, then a fragile ledge.
			// Never combine a gate with a crumbling floor or a boosted landing.
			const bumper = this.generated >= 5 && this.generated % 6 === 5;
			const fragile = this.generated >= 6 && this.generated % 6 === 0;
			const boost = this.generated % 6 === 3;
			this.ledges.push({ x: last.x + last.width + gap, width: bumper ? 310 : last.boost ? 230 : width, y, stars: [], boost, bumper, phase: this.random() * Math.PI * 2, crumble: fragile ? 0 : undefined });
		}
		this.ledges = this.ledges.filter(ledge => ledge.x + ledge.width > this.camera - 160);
	}
	protected step(dt: number, controls: Controls): void {
		this.boostTime = Math.max(0, this.boostTime - dt);
		this.springPulse = Math.max(0, this.springPulse - dt);
		const maxSpeed = this.boostTime > 0 ? 320 : 250;
		this.vx = clamp(this.vx + controls.axis * 740 * dt, -maxSpeed, maxSpeed);
		if (!controls.axis) this.vx *= Math.exp(-(this.ground ? 4 : 2.5) * dt);
		const previousY = this.y;
		this.vy += 900 * dt;
		this.x += this.vx * dt;
		this.y += this.vy * dt;
		this.angle += this.vx / 24 * dt;
		this.ground = null;
		for (const ledge of this.ledges) {
			if (ledge.crumble !== undefined && ledge.crumble > 0) {
				ledge.crumble += dt;
				if (ledge.crumble >= 0.85) ledge.collapsed = true;
			}
			if (!ledge.collapsed && this.vy >= 0 && previousY + 24 <= ledge.y + 1 && this.y + 24 >= ledge.y && this.x > ledge.x - 8 && this.x < ledge.x + ledge.width + 8) {
				this.y = ledge.y - 24; this.vy = 0; this.ground = ledge;
				if (ledge.crumble === 0) { ledge.crumble = dt; this.events++; }
				if (this.vx > 70 && this.x > ledge.x + ledge.width - 48) {
					this.launchX = this.x;
					this.vy = ledge.boost ? -470 : -430; this.ground = null; this.springPulse = 0.24; this.events++;
					if (ledge.boost) { this.vx = 320; this.boostTime = 1.15; this.events++; }
				}
			}
			if (ledge.bumper && Math.hypot(this.x - this.bumperX(ledge), this.y - this.bumperY(ledge)) < 35) this.finish('Bumper! Brake before the red gate, then roll through when it lifts.');
			for (const star of ledge.stars) {
				if (star.collected || star.missed) continue;
				if (Math.hypot(this.x - star.x, this.y - star.y) < 34) {
					star.collected = true;
					const points = 10 * this.multiplier;
					this.bonus += points; this.streak++;
					this.events++;
					for (let i = 0; i < 6; i++) {
						const angle = i * Math.PI / 3;
						this.sparks.push({ x: star.x, y: star.y, vx: Math.cos(angle) * 70, vy: Math.sin(angle) * 70, life: 0.4 });
					}
				} else if (this.x > star.x + 45) { star.missed = true; this.streak = 0; }
			}
		}
		for (const spark of this.sparks) { spark.x += spark.vx * dt; spark.y += spark.vy * dt; spark.life -= dt; }
		this.sparks = this.sparks.filter(spark => spark.life > 0).slice(-36);
		this.furthest = Math.max(this.furthest, this.x);
		this.camera = Math.max(this.camera, this.x - 120);
		this.score = Math.floor((this.furthest - 85) / 10) + this.bonus;
		if (this.y > 760) {
			const crumbled = this.ledges.some(ledge => ledge.collapsed && this.x > ledge.x - 24 && this.x < ledge.x + ledge.width + 24);
			this.finish(crumbled ? 'That ledge crumbled! Keep moving on striped platforms.' : 'Missed the landing. Adjust your speed in the air for shorter ledges.');
		}
		if (this.x < this.camera - 35) this.finish('Keep rolling forward—release to brake before the gates.');
		this.populate();
	}
}
