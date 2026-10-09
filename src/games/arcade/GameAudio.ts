/** Decode once; create lightweight audio sources at bounce time, including on iOS. */
export class GameAudio {
	private isEnabled = true;
	private context: AudioContext | null = null;
	private output: GainNode | null = null;
	private buffers = new Map<string, AudioBuffer>();

	get enabled(): boolean { return this.isEnabled; }
	set enabled(value: boolean) {
		this.isEnabled = value;
		if (this.output) this.output.gain.value = value ? 1 : 0;
	}

	unlock(): void {
		if (!this.enabled) return;
		try {
			if (!this.context) {
				this.context = new AudioContext();
				this.output = this.context.createGain();
				this.output.connect(this.context.destination);
				for (const name of ['jump', 'lose']) {
					void fetch(`/games/sarah-jumps/sounds/${name}.wav`)
						.then(response => response.arrayBuffer())
						.then(bytes => this.context?.decodeAudioData(bytes))
						.then(buffer => { if (buffer) this.buffers.set(name, buffer); })
						.catch(() => { /* The game is fully playable without audio. */ });
				}
			}
			void this.context.resume().catch(() => {});
		} catch { /* Audio is optional. */ }
	}

	play(name: 'jump' | 'lose'): void {
		const buffer = this.buffers.get(name);
		if (!this.enabled || !buffer || !this.output || this.context?.state !== 'running') return;
		const source = this.context.createBufferSource();
		const gain = this.context.createGain();
		source.buffer = buffer;
		gain.gain.value = name === 'jump' ? 0.22 : 0.3;
		source.connect(gain).connect(this.output);
		source.start();
	}

	cleanup(): void { void this.context?.close().catch(() => {}); }
}
