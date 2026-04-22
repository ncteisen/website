# Repository Guidelines

## Project Structure & Module Organization
`src/pages/` contains Astro routes; [`src/pages/index.astro`](/Users/ncteisen/git/website/src/pages/index.astro) is the main site and [`src/pages/projects/sarah-jumps.astro`](/Users/ncteisen/git/website/src/pages/projects/sarah-jumps.astro) hosts the game page. Game logic lives in `src/games/sarah-jumps/js/`, shared site data in `src/data/social_data.json`, and static assets in `public/`. Python automation lives under `scripts/`: `social-data/` orchestrates the social data pipeline (`orchestrate.py`, `strava_processor.py`, `letterboxd_processor.py`, `goodreads_processor.py`), while `strava-fetcher/`, `goodreads-fetcher/`, and `letterboxd-fetcher/` each fetch raw data from their respective sources. `resume-generator/` builds the PDF from `resume/resume_data.json`.

## Build, Test, and Development Commands
Run `npm run dev` to start the Astro dev server, `npm run build` to produce the static site, and `npm run preview` to inspect the production build locally. Use `npm run resume` after editing `resume/resume_data.json`; it regenerates `resume/resume.tex` and copies the compiled PDF to `public/resume.pdf`. Refresh social data with `python scripts/social-data/orchestrate.py`. Always use a venv (`source .venv/bin/activate`) before running Python scripts. Run `pytest scripts/` for Python-side checks.

## Coding Style & Naming Conventions
Follow the existing style instead of introducing a new formatter. Astro and TypeScript code use tabs for indentation, `const` where possible, descriptive names, and `handle...` prefixes for event handlers. Python uses 4-space indentation, type hints, and small focused functions. Keep generated files generated: do not hand-edit `src/data/social_data.json` or `resume/resume.tex`.

## Testing Guidelines
There is no dedicated frontend test suite in this repo today, so validate UI changes with `npm run build` and a local `npm run preview` pass. Python changes should include or update `pytest` coverage in `scripts/` when behavior changes. Name new tests `test_*.py` to match pytest discovery.

## Commit & Pull Request Guidelines
Recent history favors short, imperative commit messages such as `update sarah jumps` and automated update commits like `Update social data and Strava activities [skip ci]`. Keep manual commits concise, scoped, and in the imperative mood. PRs should describe the user-visible change, note any data or resume files regenerated, link related issues when applicable, and include screenshots for layout or game UI updates.

## Security & Configuration Tips
Keep Strava credentials in the repo-root `.env` only; never commit secrets. Local resume builds require `xelatex`/MacTeX, and CI already handles scheduled social-data refreshes through GitHub Actions.
