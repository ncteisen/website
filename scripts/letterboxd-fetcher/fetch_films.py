#!/usr/bin/env python3

from __future__ import annotations

import os
import sys
import argparse
from pathlib import Path
import json
import logging
import xml.etree.ElementTree as ET

import requests
from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pipeline_utils import atomic_write_json, date_sort_key, sanitize_review_html

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(SCRIPT_DIR, 'data', 'films.json')

LETTERBOXD_USERNAME = 'ncteisen'
RSS_URL = f"https://letterboxd.com/{LETTERBOXD_USERNAME}/rss/"
NAMESPACES = {
    'letterboxd': 'https://letterboxd.com',
    'dc': 'http://purl.org/dc/elements/1.1/',
    'tmdb': 'https://themoviedb.org',
}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class LetterboxdDataCollector:
    def __init__(self):
        self.existing_films = []
        self.fetched_films = []
        self.fetch_complete = False

    def load_existing_films(self) -> None:
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r') as f:
                self.existing_films = json.load(f)
            logger.info(f"Loaded {len(self.existing_films)} existing films")
        else:
            logger.info("No existing films file found")
            self.existing_films = []

    def _parse_item(self, item: ET.Element) -> dict | None:
        try:
            guid_el = item.find('guid')
            guid = guid_el.text.strip() if guid_el is not None and guid_el.text else None
            if not guid:
                return None

            title_el = item.find('letterboxd:filmTitle', NAMESPACES)
            year_el = item.find('letterboxd:filmYear', NAMESPACES)
            rating_el = item.find('letterboxd:memberRating', NAMESPACES)
            watched_el = item.find('letterboxd:watchedDate', NAMESPACES)
            rewatch_el = item.find('letterboxd:rewatch', NAMESPACES)
            link_el = item.find('link')
            pub_date_el = item.find('pubDate')

            # Skip non-film items (e.g. list entries) that lack filmTitle
            if title_el is None or title_el.text is None:
                return None

            # Extract image and review from description HTML
            description = item.find('description')
            desc_text = description.text if description is not None and description.text else ''
            soup = BeautifulSoup(desc_text, 'html.parser')

            img_tag = soup.find('img')
            image_url = img_tag.get('src', '') if img_tag else ''

            review_paragraphs = []
            if img_tag:
                current = img_tag.find_next('p')
                while current and current.name == 'p':
                    review_paragraphs.append(current)
                    current = current.find_next_sibling()
            review_text = sanitize_review_html(''.join(str(p) for p in review_paragraphs))

            return {
                'guid': guid,
                'title': title_el.text.strip(),
                'year': int(year_el.text.strip()) if year_el is not None and year_el.text else None,
                'rating': float(rating_el.text.strip()) if rating_el is not None and rating_el.text else 0.0,
                'watched_date': watched_el.text.strip() if watched_el is not None and watched_el.text else None,
                'is_rewatch': rewatch_el.text.strip() == 'Yes' if rewatch_el is not None and rewatch_el.text else False,
                'image_url': image_url,
                'review': review_text,
                'link': link_el.text.strip() if link_el is not None and link_el.text else '',
                'pub_date': pub_date_el.text.strip() if pub_date_el is not None and pub_date_el.text else None,
            }
        except Exception as e:
            logger.error(f"Failed to parse RSS item: {e}")
            return None

    def fetch_films(self) -> None:
        self.fetch_complete = False
        self.fetched_films = []
        logger.info(f"Fetching RSS from {RSS_URL}")
        response = requests.get(RSS_URL, timeout=30)
        response.raise_for_status()

        root = ET.fromstring(response.content.decode('utf-8'))
        channel = root.find('channel')
        if channel is None:
            raise ValueError('Letterboxd response is not an RSS channel')

        for item in channel.findall('item'):
            film = self._parse_item(item)
            if film:
                self.fetched_films.append(film)

        self.fetch_complete = True
        logger.info(f"Fetched {len(self.fetched_films)} films from RSS")

    def update_and_save_films(self) -> None:
        if not self.fetch_complete:
            raise RuntimeError('Cannot save an incomplete Letterboxd fetch')
        existing_dict = {f['guid']: f for f in self.existing_films}
        new_count = 0
        updated_count = 0

        for film in self.fetched_films:
            if film['guid'] in existing_dict:
                existing_dict[film['guid']] = film
                updated_count += 1
            else:
                existing_dict[film['guid']] = film
                new_count += 1

        all_films = list(existing_dict.values())
        all_films.sort(key=lambda x: date_sort_key(x.get('watched_date')), reverse=True)
        for film in all_films:
            film['review'] = sanitize_review_html(film.get('review'))

        atomic_write_json(DATA_FILE, all_films)

        logger.info(f"Saved {len(all_films)} films ({new_count} new, {updated_count} updated)")


def main() -> None:
    parser = argparse.ArgumentParser(description='Sync the recent RSS window; it is not an authoritative full history.')
    parser.add_argument('--remove-guid', action='append', default=[], help='Remove a verified deleted entry from the local cache without fetching; repeat for multiple entries.')
    args = parser.parse_args()
    collector = LetterboxdDataCollector()
    collector.load_existing_films()
    if args.remove_guid:
        existing_ids = {film['guid'] for film in collector.existing_films}
        if not set(args.remove_guid) <= existing_ids:
            raise ValueError('A requested removal does not exist; cache unchanged')
        collector.existing_films = [film for film in collector.existing_films if film['guid'] not in args.remove_guid]
        collector.fetch_complete = True
    else:
        collector.fetch_films()
    collector.update_and_save_films()


if __name__ == '__main__':
    main()
