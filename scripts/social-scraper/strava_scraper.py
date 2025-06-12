import os
import json
import requests
from datetime import datetime
from dotenv import load_dotenv
from typing import Dict, List, Optional, TypedDict

# Load environment variables
load_dotenv()

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
    average_heartrate: Optional[float]
    max_heartrate: Optional[float]
    average_cadence: Optional[float]
    average_watts: Optional[float]
    description: Optional[str]
    commute: bool
    private: bool
    visibility: str
    gear_id: Optional[str]
    external_id: Optional[str]
    upload_id: Optional[int]
    start_latlng: Optional[List[float]]
    end_latlng: Optional[List[float]]
    map: Dict[str, str]

class StravaScraper:
    def __init__(self):
        self.client_id = os.getenv('STRAVA_CLIENT_ID')
        self.client_secret = os.getenv('STRAVA_CLIENT_SECRET')
        self.refresh_token = os.getenv('STRAVA_REFRESH_TOKEN')
        self.access_token = None
        self.expires_at = None

    def get_access_token(self) -> str:
        """Get a new access token using the refresh token."""
        if self.access_token and self.expires_at and datetime.now().timestamp() < self.expires_at:
            return self.access_token

        response = requests.post(
            'https://www.strava.com/oauth/token',
            data={
                'client_id': self.client_id,
                'client_secret': self.client_secret,
                'refresh_token': self.refresh_token,
                'grant_type': 'refresh_token'
            }
        )
        response.raise_for_status()
        data = response.json()
        
        self.access_token = data['access_token']
        self.expires_at = data['expires_at']
        return self.access_token

    def get_athlete_id(self) -> int:
        """Get the current athlete's ID."""
        access_token = self.get_access_token()
        headers = {'Authorization': f'Bearer {access_token}'}
        
        response = requests.get(
            'https://www.strava.com/api/v3/athlete',
            headers=headers
        )
        response.raise_for_status()
        return response.json()['id']

    def get_athlete_stats(self) -> Dict:
        """Get athlete statistics from Strava."""
        athlete_id = self.get_athlete_id()
        access_token = self.get_access_token()
        headers = {'Authorization': f'Bearer {access_token}'}
        
        response = requests.get(
            f'https://www.strava.com/api/v3/athletes/{athlete_id}/stats',
            headers=headers
        )
        response.raise_for_status()
        return response.json()

    def get_recent_activities(self, per_page: int = 100) -> List[StravaActivity]:
        """Get recent activities from Strava."""
        access_token = self.get_access_token()
        headers = {'Authorization': f'Bearer {access_token}'}
        
        response = requests.get(
            'https://www.strava.com/api/v3/athlete/activities',
            headers=headers,
            params={'per_page': per_page}
        )
        response.raise_for_status()
        return response.json()

    def format_activity(self, activity: StravaActivity) -> Dict:
        """Format an activity into a consistent structure."""
        # Convert meters to miles
        distance_miles = activity['distance'] * 0.000621371
        
        # Convert meters per second to minutes per mile
        avg_speed_mph = activity['average_speed'] * 2.23694
        pace_min_per_mile = 60 / avg_speed_mph if avg_speed_mph > 0 else 0
        
        return {
            'id': activity['id'],
            'name': activity['name'],
            'type': activity['type'],
            'distance': round(distance_miles, 2),
            'moving_time': activity['moving_time'],
            'elapsed_time': activity['elapsed_time'],
            'elevation_gain': round(activity['total_elevation_gain'] * 3.28084, 0),  # Convert to feet
            'average_pace': round(pace_min_per_mile, 2),
            'average_heartrate': activity.get('average_heartrate'),
            'max_heartrate': activity.get('max_heartrate'),
            'average_cadence': activity.get('average_cadence'),
            'average_watts': activity.get('average_watts'),
            'start_date': activity['start_date'],
            'description': activity.get('description'),
            'commute': activity['commute'],
            'map': activity['map']
        }

    def get_recent_activities_data(self) -> Dict:
        """Get recent activities and stats, formatted into a consistent structure."""
        # Get recent activities
        activities = self.get_recent_activities()
        
        # Filter and get the latest 8 of each type, excluding commutes
        runs = [a for a in activities if a['type'] == 'Run' and not a['commute']][:8]
        bike_rides = [a for a in activities if a['type'] == 'Ride' and not a['commute']][:8]
        hikes = [a for a in activities if a['type'] == 'Hike'][:8]
        
        # Get athlete stats
        stats = self.get_athlete_stats()
        
        # Helper function to format activity totals
        def format_activity_totals(totals_data):
            return {
                'count': totals_data.get('count', 0),
                'distance': round(totals_data.get('distance', 0) * 0.000621371, 2),  # Convert meters to miles
                'moving_time': totals_data.get('moving_time', 0),  # in seconds
                'elapsed_time': totals_data.get('elapsed_time', 0),  # in seconds
                'elevation_gain': round(totals_data.get('elevation_gain', 0) * 3.28084, 0)  # Convert meters to feet
            }
        
        return {
            'recent_runs': [self.format_activity(run) for run in runs],
            'recent_bikes': [self.format_activity(bike) for bike in bike_rides],
            'recent_hikes': [self.format_activity(hike) for hike in hikes],
            'stats': {
                # Running stats
                'running': {
                    'ytd': format_activity_totals(stats.get('ytd_run_totals', {})),
                    'all_time': format_activity_totals(stats.get('all_run_totals', {})),
                    'recent': format_activity_totals(stats.get('recent_run_totals', {}))
                },
                # Biking stats
                'biking': {
                    'ytd': format_activity_totals(stats.get('ytd_ride_totals', {})),
                    'all_time': format_activity_totals(stats.get('all_ride_totals', {})),
                    'recent': format_activity_totals(stats.get('recent_ride_totals', {}))
                },
                # Swimming stats
                'swimming': {
                    'ytd': format_activity_totals(stats.get('ytd_swim_totals', {})),
                    'all_time': format_activity_totals(stats.get('all_swim_totals', {})),
                    'recent': format_activity_totals(stats.get('recent_swim_totals', {}))
                },
                # Additional interesting stats
                'biggest_ride_distance': round(stats.get('biggest_ride_distance', 0) * 0.000621371, 2),  # Convert to miles
                'biggest_climb_elevation_gain': round(stats.get('biggest_climb_elevation_gain', 0) * 3.28084, 0)  # Convert to feet
            }
        }

def main():
    try:
        scraper = StravaScraper()
        data = scraper.get_recent_activities_data()
        
        # Print comprehensive stats for testing
        print("=== Strava Comprehensive Stats ===")
        
        # Running stats
        print("\n🏃 RUNNING:")
        print(f"  Year to Date: {data['stats']['running']['ytd']['count']} runs, {data['stats']['running']['ytd']['distance']} miles")
        print(f"  All Time: {data['stats']['running']['all_time']['count']} runs, {data['stats']['running']['all_time']['distance']} miles")
        print(f"  Recent (4 weeks): {data['stats']['running']['recent']['count']} runs, {data['stats']['running']['recent']['distance']} miles")
        
        # Biking stats
        print("\n🚴 BIKING:")
        print(f"  Year to Date: {data['stats']['biking']['ytd']['count']} rides, {data['stats']['biking']['ytd']['distance']} miles")
        print(f"  All Time: {data['stats']['biking']['all_time']['count']} rides, {data['stats']['biking']['all_time']['distance']} miles")
        print(f"  Recent (4 weeks): {data['stats']['biking']['recent']['count']} rides, {data['stats']['biking']['recent']['distance']} miles")
        
        # Swimming stats
        print("\n🏊 SWIMMING:")
        print(f"  Year to Date: {data['stats']['swimming']['ytd']['count']} swims, {data['stats']['swimming']['ytd']['distance']} miles")
        print(f"  All Time: {data['stats']['swimming']['all_time']['count']} swims, {data['stats']['swimming']['all_time']['distance']} miles")
        print(f"  Recent (4 weeks): {data['stats']['swimming']['recent']['count']} swims, {data['stats']['swimming']['recent']['distance']} miles")
        
        # Additional stats
        print(f"\n🏆 RECORDS:")
        print(f"  Biggest ride distance: {data['stats']['biggest_ride_distance']} miles")
        print(f"  Biggest climb elevation: {data['stats']['biggest_climb_elevation_gain']} feet")
        
        # Save to JSON file
        with open('src/data/social_data.json', 'r') as f:
            existing_data = json.load(f)
        
        # Update the existing data with Strava data
        existing_data['strava'] = data
        
        with open('src/data/social_data.json', 'w') as f:
            json.dump(existing_data, f, indent=2)
            
        print("\n✅ Successfully updated social data with comprehensive Strava stats")
        
    except Exception as e:
        print(f"❌ Error updating Strava data: {str(e)}")
        raise

if __name__ == '__main__':
    main() 