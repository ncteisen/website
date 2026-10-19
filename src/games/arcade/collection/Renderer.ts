import sarah from '../../sarah-jumps/assets/sprites/player-jumping-flipped.png';
import type { CollectionWorld } from './worlds';
import type { Skis } from './Skis';
import type { Crossy } from './Crossy';
import type { Stacks } from './Stacks';
import type { Rolls } from './Rolls';
import { mod } from './core';

export class Renderer {
	private ctx: CanvasRenderingContext2D;
	private image = new Image();
	private loaded = false;
	private skies = new Map<string, CanvasGradient>();
	height = 600;
	readonly ready: Promise<void>;
	constructor(private canvas: HTMLCanvasElement) {
		const context = canvas.getContext('2d', { alpha: false });
		if (!context) throw new Error('Canvas is unavailable');
		this.ctx = context;
		this.ready = new Promise(resolve => {
			this.image.onload = () => { this.loaded = true; resolve(); };
			this.image.onerror = () => resolve();
			this.image.src = sarah.src;
		});
	}
	resize(): void {
		const bounds = this.canvas.getBoundingClientRect();
		if (!bounds.width || !bounds.height) return;
		this.height = bounds.height / bounds.width * 400;
		const dpr = Math.min(devicePixelRatio || 1, 2);
		this.canvas.width = Math.round(bounds.width * dpr); this.canvas.height = Math.round(bounds.height * dpr);
		this.ctx.setTransform(this.canvas.width / 400, 0, 0, this.canvas.height / this.height, 0, 0);
		this.ctx.imageSmoothingEnabled = false;
		this.skies.clear();
	}
	private rect(x: number, y: number, w: number, h: number, color: string, radius = 0): void {
		this.ctx.fillStyle = color;
		if (radius) { this.ctx.beginPath(); this.ctx.roundRect(x, y, w, h, radius); this.ctx.fill(); }
		else this.ctx.fillRect(x, y, w, h);
	}
	private circle(x: number, y: number, r: number, color: string): void {
		this.ctx.fillStyle = color; this.ctx.beginPath(); this.ctx.arc(x, y, r, 0, Math.PI * 2); this.ctx.fill();
	}
	private line(points: number[][], color: string, width = 2): void {
		this.ctx.strokeStyle = color; this.ctx.lineWidth = width; this.ctx.beginPath();
		points.forEach(([x, y], i) => i ? this.ctx.lineTo(x, y) : this.ctx.moveTo(x, y)); this.ctx.stroke();
	}
	private poly(points: number[][], color: string): void {
		this.ctx.fillStyle = color; this.ctx.beginPath();
		points.forEach(([x, y], i) => i ? this.ctx.lineTo(x, y) : this.ctx.moveTo(x, y)); this.ctx.closePath(); this.ctx.fill();
	}
	private sky(top: string, bottom: string): void {
		const key = top + bottom;
		if (!this.skies.has(key)) { const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height); gradient.addColorStop(0, top); gradient.addColorStop(1, bottom); this.skies.set(key, gradient); }
		this.ctx.fillStyle = this.skies.get(key)!; this.ctx.fillRect(0, 0, 400, this.height);
	}
	private text(text: string, x: number, y: number, color = '#345059', size = 12): void {
		this.ctx.fillStyle = color; this.ctx.font = `600 ${size}px system-ui, sans-serif`; this.ctx.textAlign = 'center'; this.ctx.fillText(text, x, y);
	}
	private sprite(x: number, bottom: number, size = 48, flip = false, angle = 0): void {
		const ctx = this.ctx; ctx.save(); ctx.translate(x, bottom - size / 2); ctx.rotate(angle); if (flip) ctx.scale(-1, 1);
		if (this.loaded) ctx.drawImage(this.image, -size / 2, -size / 2, size, size);
		else { this.circle(0, -12, 7, '#f0c298'); this.rect(-6, -5, 12, 21, '#30483f'); }
		ctx.restore();
	}
	private tree(x: number, y: number, snow = false): void {
		this.rect(x - 3, y - 8, 6, 15, '#80735f');
		this.poly([[x - 23, y], [x, y - 49], [x + 23, y]], '#39766c');
		this.poly([[x - 17, y - 18], [x, y - 58], [x + 17, y - 18]], '#548c7d');
		if (snow) this.poly([[x - 13, y - 27], [x, y - 58], [x + 13, y - 27], [x + 4, y - 32], [x, y - 27], [x - 5, y - 32]], '#fffdf5');
	}
	private star(x: number, y: number): void {
		const points = Array.from({ length: 10 }, (_, i) => { const a = i * Math.PI / 5 - Math.PI / 2, r = i % 2 ? 6 : 13; return [x + Math.cos(a) * r, y + Math.sin(a) * r]; });
		this.poly(points, '#d89232'); this.circle(x - 2, y - 3, 3, '#ffed9c');
	}
	render(world: CollectionWorld): void {
		switch (world.kind) {
			case 'sarah-skis': this.skis(world); break;
			case 'crossy-sarah': this.crossy(world); break;
			case 'sarah-stacks': this.stacks(world); break;
			case 'sarah-rolls': this.rolls(world); break;
		}
		if (world.messageUntil > world.time) { this.rect(90, 70, 220, 30, '#fffc', 15); this.text(world.message, 200, 90); }
	}
	private skis(world: Skis): void {
		this.sky('#dcebf1', '#f8faf0');
		const y = Math.min(270, this.height * 0.34);
		this.poly([[0, 0], [46, 0], [28, this.height], [0, this.height]], '#b9d8dc');
		this.poly([[365, 0], [400, 0], [400, this.height], [382, this.height]], '#c6dfdf');
		for (let i = 0; i < 12; i++) { const cy = mod(i * 113 - world.distance * 0.6, this.height + 100) - 50; this.rect(52 + i * 83 % 300, cy, 7, 2, '#cbdfe4'); }
		for (const point of world.tracks) { const cy = y + point.at - world.distance; this.rect(point.x - 9, cy, 2, 8, '#c4dce1'); this.rect(point.x + 7, cy, 2, 8, '#c4dce1'); }
		for (const row of world.rows) {
			const cy = y + row.at - world.distance;
			if (cy < -100 || cy > this.height + 100) continue;
			for (const x of row.trees) this.tree(x, cy, true);
			for (const side of [-1, 1]) {
				const x = row.center + side * (row.gateHalfWidth + 3); this.rect(x, cy - 30, 3, 36, '#5a8093');
				this.poly([[x + 3, cy - 30], [x + 23, cy - 24], [x + 3, cy - 18]], '#e57b69');
			}
			if (row.ramp) { this.poly([[row.center - 25, cy - 55], [row.center + 25, cy - 55], [row.center + 19, cy - 76], [row.center - 19, cy - 76]], '#86bcc9'); this.line([[row.center - 17, cy - 67], [row.center, cy - 73], [row.center + 17, cy - 67]], '#edf8fb', 3); }
		}
		for (const ball of world.snowballs) {
			const ahead = ball.at - world.distance;
			const x = world.snowballX(ball), cy = y + ahead;
			if (ahead > 0 && ahead < world.speed * 2 && (x < 16 || x > 384)) {
				const edge = ball.direction > 0 ? 24 : 376;
				const warningY = y + 95;
				this.circle(edge, warningY, 17, '#d67565');
				this.text(ball.direction > 0 ? '→' : '←', edge, warningY + 5, '#fffdf4', 20);
				this.text('SNOWBALL', ball.direction > 0 ? 66 : 334, warningY + 33, '#9a5548', 10);
			}
			if (x < -24 || x > 424 || cy < -30 || cy > this.height + 30) continue;
			this.line([[x - ball.direction * 32, cy + 46], [x - ball.direction * 15, cy + 23]], '#a6c8d7', 5);
			this.circle(x + 3, cy + 7, 18, '#739c9c40');
			this.circle(x, cy, 17, '#86afc2'); this.circle(x - 2, cy - 3, 14, '#fffdf5');
			const spin = world.distance / 24 * ball.direction;
			this.circle(x + Math.cos(spin) * 8, cy + Math.sin(spin) * 8, 3, '#bdd6e1');
			this.circle(x - Math.cos(spin) * 7, cy - Math.sin(spin) * 7, 2, '#dcebf1');
		}
		const lift = Math.sin(world.air / 0.75 * Math.PI) * 36;
		this.ctx.fillStyle = '#739c9c30'; this.ctx.beginPath(); this.ctx.ellipse(world.x, y + 7, 18, 6, 0, 0, Math.PI * 2); this.ctx.fill();
		this.ctx.save(); this.ctx.translate(world.x, y - lift); this.ctx.rotate(-world.vx / 1500);
		this.line([[-10, -8], [-8, 14]], '#d56350', 4); this.line([[6, -8], [8, 14]], '#d56350', 4);
		this.sprite(0, 1, 48, world.vx < -20); this.ctx.restore();
		if (world.time > 30) {
			const yy = y - 150 + world.pursuit * 105;
			this.circle(world.x - 8, yy, 20, '#91a7b8'); this.circle(world.x - 8, yy - 7, 20, '#fffdf4');
			this.circle(world.x - 13, yy - 9, 2, '#33465b'); this.circle(world.x - 2, yy - 9, 2, '#33465b');
			this.rect(world.x - 16, yy + 13, 7, 9, '#91a7b8', 2); this.rect(world.x - 3, yy + 13, 7, 9, '#91a7b8', 2);
			this.text('YETI', 355, 87, '#587684', 10); this.rect(326, 93, 58, 4, '#bdd1d9', 2); this.rect(326, 93, Math.max(2, world.pursuit * 58), 4, '#d67565', 2);
		}
	}
	private crossy(world: Crossy): void {
		this.rect(0, 0, 400, this.height, '#bad3a1');
		const sy = (row: number) => this.height - 105 - (row - world.camera) * 48;
		for (const lane of world.lanes) {
			const y = sy(lane.row);
			if (y < -40 || y > this.height + 40) continue;
			const colors = { grass: '#b7d39c', road: '#657478', river: '#73aebe', rail: '#b3a78f' };
			this.rect(0, y - 24, 400, 48, colors[lane.kind]);
			if (lane.kind === 'grass') { for (let i = 0; i < 9; i++) this.rect((i * 71 + lane.row * 37) % 400, y + (i % 3) * 7 - 9, 3, 5, i % 3 ? '#9ebc83' : '#f5e1a5'); }
			if (lane.kind === 'road') { for (let i = 0; i < 8; i++) this.rect(i * 60, y - 23, 28, 2, '#b7c3b8'); }
			if (lane.kind === 'rail') {
				for (let i = 0; i < 20; i++) this.rect(i * 23, y - 17, 6, 34, '#8b806e');
				this.rect(0, y - 13, 400, 3, '#d9d7c5'); this.rect(0, y + 10, 400, 3, '#d9d7c5');
				this.circle(18, y - 16, 6, world.warning(lane) ? '#eb6250' : '#58635e');
			}
			if (lane.kind === 'river') { for (let i = 0; i < 8; i++) this.rect(mod(i * 70 + world.time * 16, 450) - 25, y + 17, 25, 2, '#a7d1d7'); }
			if (lane.kind !== 'grass') for (const x of world.objects(lane)) {
				if (lane.kind === 'river') { this.rect(x, y - 16, lane.width, 32, '#997654', 9); this.rect(x + 8, y - 12, lane.width - 16, 6, '#c09a6e', 2); this.line([[x + 12, y + 6], [x + lane.width - 12, y + 6]], '#7f6048', 2); }
				else {
					const width = lane.kind === 'rail' ? 310 : lane.width;
					this.rect(x + 3, y - 17, width - 6, 38, '#344a4b', 5);
					this.rect(x, y - 16, width, 30, lane.kind === 'rail' ? '#daa958' : lane.row % 2 ? '#df927e' : '#e9c772', 5);
					for (let j = 0; j < width - 20; j += 35) this.rect(x + j + 10, y - 12, 18, 20, '#4c6c78', 3);
				}
			}
		}
		const alpha = 1 - world.hop / 0.14;
		const x = world.fromX + (world.x - world.fromX) * alpha;
		const row = world.fromRow + (world.row - world.fromRow) * alpha;
		const hop = Math.sin(alpha * Math.PI) * 12;
		this.sprite(x, sy(row) + 19 - hop, 47, world.x < world.fromX);
		if (world.time - world.lastProgress > 5) this.text('KEEP MOVING ↑', 200, this.height - 28, '#3e5944', 13);
	}
	private stacks(world: Stacks): void {
		this.sky('#ddd8eb', '#f6dfcf');
		this.circle(315, 120, 37, '#fff0d7');
		for (let i = 0; i < 10; i++) { const height = 55 + (i * 47) % 110; this.rect(i * 47 - 15, this.height - height, 40, height, '#bcb2ca50', 3); }
		const floor = this.height - 75;
		const camera = Math.max(0, world.score - Math.floor((this.height - 230) / 24)) * 24;
		const blockY = (level: number) => floor - level * 24 + camera;
		this.rect(65, floor + 25 + camera, 270, 12, '#9e92af', 3);
		const drawBlock = (x: number, y: number, width: number, level: number) => {
			this.rect(x, y, width, 24, `hsl(${(185 + level * 12) % 360} 28% 58%)`, 2);
			this.rect(x + 2, y + 2, Math.max(1, width - 4), 5, '#ffffff45', 1);
			this.rect(x, y + 21, width, 3, '#443c6025');
		};
		for (const block of world.blocks) drawBlock(block.x, blockY(block.level), block.width, block.level);
		for (const cut of world.offcuts) drawBlock(cut.x, blockY(cut.level) + cut.y, cut.width, cut.level);
		const top = world.top;
		this.sprite(top.x + top.width / 2, blockY(top.level), 46);
		this.ctx.save(); this.ctx.setLineDash([3, 7]);
		this.line([[top.x, blockY(world.moving.level) - 58], [top.x, blockY(top.level)]], '#80718c50', 1);
		this.line([[top.x + top.width, blockY(world.moving.level) - 58], [top.x + top.width, blockY(top.level)]], '#80718c50', 1); this.ctx.restore();
		if (!world.ended) drawBlock(world.moving.x, blockY(world.moving.level) - 55, world.moving.width, world.moving.level);
		this.text('TAP TO DROP', 200, this.height - 25, '#6f607f', 12);
	}
	private rolls(world: Rolls): void {
		this.sky('#e9dfc6', '#f5edda');
		const offset = this.height * 0.6 - 400;
		this.circle(320, 110, 34, '#fff9e7');
		for (let i = 0; i < 8; i++) { const x = mod(i * 150 - world.camera * 0.15, 900) - 150; this.circle(x, this.height * 0.78, 125, i % 2 ? '#c5d3ac' : '#d2dcbb'); }
		for (const ledge of world.ledges) {
			const x = ledge.x - world.camera, y = ledge.y + offset;
			if (ledge.collapsed) {
				const fall = Math.min(200, ((ledge.crumble || 0) - 0.85) * 220);
				for (let i = 0; i < 5; i++) this.rect(x + i * ledge.width / 5, y + fall + i * 8, 17, 9, '#b7a18388', 2);
				continue;
			}
			this.rect(x, y, ledge.width, ledge.crumble !== undefined ? 22 : this.height, '#b7a183', 6); this.rect(x, y, ledge.width, 11, '#7e9e6e', 4);
			this.rect(x + 8, y + 14, ledge.width - 16, 5, '#d0b99a', 2);
			if (ledge.crumble !== undefined) {
				for (let i = 4; i < ledge.width - 5; i += 18) this.line([[x + i, y + 2], [x + i + 9, y + 10]], '#f1cd82', 4);
				this.line([[x + ledge.width * 0.4, y + 10], [x + ledge.width * 0.5, y + 14], [x + ledge.width * 0.43, y + 18], [x + ledge.width * 0.54, y + 21]], '#8d725a', 2 + ledge.crumble * 3);
				if (ledge.crumble > 0) this.rect(x, y - 6, ledge.width * Math.max(0, 1 - ledge.crumble / 0.85), 3, '#c97346', 1);
			}
			this.rect(x + ledge.width - 52, y - 4, 44, 7, ledge.boost ? '#c9952e' : '#d67d58', 2);
			for (let i = 0; i < 3; i++) this.poly([[x + ledge.width - 47 + i * 12, y - 6], [x + ledge.width - 43 + i * 12, y - (ledge.boost ? 19 : 12)], [x + ledge.width - 39 + i * 12, y - 6]], ledge.boost ? '#ffe8a0' : '#edb975');
			if (ledge.bumper) {
				const bx = world.bumperX(ledge) - world.camera, by = world.bumperY(ledge) + offset;
				this.line([[bx, y - 160], [bx, by]], '#b49c8180', 2); this.circle(bx, by, 14, '#be6459'); this.circle(bx - 4, by - 4, 5, '#edb59d');
				const open = world.gateOpen(ledge);
				this.rect(bx - 18, y + 16, 36, 4, open ? '#668c60' : '#be6459', 2);
			}
			for (const star of ledge.stars) if (!star.collected && !star.missed) this.star(star.x - world.camera, star.y + offset);
		}
		for (const spark of world.sparks) {
			this.ctx.globalAlpha = spark.life / 0.4;
			this.circle(spark.x - world.camera, spark.y + offset, 3, '#d89232');
		}
		this.ctx.globalAlpha = 1;
		if (world.multiplier > 1) {
			this.rect(329, 77, 55, 35, '#fff4d9dd', 12);
			this.text(`×${world.multiplier}`, 356, 100, '#a66f20', 20);
		}
		const x = world.x - world.camera, y = world.y + offset;
		if (world.boostTime > 0) {
			for (let i = 1; i <= 3; i++) this.circle(x - i * 15, y + i * 3, 19 - i * 3, '#e7b44c30');
		}
		const stretch = Math.sin(world.springPulse / 0.24 * Math.PI) * 0.15;
		this.ctx.save(); this.ctx.translate(x, y); this.ctx.scale(1 - stretch, 1 + stretch); this.ctx.translate(-x, -y);
		this.circle(x, y, 25, '#ecf8ecb0');
		this.sprite(x, y + 19, 39, world.vx < -15);
		this.ctx.strokeStyle = '#577e72'; this.ctx.lineWidth = 2.5; this.ctx.beginPath(); this.ctx.arc(x, y, 24, 0, Math.PI * 2); this.ctx.stroke();
		this.ctx.save(); this.ctx.translate(x, y); this.ctx.rotate(world.angle);
		this.ctx.strokeStyle = '#7ea49490'; this.ctx.lineWidth = 2; this.ctx.beginPath(); this.ctx.ellipse(0, 0, 10, 24, 0, 0, Math.PI * 2); this.ctx.stroke(); this.ctx.restore();
		this.line([[x - 15, y - 10], [x - 11, y - 16], [x - 5, y - 19]], '#fffdf3', 3);
		this.ctx.restore();
	}
}
