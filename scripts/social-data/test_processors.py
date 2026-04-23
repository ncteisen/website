"""Tests for social data processors."""

from __future__ import annotations

import pytest

from goodreads_processor import clean_review_html, convert_book_to_review
from letterboxd_processor import convert_film_to_review, calculate_stats
from strava_processor import StravaProcessor, METERS_TO_MILES, METERS_TO_FEET


# === Goodreads processor tests ===

class TestCleanReviewHtml:
    def test_strips_leading_br(self):
        assert clean_review_html("<br/>Great book") == "Great book"

    def test_strips_trailing_br(self):
        assert clean_review_html("Great book<br/>") == "Great book"

    def test_strips_both(self):
        assert clean_review_html("<br/>Great book<br/>") == "Great book"

    def test_strips_multiple_br(self):
        assert clean_review_html("<br/><br/>Great book<br/><br/>") == "Great book"

    def test_strips_br_with_space(self):
        assert clean_review_html("<br />Hello<br />") == "Hello"

    def test_empty_br_only(self):
        assert clean_review_html("<br/><br/>") == ""

    def test_preserves_interior_br(self):
        assert clean_review_html("Good<br/>Very good") == "Good<br/>Very good"

    def test_empty_string(self):
        assert clean_review_html("") == ""


class TestConvertBookToReview:
    def test_basic_conversion(self):
        book = {
            'title': 'Dune',
            'author_name': 'Frank Herbert',
            'user_rating': 5,
            'user_read_at': 'Mon, 01 Jan 2024 00:00:00 -0000',
            'book_image_url': 'https://example.com/dune.jpg',
            'guid': 'https://goodreads.com/review/123',
            'user_review': '<br/>Amazing<br/>',
        }
        review = convert_book_to_review(book)
        assert review['title'] == 'Dune'
        assert review['author'] == 'Frank Herbert'
        assert review['rating'] == 5
        assert review['review'] == 'Amazing'

    def test_missing_fields_default(self):
        review = convert_book_to_review({})
        assert review['title'] == ''
        assert review['author'] == ''
        assert review['rating'] == 0
        assert review['review'] == ''


# === Letterboxd processor tests ===

class TestConvertFilmToReview:
    def test_basic_conversion(self):
        film = {
            'title': 'Blade Runner 2049',
            'year': 2017,
            'rating': 5.0,
            'watched_date': '2024-01-15',
            'is_rewatch': True,
            'review': 'Masterpiece',
            'image_url': 'https://example.com/br.jpg',
            'link': 'https://letterboxd.com/film/br2049',
        }
        review = convert_film_to_review(film)
        assert review['title'] == 'Blade Runner 2049'
        assert review['year'] == 2017
        assert review['rating'] == 5.0
        assert review['is_rewatch'] is True


class TestCalculateFilmStats:
    def test_films_this_year(self):
        from datetime import datetime, timezone
        year = str(datetime.now(timezone.utc).year)
        films = [
            {'watched_date': f'{year}-01-15'},
            {'watched_date': f'{year}-03-20'},
            {'watched_date': '2020-06-01'},
        ]
        stats = calculate_stats(films)
        assert stats['total_films'] == 3
        assert stats['films_this_year'] == 2


# === Strava processor tests ===

class TestFormatActivity:
    def setup_method(self):
        self.processor = StravaProcessor()

    def test_unit_conversion(self):
        activity = {
            'id': 1,
            'name': 'Morning Run',
            'type': 'Run',
            'distance': 5000,  # meters
            'moving_time': 1800,
            'elapsed_time': 1900,
            'total_elevation_gain': 100,  # meters
            'average_speed': 3.0,
            'start_date': '2024-01-15T08:00:00Z',
            'map': {},
        }
        result = self.processor.format_activity(activity)
        assert result['distance'] == round(5000 * METERS_TO_MILES, 2)
        assert result['elevation_gain'] == round(100 * METERS_TO_FEET, 0)
        assert result['moving_time'] == 1800
        assert result['name'] == 'Morning Run'

    def test_zero_speed(self):
        activity = {
            'id': 2,
            'name': 'Rest',
            'type': 'Run',
            'distance': 0,
            'moving_time': 0,
            'elapsed_time': 0,
            'total_elevation_gain': 0,
            'average_speed': 0,
            'start_date': '2024-01-15T08:00:00Z',
            'map': {},
        }
        result = self.processor.format_activity(activity)
        assert result['average_pace'] == 0


class TestCalculateActivityTotals:
    def setup_method(self):
        self.processor = StravaProcessor()

    def test_empty_list(self):
        totals = self.processor.calculate_activity_totals([])
        assert totals['count'] == 0
        assert totals['distance'] == 0

    def test_sums_correctly(self):
        activities = [
            {'distance': 5000, 'moving_time': 1800, 'elapsed_time': 1900, 'total_elevation_gain': 50},
            {'distance': 10000, 'moving_time': 3600, 'elapsed_time': 3700, 'total_elevation_gain': 100},
        ]
        totals = self.processor.calculate_activity_totals(activities)
        assert totals['count'] == 2
        assert totals['distance'] == round(15000 * METERS_TO_MILES, 2)
        assert totals['moving_time'] == 5400
        assert totals['elevation_gain'] == round(150 * METERS_TO_FEET, 0)
