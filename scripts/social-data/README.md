# Social Data Pipeline

Combines data from Strava, Letterboxd, and Goodreads into a single `src/data/social_data.json` file that the Astro site reads at build time.

## How It Works

The pipeline has two stages:

**Stage 1 — Fetchers** validate upstream data before replacing local JSON caches. Strava stores a minimal public projection and normally reconciles the complete inventory. Scheduled Goodreads runs also use a complete inventory; Letterboxd merges its recent RSS window.

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
python scripts/strava-fetcher/fetch_activities.py      # designated refresh owner only; see token persistence below
python scripts/goodreads-fetcher/fetch_books.py --full
python scripts/letterboxd-fetcher/fetch_films.py

# Stage 2: Combine into social_data.json
python scripts/social-data/orchestrate.py
```

## CI/CD

GitHub Actions runs this pipeline daily at 10:00 UTC (3 AM PDT / 2 AM PST) via `.github/workflows/social-data-fetch.yml`. It runs all four scripts in sequence, then commits any changes to the data files.

## Public data boundary and safe refreshes

Strava's checked-in `activities.json` is now a **minimal public projection**, not an authenticated API response. At the site owner's explicit request, records marked `visibility=everyone` or `visibility=followers_only` with `private=false` are published on the public website, including `map.summary_polyline` for route maps. The original visibility value is preserved in the cache. `only_me`, unknown or missing visibility, and any private flag other than `false` remain excluded. Only nonempty encoded strings of at most 200,000 characters are retained; malformed or missing map values become empty maps, and the frontend rejects invalid route geometry. Map IDs, separate coordinates, descriptions, heart rate, power, cadence, athlete details, and provider upload metadata remain excluded before persistence and again during processing. This publishes the provider's summary route without additional endpoint cropping. Statistics include all public activities consistently; the activity list alone hides short commutes.

Sanitize an existing cache and rebuild the combined data without contacting any provider:

```bash
source .venv/bin/activate
python scripts/strava-fetcher/fetch_activities.py --sanitize-cache
python scripts/social-data/orchestrate.py
```

This changes current files only. It does not remove old Git history, prior clones, caches, or deployed copies; those require a separately reviewed response.

Normal Strava fetches now reconcile the complete account inventory with bounded pagination. Deletions and changes to `only_me` or another excluded visibility remove previously published records. `--incremental` is available for a complete 30-day window only and cannot reconcile older changes. Goodreads `--full` without `--shelf` likewise replaces a complete inventory; shelf-specific refreshes remain merges. Both reject an unexpectedly empty authoritative response unless `--allow-empty-refresh` is explicitly supplied after verifying the upstream account. HTTP failures, repeated pages, and page-limit exhaustion fail without replacing caches. The orchestrator fails before replacing its last-known-good output if any source fails validation. JSON output uses atomic replacement.

Letterboxd RSS is a recent window, not a complete inventory. Absence from it is never treated as deletion. After verifying an entry was deleted upstream, remove it explicitly offline with `python scripts/letterboxd-fetcher/fetch_films.py --remove-guid '<deleted entry guid>'` (repeat the flag as needed). This is not automatic historical deletion reconciliation; a complete export/import or upstream deletion signal would be needed for that. If the item still exists in the feed, a later sync can restore it.

Both review processors allow only simple formatting and HTTP(S) links. Active markup, event handlers, images, and unsafe URL schemes are removed before generated HTML reaches the site.

## Private Strava token persistence

Local refreshes store only the latest **refresh token** in `.env.strava-state.local`, with a separate `.env.strava-lock.local` lock. Both names are covered by the existing `.env.*.local` Git ignore rule; permissions are restricted to the owner (`0600`). The lock covers reading, exchanging, and persisting the token. The private state takes precedence over the initial `.env` token on later runs. After a deliberate reauthorization, remove the old private state file before using the new `.env` token. Never commit or upload either private file. Access tokens are held only in memory.

**CI setup is required before the scheduled Strava refresh can run.** Create a GitHub environment named `strava-sync` and configure its own `STRAVA_REFRESH_TOKEN` secret with the current valid token. Put `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, and `STRAVA_TOKEN_STATE_WRITE_TOKEN` in that environment as well. The writer must be a fine-grained GitHub credential restricted to this repository with **Environments: read and write** permission; this permission also authorizes environment-secret updates beyond the one token, so restrict the credential to this repository and protect access to the workflow. It does not require repository Secrets write or Administration write. The ordinary workflow `GITHUB_TOKEN` does not provide this permission. These are explicit operator requirements for new installations. The `website` repository environment and required secrets were provisioned on October 22, 2026; secret metadata alone does not establish that a live refresh succeeds. The environment must allow the scheduled branch; adding required reviewers would make scheduled runs wait for approval.

GitHub reads repository secrets when a workflow is queued, but environment secrets when the environment job starts. That timing matters: a queued run can otherwise carry a stale token even when workflow concurrency serializes the runs. This workflow selects `strava-sync`, and the collector checks metadata to require that environment's own `STRAVA_REFRESH_TOKEN` before OAuth, refusing any repository-secret fallback. See [GitHub secret precedence and read timing](https://docs.github.com/en/actions/reference/security/secrets#when-github-actions-reads-secrets) and [environment-secret permissions](https://docs.github.com/en/rest/actions/secrets#create-or-update-an-environment-secret).

The collector then writes the constant `ready` to a separate environment secret named `STRAVA_TOKEN_STATE_PROBE` to prove write permission **before OAuth can rotate the token**. Preflight never writes the existing refresh token. After exchange it saves the new refresh token privately and updates only the `strava-sync` environment's `STRAVA_REFRESH_TOKEN` through `gh secret set --env strava-sync`, passing the value on stdin, before using the access token. Missing configuration or a failed preflight fails the entire job; no partial refresh is committed or labeled successful. The workflow serializes writers and does not cancel a job in the middle of rotation.

Use one designated refresh owner for a Strava grant. The local file lock and GitHub workflow concurrency do not coordinate with each other or with other machines. Once CI owns this grant, do not run local network refreshes with an independently cached or initial `.env` token: either side can invalidate the other side's refresh token. Local sanitization, orchestration, and tests remain offline and safe. Local network access requires a deliberately configured separate grant or a genuinely shared private token coordinator; copying a token once does not provide coordination.

Secret updates have bounded retries. A failure after OAuth has already rotated the token cannot restore its validity: publishing stops, and the new token remains only in the runner's private file while that runner exists. The error deliberately avoids printing the token. If private persistence cannot be recovered before teardown, **reauthorization may be required**. Do not use public artifacts or Actions caches as a token recovery store. No live provider calls or secret updates are performed by the regression tests.
