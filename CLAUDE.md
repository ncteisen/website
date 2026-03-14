# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (Astro)
```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
```

### Python Scrapers
```bash
# From repo root:
python scripts/social-scraper/fetch_social_data.py           # Fetch live data from all sources
python scripts/social-scraper/fetch_social_data.py --cache   # Use cached HTML (avoids network calls)
python scripts/strava-activity-fetcher/fetch_activities.py   # Fetch Strava activity routes separately

# Tests (pytest):
pytest scripts/
```

## Architecture

This is a **static personal website** deployed to GitHub Pages. Data flows in two phases:

1. **Data fetch phase**: Python scrapers pull from Strava API + Letterboxd/Goodreads HTML scraping → writes `src/data/social_data.json` and `scripts/strava-activity-fetcher/data/activities.json`
2. **Build phase**: Astro reads those JSON files at build time and generates static HTML

### Key files
- `src/pages/index.astro` — the entire website is a single-page app; this file imports social data and renders all sections (Strava, Letterboxd, Goodreads)
- `src/data/social_data.json` — auto-generated; source of truth for all social data displayed on site
- `scripts/social-scraper/` — Python scrapers: `strava_scraper.py`, `letterboxd_scraper.py`, `goodreads_scraper.py`, orchestrated by `fetch_social_data.py`
- `scripts/social-scraper/cached_data/` — HTML snapshots for offline/dev use with `--cache` flag
- `src/games/sarah-jumps/` — TypeScript canvas game with `GameEngine`, `Player`, `Platform`, `PlatformManager`, `InputHandler`, `ScoreDisplay`

### CI/CD (GitHub Actions)
- `social-data-fetch.yml`: Runs daily at 3AM Pacific, fetches data, commits updated JSON with `[skip ci]`
- `deploy.yml`: Triggers on push to `master` and after social data fetch completes; builds and deploys via `withastro/action`

### Strava credentials
The `.env` file expected at repo root contains:
```
STRAVA_CLIENT_ID=...
STRAVA_CLIENT_SECRET=...
STRAVA_REFRESH_TOKEN=...
```

## Code Style
- HTML/CSS: use early returns, descriptive names, `handle` prefix for event handlers, accessibility attributes (`tabindex`, `aria-label`)
- Use `const` arrow functions over `function` declarations
- Astro pages use TypeScript in the frontmatter (`---` blocks) for data fetching and type definitions
