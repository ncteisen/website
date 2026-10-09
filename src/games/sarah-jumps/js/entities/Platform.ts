import { WORLD_WIDTH } from './Player.ts';

export type PlatformType = 'normal' | 'horizontal' | 'vertical' | 'dissolving';

export class Platform {
	x: number;
	y: number;
	previousX: number;
	previousY: number;
	broken = false;
	fade = 1;
	pulse = 0;
	private age = 0;
	readonly range = 24;

	constructor(
		readonly baseX: number,
		readonly baseY: number,
		readonly width: number,
		readonly type: PlatformType = 'normal',
	) {
		this.x = this.previousX = baseX;
		this.y = this.previousY = baseY;
	}

	update(dt: number): void {
		this.previousX = this.x;
		this.previousY = this.y;
		this.age += dt;
		this.pulse = Math.max(0, this.pulse - dt * 5);
		if (this.type === 'horizontal') {
			this.x = Math.max(8, Math.min(WORLD_WIDTH - this.width - 8, this.baseX + Math.sin(this.age * 1.8) * this.range));
		} else if (this.type === 'vertical') {
			this.y = this.baseY + Math.sin(this.age * 1.8) * 9;
		}
		if (this.broken) this.fade = Math.max(0, this.fade - dt * 3.5);
	}

	land(): void {
		this.pulse = 1;
		if (this.type === 'dissolving') this.broken = true;
	}
}
