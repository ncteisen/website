import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

// Rasterize the supplied proof, including its final lettering. Never substitute
// the earlier illustration/lettering package for these finished pages.
const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/manga/import-proof.mjs /path/to/proof.pdf');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const base = '/writing/to-sleep-perchance-to-dream/manga/proof';
const output = join(root, 'public', base);
const scratch = mkdtempSync(join(tmpdir(), 'manga-proof-'));
const pdf = readFileSync(source);
const pageCount = Number(execFileSync('pdfinfo', [source], { encoding: 'utf8' }).match(/^Pages:\s+(\d+)/m)?.[1]);
if (!pageCount) throw new Error('Could not read the PDF page count.');

try {
	mkdirSync(output, { recursive: true });
	execFileSync('pdftoppm', ['-scale-to-x', '1600', '-scale-to-y', '-1', '-png', source, join(scratch, 'page')]);
	const renders = readdirSync(scratch).filter((name) => name.endsWith('.png')).sort();
	if (renders.length !== pageCount) throw new Error(`Expected ${pageCount} rendered pages; found ${renders.length}.`);
	const pages = [];
	for (const [index, render] of renders.entries()) {
		const name = `page-${String(index).padStart(2, '0')}`;
		const input = join(scratch, render);
		const { width, height } = await sharp(input).metadata();
		await sharp(input).webp({ quality: 88, effort: 5 }).toFile(join(output, `${name}.webp`));
		await sharp(input).resize({ width: 800 }).webp({ quality: 88, effort: 5 }).toFile(join(output, `${name}-800.webp`));
		pages.push({
			number: index,
			label: index === 0 ? 'Cover' : `Page ${index}`,
			image: `${base}/${name}.webp`,
			smallImage: `${base}/${name}-800.webp`,
			width,
			height,
		});
	}
	const pdfName = 'to-sleep-perchance-to-dream.pdf';
	copyFileSync(source, join(output, pdfName));
	writeFileSync(join(root, 'src/data/sleep_manga.json'), `${JSON.stringify({
		title: 'To Sleep, Perchance to Dream',
		sourceSha256: createHash('sha256').update(pdf).digest('hex'),
		pdf: `${base}/${pdfName}`,
		pdfBytes: pdf.length,
		pages,
	}, null, '\t')}\n`);
	console.log(`Imported ${pages.length} pages and the original PDF.`);
} finally {
	rmSync(scratch, { recursive: true, force: true });
}
