#!/usr/bin/env python3
"""One-time CSV import for historical Letterboxd data.

Usage: python import_csv.py /path/to/diary.csv
"""

from __future__ import annotations

import csv
import json
import os
import re
import sys
import logging

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(SCRIPT_DIR, 'data', 'films.json')

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def slugify(name: str) -> str:
    """Convert a film name to a Letterboxd-style slug."""
    slug = name.lower()
    slug = re.sub(r"['\u2019]", '', slug)  # remove apostrophes
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    return slug.strip('-')


def make_synthetic_guid(title: str, year: str, watched_date: str) -> str:
    """Generate a synthetic guid for CSV entries."""
    return f"csv-{title}-{year}-{watched_date}"


def parse_rating(rating_str: str) -> float:
    """Parse a rating string to float."""
    if not rating_str or not rating_str.strip():
        return 0.0
    return float(rating_str)


def import_csv(csv_path: str):
    # Load existing films (from RSS)
    existing_films = []
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            existing_films = json.load(f)
    logger.info(f"Loaded {len(existing_films)} existing films from RSS")

    # Index existing by guid
    films_dict = {f['guid']: f for f in existing_films}

    # Also build a secondary index by (title, year, watched_date) to detect overlap with RSS entries
    rss_key_set = set()
    for f in existing_films:
        key = (f.get('title', '').lower(), str(f.get('year', '')), f.get('watched_date', ''))
        rss_key_set.add(key)

    csv_count = 0
    skipped = 0

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            title = row.get('Name', '').strip()
            year = row.get('Year', '').strip()
            watched_date = row.get('Watched Date', '').strip()
            rating = parse_rating(row.get('Rating', ''))
            rewatch = row.get('Rewatch', '').strip().lower() == 'yes'
            letterboxd_uri = row.get('Letterboxd URI', '').strip()

            if not title:
                continue

            # Skip if RSS already has this entry (RSS has richer data)
            key = (title.lower(), year, watched_date)
            if key in rss_key_set:
                skipped += 1
                continue

            guid = make_synthetic_guid(title, year, watched_date)
            if guid in films_dict:
                skipped += 1
                continue

            # Reconstruct link from URI or slug
            if letterboxd_uri:
                # URI is like https://letterboxd.com/ncteisen/film/the-matrix/
                link = letterboxd_uri
            else:
                slug = slugify(title)
                link = f"https://letterboxd.com/ncteisen/film/{slug}/"

            films_dict[guid] = {
                'guid': guid,
                'title': title,
                'year': int(year) if year else None,
                'rating': rating,
                'watched_date': watched_date if watched_date else None,
                'is_rewatch': rewatch,
                'image_url': '',
                'review': '',
                'link': link,
                'pub_date': None,
            }
            csv_count += 1

    all_films = list(films_dict.values())
    all_films.sort(key=lambda x: (x.get('watched_date') is None, x.get('watched_date', '')), reverse=True)

    os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
    with open(DATA_FILE, 'w') as f:
        json.dump(all_films, f, indent=2)

    logger.info(f"Imported {csv_count} films from CSV ({skipped} skipped as duplicates)")
    logger.info(f"Total films now: {len(all_films)}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python import_csv.py /path/to/diary.csv")
        sys.exit(1)
    import_csv(sys.argv[1])


if __name__ == '__main__':
    main()
