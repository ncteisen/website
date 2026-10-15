import { clamp, idleControls, type Action, type CollectionId } from './core';

/** Primary pointer capture keeps drags/holds active when a finger leaves the canvas. */
export class Input {
	readonly controls = idleControls();
	private events = new AbortController();
	private keys = new Set<string>();
	private pointer: number | null = null;
	private startX = 0;
	private startY = 0;
	private pointerAxis = 0;
	constructor(private canvas: HTMLCanvasElement, root: HTMLElement, private kind: CollectionId, private action: (action: Action) => void, private wake: () => boolean, pause: () => void) {
		const signal = this.events.signal;
		const down = (event: PointerEvent, buttonAction?: Action) => {
			if (!event.isPrimary || this.pointer !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
			event.preventDefault(); this.pointer = event.pointerId; this.startX = event.clientX; this.startY = event.clientY;
			(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
			const active = this.wake(); this.canvas.focus({ preventScroll: true });
			this.controls.held = true;
			if (buttonAction) {
				if (kind === 'sarah-skis' || kind === 'sarah-rolls') this.pointerAxis = buttonAction === 'left' ? -1 : 1;
				else if (active || kind !== 'sarah-stacks') this.action(buttonAction);
			} else {
				this.position(event);
				if (kind === 'sarah-stacks' && active) this.action('primary');
			}
			this.syncAxis();
		};
		canvas.addEventListener('pointerdown', event => down(event), { signal });
		canvas.addEventListener('pointermove', event => { if (event.pointerId === this.pointer) { event.preventDefault(); this.position(event); this.syncAxis(); } }, { signal });
		const up = (event: PointerEvent) => {
			if (event.pointerId !== this.pointer) return;
			event.preventDefault();
			if (kind === 'crossy-sarah' && event.type === 'pointerup' && event.target === canvas) {
				const dx = event.clientX - this.startX, dy = event.clientY - this.startY;
				this.action(Math.max(Math.abs(dx), Math.abs(dy)) < 18 ? 'up' : Math.abs(dx) > Math.abs(dy) ? dx < 0 ? 'left' : 'right' : dy < 0 ? 'up' : 'down');
			}
			this.pointer = null; this.pointerAxis = 0; this.controls.target = null; this.controls.held = false; this.syncAxis(); this.action('release');
		};
		root.addEventListener('pointerup', up, { signal });
		root.addEventListener('pointercancel', up, { signal });
		root.addEventListener('lostpointercapture', up, { signal });
		root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach(button => {
			const action = button.dataset.action as Action;
			button.addEventListener('pointerdown', event => down(event, action), { signal });
			button.addEventListener('click', event => { if (event.detail === 0) { const active = this.wake(); if (active || kind !== 'sarah-stacks') this.action(action); } }, { signal });
		});
		window.addEventListener('keydown', event => {
			if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
			if (['KeyP', 'Escape'].includes(event.code) && !event.repeat) { event.preventDefault(); pause(); return; }
			const actions: Record<string, Action> = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', Space: 'primary' };
			const action = actions[event.code]; if (!action) return;
			if (event.code === 'Space' && event.target instanceof HTMLButtonElement) return;
			event.preventDefault(); if (event.repeat) return;
			this.keys.add(event.code); this.syncAxis();
			const active = this.wake();
			if (kind !== 'sarah-stacks' || active) this.action(action);
		}, { signal });
		window.addEventListener('keyup', event => {
			this.keys.delete(event.code); this.syncAxis();
			if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') this.action('release');
		}, { signal });
	}
	private position(event: PointerEvent): void {
		const rect = this.canvas.getBoundingClientRect();
		const x = clamp((event.clientX - rect.left) / rect.width * 400, 0, 400);
		if (this.kind === 'sarah-skis') this.controls.target = x;
		if (this.kind === 'sarah-rolls') this.pointerAxis = x < 200 ? -1 : 1;
	}
	private syncAxis(): void {
		const left = this.keys.has('ArrowLeft') || this.keys.has('KeyA');
		const right = this.keys.has('ArrowRight') || this.keys.has('KeyD');
		this.controls.axis = Number(right) - Number(left) || this.pointerAxis;
	}
	clear(notify = true): void { this.pointer = null; this.pointerAxis = 0; this.keys.clear(); Object.assign(this.controls, idleControls()); if (notify) this.action('release'); }
	cleanup(): void { this.clear(); this.events.abort(); }
}
