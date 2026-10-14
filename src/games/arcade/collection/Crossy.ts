import { World, clamp, mod, type Action } from './core';
export type Lane = { row: number; kind: 'grass' | 'road' | 'river' | 'rail'; speed: number; phase: number; span: number; width: number };
export class Crossy extends World {
	readonly kind = 'crossy-sarah';
	x = 225;
	row = 0;
	fromX = 225;
	fromRow = 0;
	hop = 0;
	camera = 0;
	furthest = 0;
	lastProgress = 0;
	lanes: Lane[] = [];
	private queued: Action | null = null;
	constructor(random = Math.random) { super(random); this.populate(); }
	private populate(): void {
		const pattern = ['grass', 'road', 'road', 'grass', 'river', 'river', 'grass', 'rail', 'grass'] as const;
		let row = this.lanes.length ? this.lanes[this.lanes.length - 1].row + 1 : 0;
		while (row < this.furthest + 25) {
			const kind = row < 2 ? 'grass' : pattern[(row - 2) % pattern.length];
			this.lanes.push({ row, kind, speed: (row % 2 ? 1 : -1) * (kind === 'river' ? 28 + this.random() * 12 : 65 + this.random() * 35 + Math.min(45, row)), phase: this.random() * 230, span: kind === 'river' ? 215 : 210 + this.random() * 70, width: kind === 'river' ? 155 : 62 });
			row++;
		}
		this.lanes = this.lanes.filter(lane => lane.row >= this.camera - 5);
	}
	objects(lane: Lane, time = this.time): number[] {
		if (lane.kind === 'rail') {
			const phase = mod(time + lane.phase / 40, 8);
			return phase > 1.4 && phase < 2.7 ? [-350 + (phase - 1.4) * 850] : [];
		}
		const origin = mod(lane.phase + time * lane.speed, lane.span) - lane.span;
		return [origin, origin + lane.span, origin + lane.span * 2, origin + lane.span * 3];
	}
	warning(lane: Lane): boolean { return mod(this.time + lane.phase / 40, 8) < 1.4; }
	act(action: Action): void {
		if (this.ended || action === 'release') return;
		if (this.hop > 0) { this.queued = action; return; }
		const dx = action === 'left' ? -50 : action === 'right' ? 50 : 0;
		const dy = action === 'down' ? -1 : action === 'up' || action === 'primary' ? 1 : 0;
		if (!dx && !dy) return;
		this.fromX = this.x; this.fromRow = this.row;
		this.x = clamp(this.x + dx, 25, 375); this.row = Math.max(0, this.row + dy);
		this.hop = 0.14;
		this.events++;
	}
	protected step(dt: number): void {
		this.hop = Math.max(0, this.hop - dt);
		if (this.row > this.furthest && !this.hop) { this.furthest = this.row; this.lastProgress = this.time; this.score = this.furthest; }
		const target = Math.max(0, this.furthest - 3);
		this.camera += (target - this.camera) * (1 - Math.exp(-6 * dt));
		if (this.time - this.lastProgress > 6) this.camera = Math.max(this.camera, target + (this.time - this.lastProgress - 6) * 1.2);
		if (this.row < this.camera - 1.3) this.finish('Keep hopping—the screen caught up.');
		const lane = this.lanes.find(lane => lane.row === this.row);
		if (lane && !this.hop) {
			const objects = this.objects(lane);
			if (lane.kind === 'river') {
				if (!objects.some(x => this.x >= x + 9 && this.x <= x + lane.width - 9)) this.finish('Splash! Land in the middle of a log.');
				else { this.x += lane.speed * dt; if (this.x < 10 || this.x > 390) this.finish('The log carried you away.'); }
			} else if (lane.kind !== 'grass') {
				const width = lane.kind === 'rail' ? 310 : lane.width;
				if (objects.some(x => this.x + 12 > x && this.x - 12 < x + width)) this.finish(lane.kind === 'rail' ? 'Watch the railway signals.' : 'Traffic! Wait for a gap.');
			}
		}
		if (!this.hop && this.queued) { const action = this.queued; this.queued = null; this.act(action); }
		this.populate();
	}
}
