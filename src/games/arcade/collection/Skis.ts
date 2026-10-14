import { World, clamp, type Controls } from './core';
export type SlopeRow = { at: number; center: number; trees: number[]; ramp: boolean; crossed: boolean };
export class Skis extends World {
	readonly kind = 'sarah-skis';
	x = 200;
	vx = 0;
	distance = 0;
	bonus = 0;
	air = 0;
	pursuit = 0;
	rows: SlopeRow[] = [];
	tracks: { x: number; at: number }[] = [];
	private nextRow = 380;
	private center = 200;
	private trackTime = 0;
	constructor(random = Math.random) { super(random); this.populate(); }
	act(): void {}
	private populate(): void {
		while (this.nextRow < this.distance + 1400) {
			this.center = clamp(this.center + (this.random() - 0.5) * 130, 100, 300);
			this.rows.push({ at: this.nextRow, center: this.center, trees: [this.center - 93, this.center + 93], ramp: this.random() < 0.3, crossed: false });
			this.nextRow += 230;
		}
	}
	protected step(dt: number, controls: Controls): void {
		const desired = controls.target === null ? controls.axis * 330 : clamp((controls.target - this.x) * 12, -360, 360);
		this.vx += (desired - this.vx) * (1 - Math.exp(-16 * dt));
		this.x = clamp(this.x + this.vx * dt, 18, 382);
		this.distance += (225 + Math.min(80, this.time * 1.5)) * dt;
		this.air = Math.max(0, this.air - dt);
		if (this.time > 30) this.pursuit += dt * 0.022;
		for (const row of this.rows) {
			const ahead = row.at - this.distance;
			if (Math.abs(ahead) < 21 && this.air === 0 && row.trees.some(x => Math.abs(x - this.x) < 21)) this.finish('Tree! Try carving a little earlier.');
			if (row.ramp && ahead < 75 && ahead > 50 && Math.abs(this.x - row.center) < 26 && this.air === 0) this.air = 0.75;
			if (!row.crossed && ahead <= 0) {
				row.crossed = true;
				if (Math.abs(this.x - row.center) < 55) { this.bonus += 10; this.pursuit = Math.max(0, this.pursuit - 0.06); this.announce(this.air > 0 ? 'Air + gate! +10' : 'Gate +10'); }
				else if (this.time > 30) this.pursuit += 0.07;
			}
		}
		if (this.pursuit >= 1) this.finish('The yeti caught up. Gates help you escape!');
		this.score = Math.floor(this.distance / 20) + this.bonus;
		this.rows = this.rows.filter(row => row.at > this.distance - 250);
		this.trackTime += dt;
		if (this.trackTime >= 0.035) { this.trackTime = 0; if (!this.air) this.tracks.push({ x: this.x, at: this.distance }); }
		this.tracks = this.tracks.filter(point => point.at > this.distance - 500);
		this.populate();
	}
}
