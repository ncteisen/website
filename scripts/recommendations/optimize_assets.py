#!/usr/bin/env python3

from __future__ import annotations

import json
import logging
import os
import re
from io import BytesIO
from pathlib import Path
from typing import Any

import requests
from PIL import Image, ImageFilter, ImageOps

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parents[1]
METADATA_FILE = SCRIPT_DIR / 'data' / 'metadata.json'
FAVORITES_FILE = SCRIPT_DIR / 'favorites.json'
PUBLIC_DIR = REPO_ROOT / 'public'
OUTPUT_DIR = PUBLIC_DIR / 'images' / 'favorites'

TARGET_SIZE = (600, 900)
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def slugify(value: str) -> str:
    slug = re.sub(r'[^a-z0-9]+', '-', value.lower()).strip('-')
    return slug or 'favorite'


def is_local_path(url: str) -> bool:
    return url.startswith('/')


def download_image(url: str) -> Image.Image:
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return Image.open(BytesIO(resp.content))


def optimize_image(image: Image.Image) -> Image.Image:
    image = ImageOps.exif_transpose(image).convert('RGB')
    image = ImageOps.fit(image, TARGET_SIZE, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    return image.filter(ImageFilter.UnsharpMask(radius=1.2, percent=120, threshold=3))


def local_cover_path(kind: str, title: str) -> Path:
    return OUTPUT_DIR / kind / f'{slugify(title)}.jpg'


def public_path(path: Path) -> str:
    return '/' + path.relative_to(PUBLIC_DIR).as_posix()


def favorite_cover_sources(items: list[Any]) -> dict[str, str]:
    sources = {}
    for item in items:
        if isinstance(item, dict) and item.get('url') and item.get('cover'):
            sources[item['url']] = item['cover']

    return sources


def update_favorite_cover(items: list[Any], url: str, cover: str) -> None:
    for item in items:
        if isinstance(item, dict) and item.get('url') == url and item.get('cover'):
            item['cover'] = cover
            return


def optimize_entries(
    entries: list[dict[str, Any]],
    kind: str,
    favorite_sources: dict[str, str],
    favorite_items: list[Any],
) -> int:
    saved = 0

    for entry in entries:
        cover = entry.get('cover', '')
        source_cover = favorite_sources.get(entry.get('url', ''), cover)
        title = entry.get('title', '')
        if not source_cover or not title:
            logger.warning('Skipping %s entry with missing title or cover: %s', kind, entry)
            continue

        if is_local_path(source_cover):
            entry['cover'] = source_cover
            logger.info('Skipping already-local %s cover: %s', title, source_cover)
            continue

        output_path = local_cover_path(kind, title)
        output_path.parent.mkdir(parents=True, exist_ok=True)

        logger.info('Optimizing %s: %s', title, source_cover)
        image = download_image(source_cover)
        optimized = optimize_image(image)
        optimized.save(output_path, format='JPEG', quality=90, optimize=True, progressive=True)

        local_path = public_path(output_path)
        entry['cover'] = local_path
        update_favorite_cover(favorite_items, entry.get('url', ''), local_path)
        saved += 1

    return saved


def main() -> None:
    with METADATA_FILE.open() as f:
        metadata = json.load(f)
    with FAVORITES_FILE.open() as f:
        favorites = json.load(f)

    saved = 0
    saved += optimize_entries(
        metadata.get('films', []),
        'films',
        favorite_cover_sources(favorites.get('films', [])),
        favorites.get('films', []),
    )
    saved += optimize_entries(
        metadata.get('books', []),
        'books',
        favorite_cover_sources(favorites.get('books', [])),
        favorites.get('books', []),
    )

    with METADATA_FILE.open('w') as f:
        json.dump(metadata, f, indent=2)
        f.write('\n')
    with FAVORITES_FILE.open('w') as f:
        json.dump(favorites, f, indent=2)
        f.write('\n')

    logger.info('Saved %s optimized favorite assets to %s', saved, OUTPUT_DIR)


if __name__ == '__main__':
    main()
