# Website automation and data pipeline audit — 2026-10-22

Scope: all Python fetchers/processors, favorites scripts and config, resume generator/build script, manga proof importer, generated-data consistency, Python requirements, and related GitHub workflows. Read-only review with temporary, synthetic fixtures. No network refreshes, credentials printed, repository edits, commits, or generated data changes. Requirements already had unrelated NumPy/reportlab additions; those were preserved. Root separately confirmed the GitHub repository is public and performed aggregate-only live/public-branch verification described below.

## Highest-priority findings

### PIPE-01 — P1 — Nonpublic Strava activities and routes enter public data

**Current records, confirmed locally and live by root.** [scripts/social-data/strava_processor.py:117-122](/Users/ncteisen/git/website/scripts/social-data/strava_processor.py:117) only checks commute distance; it never applies `private` or `visibility`. `:124-135` therefore admits nonpublic activities into public lists and record calculations. `:146-162` exports the full map object. [src/pages/activities.astro:449](/Users/ncteisen/git/website/src/pages/activities.astro:449) embeds its summary polyline, as do record cards at [src/pages/records.astro:364,391](/Users/ncteisen/git/website/src/pages/records.astro:364).

Aggregate-only evidence from the checked-in cache: 2,406 activities comprise 2,288 `everyone`, 107 `followers_only`, and 11 `only_me`. The current generated 100-item activity log contains 85 followers-only activities; all 85 have route polylines. One generated record card is also nonpublic. No only-me activity occurs in that current 100-item log, but a synthetic only-me run is accepted, formatted, and retains its route. Ten of the eleven only-me records contain routes in the raw cache. The raw cache is tracked and automatically staged in [.github/workflows/social-data-fetch.yml:50](/Users/ncteisen/git/website/.github/workflows/social-data-fetch.yml:50).

**Root's separate live verification:** `https://www.noaheisen.com/activities` returned 200 and contained 85 route polylines matched to local followers-only activity identities. Public GitHub master raw cache was readable and contained 2,409 activities: 2,288 everyone, 110 followers-only, and 11 only-me; 10 only-me entries had routes. The small local/remote count difference reflects a newer remote data snapshot. No identities/routes were printed and no remote payload was retained. This confirms live route exposure and public-source exposure, not merely a hypothetical future risk.

**Action:** enforce an explicit public-visibility policy before persistence/export, remove unintended nonpublic entries from generated output, and stop committing the full authenticated API response. Since the repository is public, separately assess existing Git-history exposure and recovery options rather than treating a current-file edit as full remediation. Privacy decisions about routes, timestamps, heart rate, etc. should be explicit. For retained public activities, separately verify map visibility and endpoint/privacy-zone masking under the authorized API scope; an everyone-only activity filter does not by itself establish that every returned route point is public. No current privacy-zone exposure was separately verified. Verify public source/live site using aggregate results only; do not copy locations into the audit.

**Validation:** fixtures for everyone, followers-only, only-me, missing visibility, recent records, all-time records, and totals; assert generated HTML/data cannot include forbidden IDs/routes. Root completed aggregate-only public/live corroboration as above.

### PIPE-02 — P2 — Rotated Strava refresh tokens are discarded

**Code + synthetic response confirmed; no claim of a current authentication incident.** [scripts/strava-fetcher/fetch_activities.py:53-56](/Users/ncteisen/git/website/scripts/strava-fetcher/fetch_activities.py:53) reads only `access_token`, discarding `refresh_token`. [.github/workflows/social-data-fetch.yml:25-29](/Users/ncteisen/git/website/.github/workflows/social-data-fetch.yml:25) recreates the same stored token on every run. A mocked successful token response containing a different refresh token leaves the collector on the old token.

Strava's current [authentication documentation](https://developers.strava.com/docs/authentication/#refreshing-expired-access-tokens) says clients must persist the most recently returned refresh token; when rotation occurs, the older token becomes invalid. This makes the next run fail after a rotation even though the current run succeeds.

**Action:** persist token state in an appropriate private durable store and atomically update it after every successful exchange. Serialize refreshes. Do not commit tokens. Test two successive mocked runs where the second rejects the old token.

### PIPE-03 — P2 — Fetch failures are treated as successful Strava syncs

**Fixture confirmed.** [scripts/strava-fetcher/fetch_activities.py:122-124](/Users/ncteisen/git/website/scripts/strava-fetcher/fetch_activities.py:122) logs any non-200 and breaks instead of raising. `:138-170,175-190` subsequently saves/merges data and announces success. A mocked HTTP 500 returns normally. A first-time fetch can persist an incomplete archive after later-page failure; an ordinary sync can silently retain stale data while the orchestrator refreshes the timestamp.

**Action:** distinguish normal pagination exhaustion from HTTP failure; fail the run without replacing the cache on errors. Retry only bounded retryable responses, honor rate-limit information, and validate the complete result before saving. Test page-one failure, failure after a successful page, empty end page, and 429/5xx.

### PIPE-04 — P2 — Orchestrator replaces good data with invalid partial output

**Fixture confirmed; downstream build break is code-supported.** [scripts/social-data/orchestrate.py:50-82](/Users/ncteisen/git/website/scripts/social-data/orchestrate.py:50) initializes sections to `{}`, catches all processor exceptions, and always saves them with a new `last_updated`. A fixture forcing all three processors to fail still returns normally and saves three empty sections. [src/pages/index.astro:183-187](/Users/ncteisen/git/website/src/pages/index.astro:183) directly indexes the missing recent-review arrays; [src/pages/journal.astro:75,85](/Users/ncteisen/git/website/src/pages/journal.astro:75) calls `.map` on them. Thus processing failures can be committed as generated data and break the next deploy, leaving the last live build stale.

**Action:** validate all source results and fail before replacing the last-known-good file; alternatively preserve each last-known-good section with explicit per-source success/fetch timestamps and failure state. Write via temporary file + replace only after validation. Add orchestrator failure-path tests, and a render/build contract test for generated schema.

### PIPE-05 — P2 — Syncs never reconcile deletions; Goodreads `--full` is merge-only

**Fixtures confirmed; no assertion that a particular cached record was deleted upstream.** [scripts/strava-fetcher/fetch_activities.py:85-94](/Users/ncteisen/git/website/scripts/strava-fetcher/fetch_activities.py:85) normally revisits only 30 days, while `:145-162` only merges. Removed activities and changes older than that window remain indefinitely. Goodreads `--full` changes pagination at [scripts/goodreads-fetcher/fetch_books.py:96-130](/Users/ncteisen/git/website/scripts/goodreads-fetcher/fetch_books.py:96), but `:134-147` still starts from the old dictionary and never removes absent books. A full-refresh fixture with one prior book and an empty fresh result retains the book. Strava empty-refresh fixture likewise retains a removed item. Letterboxd uses the same append/merge behavior at [scripts/letterboxd-fetcher/fetch_films.py:108-122](/Users/ncteisen/git/website/scripts/letterboxd-fetcher/fetch_films.py:108).

**Action:** provide an explicit, validated authoritative refresh/reconciliation mode for sources that support a full inventory. Avoid treating a truncated RSS window or failed/empty response as authoritative deletion evidence. Use a deletion feed/webhook or intentional manual reconciliation when full inventory is unavailable. Test additions, edits, deletions, partial refresh, and unexpectedly empty results. This matters especially for privacy changes.

### PIPE-06 — P2 — Goodreads malformed dates crash both collection and processing

**Fixtures confirmed; current cache has zero nonempty malformed dates.** The fetcher's [scripts/goodreads-fetcher/fetch_books.py:149-155](/Users/ncteisen/git/website/scripts/goodreads-fetcher/fetch_books.py:149) mixes timezone-aware parsed datetimes with naive `datetime.min`. The processor's [scripts/social-data/goodreads_processor.py:123-125](/Users/ncteisen/git/website/scripts/social-data/goodreads_processor.py:123) mixes datetime values with `date.min`. One valid timestamp plus one nonempty invalid date produces `TypeError` in both functions. Offset-free timestamps also need a defined policy.

**Action:** normalize valid dates to a timezone-aware datetime (or numeric timestamp), use one consistent sentinel type, and either exclude or explicitly place invalid dates last. Add valid/invalid/empty/naive/aware fixture combinations. Malformed upstream dates normally stop the fetch before its save; if malformed dates are already present in cached processor input, this combines with PIPE-04 to replace good generated data with invalid partial output and block site builds.

### PIPE-07 — P2 — All-time activity totals exclude commutes that YTD includes

**Fixture confirmed and user-visible labels verified.** [scripts/social-data/strava_processor.py:190-193](/Users/ncteisen/git/website/scripts/social-data/strava_processor.py:190) creates commute-filtered sport lists used by all-time totals at `:249-264`. YTD/recent totals at `:202-215` instead use the unfiltered raw list. With only one 1 km commute, YTD count is 1 and all-time count is 0. The home page exposes these as ordinary “this year” vs “all time” distances at [src/pages/index.astro:163-177](/Users/ncteisen/git/website/src/pages/index.astro:163).

**Action:** define one inclusion policy for statistical totals and apply it across periods; treat the display-list commute filter separately if desired. Test the invariant that all-time totals contain YTD totals for nonnegative distances, using short/long commute and normal activities.

### PIPE-08 — P2 — Existing Python tests have no CI gate

**Confirmed configuration gap.** [.github/workflows/deploy.yml:20-32](/Users/ncteisen/git/website/.github/workflows/deploy.yml:20) performs an Astro build; [.github/workflows/social-data-fetch.yml:20-41](/Users/ncteisen/git/website/.github/workflows/social-data-fetch.yml:20) installs pytest but never runs it. Existing code/game checks are also absent from these workflows. Daily automation can therefore commit a schema/aggregation regression, then trigger deployment without the local checks that exist.

**Action:** add an inexpensive pull-request/push validation job and run offline processor tests before social-data mutation/commit. Keep live data refresh separate from tests. Coordinate with root's broader CI finding to avoid duplicate backlog items.

## Additional actionable findings

### PIPE-09 — P2/P3 — Review HTML crosses a third-party trust boundary unsanitized

**Data-flow and malicious fixture confirmed; no evidence of a current malicious review.** [scripts/social-data/goodreads_processor.py:49-53](/Users/ncteisen/git/website/scripts/social-data/goodreads_processor.py:49) only trims `<br>` tags. Letterboxd preserves arbitrary parsed paragraph HTML at [scripts/letterboxd-fetcher/fetch_films.py:69-75](/Users/ncteisen/git/website/scripts/letterboxd-fetcher/fetch_films.py:69). The site inserts both with `set:html` ([src/pages/journal.astro:499](/Users/ncteisen/git/website/src/pages/journal.astro:499); [src/pages/index.astro:1132,1143](/Users/ncteisen/git/website/src/pages/index.astro:1132)). A synthetic `<img src=x onerror="alert(1)">` survives Goodreads cleaning unchanged.

**Action:** sanitize at the ingestion/render boundary using an allowlist of needed formatting tags and safe link protocols; strip event handlers and active content. Preserve ordinary reviews and links. Tests should cover images/event handlers, `javascript:` URLs, and intended paragraphs/emphasis. Rank as defense in depth if authorship is fully controlled; treat as higher priority if broader external content is introduced.

### PIPE-10 — P3 — One Goodreads test will fail at the 2027 rollover

[scripts/social-data/test_processors.py:107,124](/Users/ncteisen/git/website/scripts/social-data/test_processors.py:107) hardcodes a May 2026 read date and expects `books_this_year == 1`, while `goodreads_processor.py:93` uses today's year. Patching the clock to January 1, 2027 produces 0. The equivalent Letterboxd test already derives the year dynamically at `test_processors.py:149-159`.

**Action:** freeze the clock or derive the fixture year, and include explicit year-boundary coverage. No need to wait until New Year's to fix this.

### PIPE-11 — P3 — Goodreads diagnostic entry point always raises KeyError

[scripts/social-data/goodreads_processor.py:146](/Users/ncteisen/git/website/scripts/social-data/goodreads_processor.py:146) prints `stats['pages_this_year']`, but `calculate_stats()` at `:108-113` never returns that key. Calling `main()` with an otherwise valid result deterministically raises `KeyError: 'pages_this_year'`.

**Action:** remove the obsolete output or implement the intended statistic; smoke-test documented/script entry points.

### PIPE-12 — P3 — Undated Letterboxd entries sort ahead of recent entries

[scripts/letterboxd-fetcher/fetch_films.py:122](/Users/ncteisen/git/website/scripts/letterboxd-fetcher/fetch_films.py:122) and [scripts/social-data/letterboxd_processor.py:68](/Users/ncteisen/git/website/scripts/social-data/letterboxd_processor.py:68) sort `(watched_date is None, watched_date)` descending. That puts `None` first, making an undated entry the homepage featured/latest film. Fixture result: `Undated` precedes a 2026-10-01 item. Current 402 cached films have no missing watch dates, so this is latent.

**Action:** place undated records last or exclude them from the recent list; test nulls and ISO-date ordering.

### PIPE-13 — P3 — Optimizing a bare-URL favorite is undone by the next metadata refresh

`optimize_assets.py:70-74` only writes a local override back into an existing object that already has `cover`; string favorites remain strings. It then changes generated metadata at `:106-108`. A later `fetch_covers.py:109-123` scrapes fresh remote URLs and preserves only explicit config covers. Thus optimization is not persistent for bare URLs. A fixture confirms a bare URL remains unpinned after `update_favorite_cover()`.

Current config has 3 string films and 7 string books, but none of their generated covers are currently localized, so no existing localized cover was shown to be affected today.

**Action:** convert optimized string favorites into `{url, cover}` entries, or retain stable local asset mappings separate from scraped metadata. Document that the optimizer also rewrites favorites.json (`:137-139`); the README currently describes metadata/image rewriting but does not call out this source-config mutation. Test optimize → metadata refresh round trips.

## Improvements worth scheduling

- **Atomic generation and preservation:** fetchers, favorites, and orchestrator write final files directly. Favor stage/validate/atomic-replace so interrupted writes cannot truncate checked-in caches. Manga importer writes each live image in place ([scripts/manga/import-proof.mjs:22-50](/Users/ncteisen/git/website/scripts/manga/import-proof.mjs:22)), so a render failure halfway through can leave a mixed old/new asset set behind an old manifest. Stage the entire output and publish after all pages succeed.
- **Explicit per-source freshness:** `orchestrate.py:52` is processing time, not source-fetch success time; an identical rerun always changes generated JSON and can produce a no-content daily commit/deploy. Add source status and timestamps, avoid semantic no-op commits, and distinguish real freshness from regeneration.
- **Goodreads pagination guard:** `fetch_books.py:105-130` has no page ceiling or repeated-page detection. A provider that repeats the last page can run indefinitely. Stop with an actionable error on a repeated page signature; preserve the old cache.
- **Full-history completeness:** Letterboxd starts only from the current RSS window (`fetch_films.py:93-106`) but labels `len(cache)` as lifetime films (`letterboxd_processor.py:45-54`, home `index.astro:169-170`). The existing cache has 402 entries; completeness cannot be established from this code alone. Support import/backfill and record coverage/provenance, or label the metric as locally logged/captured history.
- **Favorites schema validation:** validate explicit viewport order references, metadata coverage, image existence, required scraped fields, and duplicate identity/asset slugs. The current config/metadata pass basic completeness and local-file existence checks. Filenames derive only from title (`optimize_assets.py:53-54`), so distinct same-title works can collide; include stable source identity.
- **Manga import hygiene:** scratch creation and PDF reading/count validation happen before `try/finally` (`import-proof.mjs:16-21`), leaking the temp directory on those early failures. Ensure cleanup covers the whole import. Declare Sharp directly if this script is supported tooling; it currently relies on Astro's transitive/optional dependency rather than a package.json dependency.
- **Resume reproducibility:** work experience is shared data, but identity, contact details, education, skills, and internships are hardcoded in `generate_resume.py:51-129`. Move them into the canonical data if they should remain consistent across HTML/PDF. Consider an explicit output/temp option and a page-count/overflow validation in the build rather than only compiler success. The generator docstring/log mentions nonexistent `xeresume` (`:8,236`) and an outdated source path (`:2`); point to `npm run resume` and the actual `resume/resume_data.json`.
- **Workflow resilience:** social fetch has no concurrency group, explicit job timeout, or explicit `contents: write`; it relies on repository token defaults, and simultaneous runs can conflict on push. Cleanup at social-data-fetch.yml:43-44 is skipped after earlier failure (use job env instead of materializing .env, or unconditional cleanup). Deploy's workflow_run branch lacks a success-conclusion guard (`deploy.yml:9-12`) and deployment concurrency; root is auditing overall release safety. The 10:00 UTC schedule is 03:00 PDT but 02:00 PST, unlike the year-round 3 AM Pacific README claim.
- **Portable OG image font:** [scripts/generate-og-image/generate_og_image.py:20-28](/Users/ncteisen/git/website/scripts/generate-og-image/generate_og_image.py:20) uses macOS-only font paths and silently falls back to Pillow's tiny default, changing the layout on Linux. Bundle/license a font or require an explicit font path with a visible validation error.

## Validation performed and positive findings

- `source .venv/bin/activate && python -m pytest scripts/ -q` → **22 passed in 0.02s**.
- Temporary synthetic/mocked fixtures only: privacy filtering, HTTP 500, refresh-token rotation, failed orchestrator, invalid Goodreads dates, merge-only full refresh, removal reconciliation, Letterboxd undated sort, 2027 rollover, obsolete diagnostic key, short commute totals, HTML pass-through, and bare-URL favorite persistence. No live API calls or token changes.
- Current Goodreads cache: 180 rated books with dates; zero nonempty malformed dates and zero null title/author fields.
- Current favorites: 12 films / 9 books; generated metadata matches source counts; no missing generated metadata or missing local cover files. Desktop intentionally has 8 books versus 9 mobile, supported by the documented viewport-specific ordering.
- Resume generator output matches `resume/resume.tex` exactly; `resume/resume.pdf` and `public/resume.pdf` have identical hashes. No resume regeneration performed.
- Node/Sharp read-only manifest check: **43 manga pages, zero missing image variants, zero wrong image widths; PDF SHA-256 and byte length match the manifest**. Both 800px/1600px variants are present. The proof importer uses `execFileSync` with argument arrays (no shell interpolation), and verifies rendered page count.
- Architecture cleanly separates network fetching from local processing, making the missing failure-path tests straightforward to add. API requests generally have finite timeouts. Favorites source/generated ownership and mobile/desktop ordering are documented. Resume text has a centralized LaTeX escape function and explicit skip_pdf controls.
- `git status --short` at end matches the initial unrelated changes/untracked files; audit did not edit repository files.

## Repro commands used

The principal validation command is above. Read-only consistency checks used the existing `.venv` for imports/JSON/hash checks and `node --input-type=module` for Sharp metadata. All failure reproductions replaced network methods with mocks, replaced output paths with `TemporaryDirectory`, or replaced the save function with an in-memory collector. No synthetic input was added to real generated data. To reproduce PIPE-01 safely, inject one private activity into `StravaProcessor.activities_data`, call `get_recent_activities_data()`, and assert that its `all_activities` list currently has length 1 and preserves `map`; do not use real route data in a test.
