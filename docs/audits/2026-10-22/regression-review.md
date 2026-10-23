# Audit regression and feature-change review

Reviewed October 22, 2026. Baseline: `f5ffdb7^` (`7b95b3d`), before the audit fixes. Audit release: `f5ffdb7`, including its follow-ups through `784df47`. The separate arcade release `df469d1` is distinguished below. The initial review changed no application code, credentials, or deployments. Subsequent requested corrections and release evidence are recorded under Requested follow-up.

The Strava route and Followers removals have already been restored. Career whole-entry toggles and animation were restored in `03f2d00`; review strikethrough was restored in `72b0426`. Both releases are live. Other findings remain documented below, and the latest three-letter arcade flow was retained as requested. Findings were checked against the original implementation rather than inferred from passing tests.

## Confirmed regressions

### R1 — P2: recovered browser storage can replace an existing arcade player

- **Trigger:** the browser initially refuses both storage reads and writes, the visitor chooses a nickname and receives a temporary session identity, and storage becomes available again in that same session.
- **Before:** the previously stored player identity was recovered.
- **Now:** an unknown storage snapshot is treated as permission to retry the pending write. The temporary identity overwrites the existing saved identity, including its credential. That can lose access to the earlier player's nickname and score history; it does not delete server score rows.
- **Location:** [scores.ts:30](/Users/ncteisen/git/website/src/games/arcade/scores.ts:30).
- **Evidence:** isolated storage-failure fixtures reproduced the before/after difference against the baseline, audit commit, and current commit. No actual affected production user was established.
- **Remedy:** when the prior snapshot is unknown, validate and preserve a recovered saved player before retrying a temporary identity write. Retain the existing retry behavior for a failed rename of a previously observed identity.

### R2 — P2: two Goodreads reviews lost strikethrough formatting (resolved in `72b0426`)

- The reviews for *Harry Potter and the Sorcerer's Stone* and *The Great Gatsby* each previously contained one `<s>` element. Both now display that phrase as ordinary text, altering the intended presentation/meaning.
- The text itself and its ordering remain unchanged. This is a formatting loss, not a deleted review.
- **Location:** [pipeline_utils.py:64](/Users/ncteisen/git/website/scripts/pipeline_utils.py:64); generated reviews render at [journal.astro:497](/Users/ncteisen/git/website/src/pages/journal.astro:497).
- **Evidence:** comparison of baseline and current generated `all_reviews` confirms one strikethrough became zero in each review. The sanitizer unwraps `<s>` because it is not allowlisted.
- **Remedy:** retain safe strikethrough tags (`s`, `del`, `strike`) and test them. Refresh Goodreads afterward: the fetcher has also persisted the stripped markup, so changing only the display processor cannot recover it.

### R3 — P3: some completed Globe share links reopen the questionnaire

- **Before:** a link copied from a completed checklist opened its result and answer history.
- **Now:** the corrected inclusive year bounds can introduce an unanswered same-year clue. The share loader resumes questioning and initially hides the existing result/history.
- **Location:** [dateMyGlobeChecklist.ts:38](/Users/ncteisen/git/website/src/lib/dateMyGlobeChecklist.ts:38) and [date-my-globe.astro:1331](/Users/ncteisen/git/website/src/pages/projects/date-my-globe.astro:1331).
- **Live reproduction:** [legacy completed share](https://www.noaheisen.com/projects/date-my-globe/?globe=ghana-independence:n,albania-independence:n,transvaal-republic:y,budapest-name:n,canadian-confederation:y,suez-canal:n,austria-hungary:n) opens an Alaska question. One “I'm Unsure” answer restores the result plus all seven original answers and the new eighth answer. No answers were deleted.
- The range changing from `1867–1867` to `1867–1868` is the intended removal of false year precision. The regression is the extra interaction required to view a previously completed share.
- **Remedy:** initially show reconstructed results/history for a shared result, with an optional refinement action, while retaining the corrected bounds.

### R4 — P3: manually cleared device bests can return from an open game

- **Trigger:** clear a best-score storage entry while its game controller remains open, then pause or dispose that controller.
- **Before:** the entry remained absent in the reproduced lower-score case.
- **Now:** the retained in-memory maximum is written back. Reproduced across Jumps, Flappy, and the shared collection controller.
- **Locations:** [Game.ts:83](/Users/ncteisen/git/website/src/games/arcade/collection/Game.ts:83), [FlappySarah.ts:141](/Users/ncteisen/git/website/src/games/flappy-sarah/FlappySarah.ts:141), [GameEngine.ts:139](/Users/ncteisen/git/website/src/games/sarah-jumps/js/core/GameEngine.ts:139).
- This concerns browser/DevTools storage clearing. There is no in-game reset-best control that was removed or broken.
- **Remedy:** distinguish an explicit deletion/reset from a stale lower value when reconciling local bests.

## Intentional changes that should have been disclosed

| Area | Before → after | Practical effect |
| --- | --- | --- |
| Stacks difficulty | Perfect streaks could widen a block beyond its starting width, eventually reaching the entire 400px field. Width is now capped at the original 190px. | Three perfect drops restore lost width instead of growing an already full-width block. Reproduced widths after 3/6/42 perfect drops: `206/222/400 → 190/190/190`. This materially changes gameplay. [Stacks.ts:23](/Users/ncteisen/git/website/src/games/arcade/collection/Stacks.ts:23). |
| Stacks public score history | The current leaderboard moved from version 1 to version 2. | Old server rows remain stored but are absent from the current board; there is no historical-board selector. Earlier release checks found no visible Stacks v1 entries, so actual production score loss was not demonstrated. [score-contract.ts:10](/Users/ncteisen/git/website/src/games/arcade/score-contract.ts:10). |
| Retired queued scores | Old-version records used to remain queued; the audit prunes them. | A previously valid offline Stacks v1 run is now silently deleted before nickname opt-in and is never submitted. This is a real loss of pending submission, not merely hiding historical server rows. Preserve/archive these records or notify the player instead of silently discarding them. [scores.ts:66](/Users/ncteisen/git/website/src/games/arcade/scores.ts:66). |
| Stacks local best | The device storage key remains `sarahStacksHighScore`. | Old easier-rule bests remain visible and serve as the “New best” threshold under the harder new rules, while public boards use v2 only. These policies differ and need an explicit product decision. [catalog.ts:55](/Users/ncteisen/git/website/src/games/arcade/catalog.ts:55). |
| Career disclosure | Clicking the whole career row used to toggle it with an animation. Now only the header button toggles it, instantly. | All career content remains available, and keyboard support improved, but the larger click target and animation were removed. [index.astro:1159](/Users/ncteisen/git/website/src/pages/index.astro:1159). |
| All-time cycling totals | Short commutes now count in all-time totals, matching the other statistics periods. | On identical historical input, cycling changed from 616 activities / 13,741.87 miles to 654 / 13,810.21 miles. This comparison also incorporates Only You exclusion. Short commutes remain hidden from the activity list, as before. |
| Only You activity exclusion | Only You records no longer contribute to published data. | On identical historical input, running changed from 1,305 activities / 6,827.19 miles to 1,298 / 6,809.26 miles. This exclusion was explicitly retained when Followers publication was approved. |
| Full source reconciliation | Full Strava and Goodreads refreshes replace their complete inventories instead of retaining stale records indefinitely. | Upstream deletions remove cached records. The actual Goodreads cache fell from 393 to 392 by removing a duplicate *Prisoner of Azkaban* edition; another edition remains and displayed review counts/statistics did not drop. |
| Refresh failures | Incomplete fetches and failed processors now abort rather than persisting partial or empty source sections. | Existing complete data remains, but a failing source can delay updates to otherwise healthy sources. [orchestrate.py:44](/Users/ncteisen/git/website/scripts/social-data/orchestrate.py:44). |
| Review markup | Reviews now retain a limited set of formatting and HTTP(S) links. Images, media, embeds, unsupported tags, and other attributes are removed. | No existing review images/media were removed because none existed in the baseline caches. Future reviews using them will not render that content. Strikethrough is the confirmed existing-content regression above. |
| Strava metadata | Raw descriptions, physiology, provider metadata, and separate coordinates are omitted. | No current rendered UI was found using the removed physiology fields. Approved summary routes and Everyone/Followers activities are retained. |
| Site styling and dates | Muted text is brighter; dates are deterministic across build timezones. | Styling changes remain visible. Existing production review calendar dates were preserved; the date helper does not itself guarantee Strava local-calendar dates because those are not carried through the current projection. |
| Favorite cover optimization | Optimized covers are written back as explicit source-config overrides. | Local covers remain pinned across metadata scrapes. No current cover, order, or custom title was removed. |

## Areas checked without another introduced regression

- No Astro page or public project route was deleted by the audit commit.
- Live homepage career expansion and This Year/Lifetime switching work. Career descriptions and links remain present.
- Live activity filtering shows all four hikes; switching back and using Load More displays 40 entries with 60 remaining.
- All 2,147 current route polylines decode successfully and match the established polyline decoder. No valid current route was rejected by the new decoder.
- On identical historical input after the route/Followers restorations, the latest 100 activity identities/order and all six record-card selections remain unchanged. YTD/recent/swimming statistics also match.
- Goodreads retains 179 displayed reviews and Letterboxd 403 on identical input; recent selections, ordering, headline statistics, and visible text match apart from the strikethrough styling. All 180 valid Goodreads read dates preserve their calendar day.
- Existing review links retain their link behavior. Baseline reviews contained no spoiler classes, hidden elements, details/summary controls, hidden styles, or aria-hidden content. Six plain-text spoiler warnings remain intact.
- Pets animation/restoration, committed LLM explanatory content, manga reader controls/navigation, and legacy adventure story rendering remain intact. The LLM working-copy prose was excluded from this review.
- The manga importer intentionally publishes immutable revisions and retains old assets. It rejects inconsistent output for an existing proof revision. No current reader asset was regenerated or removed by the audit.
- The archived Codewords accessibility prototype lost handlers that called an undefined function; no working interaction was removed. It now clearly links to the working game.
- A residual favorites edge exists when an already-local metadata cover has no source-config override. It predates this audit and matches none of the current favorites; it is not an introduced regression.

## Attribution, evidence, and limits

The later `df469d1` release introduced the initials-only score form, Submit/Skip flow, and replay interruption. Those are not audit changes and are not attributed to `f5ffdb7` here.

Current full CI passed during the preceding release, including Python, type, site, project, arcade, score, Codewords, build, and Globe checks. The new findings demonstrate gaps in that coverage. This review added focused before/after offline fixtures and live read-only UI checks; it did not post test scores, run OAuth, refresh providers, modify secrets, or deploy anything.

Arcade reproduction evidence is available locally at `/tmp/website-regression-review/arcade-regressions.mjs` and `/tmp/website-regression-review/arcade-results.json`. Globe browser evidence is at `/tmp/website-globe-legacy-share-reopened.png` and `/tmp/website-globe-legacy-share-restored.png`. These are local review artifacts, not production telemetry. No production user was confirmed to have encountered the storage regressions.

Remaining recommendations: fix player-identity recovery; decide how to handle Stacks historical/queued scores and local bests; then address shared-result compatibility and explicit storage-reset semantics. Review formatting and career animation/hit area have been restored as detailed below.

## Requested follow-up

- Restored review strikethrough in `72b0426`: the sanitizer preserves `s`, `del`, and `strike` while stripping attributes and executable markup. Refetched public Goodreads RSS and restored only the two affected cached review fields, then regenerated the Goodreads output. The generated-data diff contains only the two restored `<s>` pairs. All 87 Python tests pass, including three regression cases covering import, persistence, and both review processors; the production build also passes.
- Strikethrough release validation and Pages deployment passed in [run 39875726337](https://github.com/ncteisen/website/actions/runs/39875726337). The live journal matches the release build byte-for-byte, and both restored phrases have computed `text-decoration-line: line-through` in the browser.
- Restored whole-entry career toggles and the original 0.3-second animation in `03f2d00`, preserving the native button's Enter/Space support and keeping collapsed content inert. Local browser checks confirmed clicks on role text and expanded descriptions toggle the entry, and both keyboard keys work. Full validation and Pages deployment passed in [run 39875149308](https://github.com/ncteisen/website/actions/runs/39875149308). The live homepage matches the release build byte-for-byte, and a live role-text click expanded the entry.
- Retained the latest three-letter initials and Submit/Skip arcade flow from `df469d1`, as requested. No arcade changes were made in this follow-up. The browser-storage identity edge case in R1 is separate from the name length and remains documented; it was not silently treated as fixed.
