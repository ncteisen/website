#!/usr/bin/env python3

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

LETTERBOXD_USERNAME = 'ncteisen'
RECENT_ACTIVITY_LIMIT = 8

# Data store from fetcher
FILMS_DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'letterboxd-fetcher', 'data', 'films.json')


def load_films_data() -> list[dict]:
    """Load films from the letterboxd-fetcher data store."""
    resolved = os.path.normpath(FILMS_DATA_FILE)
    if not os.path.exists(resolved):
        logger.warning(f"Films data file not found: {resolved}")
        return []
    with open(resolved, 'r') as f:
        films = json.load(f)
    logger.info(f"Loaded {len(films)} films from data store")
    return films


def convert_film_to_review(film: dict) -> dict:
    """Convert a raw film record to the review format used by the site."""
    return {
        'title': film.get('title', ''),
        'year': film.get('year'),
        'rating': film.get('rating', 0),
        'watched_date': film.get('watched_date'),
        'is_rewatch': film.get('is_rewatch', False),
        'review': film.get('review', ''),
        'image_url': film.get('image_url', ''),
        'link': film.get('link', ''),
    }


def calculate_stats(films: list[dict]) -> dict:
    """Calculate profile statistics from the films data."""
    current_year = str(datetime.now(timezone.utc).year)
    films_this_year = sum(
        1 for f in films
        if f.get('watched_date') and f['watched_date'].startswith(current_year)
    )
    return {
        'total_films': len(films),
        'films_this_year': films_this_year,
    }


class LetterboxdProcessor:
    """Processes Letterboxd data from the local JSON data store."""

    def __init__(self, username: str = LETTERBOXD_USERNAME) -> None:
        self.username = username

    def get_data(self) -> dict:
        """Load films from data store and compute stats."""
        films = load_films_data()
        all_reviews = [convert_film_to_review(f) for f in films]
        all_reviews.sort(key=lambda x: (x['watched_date'] is None, x['watched_date']), reverse=True)

        return {
            'username': self.username,
            'all_reviews': all_reviews,
            'recent_reviews': all_reviews[:RECENT_ACTIVITY_LIMIT],
            'stats': calculate_stats(films),
        }


def create_letterboxd_processor(username: str = LETTERBOXD_USERNAME) -> LetterboxdProcessor:
    """Factory function to create a Letterboxd processor."""
    return LetterboxdProcessor(username)


def main() -> None:
    """Test entry point."""
    logging.basicConfig(level=logging.INFO)
    processor = create_letterboxd_processor()
    data = processor.get_data()

    print(f"Total films: {data['stats']['total_films']}")
    print(f"Films this year: {data['stats']['films_this_year']}")
    print(f"Recent reviews: {len(data['recent_reviews'])}")


if __name__ == "__main__":
    main()
