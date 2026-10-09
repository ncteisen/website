import head from '../sarah-jumps/assets/sprites/player-jumping-flipped.png';
import body from './assets/bird-body.png';

export const birdSprite = {
	head,
	body,
	size: 40,
	drawSize: 64,
	pivot: { x: 20, y: 24 },
	bodyCrop: { x: 404, y: 294, width: 681, height: 416 },
	bodyPlacement: { x: 6, y: 17, width: 26, height: 16 },
	headCrop: { x: 14, y: 1, width: 13, height: 10 },
	headPlacement: { x: 18, y: 8 },
} as const;

const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
	const image = new Image();
	image.onload = () => resolve(image);
	image.onerror = reject;
	image.src = src;
});

/** Cache the wing poses once; gameplay needs only one drawImage per frame. */
export async function createBirdAtlas(): Promise<HTMLCanvasElement> {
	const [headImage, bodyImage] = await Promise.all([loadImage(head.src), loadImage(body.src)]);
	const { size, bodyCrop: bc, bodyPlacement: bp, headCrop: hc, headPlacement: hp } = birdSprite;
	const base = document.createElement('canvas');
	base.width = base.height = size;
	const ctx = base.getContext('2d')!;
	ctx.imageSmoothingEnabled = false;
	ctx.drawImage(bodyImage, bc.x, bc.y, bc.width, bc.height, bp.x, bp.y, bp.width, bp.height);

	// Lift the existing cream wing out of the body without redrawing its art.
	// Each row describes its exact outline in the 40px approved composition.
	const wingRows = [[18, 4], [16, 7], [15, 9], [13, 11], [13, 10], [14, 8], [15, 6]] as const;
	const wing = document.createElement('canvas');
	wing.width = wing.height = size;
	const wingCtx = wing.getContext('2d')!;
	wingRows.forEach(([x, width], row) => {
		const y = row + 21;
		wingCtx.drawImage(base, x, y, width, 1, x, y, width, 1);
		// The adjacent body pixel supplies the matching yellow for this row.
		const [r, g, b, a] = ctx.getImageData(24, y, 1, 1).data;
		ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a / 255})`;
		ctx.fillRect(x, y, width, 1);
	});

	const atlas = document.createElement('canvas');
	atlas.width = size * 4;
	atlas.height = size;
	const atlasCtx = atlas.getContext('2d')!;
	atlasCtx.imageSmoothingEnabled = false;
	[0.8, 0, -0.8, 0].forEach((angle, frame) => {
		atlasCtx.save();
		atlasCtx.beginPath(); atlasCtx.rect(frame * size, 0, size, size); atlasCtx.clip();
		atlasCtx.translate(frame * size, 0);
		atlasCtx.drawImage(base, 0, 0);
		atlasCtx.save();
		atlasCtx.translate(23, 24);
		atlasCtx.rotate(angle);
		atlasCtx.drawImage(wing, -23, -24);
		atlasCtx.restore();
		// The original cap, face and ponytail remain pixel-identical in every pose.
		atlasCtx.drawImage(headImage, hc.x, hc.y, hc.width, hc.height, hp.x, hp.y, hc.width, hc.height);
		atlasCtx.restore();
	});
	return atlas;
}
