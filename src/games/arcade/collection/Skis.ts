import { World, clamp, type Controls } from './core';
export type SlopeRow = { at: number; center: number; gateHalfWidth: number; trees: number[]; ramp: boolean; crossed: boolean };
export type Snowball = { at: number; crossingX: number; direction: number };
// Keep the opening gentle, then ramp over roughly the next 90 seconds of skiing.
const difficultyAt = (distance: number) => clamp((distance - 2000) / 28000, 0, 1);
export class Skis extends World {
	readonly kind = 'sarah-skis';
	x = 200;
	vx = 0;
	distance = 0;
	bonus = 0;
	air = 0;
	pursuit = 0;
	rows: SlopeRow[] = [];
	snowballs: Snowball[] = [];
	tracks: { x: number; at: number }[] = [];
	private nextRow = 380;
	private center = 200;
	private trackTime = 0;
	private nextSnowball = 4500;
	private snowballDirection = 1;
	constructor(random = Math.random) { super(random); this.populate(); }
	act(): void {}
	get speed(): number { return 225 + 195 * difficultyAt(this.distance); }
	snowballX(ball: Snowball): number { return ball.crossingX + ball.direction * (this.distance - ball.at) * 0.65; }
	private populate(): void {
		while (this.nextRow < this.distance + 1400) {
			// Tune by the row's location so an already visible obstacle never changes.
			const difficulty = difficultyAt(this.nextRow);
			const treeOffset = 93 - 17 * difficulty;
			const previous = this.rows.at(-1);
			this.center = clamp(this.center + (this.random() - 0.5) * (130 + 50 * difficulty), 100, 300);
			if (previous && this.nextRow >= this.nextSnowball) {
				// Leave room to dodge and recover before the next tree gate.
				this.nextRow = previous.at + 360;
				this.snowballs.push({ at: (previous.at + this.nextRow) / 2, crossingX: (previous.center + this.center) / 2, direction: this.snowballDirection });
				this.snowballDirection *= -1;
				this.nextSnowball = this.nextRow + 2000 - 400 * difficulty;
			}
			this.rows.push({ at: this.nextRow, center: this.center, gateHalfWidth: 55 - 17 * difficulty, trees: [this.center - treeOffset, this.center + treeOffset], ramp: this.random() < 0.3, crossed: false });
			this.nextRow += 230 - 50 * difficulty;
		}
	}
	protected step(dt: number, controls: Controls): void {
		const desired = controls.target === null ? controls.axis * 330 : clamp((controls.target - this.x) * 12, -360, 360);
		this.vx += (desired - this.vx) * (1 - Math.exp(-16 * dt));
		this.x = clamp(this.x + this.vx * dt, 18, 382);
		this.distance += this.speed * dt;
		this.air = Math.max(0, this.air - dt);
		if (this.time > 30) this.pursuit += dt * (0.022 + 0.053 * difficultyAt(this.distance));
		for (const row of this.rows) {
			const ahead = row.at - this.distance;
			if (Math.abs(ahead) < 21 && this.air === 0 && row.trees.some(x => Math.abs(x - this.x) < 21)) this.finish('Tree! Try carving a little earlier.');
			if (row.ramp && ahead < 75 && ahead > 50 && Math.abs(this.x - row.center) < 26 && this.air === 0) this.air = 0.75;
			if (!row.crossed && ahead <= 0) {
				row.crossed = true;
				if (Math.abs(this.x - row.center) < row.gateHalfWidth) { this.bonus += 10; this.pursuit = Math.max(0, this.pursuit - 0.06); this.announce(this.air > 0 ? 'Air + gate! +10' : 'Gate +10'); }
				else if (this.time > 30) this.pursuit += 0.07;
			}
		}
		for (const ball of this.snowballs) {
			if (this.air === 0 && Math.hypot(this.snowballX(ball) - this.x, ball.at - this.distance) < 28) this.finish('Snowball! Watch the edge warning and carve around it.');
		}
		this.snowballs = this.snowballs.filter(ball => ball.at > this.distance - 200);
		if (this.pursuit >= 1) this.finish('The yeti caught up. Gates help you escape!');
		this.score = Math.floor(this.distance / 20) + this.bonus;
		this.rows = this.rows.filter(row => row.at > this.distance - 250);
		this.trackTime += dt;
		if (this.trackTime >= 0.035) { this.trackTime = 0; if (!this.air) this.tracks.push({ x: this.x, at: this.distance }); }
		this.tracks = this.tracks.filter(point => point.at > this.distance - 500);
		this.populate();
	}
}
