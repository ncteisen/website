# Social Data Pipeline

Combines data from Strava, Letterboxd, and Goodreads into a single `src/data/social_data.json` file that the Astro site reads at build time.

## How It Works

The pipeline has two stages:

**Stage 1 — Fetchers** pull raw data from external sources into local JSON files. Each fetcher runs independently and uses smart sync (only fetches new data on subsequent runs).

**Stage 2 — Orchestrator** reads those JSON files, computes stats, and combines everything into the final output. Stage 2 makes no network calls — all data comes from the local JSON files produced by Stage 1.

```
External Sources          Fetchers (Stage 1)              Local JSON
─────────────────         ──────────────────              ──────────
Strava API          ───>  strava-fetcher/                 activities.json
                          fetch_activities.py

Goodreads RSS       ───>  goodreads-fetcher/              books.json
                          fetch_books.py

Letterboxd RSS      ───>  letterboxd-fetcher/             films.json
                          fetch_films.py
                                    │
                                    ▼
                          orchestrate.py (Stage 2)
                          ┌─────────┼──────────┐
                          ▼         ▼          ▼
                   strava_     letterboxd_  goodreads_
                   processor   processor    processor
                          └─────────┼──────────┘
                                    ▼
                          src/data/social_data.json
                                    │
                                    ▼
                          Astro build ───> GitHub Pages
```

## Script Reference

| File | What it does | Reads |
|---|---|---|
| `orchestrate.py` | Calls all three processors, writes final JSON | — |
| `strava_processor.py` | Reads activities JSON, calculates stats, formats data | `strava-fetcher/data/activities.json` |
| `letterboxd_processor.py` | Reads films JSON, computes stats | `letterboxd-fetcher/data/films.json` |
| `goodreads_processor.py` | Reads books JSON, computes stats | `goodreads-fetcher/data/books.json` |

### Naming Convention

- **Fetcher**: pulls data from an external API or RSS feed into local JSON
- **Processor**: reads local JSON and computes/formats data (no network calls)

## Running Locally

From the repo root (with venv activated):

```bash
# Stage 1: Fetch fresh data
python scripts/strava-fetcher/fetch_activities.py      # requires .env with Strava credentials
python scripts/goodreads-fetcher/fetch_books.py
python scripts/letterboxd-fetcher/fetch_films.py

# Stage 2: Combine into social_data.json
python scripts/social-data/orchestrate.py
```

## CI/CD

GitHub Actions runs this pipeline daily at 3 AM Pacific via `.github/workflows/social-data-fetch.yml`. It runs all four scripts in sequence, then commits any changes to the data files.
