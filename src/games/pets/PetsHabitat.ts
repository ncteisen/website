import { CODEX_PETS, type PetManifest } from './pets';

const CELL_WIDTH = 192;
const CELL_HEIGHT = 208;

const SPRITE_ROWS = {
	idle: { row: 0, frames: 6, frameMs: [280, 110, 110, 140, 140, 320] },
	'running-right': { row: 1, frames: 8, frameMs: [120, 120, 120, 120, 120, 120, 120, 220] },
	'running-left': { row: 2, frames: 8, frameMs: [120, 120, 120, 120, 120, 120, 120, 220] },
	waving: { row: 3, frames: 4, frameMs: [140, 140, 140, 280] },
	jumping: { row: 4, frames: 5, frameMs: [110, 120, 160, 120, 130] },
	failed: { row: 5, frames: 8, frameMs: [120, 120, 120, 120, 120, 120, 120, 220] },
	waiting: { row: 6, frames: 6, frameMs: [260, 140, 140, 180, 140, 320] },
	running: { row: 7, frames: 6, frameMs: [120, 120, 120, 120, 120, 220] },
	review: { row: 8, frames: 6, frameMs: [220, 160, 160, 180, 160, 280] },
} as const;

type SpriteState = keyof typeof SPRITE_ROWS;
type PetAction = 'idle' | 'walk' | 'wave' | 'jump' | 'waiting';
type Direction = -1 | 1;

interface PetActor {
	manifest: PetManifest;
	image: HTMLImageElement;
	x: number;
	y: number;
	targetX: number;
	targetY: number;
	facing: Direction;
	action: PetAction;
	spriteState: SpriteState;
	frameIndex: number;
	frameElapsedMs: number;
	actionTimer: number;
	interactionCooldown: number;
	jumpElapsed: number;
	jumpDuration: number;
	speed: number;
	sizeBias: number;
}

class SeededRandom {
	private seed: number;

	constructor(seed = Date.now()) {
		this.seed = seed >>> 0;
	}

	public next(): number {
		this.seed += 0x6d2b79f5;
		let value = this.seed;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	}

	public range(min: number, max: number): number {
		return min + (max - min) * this.next();
	}
}

export class PetsHabitat {
	private readonly canvas: HTMLCanvasElement;
	private readonly ctx: CanvasRenderingContext2D;
	private readonly manifest: readonly PetManifest[];
	private readonly random = new SeededRandom();
	private readonly pets: PetActor[] = [];
	private resizeObserver?: ResizeObserver;
	private animationFrame = 0;
	private lastTimestamp = 0;
	private worldWidth = 820;
	private worldHeight = 510;
	private isReady = false;
	private isDisposed = false;

	private readonly handleWindowResize = (): void => {
		this.resizeCanvas();
	};

	constructor(canvasId: string, manifest: readonly PetManifest[] = CODEX_PETS) {
		const canvas = document.getElementById(canvasId);
		if (!(canvas instanceof HTMLCanvasElement)) {
			throw new Error(`Pets canvas "${canvasId}" was not found.`);
		}

		const context = canvas.getContext('2d');
		if (!context) {
			throw new Error('Pets could not start because canvas rendering is unavailable.');
		}

		this.canvas = canvas;
		this.ctx = context;
		this.manifest = manifest;
	}

	public start(): void {
		this.resizeCanvas();
		this.observeResize();
		this.draw();

		void this.loadPets()
			.then(() => {
				if (this.isDisposed) return;

				this.spawnPets();
				this.isReady = true;
				this.canvas.dispatchEvent(new CustomEvent('pets-habitat:ready', { bubbles: true }));
				this.lastTimestamp = performance.now();
				this.animationFrame = window.requestAnimationFrame(this.tick);
			})
			.catch((error: unknown) => {
				console.error('Unable to load Codex pets.', error);
				this.canvas.dispatchEvent(new CustomEvent('pets-habitat:error', { bubbles: true }));
				this.drawErrorState();
			});
	}

	public cleanup(): void {
		this.isDisposed = true;
		window.cancelAnimationFrame(this.animationFrame);
		window.removeEventListener('resize', this.handleWindowResize);
		this.resizeObserver?.disconnect();
	}

	private async loadPets(): Promise<void> {
		const actors = await Promise.all(
			this.manifest.map(async (pet) => ({
				pet,
				image: await this.loadImage(pet.spritePath),
			})),
		);

		for (const actor of actors) {
			this.pets.push(this.createPetActor(actor.pet, actor.image));
		}
	}

	private loadImage(src: string): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const image = new Image();
			image.onload = () => resolve(image);
			image.onerror = () => reject(new Error(`Unable to load sprite: ${src}`));
			image.src = src;
		});
	}

	private observeResize(): void {
		window.addEventListener('resize', this.handleWindowResize);

		if ('ResizeObserver' in window && this.canvas.parentElement) {
			this.resizeObserver = new ResizeObserver(() => this.resizeCanvas());
			this.resizeObserver.observe(this.canvas.parentElement);
		}
	}

	private resizeCanvas(): void {
		const rect = this.canvas.getBoundingClientRect();
		const width = Math.max(300, rect.width || this.worldWidth);
		const height = Math.max(260, rect.height || width * 0.62);
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const nextWidth = Math.round(width * dpr);
		const nextHeight = Math.round(height * dpr);

		if (this.canvas.width !== nextWidth || this.canvas.height !== nextHeight) {
			this.canvas.width = nextWidth;
			this.canvas.height = nextHeight;
		}

		this.worldWidth = width;
		this.worldHeight = height;
		this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		this.clampAllPets();
		this.draw();
	}

	private spawnPets(): void {
		const count = this.pets.length;
		this.pets.forEach((pet, index) => {
			const slot = (index + 1) / (count + 1);
			pet.x = this.worldWidth * slot + this.random.range(-26, 26);
			pet.y = this.randomFloorY();
			pet.targetX = pet.x;
			pet.targetY = pet.y;
			this.chooseNextAction(pet);
		});
		this.clampAllPets();
	}

	private createPetActor(manifest: PetManifest, image: HTMLImageElement): PetActor {
		const facing: Direction = this.random.next() > 0.5 ? 1 : -1;

		return {
			manifest,
			image,
			x: this.worldWidth / 2,
			y: this.randomFloorY(),
			targetX: this.worldWidth / 2,
			targetY: this.randomFloorY(),
			facing,
			action: 'idle',
			spriteState: 'idle',
			frameIndex: 0,
			frameElapsedMs: 0,
			actionTimer: this.random.range(0.8, 2.2),
			interactionCooldown: this.random.range(1.5, 4),
			jumpElapsed: 0,
			jumpDuration: 0.9,
			speed: this.random.range(34, 54),
			sizeBias: this.random.range(0.9, 1.08),
		};
	}

	private readonly tick = (timestamp: number): void => {
		if (this.isDisposed) return;

		const deltaSeconds = Math.min((timestamp - this.lastTimestamp) / 1000, 0.05);
		this.lastTimestamp = timestamp;

		this.update(deltaSeconds);
		this.draw();
		this.animationFrame = window.requestAnimationFrame(this.tick);
	};

	private update(deltaSeconds: number): void {
		for (const pet of this.pets) {
			pet.actionTimer -= deltaSeconds;
			pet.interactionCooldown = Math.max(0, pet.interactionCooldown - deltaSeconds);
			this.updateAction(pet, deltaSeconds);
			this.advanceFrames(pet, deltaSeconds);
		}

		this.separatePets();
		this.clampAllPets();
	}

	private updateAction(pet: PetActor, deltaSeconds: number): void {
		if (pet.actionTimer <= 0) {
			this.chooseNextAction(pet);
		}

		if (pet.action !== 'walk') return;

		const dx = pet.targetX - pet.x;
		const dy = pet.targetY - pet.y;
		const distance = Math.hypot(dx, dy);

		if (distance < 8) {
			this.setAction(pet, this.random.next() > 0.55 ? 'waiting' : 'idle');
			return;
		}

		const step = Math.min(distance, pet.speed * deltaSeconds);
		pet.x += (dx / distance) * step;
		pet.y += (dy / distance) * step * 0.68;

		if (Math.abs(dx) > 1) {
			pet.facing = dx > 0 ? 1 : -1;
		}

		pet.spriteState = this.runningSpriteState(pet);
	}

	private chooseNextAction(pet: PetActor): void {
		const neighbor = this.findNearestPet(pet);
		if (neighbor && neighbor.distance < this.worldWidth * 0.18 && pet.interactionCooldown <= 0 && this.random.next() > 0.62) {
			pet.facing = neighbor.pet.x > pet.x ? 1 : -1;
			this.setAction(pet, 'wave');
			pet.interactionCooldown = this.random.range(4.5, 8);
			return;
		}

		const roll = this.random.next();
		if (roll < 0.48) {
			this.setAction(pet, 'walk');
		} else if (roll < 0.68) {
			this.setAction(pet, 'idle');
		} else if (roll < 0.86) {
			this.setAction(pet, 'waiting');
		} else {
			this.setAction(pet, 'jump');
		}
	}

	private setAction(pet: PetActor, action: PetAction): void {
		pet.action = action;
		pet.frameIndex = 0;
		pet.frameElapsedMs = 0;

		if (action === 'walk') {
			const margin = this.petDrawSize(pet).width * 0.55;
			pet.targetX = this.random.range(margin, this.worldWidth - margin);
			pet.targetY = this.randomFloorY();
			pet.facing = pet.targetX >= pet.x ? 1 : -1;
			pet.spriteState = this.runningSpriteState(pet);
			pet.actionTimer = this.random.range(1.7, 4.1);
			return;
		}

		if (action === 'wave') {
			pet.spriteState = 'waving';
			pet.actionTimer = this.random.range(0.9, 1.35);
			return;
		}

		if (action === 'jump') {
			pet.spriteState = 'jumping';
			pet.jumpElapsed = 0;
			pet.jumpDuration = this.random.range(0.75, 1.05);
			pet.actionTimer = pet.jumpDuration;
			return;
		}

		pet.spriteState = action === 'waiting' ? 'waiting' : 'idle';
		pet.actionTimer = this.random.range(0.9, 2.7);
	}

	private runningSpriteState(pet: PetActor): SpriteState {
		const runningSprites = pet.manifest.runningSprites ?? {
			left: 'running-left',
			right: 'running-right',
		};

		return pet.facing > 0 ? runningSprites.right : runningSprites.left;
	}

	private advanceFrames(pet: PetActor, deltaSeconds: number): void {
		if (pet.action === 'jump') {
			pet.jumpElapsed = Math.min(pet.jumpDuration, pet.jumpElapsed + deltaSeconds);
		}

		const row = SPRITE_ROWS[pet.spriteState];
		pet.frameElapsedMs += deltaSeconds * 1000;

		let currentFrameMs = row.frameMs[pet.frameIndex] ?? 140;
		while (pet.frameElapsedMs >= currentFrameMs) {
			pet.frameElapsedMs -= currentFrameMs;
			pet.frameIndex = (pet.frameIndex + 1) % row.frames;
			currentFrameMs = row.frameMs[pet.frameIndex] ?? 140;
		}
	}

	private separatePets(): void {
		for (let index = 0; index < this.pets.length; index += 1) {
			for (let otherIndex = index + 1; otherIndex < this.pets.length; otherIndex += 1) {
				const first = this.pets[index];
				const second = this.pets[otherIndex];
				const dx = second.x - first.x;
				const dy = second.y - first.y;
				const distance = Math.max(1, Math.hypot(dx, dy));
				const minDistance = (this.petDrawSize(first).width + this.petDrawSize(second).width) * 0.32;

				if (distance >= minDistance) continue;

				const push = (minDistance - distance) * 0.012;
				const pushX = (dx / distance) * push;
				const pushY = (dy / distance) * push;
				first.x -= pushX;
				first.y -= pushY;
				second.x += pushX;
				second.y += pushY;
			}
		}
	}

	private findNearestPet(pet: PetActor): { pet: PetActor; distance: number } | undefined {
		let nearest: { pet: PetActor; distance: number } | undefined;

		for (const other of this.pets) {
			if (other === pet) continue;
			const distance = Math.hypot(other.x - pet.x, other.y - pet.y);
			if (!nearest || distance < nearest.distance) {
				nearest = { pet: other, distance };
			}
		}

		return nearest;
	}

	private clampAllPets(): void {
		for (const pet of this.pets) {
			const size = this.petDrawSize(pet);
			const marginX = size.width * 0.5;
			pet.x = this.clamp(pet.x, marginX, this.worldWidth - marginX);
			pet.y = this.clamp(pet.y, this.floorTop() + size.height * 0.38, this.floorBottom());
		}
	}

	private draw(): void {
		this.ctx.clearRect(0, 0, this.worldWidth, this.worldHeight);
		this.drawHabitat();

		if (!this.isReady) return;

		const petsByDepth = [...this.pets].sort((a, b) => a.y - b.y);
		for (const pet of petsByDepth) {
			this.drawPet(pet);
		}
	}

	private drawHabitat(): void {
		const ctx = this.ctx;
		const floorTop = this.floorTop();

		const wallGradient = ctx.createLinearGradient(0, 0, 0, this.worldHeight);
		wallGradient.addColorStop(0, '#111111');
		wallGradient.addColorStop(0.52, '#151412');
		wallGradient.addColorStop(1, '#1d2118');
		ctx.fillStyle = wallGradient;
		ctx.fillRect(0, 0, this.worldWidth, this.worldHeight);

		ctx.fillStyle = '#1f2b22';
		ctx.beginPath();
		ctx.moveTo(0, floorTop);
		ctx.lineTo(this.worldWidth, floorTop - 18);
		ctx.lineTo(this.worldWidth, this.worldHeight);
		ctx.lineTo(0, this.worldHeight);
		ctx.closePath();
		ctx.fill();

		ctx.fillStyle = 'rgba(112, 83, 48, 0.42)';
		for (let x = 22; x < this.worldWidth; x += 74) {
			this.roundedRect(x, floorTop - 70, 12, 95, 4);
			ctx.fill();
		}

		ctx.fillStyle = '#7c5c35';
		this.roundedRect(12, floorTop - 46, this.worldWidth - 24, 11, 5);
		ctx.fill();
		ctx.fillStyle = '#a4773d';
		this.roundedRect(18, floorTop - 30, this.worldWidth - 36, 8, 4);
		ctx.fill();

		ctx.strokeStyle = 'rgba(231, 215, 175, 0.07)';
		ctx.lineWidth = 1;
		for (let y = floorTop + 26; y < this.worldHeight; y += 28) {
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(this.worldWidth, y - 12);
			ctx.stroke();
		}

		this.drawToy(this.worldWidth * 0.16, this.worldHeight - 44, '#d0a24a');
		this.drawToy(this.worldWidth * 0.83, this.worldHeight - 72, '#5b8ef0');
	}

	private drawToy(x: number, y: number, color: string): void {
		const ctx = this.ctx;
		ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
		ctx.beginPath();
		ctx.ellipse(x + 4, y + 9, 16, 5, 0, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.arc(x, y, 10, 0, Math.PI * 2);
		ctx.fill();

		ctx.strokeStyle = 'rgba(20, 20, 20, 0.35)';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.arc(x, y, 10, -0.4, 1.8);
		ctx.stroke();
	}

	private drawPet(pet: PetActor): void {
		const ctx = this.ctx;
		const row = SPRITE_ROWS[pet.spriteState];
		const size = this.petDrawSize(pet);
		const jumpOffset = this.jumpOffset(pet);
		const sourceX = pet.frameIndex * CELL_WIDTH;
		const sourceY = row.row * CELL_HEIGHT;
		const x = pet.x - size.width / 2;
		const y = pet.y - size.height - jumpOffset;

		ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
		ctx.beginPath();
		ctx.ellipse(pet.x, pet.y + 2, size.width * 0.28, size.height * 0.05, 0, 0, Math.PI * 2);
		ctx.fill();

		ctx.drawImage(pet.image, sourceX, sourceY, CELL_WIDTH, CELL_HEIGHT, x, y, size.width, size.height);
	}

	private drawErrorState(): void {
		this.drawHabitat();
		this.ctx.fillStyle = '#c77c62';
		this.ctx.font = '500 13px DM Sans, sans-serif';
		this.ctx.textAlign = 'center';
		this.ctx.fillText('The pets wandered off for a minute.', this.worldWidth / 2, this.worldHeight / 2);
	}

	private petDrawSize(pet: PetActor): { width: number; height: number } {
		const floorRange = Math.max(1, this.floorBottom() - this.floorTop());
		const depth = this.clamp((pet.y - this.floorTop()) / floorRange, 0, 1);
		const targetHeight = this.clamp(this.worldWidth / 7.5, 66, 106) * pet.sizeBias * (0.9 + depth * 0.2);
		const scale = targetHeight / CELL_HEIGHT;
		return {
			width: CELL_WIDTH * scale,
			height: CELL_HEIGHT * scale,
		};
	}

	private jumpOffset(pet: PetActor): number {
		if (pet.action !== 'jump') return 0;

		const progress = this.clamp(pet.jumpElapsed / pet.jumpDuration, 0, 1);
		return Math.sin(progress * Math.PI) * this.petDrawSize(pet).height * 0.28;
	}

	private randomFloorY(): number {
		const floorTop = this.floorTop();
		const floorBottom = this.floorBottom();
		return this.random.range(floorTop + (floorBottom - floorTop) * 0.28, floorBottom);
	}

	private floorTop(): number {
		return this.worldHeight * 0.45;
	}

	private floorBottom(): number {
		return this.worldHeight - 28;
	}

	private roundedRect(x: number, y: number, width: number, height: number, radius: number): void {
		const ctx = this.ctx;
		const safeRadius = Math.min(radius, width / 2, height / 2);
		ctx.beginPath();
		ctx.moveTo(x + safeRadius, y);
		ctx.lineTo(x + width - safeRadius, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
		ctx.lineTo(x + width, y + height - safeRadius);
		ctx.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
		ctx.lineTo(x + safeRadius, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
		ctx.lineTo(x, y + safeRadius);
		ctx.quadraticCurveTo(x, y, x + safeRadius, y);
		ctx.closePath();
	}

	private clamp(value: number, min: number, max: number): number {
		return Math.min(Math.max(value, min), max);
	}
}
