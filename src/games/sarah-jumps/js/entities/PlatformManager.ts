import { Platform, type PlatformType } from './Platform.ts';
import { WORLD_WIDTH, WORLD_HEIGHT } from './Player.ts';

/** A bounded ribbon of platforms; randomness is injectable for repeatable checks. */
export class PlatformManager {
	platforms: Platform[] = [];
	private topY = 550;
	private topCenter = WORLD_WIDTH / 2;
	private count = 0;

	constructor(private random: () => number = Math.random) { this.reset(); }

	reset(): void {
		this.topY = 550;
		this.topCenter = WORLD_WIDTH / 2;
		this.count = 0;
		this.platforms = [new Platform(130, 550, 140)];
		this.fill(0);
	}

	update(dt: number, camera: number): void {
		for (const platform of this.platforms) platform.update(dt);
		// In-place compaction avoids allocating arrays during every physics step.
		let live = 0;
		for (const platform of this.platforms) {
			if (platform.y + camera < WORLD_HEIGHT + 60 && platform.fade > 0) this.platforms[live++] = platform;
		}
		this.platforms.length = live;
		this.fill(camera);
	}

	private fill(camera: number): void {
		while (this.topY + camera > -180) {
			this.count++;
			const difficulty = Math.min(1, this.count / 65);
			const width = 100 - difficulty * 24;
			// Gaps remain below the 157px jump apex, including vertical motion.
			// Lateral travel is bounded, including moving-platform endpoints.
			this.topY -= 78 + this.random() * 24 + difficulty * 18;
			this.topCenter = Math.max(68, Math.min(WORLD_WIDTH - 68, this.topCenter + (this.random() - 0.5) * 190));
			const roll = this.random();
			let type: PlatformType = 'normal';
			// Teach one mechanic at a time, leaving a stable landing after each special.
			if (this.count > 8 && this.count % 2 === 0) {
				if (roll < 0.28) type = 'horizontal';
				else if (this.count > 18 && roll < 0.45) type = 'dissolving';
				else if (this.count > 30 && roll < 0.6) type = 'vertical';
			}
			this.platforms.push(new Platform(this.topCenter - width / 2, this.topY, width, type));
		}
	}
}
