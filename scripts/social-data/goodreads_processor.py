from __future__ import annotations

import json
import logging
import os
from datetime import date, datetime
from email.utils import parsedate_to_datetime

logger = logging.getLogger(__name__)

RECENT_ACTIVITY_LIMIT = 8

GOODREADS_PROFILE_URL = "https://www.goodreads.com/user/show/44763252-noah-eisen"

# Data store from fetcher
BOOKS_DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'goodreads-fetcher', 'data', 'books.json')


def load_books_data() -> list[dict]:
    """Load books from the goodreads-fetcher data store."""
    resolved = os.path.normpath(BOOKS_DATA_FILE)
    if not os.path.exists(resolved):
        logger.warning(f"Books data file not found: {resolved}")
        return []
    with open(resolved, 'r') as f:
        books = json.load(f)
    logger.info(f"Loaded {len(books)} books from data store")
    return books


def convert_book_to_review(book: dict) -> dict:
    """Convert a raw book record to the review format used by the site."""
    return {
        'title': book.get('title', ''),
        'author': book.get('author_name', ''),
        'rating': book.get('user_rating', 0),
        'read_at': book.get('user_read_at'),
        'image_url': book.get('book_image_url', ''),
        'link': book.get('guid', ''),
        'review': book.get('user_review', ''),
    }


def parse_read_at(date_str: str) -> datetime | None:
    """Parse an RFC 2822 date string into a datetime."""
    try:
        return parsedate_to_datetime(date_str)
    except Exception:
        return None


def calculate_stats(books: list[dict]) -> dict:
    """Calculate profile statistics from the books data."""
    rated_books = [b for b in books if b.get('user_rating', 0) > 0]
    reviewed_books = [b for b in books if b.get('user_review')]
    current_year = date.today().year

    # Books read this year (by read date)
    books_this_year = []
    for b in books:
        read_at = b.get('user_read_at')
        if read_at:
            dt = parse_read_at(read_at)
            if dt and dt.year == current_year:
                books_this_year.append(b)

    # Average rating
    ratings = [b['user_rating'] for b in rated_books]
    average_rating = round(sum(ratings) / len(ratings), 2) if ratings else 0.0

    return {
        'total_ratings': len(rated_books),
        'average_rating': average_rating,
        'total_reviews': len(reviewed_books),
        'books_this_year': len(books_this_year),
    }


def get_goodreads_data() -> dict:
    """Load books, compute reviews and stats."""
    books = load_books_data()
    reviews = [convert_book_to_review(b) for b in books]

    # Filter out unrated books and books without read dates
    all_reviews = [r for r in reviews if r['rating'] > 0 and r['read_at']]
    all_reviews.sort(
        key=lambda x: (x['read_at'] is None, parse_read_at(x['read_at']) or date.min),
        reverse=True,
    )

    return {
        'all_reviews': all_reviews,
        'recent_reviews': all_reviews[:RECENT_ACTIVITY_LIMIT],
        'profile_url': GOODREADS_PROFILE_URL,
        'stats': calculate_stats(books),
    }


def main() -> None:
    """Test entry point."""
    logging.basicConfig(level=logging.INFO)
    data = get_goodreads_data()

    stats = data['stats']
    print(f"Total ratings: {stats['total_ratings']}")
    print(f"Average rating: {stats['average_rating']}")
    print(f"Total reviews: {stats['total_reviews']}")
    print(f"Books this year: {stats['books_this_year']}")
    print(f"Pages this year: {stats['pages_this_year']}")
    print(f"Recent reviews: {len(data['recent_reviews'])}")


if __name__ == "__main__":
    main()
