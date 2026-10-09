import type { Platform } from './Platform.ts';

export const WORLD_WIDTH = 400;
export const WORLD_HEIGHT = 600;
export const GRAVITY = 1900;
export const JUMP_SPEED = 780;
export const MOVE_SPEED = 460;

export interface Steering {
	axis: number;
	target: number | null;
}

/** World coordinates: x is the body's center, y is the feet. No browser state. */
export class Player {
	x = WORLD_WIDTH / 2;
	y = 550;
	previousX = this.x;
	previousY = this.y;
	velocityY = -JUMP_SPEED;
	facingLeft = false;
	bounceAge = 1;
	readonly halfWidth = 12;

	update(dt: number, steering: Steering): void {
		this.previousX = this.x;
		this.previousY = this.y;
		const distance = steering.target === null ? steering.axis * MOVE_SPEED * dt : steering.target - this.x;
		const movement = Math.max(-MOVE_SPEED * dt, Math.min(MOVE_SPEED * dt, distance));
		this.x = Math.max(18, Math.min(WORLD_WIDTH - 18, this.x + movement));
		if (Math.abs(movement) > 0.05) this.facingLeft = movement < 0;
		this.velocityY = Math.min(1000, this.velocityY + GRAVITY * dt);
		this.y += this.velocityY * dt;
		this.bounceAge += dt;
	}

	/** Sweep feet against a moving platform instead of checking a narrow landing band. */
	landingTime(platform: Platform): number | null {
		if (this.velocityY <= 0 || platform.broken) return null;
		const before = this.previousY - platform.previousY;
		const after = this.y - platform.y;
		if (before > 0.01 || after < 0 || after <= before) return null;
		const time = Math.max(0, -before / (after - before));
		const x = this.previousX + (this.x - this.previousX) * time;
		const platformX = platform.previousX + (platform.x - platform.previousX) * time;
		return x + this.halfWidth >= platformX && x - this.halfWidth <= platformX + platform.width ? time : null;
	}

	land(platform: Platform): void {
		this.y = platform.y;
		this.velocityY = -JUMP_SPEED;
		this.bounceAge = 0;
		platform.land();
	}
}
