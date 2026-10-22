#!/usr/bin/env python3

from __future__ import annotations

import os
import json
import time
import logging
import argparse
import sys
from pathlib import Path
import xml.etree.ElementTree as ET
from datetime import datetime
from email.utils import parsedate_to_datetime

import requests

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pipeline_utils import atomic_write_json, date_sort_key, parse_date, sanitize_review_html

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
    def __init__(self, full_refresh: bool = False, shelf: str | None = None):
        self.full_refresh = full_refresh
        self.shelf = shelf
        self.existing_books = []
        self.fetched_books = []
        self.fetch_complete = False
        self.authoritative = False

    def load_existing_books(self) -> None:
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
            review_text = description.split('review:', 1)[1].strip()
            # Strip leading/trailing <br/> tags left over from the RSS format
            review_text = re.sub(r'^(<br\s*/?>)+', '', review_text)
            review_text = re.sub(r'(<br\s*/?>)+$', '', review_text).strip()

        return {
            'book_id': book_id,
            'title': title,
            'author_name': text('author_name'),
            'user_rating': user_rating,
            'user_read_at': parse_date(user_read_at).isoformat() if parse_date(user_read_at) else None,
            'user_date_added': user_date_added,
            'user_shelves': text('user_shelves'),
            'user_review': sanitize_review_html(review_text),
            'isbn': text('isbn'),
            'num_pages': text('num_pages'),
            'book_published': text('book_published'),
            'average_rating': text('average_rating'),
            'book_image_url': image_url,
            'book_large_image_url': large_image_url,
            'guid': text('guid'),
        }

    def fetch_books(self, *, max_pages: int = 200, allow_empty: bool = False) -> None:
        self.fetch_complete = False
        self.authoritative = self.shelf is None and (self.full_refresh or not self.existing_books)
        paginated = self.full_refresh or not self.existing_books
        staged = []
        seen = set()
        for page in range(1, max_pages + 1):
            params = {"per_page": 100, "page": page}
            if self.shelf:
                params['shelf'] = self.shelf
            response = requests.get(GOODREADS_RSS_URL, params=params, headers=HEADERS, timeout=30)
            response.raise_for_status()
            root = ET.fromstring(response.content)
            if root.find('channel') is None:
                raise ValueError('Goodreads response is not an RSS channel')
            items = root.findall('.//item')
            if not items:
                if self.authoritative and self.existing_books and not staged and not allow_empty:
                    raise RuntimeError('Refusing unexpected empty Goodreads full refresh; verify upstream before allowing it')
                self.fetched_books = staged
                self.fetch_complete = True
                return
            for item in items:
                book = self._parse_item(item)
                if not book['book_id'] or book['book_id'] in seen:
                    raise ValueError('Missing or repeated Goodreads identity; cache unchanged')
                seen.add(book['book_id'])
                staged.append(book)
            if not paginated:
                self.fetched_books = staged
                self.fetch_complete = True
                return
            time.sleep(1)
        raise RuntimeError('Goodreads page limit reached before completion; cache unchanged')

    def update_and_save_books(self) -> None:
        if not self.fetch_complete:
            raise RuntimeError('Cannot save an incomplete Goodreads fetch')
        existing = {} if self.authoritative else {b['book_id']: b for b in self.existing_books}
        existing.update({b['book_id']: b for b in self.fetched_books})
        books = []
        for book in existing.values():
            cleaned = dict(book)
            parsed = parse_date(cleaned.get('user_read_at'))
            cleaned['user_read_at'] = parsed.isoformat() if parsed else None
            cleaned['user_review'] = sanitize_review_html(cleaned.get('user_review'))
            books.append(cleaned)
        books.sort(key=lambda item: date_sort_key(item.get('user_read_at')), reverse=True)
        atomic_write_json(DATA_FILE, books)
        logger.info('Saved %s Goodreads records', len(books))


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch Goodreads RSS book data.")
    parser.add_argument(
        "--full",
        action="store_true",
        help="Fetch every RSS page instead of only the first incremental page.",
    )
    parser.add_argument(
        "--shelf",
        help="Fetch a specific Goodreads shelf. Defaults to the account's all-shelf RSS feed.",
    )
    parser.add_argument('--allow-empty-refresh', action='store_true', help='Allow a verified empty authoritative account response.')
    args = parser.parse_args()

    collector = GoodreadsDataCollector(full_refresh=args.full, shelf=args.shelf)
    collector.load_existing_books()
    collector.fetch_books(allow_empty=args.allow_empty_refresh)
    collector.update_and_save_books()


if __name__ == '__main__':
    main()
