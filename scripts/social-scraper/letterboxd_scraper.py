#!/usr/bin/env python3

import logging
import requests
import xml.etree.ElementTree as ET
import os
from typing import Dict, Any, List
from datetime import datetime
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# Constants
LETTERBOXD_USERNAME = 'ncteisen'  # TODO: Move to environment variable
LETTERBOXD_PROFILE_URL = f"https://letterboxd.com/{LETTERBOXD_USERNAME}/"
NAMESPACES = {
    'letterboxd': 'https://letterboxd.com',
    'dc': 'http://purl.org/dc/elements/1.1/'
}

# Cache directory
CACHE_DIR = os.path.join(os.path.dirname(__file__), 'cached_data')
CACHED_RSS_FILE = os.path.join(CACHE_DIR, 'letterboxd_rss.xml')
CACHED_PROFILE_FILE = os.path.join(CACHE_DIR, 'letterboxd_profile.html')

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
            response = requests.get(LETTERBOXD_PROFILE_URL, headers=headers)
            response.raise_for_status()
            html_content = response.text
        
        return extract_profile_stats(html_content)
    except Exception as e:
        logger.error(f"Failed to fetch Letterboxd profile stats: {e}")
        return {}

class LetterboxdScraper:
    """Scraper for Letterboxd data."""
    
    def __init__(self, username: str = LETTERBOXD_USERNAME):
        """Initialize the scraper with a Letterboxd username."""
        self.username = username
        self.base_url = f"https://letterboxd.com/{username}/rss/"
    
    def _parse_review(self, item: ET.Element) -> Dict[str, Any]:
        """Parse a single review item from the RSS feed."""
        try:
            # Extract review text from description
            description = item.find('description').text
            soup = BeautifulSoup(description, 'html.parser')
            
            # Find the image and get all paragraphs after it
            img = soup.find('img')
            review_paragraphs = []
            if img:
                current = img.find_next('p')
                while current and current.name == 'p':
                    review_paragraphs.append(current)
                    current = current.find_next_sibling()
            
            # Combine all review paragraphs
            review_text = ''.join(str(p) for p in review_paragraphs)
            
            # Extract image URL
            img_tag = soup.find('img')
            image_url = img_tag.get('src') if img_tag else ""
            
            return {
                'title': item.find('letterboxd:filmTitle', NAMESPACES).text,
                'year': int(item.find('letterboxd:filmYear', NAMESPACES).text),
                'rating': float(item.find('letterboxd:memberRating', NAMESPACES).text),
                'watched_date': item.find('letterboxd:watchedDate', NAMESPACES).text,
                'is_rewatch': item.find('letterboxd:rewatch', NAMESPACES).text == 'Yes',
                'review': review_text,
                'image_url': image_url,
                'link': item.find('link').text
            }
        except Exception as e:
            logger.error(f"Failed to parse review: {e}")
            return None
    
    def fetch_data(self, use_cache: bool = False) -> Dict[str, Any]:
        """Fetch and process Letterboxd data."""
        try:
            if use_cache and os.path.exists(CACHED_RSS_FILE):
                logger.info("Using cached Letterboxd RSS data")
                with open(CACHED_RSS_FILE, 'r', encoding='utf-8') as f:
                    rss_content = f.read()
            else:
                logger.info("Fetching Letterboxd RSS data from network")
                # Fetch RSS feed
                response = requests.get(self.base_url)
                response.raise_for_status()
                rss_content = response.content.decode('utf-8')
            
            # Parse XML
            root = ET.fromstring(rss_content)
            channel = root.find('channel')
            
            # Get all reviews
            reviews: List[Dict[str, Any]] = []
            for item in channel.findall('item'):
                review = self._parse_review(item)
                if review:
                    reviews.append(review)
            
            # Get last 8 reviews
            recent_reviews = reviews[:8]
            
            # Get profile stats
            stats = fetch_letterboxd_profile_stats(use_cache)
            
            return {
                'username': self.username,
                'recent_reviews': recent_reviews,
                'stats': stats
            }
        except Exception as e:
            logger.error(f"Failed to fetch Letterboxd data: {e}")
            raise

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