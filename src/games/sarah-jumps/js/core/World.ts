import { Player, WORLD_HEIGHT, type Steering } from '../entities/Player.ts';
import { PlatformManager } from '../entities/PlatformManager.ts';
import type { Platform } from '../entities/Platform.ts';

export class World {
	player = new Player();
	platforms: PlatformManager;
	camera = 0;
	previousCamera = 0;
	score = 0;
	landings = 0;
	ended = false;
	private extraHeight = 0;

	constructor(random: () => number = Math.random) { this.platforms = new PlatformManager(random); }

	setViewport(height: number): void {
		// Tall phones reveal more of the course above the fixed play camera.
		// Player coordinates, jump physics, scoring and the fall boundary stay fixed.
		this.extraHeight = Math.max(0, height - WORLD_HEIGHT);
		this.platforms.cover(this.camera + this.extraHeight);
	}

	update(dt: number, steering: Steering): Platform | null {
		if (this.ended) return null;
		this.previousCamera = this.camera;
		this.platforms.update(dt, this.camera, this.extraHeight);
		this.player.update(dt, steering);
		let landing: Platform | null = null;
		let firstTime = Infinity;
		for (const platform of this.platforms.platforms) {
			const time = this.player.landingTime(platform);
			if (time !== null && time < firstTime) { landing = platform; firstTime = time; }
		}
		if (landing) { this.player.land(landing); this.landings++; }
		this.camera = Math.max(this.camera, WORLD_HEIGHT * 0.43 - this.player.y);
		// Preserve the original score scale and saved personal bests.
		this.score = Math.floor(this.camera / 100);
		this.ended = this.player.y + this.camera > WORLD_HEIGHT + 65;
		return landing;
	}
}
