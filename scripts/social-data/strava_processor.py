from __future__ import annotations

import os
import json
import logging
from datetime import datetime, timedelta, timezone
from typing import TypedDict

logger = logging.getLogger(__name__)

# Unit conversion constants
METERS_TO_MILES = 0.000621371
METERS_TO_FEET = 3.28084
MPS_TO_MPH = 2.23694

# Number of recent activities to return per sport type
RECENT_ACTIVITY_LIMIT = 8

class StravaActivity(TypedDict):
    id: int
    name: str
    distance: float  # in meters
    moving_time: int  # in seconds
    elapsed_time: int  # in seconds
    total_elevation_gain: float  # in meters
    type: str
    start_date: str
    average_speed: float  # in meters per second
    max_speed: float  # in meters per second
    average_heartrate: float | None
    max_heartrate: float | None
    average_cadence: float | None
    average_watts: float | None
    description: str | None
    commute: bool
    private: bool
    visibility: str
    gear_id: str | None
    external_id: str | None
    upload_id: int | None
    start_latlng: list[float] | None
    end_latlng: list[float] | None
    map: dict[str, str]

class StravaProcessor:
    def __init__(self):
        # Get the absolute path to the strava-fetcher data
        self.script_dir = os.path.dirname(os.path.abspath(__file__))
        self.activities_file = os.path.join(
            self.script_dir,
            '..',
            'strava-fetcher',
            'data',
            'activities.json'
        )
        self.activities_data = None

    def load_activities_data(self) -> list[StravaActivity]:
        """Load activities from the cached JSON file."""
        if self.activities_data is not None:
            return self.activities_data
            
        try:
            with open(self.activities_file, 'r') as f:
                self.activities_data = json.load(f)
            return self.activities_data
        except FileNotFoundError:
            raise FileNotFoundError(
                f"Activities file not found at {self.activities_file}. "
                "Please run the strava-fetcher first."
            )
        except json.JSONDecodeError:
            raise ValueError(f"Invalid JSON in activities file: {self.activities_file}")

    def filter_activities_by_date_range(self, activities: list[StravaActivity], days_back: int) -> list[StravaActivity]:
        """Filter activities to only include those within the specified number of days."""
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_back)
        filtered_activities = []
        
        for activity in activities:
            activity_date = datetime.fromisoformat(activity['start_date'].replace('Z', '+00:00'))
            if activity_date >= cutoff_date:
                filtered_activities.append(activity)
                
        return filtered_activities

    def calculate_activity_totals(self, activities: list[StravaActivity]) -> dict:
        """Calculate totals for a list of activities."""
        if not activities:
            return {
                'count': 0,
                'distance': 0,
                'moving_time': 0,
                'elapsed_time': 0,
                'elevation_gain': 0
            }
        
        total_distance = sum(activity.get('distance', 0) for activity in activities)
        total_moving_time = sum(activity.get('moving_time', 0) for activity in activities)
        total_elapsed_time = sum(activity.get('elapsed_time', 0) for activity in activities)
        total_elevation = sum(activity.get('total_elevation_gain', 0) for activity in activities)
        
        return {
            'count': len(activities),
            'distance': round(total_distance * METERS_TO_MILES, 2),
            'moving_time': total_moving_time,
            'elapsed_time': total_elapsed_time,
            'elevation_gain': round(total_elevation * METERS_TO_FEET, 0)
        }

    def get_activities_by_type(self, activity_type: str, exclude_commutes: bool = True) -> list[StravaActivity]:
        """Get all activities of a specific type."""
        activities = self.load_activities_data()
        filtered = [
            activity for activity in activities 
            if activity.get('type') == activity_type or activity.get('sport_type') == activity_type
        ]
        
        if exclude_commutes:
            filtered = [activity for activity in filtered if not activity.get('commute', False)]
            
        return filtered

    def format_activity(self, activity: StravaActivity) -> dict:
        """Format an activity into a consistent structure."""
        # Convert meters to miles
        distance_miles = activity.get('distance', 0) * METERS_TO_MILES

        # Convert meters per second to minutes per mile
        avg_speed_mph = activity.get('average_speed', 0) * MPS_TO_MPH
        pace_min_per_mile = 60 / avg_speed_mph if avg_speed_mph > 0 else 0
        
        return {
            'id': activity['id'],
            'name': activity['name'],
            'type': activity.get('type', activity.get('sport_type', 'Unknown')),
            'distance': round(distance_miles, 2),
            'moving_time': activity.get('moving_time', 0),
            'elapsed_time': activity.get('elapsed_time', 0),
            'elevation_gain': round(activity.get('total_elevation_gain', 0) * METERS_TO_FEET, 0),
            'average_pace': round(pace_min_per_mile, 2),
            'average_heartrate': activity.get('average_heartrate'),
            'max_heartrate': activity.get('max_heartrate'),
            'average_cadence': activity.get('average_cadence'),
            'average_watts': activity.get('average_watts'),
            'start_date': activity['start_date'],
            'description': activity.get('description'),
            'commute': activity.get('commute', False),
            'map': activity.get('map', {})
        }

    def calculate_record_stats(self, activities: list[StravaActivity]) -> dict:
        """Calculate record statistics from all activities."""
        if not activities:
            return {
                'biggest_ride_distance': 0,
                'biggest_climb_elevation_gain': 0
            }
        
        # Find biggest ride distance
        rides = [a for a in activities if a.get('type') == 'Ride' or a.get('sport_type') == 'Ride']
        biggest_ride = max(rides, key=lambda x: x.get('distance', 0), default={'distance': 0})
        
        # Find biggest climb
        biggest_climb = max(activities, key=lambda x: x.get('total_elevation_gain', 0), default={'total_elevation_gain': 0})
        
        return {
            'biggest_ride_distance': round(biggest_ride.get('distance', 0) * METERS_TO_MILES, 2),
            'biggest_climb_elevation_gain': round(biggest_climb.get('total_elevation_gain', 0) * METERS_TO_FEET, 0)
        }

    def get_recent_activities_data(self) -> dict:
        """Get recent activities and stats, formatted into a consistent structure."""
        activities = self.load_activities_data()
        
        # Get activities by type (latest 8 of each, excluding commutes)
        all_runs = self.get_activities_by_type('Run', exclude_commutes=True)
        all_bikes = self.get_activities_by_type('Ride', exclude_commutes=True)
        all_hikes = self.get_activities_by_type('Hike', exclude_commutes=True)
        all_swims = self.get_activities_by_type('Swim', exclude_commutes=True)
        
        # Sort by date and take latest N
        runs = sorted(all_runs, key=lambda x: x['start_date'], reverse=True)[:RECENT_ACTIVITY_LIMIT]
        bike_rides = sorted(all_bikes, key=lambda x: x['start_date'], reverse=True)[:RECENT_ACTIVITY_LIMIT]
        hikes = sorted(all_hikes, key=lambda x: x['start_date'], reverse=True)[:RECENT_ACTIVITY_LIMIT]
        
        # Calculate stats for different time periods
        current_year = datetime.now(timezone.utc).year
        ytd_activities = [
            a for a in activities 
            if datetime.fromisoformat(a['start_date'].replace('Z', '+00:00')).year == current_year
        ]
        recent_activities = self.filter_activities_by_date_range(activities, 28)  # 4 weeks
        
        # Filter by activity type for stats
        ytd_runs = [a for a in ytd_activities if a.get('type') == 'Run' or a.get('sport_type') == 'Run']
        ytd_rides = [a for a in ytd_activities if a.get('type') == 'Ride' or a.get('sport_type') == 'Ride']
        ytd_swims = [a for a in ytd_activities if a.get('type') == 'Swim' or a.get('sport_type') == 'Swim']
        
        recent_runs = [a for a in recent_activities if a.get('type') == 'Run' or a.get('sport_type') == 'Run']
        recent_rides = [a for a in recent_activities if a.get('type') == 'Ride' or a.get('sport_type') == 'Ride']
        recent_swims = [a for a in recent_activities if a.get('type') == 'Swim' or a.get('sport_type') == 'Swim']
        
        # Calculate record stats
        records = self.calculate_record_stats(activities)
        
        return {
            'recent_runs': [self.format_activity(run) for run in runs],
            'recent_bikes': [self.format_activity(bike) for bike in bike_rides],
            'recent_hikes': [self.format_activity(hike) for hike in hikes],
            'stats': {
                # Running stats
                'running': {
                    'ytd': self.calculate_activity_totals(ytd_runs),
                    'all_time': self.calculate_activity_totals(all_runs),
                    'recent': self.calculate_activity_totals(recent_runs)
                },
                # Biking stats
                'biking': {
                    'ytd': self.calculate_activity_totals(ytd_rides),
                    'all_time': self.calculate_activity_totals(all_bikes),
                    'recent': self.calculate_activity_totals(recent_rides)
                },
                # Swimming stats
                'swimming': {
                    'ytd': self.calculate_activity_totals(ytd_swims),
                    'all_time': self.calculate_activity_totals(all_swims),
                    'recent': self.calculate_activity_totals(recent_swims)
                },
                # Record stats
                'biggest_ride_distance': records['biggest_ride_distance'],
                'biggest_climb_elevation_gain': records['biggest_climb_elevation_gain']
            }
        }

def main() -> None:
    """Test entry point: loads activities and logs a summary of stats."""
    try:
        processor = StravaProcessor()
        data = processor.get_recent_activities_data()

        logger.info("=== Strava Comprehensive Stats ===")

        # Running stats
        logger.info("RUNNING:")
        logger.info(f"  Year to Date: {data['stats']['running']['ytd']['count']} runs, {data['stats']['running']['ytd']['distance']} miles")
        logger.info(f"  All Time: {data['stats']['running']['all_time']['count']} runs, {data['stats']['running']['all_time']['distance']} miles")
        logger.info(f"  Recent (4 weeks): {data['stats']['running']['recent']['count']} runs, {data['stats']['running']['recent']['distance']} miles")

        # Biking stats
        logger.info("BIKING:")
        logger.info(f"  Year to Date: {data['stats']['biking']['ytd']['count']} rides, {data['stats']['biking']['ytd']['distance']} miles")
        logger.info(f"  All Time: {data['stats']['biking']['all_time']['count']} rides, {data['stats']['biking']['all_time']['distance']} miles")
        logger.info(f"  Recent (4 weeks): {data['stats']['biking']['recent']['count']} rides, {data['stats']['biking']['recent']['distance']} miles")

        # Swimming stats
        logger.info("SWIMMING:")
        logger.info(f"  Year to Date: {data['stats']['swimming']['ytd']['count']} swims, {data['stats']['swimming']['ytd']['distance']} miles")
        logger.info(f"  All Time: {data['stats']['swimming']['all_time']['count']} swims, {data['stats']['swimming']['all_time']['distance']} miles")
        logger.info(f"  Recent (4 weeks): {data['stats']['swimming']['recent']['count']} swims, {data['stats']['swimming']['recent']['distance']} miles")

        # Record stats
        logger.info("RECORDS:")
        logger.info(f"  Biggest ride distance: {data['stats']['biggest_ride_distance']} miles")
        logger.info(f"  Biggest climb elevation: {data['stats']['biggest_climb_elevation_gain']} feet")

        logger.info("Successfully updated social data with comprehensive Strava stats")

    except Exception as e:
        logger.error(f"Error updating Strava data: {str(e)}")
        raise

if __name__ == '__main__':
    main() 