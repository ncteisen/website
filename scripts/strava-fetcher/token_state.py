"""Private refresh-token storage. Never include tokens in diagnostics or artifacts."""
from __future__ import annotations

import fcntl
import json
import os
import subprocess
import time
from contextlib import contextmanager
from pathlib import Path

from pipeline_utils import atomic_write_json


class TokenState:
    def __init__(self, root: Path):
        # Both names match the repository's existing .env.*.local ignore rule.
        self.path = root / '.env.strava-state.local'
        self.lock_path = root / '.env.strava-lock.local'
        self.github = os.getenv('GITHUB_ACTIONS') == 'true'
        self.repository = os.getenv('GITHUB_REPOSITORY', '')
        self.writer_token = os.getenv('STRAVA_TOKEN_STATE_WRITE_TOKEN', '')
        self.environment = os.getenv('STRAVA_TOKEN_STATE_ENVIRONMENT', '')

    @contextmanager
    def locked(self):
        if self.github and (not self.writer_token or not self.repository or self.environment != 'strava-sync'):
            raise RuntimeError('Strava CI refresh is disabled until private token persistence is configured; see scripts/social-data/README.md')
        fd = os.open(self.lock_path, os.O_CREAT | os.O_RDWR, 0o600)
        with os.fdopen(fd, 'a+') as lock:
            os.fchmod(lock.fileno(), 0o600)
            fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
            yield

    def load(self, fallback: str | None) -> str:
        if self.path.exists():
            os.chmod(self.path, 0o600)
            try:
                token = json.loads(self.path.read_text())['refresh_token']
            except (ValueError, KeyError, TypeError):
                raise RuntimeError('Invalid private Strava token state') from None
        else:
            token = fallback
        if not isinstance(token, str) or not token:
            raise RuntimeError('No Strava refresh token is configured')
        return token

    def _require_environment_secret(self) -> None:
        # An absent environment secret would silently fall back to a repository
        # secret captured when the workflow was queued. Never refresh with that.
        try:
            result = subprocess.run(
                ['gh', 'api', f'repos/{self.repository}/environments/{self.environment}/secrets/STRAVA_REFRESH_TOKEN'],
                text=True, capture_output=True,
                env=dict(os.environ, GH_TOKEN=self.writer_token), timeout=45,
            )
            if result.returncode == 0 and json.loads(result.stdout).get('name') == 'STRAVA_REFRESH_TOKEN':
                return
        except (OSError, subprocess.TimeoutExpired, ValueError, AttributeError):
            pass
        raise RuntimeError('Required strava-sync environment refresh secret is unavailable; refusing repository-secret fallback before OAuth')

    def _write_github_secret(self, token: str, name: str = 'STRAVA_REFRESH_TOKEN') -> None:
        environment = dict(os.environ, GH_TOKEN=self.writer_token)
        for attempt in range(3):
            try:
                result = subprocess.run(
                    ['gh', 'secret', 'set', name, '--repo', self.repository, '--env', self.environment],
                    input=token, text=True, capture_output=True, env=environment, timeout=45,
                )
                if result.returncode == 0:
                    return
            except (OSError, subprocess.TimeoutExpired):
                pass
            if attempt < 2:
                time.sleep(attempt + 1)
        raise RuntimeError('Could not persist private Strava token state in GitHub; no data will be published. Reauthorization may be needed if rotation already occurred.')

    def preflight(self) -> None:
        if self.github:
            self._require_environment_secret()
            # Verify write permission without touching the authoritative token.
            # A stale queued input must never roll back the current secret.
            self._write_github_secret('ready', name='STRAVA_TOKEN_STATE_PROBE')

    def save(self, token: str) -> None:
        atomic_write_json(self.path, {'refresh_token': token}, mode=0o600)
        if self.github:
            self._write_github_secret(token)
