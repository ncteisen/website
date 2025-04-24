#!/usr/bin/env python3

import logging
import requests
import xml.etree.ElementTree as ET
from typing import Dict, Any, List
from datetime import datetime
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# Constants
LETTERBOXD_USERNAME = 'ncteisen'  # TODO: Move to environment variable
NAMESPACES = {
    'letterboxd': 'https://letterboxd.com',
    'dc': 'http://purl.org/dc/elements/1.1/'
}

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
            review_text = soup.find('p', text=True).text if soup.find('p', text=True) else ""
            
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
    
    def fetch_data(self) -> Dict[str, Any]:
        """Fetch and process Letterboxd data."""
        try:
            # Fetch RSS feed
            response = requests.get(self.base_url)
            response.raise_for_status()
            
            # Parse XML
            root = ET.fromstring(response.content)
            channel = root.find('channel')
            
            # Get all reviews
            reviews: List[Dict[str, Any]] = []
            for item in channel.findall('item'):
                review = self._parse_review(item)
                if review:
                    reviews.append(review)
            
            # Get last 3 reviews
            recent_reviews = reviews[:3]
            
            return {
                'username': self.username,
                'last_updated': datetime.utcnow().isoformat(),
                'recent_reviews': recent_reviews
            }
        except Exception as e:
            logger.error(f"Failed to fetch Letterboxd data: {e}")
            raise

def create_scraper(username: str = LETTERBOXD_USERNAME) -> LetterboxdScraper:
    """Factory function to create a Letterboxd scraper."""
    return LetterboxdScraper(username) 