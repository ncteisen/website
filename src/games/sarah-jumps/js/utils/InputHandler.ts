import { WORLD_WIDTH, type Steering } from '../entities/Player.ts';

export class InputHandler {
	private events = new AbortController();
	private keys = new Set<string>();
	private pointers = new Map<number, number>();
	private pointerId: number | null = null;
	private target: number | null = null;
	private bounds: DOMRect;
	private steering: Steering = { axis: 0, target: null };

	constructor(
		private canvas: HTMLCanvasElement,
		root: HTMLElement,
		private canSteer: () => boolean,
		private start: () => void,
		private pause: () => void,
		private canStartFromTouch: () => boolean = () => false,
	) {
		this.bounds = canvas.getBoundingClientRect();
		const signal = this.events.signal;
		canvas.addEventListener('pointerdown', this.handlePointerDown, { signal });
		canvas.addEventListener('pointermove', this.handlePointerMove, { signal });
		canvas.addEventListener('lostpointercapture', this.handlePointerUp, { signal });
		window.addEventListener('pointerup', this.handlePointerUp, { signal });
		window.addEventListener('pointercancel', this.handlePointerUp, { signal });
		window.addEventListener('keydown', this.handleKeyDown, { signal });
		window.addEventListener('keyup', event => this.keys.delete(event.code), { signal });
		window.addEventListener('blur', () => this.reset(), { signal });
		window.addEventListener('resize', this.measure, { signal });
		window.addEventListener('scroll', this.measure, { signal, capture: true, passive: true });
		for (const button of root.querySelectorAll<HTMLButtonElement>('[data-move]')) {
			button.addEventListener('pointerdown', event => {
				if (!this.canSteer() || (event.pointerType === 'mouse' && event.button !== 0)) return;
				event.preventDefault();
				button.setPointerCapture(event.pointerId);
				this.pointers.set(event.pointerId, Number(button.dataset.move));
				this.target = null;
			}, { signal });
			button.addEventListener('lostpointercapture', this.handlePointerUp, { signal });
		}
	}

	read(): Steering {
		let axis = Number(this.keys.has('ArrowRight') || this.keys.has('KeyD')) - Number(this.keys.has('ArrowLeft') || this.keys.has('KeyA'));
		for (const direction of this.pointers.values()) axis += direction;
		this.steering.axis = Math.sign(axis);
		this.steering.target = axis === 0 ? this.target : null;
		return this.steering;
	}

	reset(): void {
		this.keys.clear();
		this.pointers.clear();
		this.target = null;
		if (this.pointerId !== null && this.canvas.hasPointerCapture(this.pointerId)) this.canvas.releasePointerCapture(this.pointerId);
		this.pointerId = null;
	}

	cleanup(): void { this.reset(); this.events.abort(); }

	private measure = (): void => { this.bounds = this.canvas.getBoundingClientRect(); };
	private point(event: PointerEvent): void { this.target = (event.clientX - this.bounds.left) / this.bounds.width * WORLD_WIDTH; }

	private handlePointerDown = (event: PointerEvent): void => {
		if (this.pointerId !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
		if (!this.canSteer() && this.canStartFromTouch()) this.start();
		if (!this.canSteer()) return;
		event.preventDefault();
		this.canvas.focus({ preventScroll: true });
		this.measure();
		this.pointerId = event.pointerId;
		this.canvas.setPointerCapture(event.pointerId);
		this.point(event);
	};

	private handlePointerMove = (event: PointerEvent): void => {
		if (event.pointerId === this.pointerId) this.point(event);
	};

	private handlePointerUp = (event: PointerEvent): void => {
		this.pointers.delete(event.pointerId);
		if (event.pointerId === this.pointerId) { this.pointerId = null; this.target = null; }
	};

	private handleKeyDown = (event: KeyboardEvent): void => {
		if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
		if (['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD'].includes(event.code)) {
			if (!this.canSteer()) return;
			event.preventDefault(); this.keys.add(event.code);
		} else if (event.code === 'Space' && !(event.target instanceof HTMLButtonElement)) {
			event.preventDefault();
			if (!event.repeat && !this.canSteer()) this.start();
		} else if ((event.code === 'Escape' || event.code === 'KeyP') && !event.repeat) {
			event.preventDefault(); this.pause();
		}
	};
}
