"""Offline validation and atomic output helpers shared by the data pipeline."""
from __future__ import annotations

import json
import math
import os
import tempfile
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlsplit

from bs4 import BeautifulSoup


def atomic_write_json(path: str | Path, data: object, *, mode: int | None = None) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    # Private state staging must also match the repository's ignored
    # .env.*.local pattern, including during an interrupted atomic write.
    if mode == 0o600:
        fd, temporary = tempfile.mkstemp(prefix='.env.private-', suffix='.local', dir=path.parent)
    else:
        fd, temporary = tempfile.mkstemp(prefix=f'.{path.name}.', dir=path.parent)
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as output:
            json.dump(data, output, indent=2, allow_nan=False)
            output.write('\n')
            output.flush()
            os.fsync(output.fileno())
        os.chmod(temporary, mode if mode is not None else 0o644)
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)


def parse_date(value: object) -> datetime | None:
    """Normalize feed timestamps to UTC; invalid/missing dates sort last."""
    if not isinstance(value, str) or not value.strip():
        return None
    try:
        parsed = parsedate_to_datetime(value)
    except (ValueError, TypeError, OverflowError):
        try:
            parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
        except (ValueError, TypeError, OverflowError):
            return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc)


def date_sort_key(value: object) -> datetime:
    return parse_date(value) or datetime.min.replace(tzinfo=timezone.utc)


def sanitize_review_html(value: object) -> str:
    """Keep review formatting and HTTP(S) links, never executable markup."""
    soup = BeautifulSoup(value if isinstance(value, str) else '', 'html.parser')
    blocked = {'script', 'style', 'iframe', 'object', 'embed', 'svg', 'math',
               'form', 'input', 'button', 'template', 'link', 'meta', 'img',
               'video', 'audio', 'source'}
    allowed = {'p', 'br', 'strong', 'em', 'b', 'i', 'u', 'blockquote', 'ul', 'ol', 'li', 'a'}
    for tag in list(soup.find_all(True)):
        if tag.name is None:
            continue
        if tag.name in blocked:
            tag.decompose()
        elif tag.name not in allowed:
            tag.unwrap()
        else:
            href = tag.get('href') if tag.name == 'a' else None
            tag.attrs = {}
            if isinstance(href, str):
                try:
                    parsed = urlsplit(href.strip())
                except ValueError:
                    parsed = None
                if parsed and parsed.scheme.lower() in {'http', 'https'} and parsed.netloc:
                    tag['href'] = href.strip()
                    tag['rel'] = 'noopener noreferrer'
    return str(soup).strip()


def public_strava_activity(activity: dict) -> dict | None:
    """Fail closed and persist only the deliberately public activity projection.

    Routes, coordinates, descriptions, physiology and provider/athlete metadata
    are omitted. Broad OAuth scope cannot prove that cached routes respect map
    visibility/privacy-zone settings, even when the activity is public.
    """
    if activity.get('visibility') != 'everyone' or activity.get('private') is not False:
        return None
    activity_id = activity.get('id')
    started = parse_date(activity.get('start_date'))
    if isinstance(activity_id, bool) or not isinstance(activity_id, int) or activity_id <= 0 or started is None:
        raise ValueError('Public activity has invalid identity or start date')
    if not isinstance(activity.get('name'), str):
        raise ValueError('Public activity has invalid name')
    result = {
        'id': activity_id,
        'name': activity['name'],
        'type': activity.get('type') or activity.get('sport_type') or 'Unknown',
        'sport_type': activity.get('sport_type') or activity.get('type') or 'Unknown',
        'start_date': started.isoformat().replace('+00:00', 'Z'),
        'commute': activity.get('commute') is True,
        'private': False,
        'visibility': 'everyone',
    }
    for key in ('distance', 'moving_time', 'elapsed_time', 'total_elevation_gain', 'average_speed'):
        value = activity.get(key, 0)
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or value < 0:
            raise ValueError('Public activity contains an invalid numeric field')
        result[key] = value
    return result


def public_strava_activities(activities: object) -> list[dict]:
    if not isinstance(activities, list) or any(not isinstance(item, dict) for item in activities):
        raise ValueError('Activity cache must be a list of records')
    public = []
    seen = set()
    for activity in activities:
        projected = public_strava_activity(activity)
        if projected is not None and projected['id'] not in seen:
            public.append(projected)
            seen.add(projected['id'])
    return public
