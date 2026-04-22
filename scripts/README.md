# Scripts

Python automation scripts for the website. Each subdirectory handles a different concern.

| Directory | Purpose |
|---|---|
| `social-data/` | Orchestrates the social data pipeline — combines fetched data into `src/data/social_data.json` |
| `strava-fetcher/` | Fetches activity data from the Strava API |
| `goodreads-fetcher/` | Fetches book data from the Goodreads RSS feed |
| `letterboxd-fetcher/` | Fetches film data from the Letterboxd RSS feed |
| `resume-generator/` | Generates `resume.tex` from `resume/resume_data.json` |

See [`social-data/README.md`](social-data/README.md) for the full data pipeline diagram and details.

## Python Environment Setup

Requires Python 3.12+.

```bash
# Create and activate a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

All scripts should be run from the **repo root**, not from inside their directories:

```bash
# Fetch fresh data from external sources
python scripts/strava-fetcher/fetch_activities.py
python scripts/goodreads-fetcher/fetch_books.py
python scripts/letterboxd-fetcher/fetch_films.py

# Run the orchestrator to combine everything into social_data.json
python scripts/social-data/orchestrate.py
```

Strava requires API credentials in a `.env` file at the repo root:

```
STRAVA_CLIENT_ID=...
STRAVA_CLIENT_SECRET=...
STRAVA_REFRESH_TOKEN=...
```
