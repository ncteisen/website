import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const directory = await mkdtemp(join(tmpdir(), 'sarah-jumps-check-'));
try {
	const outfile = join(directory, 'checks.mjs');
	await build({ entryPoints: [new URL('./check.ts', import.meta.url).pathname], bundle: true, platform: 'node', format: 'esm', outfile });
	await import(pathToFileURL(outfile).href);
} finally {
	await rm(directory, { recursive: true, force: true });
}
