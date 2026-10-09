import { GameEngine } from './core/GameEngine';

/** One mounted game owns one loop, input handler, and cleanup boundary. */
export class SarahJumps {
	readonly engine: GameEngine;

	constructor(root: HTMLElement) { this.engine = new GameEngine(root); }
	start(): Promise<void> { return this.engine.init(); }
	cleanup(): void { this.engine.cleanup(); }
}
