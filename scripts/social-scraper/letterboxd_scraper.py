#!/usr/bin/env python3

import json
import logging
import requests
import os
from typing import Dict, Any, List, Optional
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# Constants
LETTERBOXD_USERNAME = 'ncteisen'
LETTERBOXD_PROFILE_URL = f"https://letterboxd.com/{LETTERBOXD_USERNAME}/"

RECENT_ACTIVITY_LIMIT = 8

CACHE_DIR = os.path.join(os.path.dirname(__file__), 'cached_data')
CACHED_PROFILE_FILE = os.path.join(CACHE_DIR, 'letterboxd_profile.html')

# Data store from fetcher
FILMS_DATA_FILE = os.path.join(os.path.dirname(__file__), '..', 'letterboxd-fetcher', 'data', 'films.json')

def extract_profile_stats(html_content: str) -> Dict[str, Any]:
    """Extract profile statistics from Letterboxd profile HTML."""
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Find all profile statistics
        stats = {}
        stat_elements = soup.find_all('h4', class_='profile-statistic statistic')
        
        for stat_element in stat_elements:
            value_span = stat_element.find('span', class_='value')
            definition_span = stat_element.find('span', class_='definition')
            
            if value_span and definition_span:
                value = value_span.get_text(strip=True)
                definition = definition_span.get_text(strip=True)
                
                # Convert numeric values
                try:
                    numeric_value = int(value.replace(',', ''))
                except ValueError:
                    numeric_value = value
                
                # Map definitions to standardized keys
                if definition == 'Films':
                    stats['total_films'] = numeric_value
                elif definition == 'This year':
                    stats['films_this_year'] = numeric_value
                elif definition == 'Lists':
                    stats['total_lists'] = numeric_value
                elif definition == 'Following':
                    stats['following_count'] = numeric_value
                elif definition == 'Followers':
                    stats['followers_count'] = numeric_value
        
        return stats
    except Exception as e:
        logger.error(f"Failed to extract profile stats: {e}")
        return {}

def fetch_letterboxd_profile_stats(use_cache: bool = False) -> Dict[str, Any]:
    """Fetch and extract Letterboxd profile statistics."""
    try:
        if use_cache and os.path.exists(CACHED_PROFILE_FILE):
            logger.info("Using cached Letterboxd profile data")
            with open(CACHED_PROFILE_FILE, 'r', encoding='utf-8') as f:
                html_content = f.read()
        else:
            logger.info("Fetching Letterboxd profile data from network")
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                              "AppleWebKit/537.36 (KHTML, like Gecko) "
                              "Chrome/120.0.0.0 Safari/537.36"
            }
            response = requests.get(LETTERBOXD_PROFILE_URL, headers=headers, timeout=30)
            response.raise_for_status()
            html_content = response.text
        
        return extract_profile_stats(html_content)
    except Exception as e:
        logger.error(f"Failed to fetch Letterboxd profile stats: {e}")
        return {}

def load_films_data() -> List[Dict[str, Any]]:
    """Load films from the letterboxd-fetcher data store."""
    resolved = os.path.normpath(FILMS_DATA_FILE)
    if not os.path.exists(resolved):
        logger.warning(f"Films data file not found: {resolved}")
        return []
    with open(resolved, 'r') as f:
        films = json.load(f)
    logger.info(f"Loaded {len(films)} films from data store")
    return films


def convert_film_to_review(film: Dict[str, Any]) -> Dict[str, Any]:
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


class LetterboxdScraper:
    """Scraper for Letterboxd data."""

    def __init__(self, username: str = LETTERBOXD_USERNAME):
        self.username = username

    def fetch_data(self, use_cache: bool = False) -> Dict[str, Any]:
        """Load films from data store and fetch profile stats."""
        films = load_films_data()
        all_reviews = [convert_film_to_review(f) for f in films]
        # Sort by watched_date descending
        all_reviews.sort(key=lambda x: (x['watched_date'] is None, x['watched_date']), reverse=True)

        recent_reviews = all_reviews[:RECENT_ACTIVITY_LIMIT]

        # Get profile stats (still scraped from HTML)
        stats = fetch_letterboxd_profile_stats(use_cache)

        return {
            'username': self.username,
            'all_reviews': all_reviews,
            'recent_reviews': recent_reviews,
            'stats': stats,
        }

def create_letterboxd_scraper(username: str = LETTERBOXD_USERNAME) -> LetterboxdScraper:
    """Factory function to create a Letterboxd scraper."""
    return LetterboxdScraper(username)

def main():
    """Test function to print scraped data."""
    # Use cache if available for testing
    use_cache = os.path.exists(CACHED_RSS_FILE) and os.path.exists(CACHED_PROFILE_FILE)
    if use_cache:
        print("Found cached data, using cache for testing...")
    
    try:
        scraper = create_letterboxd_scraper()
        data = scraper.fetch_data(use_cache)
        
        print("\nScraped Letterboxd Profile Stats:")
        print("=" * 80)
        if data['stats']:
            for key, value in data['stats'].items():
                formatted_key = key.replace('_', ' ').title()
                print(f"{formatted_key}: {value}")
        else:
            print("No stats found")
        
        print("\nScraped Letterboxd Reviews:")
        print("=" * 80)
        
        for i, review in enumerate(data['recent_reviews'], 1):
            print(f"\nReview #{i}:")
            print(f"Title: {review['title']} ({review['year']})")
            print(f"Rating: {review['rating']}/5")
            print(f"Watched: {review['watched_date']}")
            print(f"Rewatch: {review['is_rewatch']}")
            if review['review']:
                # Truncate long reviews for readability
                review_text = review['review'][:200] + "..." if len(review['review']) > 200 else review['review']
                print(f"Review: {review_text}")
            print(f"Link: {review['link']}")
            print("-" * 80)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main() 