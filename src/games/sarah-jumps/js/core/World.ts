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

	constructor(random: () => number = Math.random) { this.platforms = new PlatformManager(random); }

	update(dt: number, steering: Steering): Platform | null {
		if (this.ended) return null;
		this.previousCamera = this.camera;
		this.platforms.update(dt, this.camera);
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
