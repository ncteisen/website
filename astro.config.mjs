// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
	site: 'https://www.noaheisen.com',
	output: 'static',
	integrations: [
		sitemap({
			filter: (page) => {
				const path = new URL(page).pathname.replace(/\/$/, '');
				return !['/projects/codewords', '/projects/playpen'].includes(path)
					&& !path.includes('/manga/export/');
			},
		}),
	],
});
