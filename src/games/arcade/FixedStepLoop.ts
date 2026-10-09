/** Seconds-based physics, one render per display refresh, no mobile frame cap. */
export class FixedStepLoop {
	private frameId: number | null = null;
	private previousTime: number | null = null;
	private accumulator = 0;
	private readonly step = 1 / 120;
	private running = false;

	constructor(
		private update: (seconds: number) => void,
		private render: (alpha: number) => void,
	) {}

	start(): void {
		if (this.running) return;
		this.running = true;
		this.previousTime = null;
		this.accumulator = 0;
		this.frameId = requestAnimationFrame(this.frame);
	}

	stop(): void {
		this.running = false;
		if (this.frameId !== null) cancelAnimationFrame(this.frameId);
		this.frameId = null;
		this.previousTime = null;
		this.accumulator = 0;
	}

	private frame = (time: number): void => {
		if (!this.running) return;
		// Bound catch-up after a stall. Backgrounding is handled by the owner.
		const elapsed = this.previousTime === null ? 0 : Math.min((time - this.previousTime) / 1000, 0.1);
		this.previousTime = time;
		this.accumulator += elapsed;
		while (this.accumulator + 1e-10 >= this.step && this.running) {
			this.accumulator -= this.step;
			this.update(this.step);
		}
		this.render(Math.max(0, this.accumulator / this.step));
		if (this.running) this.frameId = requestAnimationFrame(this.frame);
	};
}
