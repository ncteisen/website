#!/usr/bin/env python3

import os
import json
import time
import logging
import xml.etree.ElementTree as ET
from datetime import datetime
from email.utils import parsedate_to_datetime

import requests

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(SCRIPT_DIR, 'data', 'books.json')

GOODREADS_RSS_URL = "https://www.goodreads.com/review/list_rss/44763252-noah-eisen"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36"
}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


class GoodreadsDataCollector:
    def __init__(self):
        self.existing_books = []
        self.fetched_books = []

    def load_existing_books(self):
        if os.path.exists(DATA_FILE):
            with open(DATA_FILE, 'r') as f:
                self.existing_books = json.load(f)
            logger.info(f"Loaded {len(self.existing_books)} existing books")
        else:
            logger.info("No existing books file found")
            self.existing_books = []

    def _parse_item(self, item: ET.Element) -> dict:
        def text(tag):
            el = item.find(tag)
            return el.text.strip() if el is not None and el.text else None

        book_id = text('book_id')
        title = text('title')
        # Clean title: "Title by Author" -> "Title"
        if title and ' by ' in title:
            title = title.split(' by ')[0].strip()

        user_rating = int(text('user_rating') or '0')
        user_read_at = text('user_read_at')
        user_date_added = text('user_date_added')

        # Extract image URL and clean size patterns
        image_url = text('book_image_url') or ''
        import re
        image_url = re.sub(r'\.?_S[XY]\d+_', '', image_url)

        large_image_url = text('book_large_image_url') or ''
        large_image_url = re.sub(r'\.?_S[XY]\d+_', '', large_image_url)

        # Extract review from description
        description = text('description') or ''
        review_text = ''
        if 'review:' in description:
            review_text = description.split('review:')[1].strip()

        return {
            'book_id': book_id,
            'title': title,
            'author_name': text('author_name'),
            'user_rating': user_rating,
            'user_read_at': user_read_at,
            'user_date_added': user_date_added,
            'user_shelves': text('user_shelves'),
            'user_review': review_text,
            'isbn': text('isbn'),
            'num_pages': text('num_pages'),
            'book_published': text('book_published'),
            'average_rating': text('average_rating'),
            'book_image_url': image_url,
            'book_large_image_url': large_image_url,
            'guid': text('guid'),
        }

    def fetch_books(self):
        is_backfill = len(self.existing_books) == 0
        if is_backfill:
            logger.info("Backfill mode: fetching ALL pages")
        else:
            logger.info("Incremental mode: fetching page 1 only")

        page = 1
        while True:
            url = f"{GOODREADS_RSS_URL}?shelf=read&per_page=100&page={page}"
            logger.info(f"Fetching page {page}: {url}")
            response = requests.get(url, headers=HEADERS, timeout=30)
            response.raise_for_status()

            root = ET.fromstring(response.content.decode('utf-8'))
            items = root.findall('.//item')
            if not items:
                logger.info(f"No items on page {page}, done.")
                break

            for item in items:
                book = self._parse_item(item)
                if book['book_id']:
                    self.fetched_books.append(book)

            logger.info(f"Page {page}: fetched {len(items)} items")

            if not is_backfill:
                break

            page += 1
            time.sleep(1)

        logger.info(f"Total fetched: {len(self.fetched_books)} books")

    def update_and_save_books(self):
        existing_dict = {b['book_id']: b for b in self.existing_books}
        new_count = 0
        updated_count = 0

        for book in self.fetched_books:
            if book['book_id'] in existing_dict:
                existing_dict[book['book_id']] = book
                updated_count += 1
            else:
                existing_dict[book['book_id']] = book
                new_count += 1

        all_books = list(existing_dict.values())
        # Sort by read date descending
        def parse_read_at(date_str):
            try:
                return parsedate_to_datetime(date_str)
            except Exception:
                return datetime.min

        all_books.sort(key=lambda x: (x.get('user_read_at') is None, parse_read_at(x.get('user_read_at', ''))), reverse=True)

        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        with open(DATA_FILE, 'w') as f:
            json.dump(all_books, f, indent=2)

        logger.info(f"Saved {len(all_books)} books ({new_count} new, {updated_count} updated)")


def main():
    collector = GoodreadsDataCollector()
    collector.load_existing_books()
    collector.fetch_books()
    collector.update_and_save_books()


if __name__ == '__main__':
    main()
