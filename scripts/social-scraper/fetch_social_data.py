#!/usr/bin/env python3

import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any

from letterboxd_scraper import create_scraper

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
OUTPUT_DIR = Path('public/data')
OUTPUT_FILE = OUTPUT_DIR / 'social_data.json'

def ensure_output_directory() -> None:
    """Ensure the output directory exists."""
    try:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        logger.info(f"Output directory ensured at {OUTPUT_DIR}")
    except Exception as e:
        logger.error(f"Failed to create output directory: {e}")
        raise

def save_data(data: Dict[str, Any]) -> None:
    """Save the fetched data to a JSON file."""
    try:
        with open(OUTPUT_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        logger.info(f"Data saved successfully to {OUTPUT_FILE}")
    except Exception as e:
        logger.error(f"Failed to save data: {e}")
        raise

def main() -> None:
    """Main function to fetch and save social media data."""
    try:
        # Ensure output directory exists
        ensure_output_directory()

        # Initialize data structure
        data = {
            'last_updated': datetime.utcnow().isoformat(),
            'letterboxd': {},
            'github': {},
            'twitter': {},
            'linkedin': {}
        }

        # Fetch Letterboxd data
        try:
            letterboxd_scraper = create_scraper()  # Using default username
            data['letterboxd'] = letterboxd_scraper.fetch_data()
            logger.info("Successfully fetched Letterboxd data")
        except Exception as e:
            logger.error(f"Failed to fetch Letterboxd data: {e}")
            # Continue with other platforms even if one fails

        # Save the data
        save_data(data)

    except Exception as e:
        logger.error(f"An error occurred: {e}")
        raise

if __name__ == '__main__':
    main() 