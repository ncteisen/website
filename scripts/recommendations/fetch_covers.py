#!/usr/bin/env python3

from __future__ import annotations

import json
import logging
import os
import re

import requests
from bs4 import BeautifulSoup

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_FILE = os.path.join(SCRIPT_DIR, 'reviews.json')
OUTPUT_FILE = os.path.join(SCRIPT_DIR, 'data', 'metadata.json')

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
}

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def scrape_film(url: str) -> dict[str, str]:
    """Scrape title, director, year, and poster from a Letterboxd film page."""
    resp = requests.get(url, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    html = resp.text

    # Extract JSON-LD structured data (Letterboxd wraps it in CDATA comments)
    soup = BeautifulSoup(html, 'html.parser')
    ld_tag = soup.find('script', type='application/ld+json')
    ld = {}
    if ld_tag:
        raw = ld_tag.string or ld_tag.get_text()
        raw = re.sub(r'/\*.*?\*/', '', raw, flags=re.DOTALL).strip()
        ld = json.loads(raw)

    title = ld.get('name', '')
    directors = ld.get('director', [])
    director = directors[0]['name'] if directors else ''
    released = ld.get('releasedEvent', [])
    year = released[0].get('startDate', '') if released else ''

    subtitle = f'{director}, {year}' if director and year else director or year

    # Extract poster image (existing proven regex + upscale)
    matches = re.findall(
        r'((?:film-poster|sm/upload)/[^\s"\'<>]+-0-230-0-345-crop\.jpg[^\s"\'<>]*)',
        html,
    )
    cover = ''
    if matches:
        path = matches[0].replace('-0-230-0-345-crop', '-0-600-0-900-crop')
        cover = f'https://a.ltrbxd.com/resized/{path}'

    logger.info(f'Film: {title} ({subtitle}) — cover {"found" if cover else "MISSING"}')
    return {'title': title, 'subtitle': subtitle, 'cover': cover}


def scrape_book(url: str) -> dict[str, str]:
    """Scrape title, author, and cover from a Goodreads book page."""
    resp = requests.get(url, headers=HEADERS, timeout=15)
    resp.raise_for_status()
    html = resp.text

    soup = BeautifulSoup(html, 'html.parser')

    # Extract JSON-LD structured data
    ld_tag = soup.find('script', type='application/ld+json')
    ld = json.loads(ld_tag.string) if ld_tag else {}

    title = ld.get('name', '')
    authors = ld.get('author', [])
    author = authors[0]['name'] if authors else ''

    # Cover image: try og:image first, then JSON-LD
    og_img = soup.find('meta', property='og:image')
    cover = og_img['content'] if og_img else ld.get('image', '')

    logger.info(f'Book: {title} ({author}) — cover {"found" if cover else "MISSING"}')
    return {'title': title, 'subtitle': author, 'cover': cover}


def main() -> None:
    with open(INPUT_FILE) as f:
        recs = json.load(f)

    output: dict[str, list] = {'films': [], 'books': []}

    for film in recs['films']:
        metadata = scrape_film(film['url'])
        output['films'].append({'url': film['url'], **metadata})

    for book in recs['books']:
        metadata = scrape_book(book['url'])
        output['books'].append({'url': book['url'], **metadata})

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output, f, indent=2)

    total = len(output['films']) + len(output['books'])
    logger.info(f'Saved {total} recommendations to {OUTPUT_FILE}')


if __name__ == '__main__':
    main()
