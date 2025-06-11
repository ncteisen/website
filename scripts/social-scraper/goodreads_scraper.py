import requests
import xml.etree.ElementTree as ET
from typing import Dict, List
import logging
import re
import os
from bs4 import BeautifulSoup

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
GOODREADS_RSS_URL = "https://www.goodreads.com/review/list_rss/44763252-noah-eisen"
GOODREADS_PROFILE_URL = "https://www.goodreads.com/user/show/44763252-noah-eisen"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) "
                  "Chrome/120.0.0.0 Safari/537.36"
}

# Cache directory
CACHE_DIR = os.path.join(os.path.dirname(__file__), 'cached_data')
CACHED_PROFILE_FILE = os.path.join(CACHE_DIR, 'goodreads_profile.html')
CACHED_RSS_FILE = os.path.join(CACHE_DIR, 'goodreads_rss.xml')

def extract_book_data(item: ET.Element) -> Dict:
    """Extract book data from an RSS item."""
    try:
        # Extract basic book information
        title = item.find('title').text.split(' by ')[0].strip()
        author = item.find('author_name').text.strip()
        
        # Extract rating and read date from the description
        description = item.find('description').text
        
        # Extract user's rating (not average rating)
        user_rating_match = re.search(r'(?<!average )rating:\s*(\d+(?:\.\d+)?)', description)
        user_rating = float(user_rating_match.group(1)) if user_rating_match else 0.0
        
        # Extract read date
        read_at_match = re.search(r'read at:\s*([^\n<]+)', description)
        read_at = read_at_match.group(1).strip() if read_at_match else None
        
        # Extract book image URL and clean it up
        image_url = item.find('book_image_url').text.strip()
        # Remove size patterns like ._SY75_ or _SX50_ from the URL
        image_url = re.sub(r'\.?_S[XY]\d+_', '', image_url)
        
        # Extract book link
        link = item.find('link').text.strip()
        
        # Extract review text
        review_text = description.split('review:')[1].strip() if 'review:' in description else ''
        
        return {
            'title': title,
            'author': author,
            'rating': user_rating,
            'read_at': read_at,
            'image_url': image_url,
            'link': link,
            'review': review_text
        }
    except Exception as e:
        logger.error(f"Error extracting book data: {e}")
        return None

def extract_profile_stats(html_content: str) -> Dict:
    """Extract profile statistics from Goodreads profile HTML."""
    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        
        # Find the stats container
        stats_div = soup.find('div', class_='profilePageUserStatsInfo')
        if not stats_div:
            logger.error("Could not find profilePageUserStatsInfo div")
            return {}
        
        stats = {}
        
        # Extract ratings count and average
        ratings_link = stats_div.find('a', href=re.compile(r'/review/list/.*sort=rating'))
        if ratings_link:
            ratings_text = ratings_link.get_text(strip=True)
            ratings_match = re.search(r'(\d+)\s+ratings?', ratings_text)
            if ratings_match:
                stats['total_ratings'] = int(ratings_match.group(1))
        
        # Extract average rating
        avg_rating_link = stats_div.find('a', href='#')
        if avg_rating_link:
            avg_text = avg_rating_link.get_text(strip=True)
            avg_match = re.search(r'\(([\d.]+)\s+avg\)', avg_text)
            if avg_match:
                stats['average_rating'] = float(avg_match.group(1))
        
        # Extract reviews count
        reviews_link = stats_div.find('a', href=re.compile(r'/review/list/.*sort=review'))
        if reviews_link:
            reviews_text = reviews_link.get_text(strip=True)
            reviews_match = re.search(r'(\d+)\s+reviews?', reviews_text)
            if reviews_match:
                stats['total_reviews'] = int(reviews_match.group(1))
        
        return stats
    except Exception as e:
        logger.error(f"Error extracting profile stats: {e}")
        return {}

def fetch_goodreads_profile_stats(use_cache: bool = False) -> Dict:
    """Fetch and parse Goodreads profile statistics."""
    try:
        if use_cache and os.path.exists(CACHED_PROFILE_FILE):
            logger.info("Using cached profile data")
            with open(CACHED_PROFILE_FILE, 'r', encoding='utf-8') as f:
                html_content = f.read()
        else:
            logger.info("Fetching profile data from network")
            response = requests.get(GOODREADS_PROFILE_URL, headers=HEADERS)
            response.raise_for_status()
            html_content = response.text
        
        return extract_profile_stats(html_content)
    except Exception as e:
        logger.error(f"Error fetching Goodreads profile stats: {e}")
        return {}

def fetch_goodreads_reviews(use_cache: bool = False) -> Dict:
    """Fetch and parse Goodreads RSS feed."""
    try:
        if use_cache and os.path.exists(CACHED_RSS_FILE):
            logger.info("Using cached RSS data")
            with open(CACHED_RSS_FILE, 'r', encoding='utf-8') as f:
                rss_content = f.read()
        else:
            logger.info("Fetching RSS data from network")
            # Fetch the RSS feed with browser-like headers
            response = requests.get(GOODREADS_RSS_URL, headers=HEADERS)
            response.raise_for_status()
            rss_content = response.content.decode('utf-8')
        
        # Parse the XML
        root = ET.fromstring(rss_content)
        
        # Extract book reviews
        reviews = []
        for item in root.findall('.//item'):
            book_data = extract_book_data(item)
            if book_data:
                reviews.append(book_data)
        
        # Sort reviews by read_at date, with null dates at the bottom
        reviews.sort(key=lambda x: (x['read_at'] is None, x['read_at']), reverse=True)
        
        # Structure the data similar to Letterboxd
        return {
            'recent_reviews': reviews[:8],  # Get the 8 most recent reviews
            'profile_url': GOODREADS_PROFILE_URL,
        }
    except Exception as e:
        logger.error(f"Error fetching Goodreads reviews: {e}")
        return {
            'recent_reviews': [],
            'profile_url': GOODREADS_PROFILE_URL,
        }

def fetch_goodreads_data(use_cache: bool = False) -> Dict:
    """Fetch both reviews and profile stats."""
    reviews_data = fetch_goodreads_reviews(use_cache)
    stats_data = fetch_goodreads_profile_stats(use_cache)
    
    return {
        **reviews_data,
        'stats': stats_data
    }

def main():
    """Test function to print scraped data."""
    # Use cache if available for testing
    use_cache = os.path.exists(CACHED_PROFILE_FILE)
    if use_cache:
        print("Found cached data, using cache for testing...")
    
    data = fetch_goodreads_data(use_cache)
    print(data)
    
    
if __name__ == "__main__":
    main() 