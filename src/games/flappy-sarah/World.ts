export const WIDTH = 400;
export const HEIGHT = 600;
export const FLOOR = 566;
export const PLAYER_X = 112;
export const RADIUS = 13;
// A short hop and quick fall reward a steady tapping rhythm.
export const GRAVITY = 1800;
export const FLAP_VELOCITY = -390;
export const PIPE_WIDTH = 64;
export const PIPE_SPACING = 230;
export const PIPE_SPEED = 165;
export const PIPE_GAP = 136;

export interface Pipe {
	x: number;
	previousX: number;
	center: number;
	gap: number;
	passed: boolean;
}

/** Independent of rendering/input, with repeatable course generation for checks. */
export class World {
	y = 280;
	previousY = this.y;
	velocity = 0;
	distance = 0;
	previousDistance = 0;
	flapAge = 0;
	score = 0;
	ended = false;
	pipes: Pipe[] = [];
	private lastCenter = 290;

	constructor(private random: () => number = Math.random) {
		this.spawn(480, true);
		this.spawn(480 + PIPE_SPACING);
		this.spawn(480 + PIPE_SPACING * 2);
	}

	flap(): void {
		if (this.ended) return;
		// Reset impulse instead of stacking it: rapid taps remain predictable.
		this.velocity = FLAP_VELOCITY;
		this.flapAge = 0;
	}

	update(dt: number): void {
		if (this.ended) return;
		this.previousY = this.y;
		this.previousDistance = this.distance;
		this.flapAge += dt;
		this.velocity = Math.min(620, this.velocity + GRAVITY * dt);
		this.y += this.velocity * dt;
		const travel = PIPE_SPEED * dt;
		this.distance += travel;
		for (const pipe of this.pipes) {
			pipe.previousX = pipe.x;
			pipe.x -= travel;
		}
		if (this.y - RADIUS <= 0 || this.y + RADIUS >= FLOOR) {
			this.y = Math.max(RADIUS, Math.min(FLOOR - RADIUS, this.y));
			this.ended = true;
			return;
		}
		for (const pipe of this.pipes) {
			if (this.hitsPipe(pipe)) { this.ended = true; return; }
			if (!pipe.passed && pipe.x + PIPE_WIDTH + 4 < PLAYER_X - RADIUS) {
				pipe.passed = true;
				this.score++;
			}
		}
		while (this.pipes.length && this.pipes[0].x + PIPE_WIDTH < -12) this.pipes.shift();
		const last = this.pipes[this.pipes.length - 1];
		if (!last || last.x < WIDTH + 32) this.spawn(last ? last.x + PIPE_SPACING : WIDTH + PIPE_SPACING);
	}

	private hitsPipe(pipe: Pipe): boolean {
		// The collision circle follows Sarah's torso, leaving hair/limbs forgiving.
		// 120Hz steps cap relative travel below the collision radius, even after stalls.
		const nearestX = Math.max(pipe.x - 4, Math.min(PLAYER_X, pipe.x + PIPE_WIDTH + 4));
		const dx = PLAYER_X - nearestX;
		if (Math.abs(dx) > RADIUS) return false;
		const top = pipe.center - pipe.gap / 2;
		const bottom = pipe.center + pipe.gap / 2;
		const topDistance = Math.max(0, this.y - top);
		const bottomDistance = Math.max(0, bottom - this.y);
		return dx * dx + Math.min(topDistance * topDistance, bottomDistance * bottomDistance) <= RADIUS * RADIUS;
	}

	private spawn(x: number, first = false): void {
		if (!first) this.lastCenter = Math.max(155, Math.min(405, this.lastCenter + (this.random() - 0.5) * 150));
		this.pipes.push({ x, previousX: x, center: this.lastCenter, gap: PIPE_GAP, passed: false });
	}
}
