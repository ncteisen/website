import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const base = '/writing/to-sleep-perchance-to-dream/manga/proof';
const readPageCount = (source) => Number(execFileSync('pdfinfo', [source], { encoding: 'utf8' }).match(/^Pages:\s+(\d+)/m)?.[1]);
const renderPages = (source, scratch) => execFileSync('pdftoppm', ['-scale-to-x', '1600', '-scale-to-y', '-1', '-png', source, join(scratch, 'page')]);
const encodePage = async (input, output, name) => {
	const { width, height } = await sharp(input).metadata();
	if (!width || !height) throw new Error('Rendered page has no dimensions');
	await sharp(input).webp({ quality: 88, effort: 5 }).toFile(join(output, `${name}.webp`));
	await sharp(input).resize({ width: 800 }).webp({ quality: 88, effort: 5 }).toFile(join(output, `${name}-800.webp`));
	return { width, height };
};

// Immutable version directories + one atomic manifest swap keep the currently
// published proof complete even if rasterization, encoding, or publication fails.
export async function importProof(source, options = {}) {
	const { root = repoRoot, getPageCount = readPageCount, render = renderPages, encode = encodePage } = options;
	const output = join(root, 'public', base);
	const manifest = join(root, 'src/data/sleep_manga.json');
	const scratch = mkdtempSync(join(tmpdir(), 'manga-proof-'));
	let stage;
	let manifestStage;
	try {
		const input = join(scratch, 'proof.pdf');
		copyFileSync(source, input);
		const pdf = readFileSync(input);
		const sourceSha256 = createHash('sha256').update(pdf).digest('hex');
		const revision = `v1-${sourceSha256}`;
		const pageCount = getPageCount(input);
		if (!Number.isInteger(pageCount) || pageCount < 1) throw new Error('Could not read the PDF page count.');
		render(input, scratch);
		const renders = readdirSync(scratch).filter((name) => name.endsWith('.png'))
			.sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
		if (renders.length !== pageCount) throw new Error(`Expected ${pageCount} rendered pages; found ${renders.length}.`);
		mkdirSync(output, { recursive: true });
		stage = mkdtempSync(join(output, '.staging-'));
		const pages = [];
		for (const [index, file] of renders.entries()) {
			const name = `page-${String(index).padStart(2, '0')}`;
			const { width, height } = await encode(join(scratch, file), stage, name);
			if (!width || !height) throw new Error('Rendered page has no dimensions');
			// Validate both variants before publishing any references.
			for (const suffix of ['', '-800']) {
				if (!readFileSync(join(stage, `${name}${suffix}.webp`)).length) throw new Error('Empty page output');
			}
			pages.push({ number: index, label: index === 0 ? 'Cover' : `Page ${index}`,
				image: `${base}/${revision}/${name}.webp`, smallImage: `${base}/${revision}/${name}-800.webp`, width, height });
		}
		const pdfName = 'to-sleep-perchance-to-dream.pdf';
		copyFileSync(input, join(stage, pdfName));
		const destination = join(output, revision);
		if (existsSync(destination)) {
			// The same source/encoder revision must be byte-identical; never overwrite
			// an existing version that an older manifest may still reference.
			for (const name of readdirSync(stage)) {
				if (!readFileSync(join(stage, name)).equals(readFileSync(join(destination, name)))) throw new Error('Existing proof revision differs; increment encoder revision');
			}
		} else renameSync(stage, destination);
		mkdirSync(dirname(manifest), { recursive: true });
		manifestStage = `${manifest}.${randomUUID()}.tmp`;
		writeFileSync(manifestStage, `${JSON.stringify({ title: 'To Sleep, Perchance to Dream', sourceSha256,
			pdf: `${base}/${revision}/${pdfName}`, pdfBytes: pdf.length, pages }, null, '\t')}\n`, { flag: 'wx' });
		renameSync(manifestStage, manifest);
		return pages.length;
	} finally {
		if (manifestStage) rmSync(manifestStage, { force: true });
		if (stage) rmSync(stage, { recursive: true, force: true });
		rmSync(scratch, { recursive: true, force: true });
	}
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	if (!process.argv[2]) throw new Error('Usage: node scripts/manga/import-proof.mjs /path/to/proof.pdf');
	console.log(`Imported ${await importProof(process.argv[2])} pages and the original PDF.`);
}
