#!/usr/bin/env python3

from __future__ import annotations

import json
import logging
from datetime import datetime
from pathlib import Path

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
OUTPUT_DIR = Path('src/data')
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
    """Save the fetched data to a JSON file."""
    try:
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        logger.info(f"Data saved successfully to {OUTPUT_FILE}")
    except Exception as e:
        logger.error(f"Failed to save data: {e}")
        raise

def main() -> None:
    """Main function to process and save social media data."""
    try:
        # Ensure output directory exists
        ensure_output_directory()

        # Initialize data structure
        data = {
            'last_updated': datetime.utcnow().isoformat(),
            'letterboxd': {},
            'goodreads': {},
            'strava': {},
        }

        # Process Letterboxd data
        try:
            letterboxd_processor = create_letterboxd_processor()
            data['letterboxd'] = letterboxd_processor.get_data()
            logger.info("Successfully processed Letterboxd data")
        except Exception as e:
            logger.error(f"Failed to process Letterboxd data: {e}")

        # Process Goodreads data
        try:
            data['goodreads'] = get_goodreads_data()
            logger.info("Successfully processed Goodreads data")
        except Exception as e:
            logger.error(f"Failed to process Goodreads data: {e}")

        # Process Strava data
        try:
            strava_processor = StravaProcessor()
            data['strava'] = strava_processor.get_recent_activities_data()
            logger.info("Successfully processed Strava data")
        except Exception as e:
            logger.error(f"Failed to process Strava data: {e}")

        # Save the data
        save_data(data)

    except Exception as e:
        logger.error(f"An error occurred: {e}")
        raise

if __name__ == '__main__':
    main()
