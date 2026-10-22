import { build } from 'esbuild';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Node 22.12 does not load TypeScript directly. Bundle the source and its map
// packs just as the other project checks do, without regenerating any data.
export async function loadGlobeEvents() {
	const directory = await mkdtemp(join(tmpdir(), 'website-globe-audit-'));
	try {
		const outfile = join(directory, 'events.mjs');
		await build({
			entryPoints: [fileURLToPath(new URL('../../src/data/dateMyGlobeEvents.ts', import.meta.url))],
			bundle: true,
			platform: 'node',
			format: 'esm',
			outfile,
		});
		return await import(pathToFileURL(outfile).href);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}
