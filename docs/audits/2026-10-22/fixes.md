# Website audit fix status

**Route-map follow-up:** the owner explicitly approved publishing route maps on October 22. Public activities now retain their summary route polylines for the homepage, activity log, and records pages. Nonpublic activities remain excluded, and unrelated provider metadata remains omitted. Earlier references below to route omission describe the initial release, before this approved restoration.

The reproduced website defects from the [October 22 audit](/Users/ncteisen/git/website/docs/audits/2026-10-22-website-sweep.md) now have local code fixes and regression coverage. The public Strava cache and combined site data were regenerated offline through the updated scripts. Existing LLM copy, requirements changes, and untracked artwork/manga work were preserved.

**Release configuration:** the `strava-sync` GitHub environment is provisioned with the three Strava credentials and a dedicated writer credential, restricted to the `master` branch. The release must verify a real Actions refresh and both Pages and Worker deployment. Existing public Git history, clones, and external caches remain outside this fix batch.

## Data and automation fixes

| Audit finding | Implemented behavior | Regression evidence |
| --- | --- | --- |
| PIPE-01 public Strava exposure | Persistence and processing require `visibility=everyone` and `private=false`. The public projection excludes routes, coordinates, descriptions, physiology, and provider metadata. | Visibility/missing-field fixtures; local cache contains 2,288 public projections and zero route fields; built activity links contain none of the excluded identities. |
| PIPE-02 token rotation | Locked, atomic private local state; serialized CI writes rotated tokens into the dedicated `strava-sync` environment. Metadata checks refuse repository-secret fallback; a constant probe verifies write permission without overwriting the token. | Concurrent local refreshes, permission/persistence failures, stale queued inputs, environment scope, and private temporary-file tests. Requires operator configuration below. |
| PIPE-03 incomplete Strava fetch | HTTP failures, invalid/repeated pages, and pagination exhaustion raise errors before cache replacement. | First/later-page failure fixtures preserve previous bytes. |
| PIPE-04 partial combined output | All processors and required source arrays/stats must succeed before one atomic output replacement. | Processor and late schema failures preserve the previous combined file. |
| PIPE-05 stale/deleted entries | Full Strava and full account Goodreads refreshes replace the validated inventory. A Strava incremental refresh reconciles its complete 30-day window. Unexpected empty inventories require an explicit flag. | Deletion/visibility/window/full-refresh fixtures. Letterboxd's limited RSS window cannot establish historical deletion; an explicit verified offline `--remove-guid` command handles that case. |
| PIPE-06 invalid dates | Date parsing normalizes to UTC; invalid or absent Goodreads dates sort last without mixed-type comparisons. | Mixed valid, missing, malformed, aware, and naive timestamps. |
| PIPE-07 inconsistent totals | Every statistics period uses the same public-activity inclusion policy; short-commute suppression applies only to displayed activity lists. | Commute totals and public/private fixtures. |
| PIPE-09 raw review HTML | Goodreads and Letterboxd processors retain simple formatting and HTTP(S) links while removing executable markup, event attributes, and unsafe schemes. | Injected active markup and unsafe URLs plus allowed formatting tests. |
| PIPE-10 calendar-dependent tests | Year-specific assertions follow the test date and include a year boundary. | Offline processor suite. |
| PIPE-11 stale Goodreads CLI | CLI reports fields actually returned by the processor. | Entry-point fixture. |
| PIPE-12 undated Letterboxd ordering | Undated records sort after dated entries in fetching and processing. | Mixed dated/undated fixtures. |
| PIPE-13 favorite cover persistence | Optimization converts string entries into objects when necessary and persists the optimized cover, including objects without an earlier cover. | Optimize/save/reload/metadata roundtrip fixture. |

Implementation and operating details: [pipeline helpers](/Users/ncteisen/git/website/scripts/pipeline_utils.py), [fetcher](/Users/ncteisen/git/website/scripts/strava-fetcher/fetch_activities.py), [token state](/Users/ncteisen/git/website/scripts/strava-fetcher/token_state.py), [pipeline regression tests](/Users/ncteisen/git/website/scripts/test_pipeline_regressions.py), and [pipeline README](/Users/ncteisen/git/website/scripts/social-data/README.md).

## Game and project fixes

| Audit finding | Implemented behavior | Regression evidence |
| --- | --- | --- |
| A1 Stacks full-width motion | Perfect placements restore width up to the original 190; folded movement handles zero travel and large overshoots. Only Stacks advances to score version 2. | Long perfect-placement sequence, boundary cases, existing seeded game simulations. |
| A2 unauthenticated quota charging | Existing-player credentials and blocked status are checked before charging that player's write quota. Network limits remain enforced. | Invalid-secret requests followed by a legitimate request against an isolated local Worker/D1. |
| A3 stale-tab best-score overwrite | Saving merges the persisted maximum; controllers refresh bests on storage and page-restoration events. | Two stale controllers, storage events, restoration, and failed-write cases. `localStorage` read/modify/write is not an atomic cross-process transaction. |
| A4 retired queued scores | Corrupt and retired entries are pruned, retained records count toward the 50-item limit, and newer-version records are preserved without being posted under older rules. | Mixed old/current/future versions and corrupt records. |
| A5 failed storage writes | A failed nickname write retains the session value, retries persistence, and respects later cross-tab changes. | Readable old values with denied writes and in-flight saves. |
| Additional queue deletion edge | Acknowledged or permanently rejected UUIDs remain retired for the session when storage removal throws. | Successful and 400/409 responses each post once across repeated flushes; deletion resumes when storage recovers. Reloading while storage remains unwritable can retry an acknowledged UUID once; server idempotency remains intact. |
| PROJECT-01 Globe contradictory clues | Bounds remain intact; conflicts show “No matching date range” with the conflicting evidence. Same-year transitions use year precision. | Shared contradictory links, strongest-bound provenance, malformed/duplicate state, all-unsure termination, and 527 catalog-year runs. |
| PROJECT-02 optional Czechia name | Seeing “Czech Republic” does not impose an upper date bound or prematurely prune later questions. | Former failing shared link now yields 2018–present. |
| PROJECT-03 Pets restoration | Persisted page hides pause animation; page restoration resumes it. Real disposal stays permanent, including pending image loads. | Actual-class lifecycle fixtures and browser navigation-back rendering. Browser smoke does not separately establish which navigation used the browser cache. |
| PROJECT-04 LLM probabilities | Fractional wrong-token probabilities decrease; target gain stays within total probability mass. Reset restores the original example. | Capital `.01/.01/.01 → 8.01/.005/.005`; repeated steps, reset, and Toast mass constraints. Existing LLM copy is unchanged. |
| PROJECT-06 interrupted manga import | Every image variant and PDF is staged in an immutable revision; one atomic manifest replacement publishes the complete set. | Mid-encoding failure preserves all old references; successful and repeat imports publish complete fixtures. Existing proof assets were not regenerated. |

Game checks live in [arcade scripts](/Users/ncteisen/git/website/scripts/arcade); project checks live in [project scripts](/Users/ncteisen/git/website/scripts/projects). Stacks v2 requires a coordinated Worker/frontend release; old server runs remain stored.

## Site and legacy fixes

| Audit finding | Implemented behavior | Regression evidence |
| --- | --- | --- |
| SITE-03 TypeScript failures | Explicit Astro ambient types and readonly generated-map interfaces remove the ten module-check failures. | `npm run check:types` passes. This is a TypeScript module check; adding an Astro template checker remains separate maintenance. |
| SITE-04 keyboard controls | Career headers are native buttons with expanded state and truly hidden details; featured review CTAs are real anchors. Period and list filters expose pressed state. | Actual event-handler fixtures and browser keyboard expand/collapse plus statistics toggle. |
| SITE-05 audited contrast failures | Shared muted text is `#888` across homepage/activity/record/journal labels and enabled reader controls; low-contrast hover text is corrected. | Browser styles confirm enabled reader controls at `rgb(136,136,136)`; 5.58:1 against the main background. Disabled controls retain their distinct styling. This is not a complete WCAG assessment. |
| SITE-06 timezone drift | Calendar days are preserved; timestamps use explicit UTC, with an optional activity-local calendar date when provided. | Identical results under UTC, Los Angeles, and Tokyo, including year boundaries and timestamps without an offset. |
| SITE-07 map failure cascades | Installed Leaflet is bundled and loaded asynchronously; failures are isolated per card. Visibility is rechecked after loading, and summaries use the full row when maps are absent. | Failed module, malformed route, failed card, and filter-during-load fixtures; browser full-width summary check. |
| LEG-01 typed HTML | Commands enter a paragraph text setter; authored story HTML keeps a separate rendering path. | Markup/event/script strings remain literal text at the view sink. |
| LEG-02 replay | Restart recreates every room and puzzle state. | Two complete solves in one session, including a locked-puzzle check after restart. |
| Legacy prototype | The old accessibility experiment is explicitly static, has distinct IDs, and no longer calls an undefined function. | Source inspection; link points to the current game. |

The [site regression suite](/Users/ncteisen/git/website/scripts/site/run-checks.mjs) covers dates, map failures, career controls, legacy behavior, and transactional manga imports. [Validation CI](/Users/ncteisen/git/website/.github/workflows/validate.yml) now runs the offline checks for pull requests and gates Pages deployment. Deployment ignores failed/wrong-branch social refreshes and serializes releases. The scheduled data workflow runs Python tests in a virtual environment before fetching.

## Verification

All of the following passed locally after the relevant changes:

- `source .venv/bin/activate && python -m pytest scripts/ -q`: **58 passed**.
- `npm run check:types`, `npm run test:site`, and `npm run test:projects`.
- `npm run test:arcade`, `npm run test:scores`, and `npm run test:codewords`.
- `npm run build`: **89 Astro routes**, including the preserved untracked manga export routes.
- Globe event validation, copy audit, and map-pack audit: **134 events, no issues**.
- Aggregate privacy checks of the public cache and built homepage/activity/record pages: zero excluded activity links and zero embedded routes.
- Local link/asset scan across **98 built HTML files**: zero missing targets.
- `git diff --check` and comparison of the LLM change against the user's preexisting local version.

The implementation-stage score suite used a temporary local Worker and database; provider/token tests used synthetic responses. Physical devices and screen readers were not exercised. Live release checks are separate from those fixtures.

The isolated release checkout was rebuilt from the latest upstream data, excluding unrelated work. It passed the same suites with **27 Astro routes**, **36 total HTML files**, zero missing local targets, and 2,288 public Strava projections. The LLM fix-only candidate also passed actual handler checks for fractional values and matching bar widths. SHA-256 checks confirmed all 385 unrelated working files remained unchanged during release preparation.

Browser evidence:

![Globe clearly identifies conflicting clues](/Users/ncteisen/git/website/docs/audits/2026-10-22/fixes/globe-conflict.png)

![The corrected LLM step preserves fractional probabilities](/Users/ncteisen/git/website/docs/audits/2026-10-22/fixes/llm-training.png)

Additional screenshots: [keyboard disclosure](/Users/ncteisen/git/website/docs/audits/2026-10-22/fixes/home-keyboard.png), [public activity layout](/Users/ncteisen/git/website/docs/audits/2026-10-22/fixes/activities-public.png), [Pets after returning](/Users/ncteisen/git/website/docs/audits/2026-10-22/fixes/pets-return.png).

## Required release setup and remaining work

The `strava-sync` environment and its four required secrets were provisioned on October 22. Its deployment policy permits only `master`; the dedicated credential uses **Environments read/write** permission for this repository. Verify the first full refresh before treating rotation persistence as production-tested. The full setup, probe-secret behavior, single refresh-owner requirement, and post-rotation recovery limitation are in the [pipeline README](/Users/ncteisen/git/website/scripts/social-data/README.md). The previous workflow was paused during migration to avoid competing token refreshes. CI is the designated refresh owner after activation.

The sanitized artifacts remove the old data from the current public site/repository snapshot when deployed. Existing Git history, clones, and external caches remain a separate privacy-remediation decision. Route maps remain omitted until a policy can verify endpoint masking and route visibility.

The audit's broader opportunities—dependency upgrades, payload reduction, complete accessibility/transcript work, historical fact checking, and architectural cleanup—remain follow-up work. They were not presented as reproduced application bugs and were not folded into this fix batch.

## Release verification — October 22

- Fix commit `f5ffdb7`; Node 22.12 audit-loader correction `a630e60`. The full [Pages validation/build/deployment](https://github.com/ncteisen/website/actions/runs/39856791657) passed. The compatibility fix was also tested using the exact CI Node version locally.
- Score Worker version `66b3cd26-c014-4f55-9336-03c44144a95d` deployed before Pages. Health reports Stacks version 2; all-time and weekly boards return 200 with the expected CORS policy. The existing sole D1 migration was verified applied with a SELECT-only query; no schema changes were needed.
- Nine live website routes returned 200; eight emitted script assets matched the build using production public settings. Public activity checks found zero excluded activity links and zero populated route attributes. The live homepage keyboard disclosure expanded correctly.
- Private token persistence succeeded in the first live attempt, but activity access rejected the local seed. The previously working repository grant was then transferred directly inside GitHub by a guarded [secret-only migration](https://github.com/ncteisen/website/actions/runs/39857294306), with no token values in output. Temporary migration workflows were removed afterward. The environment remains restricted to `master`, and CI owns refreshes.

The first live attempt correctly failed before publishing partial data. Subsequent complete refresh and deployment results are available under the repository's Fetch Social Data and Deploy to GitHub Pages Actions runs. Existing public history remediation remains separate.
