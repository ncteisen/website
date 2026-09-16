# Manga reader assets

The public reader uses the finished 43-page proof PDF (cover + 42 story pages),
not the older 62-page illustration and lettering package in `manga/`.

To regenerate the reader images and its manifest:

```sh
node scripts/manga/import-proof.mjs /path/to/to-sleep-perchance-to-dream-v2-proof.pdf
npm run build
```

Requires Poppler's `pdfinfo` and `pdftoppm` on PATH and the site's existing Sharp
dependency. The importer creates 800px and 1600px WebP images, copies the PDF
unchanged to `public/writing/to-sleep-perchance-to-dream/manga/proof/`, and writes
`src/data/sleep_manga.json`. The manifest records the source PDF's SHA-256.
Do not hand-edit those generated assets.

`src/components/ComicReader.astro` provides page navigation, a continuous scroll
mode, enlargement, page links, and an optional resume link using local storage.
Mobile page mode also supports deliberate horizontal swipes on the artwork;
vertical scrolling, pinch zoom, and browser edge gestures retain their native behavior.
Without JavaScript it displays every page in order. The original text story is
linked above the reader.
