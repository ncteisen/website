export type CollectionId = 'sarah-skis' | 'crossy-sarah' | 'sarah-swings' | 'sarah-stacks' | 'sarah-rolls';
export type Action = 'left' | 'right' | 'up' | 'down' | 'primary' | 'release';
export type Controls = { axis: number; target: number | null; held: boolean };
export const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
export const mod = (value: number, size: number) => (value % size + size) % size;
export const idleControls = (): Controls => ({ axis: 0, target: null, held: false });

export abstract class World {
	abstract readonly kind: CollectionId;
	time = 0;
	score = 0;
	ended = false;
	reason = '';
	message = '';
	messageUntil = 0;
	events = 0;
	constructor(public random: () => number = Math.random) {}
	update(dt: number, controls: Controls): void {
		if (this.ended) return;
		this.time += dt;
		this.step(dt, controls);
	}
	protected abstract step(dt: number, controls: Controls): void;
	abstract act(action: Action): void;
	protected finish(reason: string): void { this.ended = true; this.reason = reason; }
	protected announce(message: string): void { this.message = message; this.messageUntil = this.time + 1.4; this.events++; }
}
