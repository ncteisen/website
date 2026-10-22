#!/usr/bin/env python3

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pipeline_utils import atomic_write_json

from letterboxd_processor import create_letterboxd_processor
from goodreads_processor import get_goodreads_data
from strava_processor import StravaProcessor

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
OUTPUT_DIR = Path(__file__).resolve().parents[2] / 'src' / 'data'
OUTPUT_FILE = OUTPUT_DIR / 'social_data.json'

def ensure_output_directory() -> None:
    """Ensure the output directory exists."""
    try:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        logger.info(f"Output directory ensured at {OUTPUT_DIR}")
    except Exception as e:
        logger.error(f"Failed to create output directory: {e}")
        raise

def save_data(data: dict) -> None:
    """Replace the combined output only after every source passes validation."""
    atomic_write_json(OUTPUT_FILE, data)
    logger.info("Combined social data saved")


def main() -> None:
    # Any source failure aborts before the last-known-good output is replaced.
    letterboxd = create_letterboxd_processor().get_data()
    goodreads = get_goodreads_data()
    strava = StravaProcessor().get_recent_activities_data()
    for source, arrays in ((letterboxd, ('all_reviews', 'recent_reviews')),
                           (goodreads, ('all_reviews', 'recent_reviews')),
                           (strava, ('all_activities', 'recent_runs', 'recent_bikes', 'recent_hikes'))):
        if not isinstance(source, dict) or not isinstance(source.get('stats'), dict):
            raise ValueError('Invalid social data source schema')
        if any(not isinstance(source.get(key), list) for key in arrays):
            raise ValueError('Invalid social data source lists')
    data = {'last_updated': datetime.now(timezone.utc).isoformat(),
            'letterboxd': letterboxd, 'goodreads': goodreads, 'strava': strava}
    ensure_output_directory()
    save_data(data)


if __name__ == '__main__':
    main()
