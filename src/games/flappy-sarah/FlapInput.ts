/** One impulse per press. No keyboard-repeat or synthetic click after a touch flap. */
export class FlapInput {
	private events = new AbortController();

	constructor(canvas: HTMLCanvasElement, button: HTMLButtonElement, flap: () => void, pause: () => void) {
		const signal = this.events.signal;
		const handlePointerDown = (event: PointerEvent) => {
			if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
			event.preventDefault();
			canvas.focus({ preventScroll: true });
			flap();
		};
		canvas.addEventListener('pointerdown', handlePointerDown, { signal });
		button.addEventListener('pointerdown', handlePointerDown, { signal });
		button.addEventListener('click', event => { if (event.detail === 0) flap(); }, { signal });
		window.addEventListener('keydown', event => {
			if (event.target instanceof HTMLElement && event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
			if (event.code === 'Space' && event.target instanceof HTMLButtonElement) return;
			if (event.code === 'Space' || event.code === 'ArrowUp') {
				event.preventDefault();
				if (!event.repeat) flap();
			} else if ((event.code === 'KeyP' || event.code === 'Escape') && !event.repeat) {
				event.preventDefault(); pause();
			}
		}, { signal });
	}

	cleanup(): void { this.events.abort(); }
}
