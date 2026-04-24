#!/usr/bin/env python3

from __future__ import annotations

import os
import json
import logging
import re

import requests

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(SCRIPT_DIR, 'data', 'covers.json')
BOOKS_FILE = os.path.join(SCRIPT_DIR, '..', 'goodreads-fetcher', 'data', 'books.json')

FILMS = {
    'The Prestige': 'https://letterboxd.com/film/the-prestige/',
    'Arrival': 'https://letterboxd.com/film/arrival-2016/',
    'Knives Out': 'https://letterboxd.com/film/knives-out-2019/',
    'Eternal Sunshine of the Spotless Mind': 'https://letterboxd.com/film/eternal-sunshine-of-the-spotless-mind/',
}

BOOKS = ['Exhalation', 'Tenth of December', '10:04', 'Playground']

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def fetch_film_covers() -> dict[str, str]:
    """Scrape portrait poster images from Letterboxd film pages using requests."""
    covers: dict[str, str] = {}
    for title, url in FILMS.items():
        logger.info(f"Fetching poster for {title} from {url}")
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()

        # Extract portrait poster path (2:3 ratio, 230x345) from page source
        # Two URL patterns: film-poster/... or sm/upload/...
        matches = re.findall(
            r'((?:film-poster|sm/upload)/[^\s"\'<>]+-0-230-0-345-crop\.jpg[^\s"\'<>]*)',
            resp.text,
        )
        if matches:
            # Upscale from 230x345 to 600x900
            path = matches[0].replace('-0-230-0-345-crop', '-0-600-0-900-crop')
            covers[title] = f'https://a.ltrbxd.com/resized/{path}'
            logger.info(f"  Found: {covers[title][:80]}...")
        else:
            logger.warning(f"  No portrait poster found for {title}")
    return covers


def fetch_book_covers() -> dict[str, str]:
    """Look up book cover images from local Goodreads data."""
    covers: dict[str, str] = {}
    with open(BOOKS_FILE, 'r') as f:
        all_books = json.load(f)

    for target in BOOKS:
        matches = [b for b in all_books if target.lower() in b['title'].lower()]
        if matches:
            book = matches[0]
            image_url = book.get('book_large_image_url') or book.get('book_image_url', '')
            if image_url:
                covers[target] = image_url
                logger.info(f"Found cover for {target}: {image_url[:80]}...")
            else:
                logger.warning(f"No image URL for {target}")
        else:
            logger.warning(f"Book not found in local data: {target}")

    return covers


def main() -> None:
    film_covers = fetch_film_covers()
    book_covers = fetch_book_covers()

    covers = {**film_covers, **book_covers}

    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w') as f:
        json.dump(covers, f, indent=2)

    logger.info(f"Saved {len(covers)} covers to {DATA_FILE}")


if __name__ == '__main__':
    main()
