import requests
import xml.etree.ElementTree as ET
from typing import Dict, List
import logging
import re

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

def fetch_goodreads_reviews() -> Dict:
    """Fetch and parse Goodreads RSS feed."""
    try:
        # Fetch the RSS feed with browser-like headers
        response = requests.get(GOODREADS_RSS_URL, headers=HEADERS)
        response.raise_for_status()
        
        # Parse the XML
        root = ET.fromstring(response.content)
        
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

def main():
    """Test function to print scraped data."""
    reviews = fetch_goodreads_reviews()
    print("\nScraped Goodreads Reviews:")
    print("=" * 80)
    
    for i, review in enumerate(reviews['recent_reviews'], 1):
        print(f"\nReview #{i}:")
        print(f"Title: {review['title']}")
        print(f"Author: {review['author']}")
        print(f"Rating: {review['rating']}/5")
        print(f"Read At: {review['read_at']}")
        print(f"Image URL: {review['image_url']}")
        print(f"Review Link: {review['link']}")
        if review['review']:
            print(f"Review: {review['review']}")
        print("-" * 80)
    
if __name__ == "__main__":
    main() 