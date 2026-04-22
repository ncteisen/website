# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (Astro)
```bash
npm run dev       # Start dev server
npm run build     # Build for production
npm run preview   # Preview production build
```

### Python Scripts

Python 3.12+ required. Always use a virtual environment:

```bash
# First-time setup
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Activate on subsequent sessions
source .venv/bin/activate
```

All scripts run from the **repo root**:

```bash
# Stage 1 — Fetchers (pull data from external sources into local JSON)
python scripts/strava-fetcher/fetch_activities.py       # Strava API (requires .env)
python scripts/goodreads-fetcher/fetch_books.py         # Goodreads RSS
python scripts/letterboxd-fetcher/fetch_films.py        # Letterboxd RSS

# Stage 2 — Orchestrator (combines local JSON → social_data.json)
python scripts/social-data/orchestrate.py

# Tests (pytest):
pytest scripts/
```

### Terminology
- **Fetcher**: pulls data from an external API or RSS feed into local JSON
- **Processor**: reads local JSON and computes/formats data (no network calls)
- **Orchestrator**: `orchestrate.py` — calls processors, writes final output

## Architecture

This is a **static personal website** deployed to GitHub Pages. Data flows in two phases:

1. **Data fetch phase**: Python fetchers pull from Strava API + Letterboxd/Goodreads RSS feeds → writes local JSON files. The orchestrator then reads those JSON files, computes stats, and produces `src/data/social_data.json`
2. **Build phase**: Astro reads `social_data.json` at build time and generates static HTML

### Key files
- `src/pages/index.astro` — the entire website is a single-page app; this file imports social data and renders all sections (Strava, Letterboxd, Goodreads)
- `src/data/social_data.json` — auto-generated; source of truth for all social data displayed on site
- `scripts/social-data/` — orchestrator (`orchestrate.py`) and processors (`strava_processor.py`, `letterboxd_processor.py`, `goodreads_processor.py`)
- `scripts/strava-fetcher/` — Strava API fetcher
- `scripts/goodreads-fetcher/` — Goodreads RSS fetcher
- `scripts/letterboxd-fetcher/` — Letterboxd RSS fetcher
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
- Python: use modern type annotations (built-in generics, `X | None` instead of `Optional[X]`)
