from __future__ import annotations

import argparse
import json
import logging
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent.parent
sys.path.insert(0, str(SCRIPT_DIR.parent))
from pipeline_utils import atomic_write_json, parse_date, public_strava_activities
from token_state import TokenState

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
DATA_FILE = SCRIPT_DIR / 'data' / 'activities.json'


class StravaDataCollector:
    def __init__(self):
        load_dotenv(REPO_ROOT / '.env')
        self.client_id = os.getenv('STRAVA_CLIENT_ID')
        self.client_secret = os.getenv('STRAVA_CLIENT_SECRET')
        self.refresh_token = os.getenv('STRAVA_REFRESH_TOKEN')
        if not self.client_id or not self.client_secret:
            raise ValueError('Missing Strava client configuration')
        self.token_state = TokenState(REPO_ROOT)
        self.access_token = None
        self.activities = []
        self.existing_activities = []
        self.fetch_complete = False
        self.authoritative = False
        self.after = None

    def get_access_token(self) -> bool:
        with self.token_state.locked():
            current = self.token_state.load(self.refresh_token)
            self.token_state.preflight()
            response = requests.post('https://www.strava.com/oauth/token', data={
                'client_id': self.client_id, 'client_secret': self.client_secret,
                'refresh_token': current, 'grant_type': 'refresh_token',
            }, timeout=30)
            if response.status_code != 200:
                raise RuntimeError(f'Strava token exchange failed (HTTP {response.status_code})')
            payload = response.json()
            if not all(isinstance(payload.get(key), str) and payload[key] for key in ('access_token', 'refresh_token')):
                raise RuntimeError('Strava token response is incomplete')
            # Persist rotation before using the access token or publishing data.
            self.token_state.save(payload['refresh_token'])
            self.refresh_token = payload['refresh_token']
            self.access_token = payload['access_token']
        return True

    def load_existing_activities(self, filename: str | Path | None = None) -> None:
        path = Path(filename or DATA_FILE)
        self.existing_activities = public_strava_activities(json.loads(path.read_text())) if path.exists() else []

    def fetch_activities(self, per_page: int = 200, max_pages: int = 100, fetch_all: bool = True, allow_empty: bool = False) -> None:
        self.fetch_complete = False
        self.authoritative = fetch_all or not self.existing_activities
        self.after = None if self.authoritative else datetime.now(timezone.utc) - timedelta(days=30)
        if not self.access_token:
            self.get_access_token()
        staged = []
        seen = set()
        for page in range(1, max_pages + 1):
            params = {'per_page': per_page, 'page': page}
            if self.after:
                params['after'] = int(self.after.timestamp())
            response = requests.get('https://www.strava.com/api/v3/athlete/activities',
                                    headers={'Authorization': f'Bearer {self.access_token}'},
                                    params=params, timeout=30)
            if response.status_code != 200:
                raise RuntimeError(f'Strava activity fetch failed (HTTP {response.status_code}); cache unchanged')
            batch = response.json()
            if not isinstance(batch, list) or any(not isinstance(item, dict) or not isinstance(item.get('id'), int) for item in batch):
                raise ValueError('Invalid Strava activity response; cache unchanged')
            if not batch:
                if self.authoritative and self.existing_activities and not staged and not allow_empty:
                    raise RuntimeError('Refusing an unexpected empty full refresh; use --allow-empty-refresh only after verifying the upstream account')
                self.activities = public_strava_activities(staged)
                self.fetch_complete = True
                return
            ids = {item['id'] for item in batch}
            if not ids or ids & seen:
                raise RuntimeError('Repeated Strava pagination results; cache unchanged')
            seen.update(ids)
            staged.extend(batch)
        raise RuntimeError('Strava pagination limit reached before completion; cache unchanged')

    def update_and_save_activities(self, filename: str | Path | None = None) -> None:
        if not self.fetch_complete:
            raise RuntimeError('Cannot save an incomplete Strava fetch')
        # Full sync is authoritative. Incremental sync reconciles the complete
        # requested time window, including removals and newly private records.
        retained = [] if self.authoritative else [a for a in self.existing_activities if parse_date(a['start_date']) < self.after]
        merged = {a['id']: a for a in retained + self.activities}
        public = public_strava_activities(list(merged.values()))
        public.sort(key=lambda item: item['start_date'], reverse=True)
        atomic_write_json(filename or DATA_FILE, public)
        logger.info('Saved %s public activities; public summary routes retained when available; private provider metadata omitted', len(public))


def sanitize_cache(filename: str | Path = DATA_FILE) -> None:
    path = Path(filename)
    public = public_strava_activities(json.loads(path.read_text()))
    public.sort(key=lambda item: item['start_date'], reverse=True)
    atomic_write_json(path, public)
    logger.info('Sanitized cache: %s public activity projections retained', len(public))


def main() -> None:
    parser = argparse.ArgumentParser(description='Fetch a validated public-only Strava projection.')
    parser.add_argument('--sanitize-cache', action='store_true', help='Sanitize the existing cache offline; no credentials or network required.')
    parser.add_argument('--incremental', action='store_true', help='Reconcile only the last 30 days. Normal full sync also removes older deletions.')
    parser.add_argument('--allow-empty-refresh', action='store_true', help='Explicitly allow an authoritative empty account response.')
    args = parser.parse_args()
    if args.sanitize_cache:
        sanitize_cache()
        return
    collector = StravaDataCollector()
    collector.load_existing_activities()
    collector.fetch_activities(fetch_all=not args.incremental, allow_empty=args.allow_empty_refresh)
    collector.update_and_save_activities()


if __name__ == '__main__':
    main()
