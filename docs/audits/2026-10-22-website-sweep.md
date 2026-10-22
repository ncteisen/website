# Website codebase sweep — October 22, 2026

Implementation follow-up: [fix status and verification](/Users/ncteisen/git/website/docs/audits/2026-10-22/fixes.md). The findings below describe the original audit snapshot.

This review found one confirmed public privacy issue, several reproducible correctness bugs, and useful improvements to validation, accessibility, performance, and maintenance. The site does not need a wholesale rewrite. Its static architecture, pure game engines, score-service contracts, and existing simulation tests are good foundations; the largest gaps are at data-publication boundaries and in failure/lifecycle cases.

**Start with the Strava publication policy.** The live activity page contains route polylines for 85 activities marked `followers_only` in the cached source data. The public GitHub cache also contains 11 `only_me` activities, 10 with routes. These are aggregate observations; this report deliberately contains no activity identities, locations, or credentials.

## Snapshot and scope

- Local branch: `master`, commit `74ca8dfa540714871600313e8e706c6a315df504`.
- Existing user changes preserved: `requirements.txt`, `src/pages/projects/llms-101.astro`, and untracked art/manga/export files. The LLM demonstration finding is explicitly about this local version.
- Reviewed Astro pages/components, interactive projects, all arcade engines and score code, Worker/D1, Python pipelines, favorites/resume/manga tooling, workflows, dependencies, generated output, and the legacy site.
- Four review tracks used source inspection, existing tests, isolated synthetic fixtures, local browser checks, and narrowly scoped public read-only verification. No provider refresh, production score write, source fix, commit, push, deployment, or history rewrite was performed.
- Both committed HEAD and the current working tree build. HEAD produces 27 Astro routes; the working tree produces 89, including 62 preexisting untracked manga export routes. The working-tree output contains 98 HTML files after copied legacy/static pages are included.
- Public GitHub data is newer than the local checkout: 2,409 raw Strava activities remotely versus 2,406 locally. Counts below identify their source and should not be treated as permanent inventory.

Detailed reviews: [data and automation](</Users/ncteisen/git/website/docs/audits/2026-10-22/pipelines.md>), [arcade and scores](</Users/ncteisen/git/website/docs/audits/2026-10-22/arcade.md>), [interactive projects](</Users/ncteisen/git/website/docs/audits/2026-10-22/projects.md>), and [legacy site and documentation](</Users/ncteisen/git/website/docs/audits/2026-10-22/legacy.md>). Each includes source locations, evidence, proposed fixes, and validation criteria. Shared findings are cross-referenced rather than counted twice.

## Priority and action order

P1 means address promptly because current public data is affected. P2 means a concrete bug or material engineering gap worth scheduling next. P3 means lower-impact cleanup or a product decision. Effort is relative: **S** is a focused change, **M** crosses a subsystem/workflow, **L** requires broader content or migration work. Estimates exclude rollout and any privacy-history remediation.

| Order | Priority | Action | Evidence / detail | Effort |
| --- | --- | --- | --- | --- |
| 1 | P1 | Stop unintentionally republishing nonpublic Strava data and assess existing public copies | Live HTML + public cache; PIPE-01 below | M; history response separate |
| 2 | P2 | Persist rotated Strava refresh tokens privately | Contract + synthetic response; PIPE-02 | M |
| 3 | P2 | Fail fetch/processing safely and preserve last-known-good data | Mocked HTTP/processor failures; PIPE-03/04 | M |
| 4 | P2 | Reconcile removals and visibility changes instead of keeping every old record forever | Synthetic full-refresh/deletion cases; PIPE-05 | M |
| 5 | P2 | Put existing checks in CI and repair the type-check configuration | SITE-02/03 | M |
| 6 | P2 | Upgrade and triage flagged dependencies against this site's actual execution paths | Registry snapshot; SITE-01 | M |
| 7 | P2 | Represent contradictory Globe clues and optional names correctly | Browser + range traversal; PROJECT-01/02 | M |
| 8 | P2 | Authenticate before charging a player's score-write quota | Isolated Worker/D1 reproduction; A2 | S |
| 9 | P2 | Fix Stacks' full-width movement boundary | 42 legal perfect drops reproduce it; A1 | S |
| 10 | P2 | Preserve the maximum best score across open tabs | Two actual controller instances; A3 | S |
| 11 | P2 | Give career disclosures and featured reviews proper keyboard controls | Browser DOM + source; SITE-04 | S |
| 12 | P2 | Raise contrast of enabled text/controls across site and reader | Computed styles + contrast calculation; SITE-05 / PROJECT-05 | M |
| 13 | P2 | Resume Pets correctly after back/forward-cache restoration | Actual-class lifecycle fixture; PROJECT-03 | S |
| 14 | P2 | Prune obsolete queued runs and handle partial storage failure | Client storage fixtures; A4/A5 | S–M |
| 15 | P2 | Normalize Goodreads dates and unify activity-total inclusion rules | Synthetic edge cases; PIPE-06/07 | S |
| 16 | P2 | Sanitize external review HTML before raw HTML rendering | Data-flow + injected fixture, no observed exploit; PIPE-09 | S–M |
| 17 | P2 | Make optional maps fail independently of core homepage controls | Missing-Leaflet fixture; SITE-07 | S |
| 18 | P2 | Stage complete manga imports before replacing published assets | Source-confirmed interrupted-import failure path; PROJECT-06 | M |
| 19 | P2/P3 | Reduce Globe/journal/image payloads and offscreen work | Measured build and DOM counts; SITE-08 / PROJECT-07 | M |
| 20 | P3 | Fix timezone-sensitive dates, calendar-dependent tests, and stale tool entry points | SITE-06; PIPE-10/11/12 | S |
| 21 | P3 | Make favorite-image optimization survive the next scrape | Source trace + persistence fixture; PIPE-13 | S |
| 22 | P3 | Restore legacy game replay and safely echo typed input | Local VM fixtures; LEG-01/02 | S |

The detailed reviews also cover reduced motion, manga transcripts, accessible LLM status announcements, Globe undo/resume, score retention/observability, metadata completeness, and developer-documentation cleanup. These are separate opportunities rather than claims of observed outages.

## PIPE-01: confirmed public Strava privacy exposure

The processor's inclusion predicate checks commute distance, not visibility: [strava_processor.py:117](</Users/ncteisen/git/website/scripts/social-data/strava_processor.py:117>). It exports the map object at [line 162](</Users/ncteisen/git/website/scripts/social-data/strava_processor.py:162>), and the activity page serializes its polyline into HTML at [activities.astro:449](</Users/ncteisen/git/website/src/pages/activities.astro:449>). The scheduled workflow commits the authenticated raw cache at [social-data-fetch.yml:50](</Users/ncteisen/git/website/.github/workflows/social-data-fetch.yml:50>).

Read-only verification on the audit date established:

| Surface | Observation |
| --- | --- |
| GitHub repository metadata | `ncteisen/website` is public |
| Public raw cache on `master` | 2,409 activities: 2,288 `everyone`, 110 `followers_only`, 11 `only_me` |
| Public raw cache routes | 10 of the 11 `only_me` activities contain route polylines |
| Live `/activities/` HTML | HTTP 200; 85 embedded routes match activities marked `followers_only` in the local cache |
| Local generated record cards | One nonpublic record is included; not separately checked on the live records page |
| Synthetic processor fixture | An `only_me` activity is also accepted and exported with its route |

This is a publication-policy failure, not evidence of stolen credentials or unauthorized account access. The API legitimately returns data to its authorized owner; the exporter then treats that data as suitable for a public site. Strava documents that activity-read scopes can include followers-only data, and broader scopes can include only-you activities and privacy-zone data. Merely narrowing an API scope is not a complete public-export policy. [Strava authentication and scopes](https://developers.strava.com/docs/authentication/)

Recommended response, in order:

1. Define an explicit allowlist for public export before regenerating or releasing social data. Apply it to recent activities, records, totals, and any stored public cache, with a deliberate policy for missing visibility. Verify route-specific map visibility and endpoint/privacy-zone masking before retaining any route, including activities marked everyone; broad read scopes can return more than the public map. No current privacy-zone exposure was separately established.
2. Store authenticated raw responses privately, or persist only a minimal public projection. Filter before public persistence; hiding cards after committing raw data is insufficient.
3. Regenerate affected public artifacts from sanitized input and verify both the public repository and deployed HTML using aggregate-only checks.
4. Separately assess Git history, existing clones/caches, and whether repository-history remediation is warranted. Removing the current file alone cannot remove historical copies. No destructive remediation was performed during this audit.
5. Add fixtures for everyone/followers-only/only-me/missing visibility, records, and visibility changes; assert forbidden synthetic identities/routes cannot enter output HTML or public JSON.

The [pipeline review](</Users/ncteisen/git/website/docs/audits/2026-10-22/pipelines.md>) explains the related deletion-reconciliation and token-rotation gaps. Fixing publication once without fixing subsequent sync behavior would leave an easy recurrence path.

## Site, build, and release findings

### SITE-01 — P2: the locked dependency set needs security maintenance

`npm audit --json --ignore-scripts` successfully retrieved the registry report and returned **12 affected package entries: 1 critical, 10 high, 1 low**. This is a count of affected packages, not 12 independent exploitable paths. The preserved [registry result](</Users/ncteisen/git/website/docs/audits/2026-10-22/npm-audit.json>) contains exact advisory identifiers and affected ranges.

| Package | Locked version | Registry package severity |
| --- | --- | --- |
| astro | 6.2.2 | Critical |
| devalue | 5.7.1 | High |
| esbuild | 0.27.7 | Low |
| http-cache-semantics | 4.2.0 | High |
| js-yaml | 4.1.1 | High |
| nanoid | 3.3.11 | High |
| postcss | 8.5.10 | High |
| sharp | 0.34.5 | High |
| smol-toml | 1.6.1 | High |
| source-map-js | 1.2.1 | High |
| svgo | 4.0.1 | High |
| vite | 7.3.2 | High |

The critical Astro advisory concerns processing an attacker-controlled AVIF through the Sharp image service. This repo produces static Pages output and has no Astro server adapter or deployed SSR image endpoint. The audit did not establish an attacker-controlled AVIF-processing path here. Build-time image processing, local development tooling, and future imports still warrant patching; the registry severity should not be presented as proof that the public site currently permits remote code execution. [Maintainer advisory](https://github.com/withastro/astro/security/advisories/GHSA-26w7-cxv4-gfx2)

**Action:** make a scoped dependency-update change, inspect direct/transitive compatibility, refresh the lockfile, run all checks and browser smoke tests, and rerun the audit. The advisory's fixed version for that one issue is not a blanket target for the whole dependency set. Add regular dependency review; include CDN/vendored legacy libraries, which npm does not inventory. Python dependencies were inspected but a Python vulnerability-database audit was not run.

### SITE-02 — P2: useful tests exist but do not gate deployment

[deploy.yml:20](</Users/ncteisen/git/website/.github/workflows/deploy.yml:20>) checks out and builds/uploads using the Astro action. It does not run arcade, score, Codewords, Python, or Globe checks, and it has no pull-request trigger. [social-data-fetch.yml:20](</Users/ncteisen/git/website/.github/workflows/social-data-fetch.yml:20>) installs dependencies and refreshes data without running the processor tests first.

The deploy workflow also subscribes to upstream `completed` without checking conclusion or branch, and has no concurrency group. Upstream failure therefore still triggers a build of checked-out repository content. Its own `needs: build` correctly prevents a deployment when that build fails; it does not publish a failed fetcher's uncommitted files. Overlapping builds are a deployment-order risk, not an observed rollback in this review. [GitHub workflow_run semantics](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#running-a-workflow-based-on-the-conclusion-of-another-workflow)

**Action:** add a reusable validation job for PRs/pushes; gate deploy on it. Run offline Python tests before scheduled mutations. Include fresh-build-dependent Globe audits after building. Add explicit upstream-success/branch conditions, a deployment concurrency policy, bounded job timeouts, and explicit permissions. Serialize social-data writers to avoid conflicting pushes. Keep Worker deployment separate and document the frontend/backend compatibility and verification steps.

**Acceptance:** a deliberately failing existing test blocks deployment; a failed social fetch does not trigger a misleading successful refresh; concurrent jobs cannot publish an older artifact over a newer one. Do not introduce live provider/API writes into validation.

### SITE-03 — P2: normal TypeScript checking is broken and Astro templates are unchecked

Running `./node_modules/.bin/tsc --noEmit` reports **10 errors**. [tsconfig.json:3](</Users/ncteisen/git/website/tsconfig.json:3>) includes `.astro/types.d.ts` but excludes the generated `.astro/` directory, losing its `astro/client` reference. The result includes missing imported-image declarations and `ImportMeta.env` types.

Supplying `--types astro/client` removes nine errors and leaves the real readonly/mutable mismatch at [dateMyGlobeEvents.ts:103](</Users/ncteisen/git/website/src/data/dateMyGlobeEvents.ts:103>): generated `as const` map features are cast to mutable interfaces. This is a type-contract defect; runtime geometry corruption was not established. An ordinary Astro build succeeds without enforcing these checks. Plain `tsc` also does not check `.astro` templates, and `@astrojs/check` is not installed.

**Action:** restore Astro ambient types, align generated and consumed map interfaces with actual mutability, and add an Astro-aware check command. Avoid hiding the geometry mismatch with an unexplained double assertion. Put the new check in SITE-02's validation gate.

**Acceptance:** both TypeScript modules and Astro template/scripts check cleanly with no interactive dependency-install prompt in CI.

### SITE-04 — P2: homepage disclosure and review actions are mouse-only

Career rows at [index.astro:949](</Users/ncteisen/git/website/src/pages/index.astro:949>) are `div`s, toggled only by click at [line 1235](</Users/ncteisen/git/website/src/pages/index.astro:1235>). The browser confirmed all five have `tabIndex=-1`, no button role, and no expanded state. Collapsed content is clipped with `max-height`, so its links can still remain in the accessibility tree and tab sequence even when visually hidden.

Featured review cards at [line 1124](</Users/ncteisen/git/website/src/pages/index.astro:1124>) use click handlers and CTA spans instead of primary destination anchors. The two current cards contain no real links. Reviews can contain inline anchors, so wrapping an entire review in another anchor would create a separate problem.

**Action:** use a real disclosure button with controlled details, or `<details>/<summary>`, for career entries; expose expanded state and remove collapsed detail links from focus. Convert each review CTA into a real anchor. Add pressed/selected state for period and list filters, and useful section headings in place of purely visual labels.

**Acceptance:** keyboard users can expand/collapse every job, see focus, and open each featured review; focus never lands on clipped content. Check with a screen reader as well as DOM inspection. The existing journal filters and load-more behavior worked in the browser.

### SITE-05 — P2: muted text is frequently below readable contrast

Browser-computed homepage styles match the source: [section labels](</Users/ncteisen/git/website/src/pages/index.astro:248>) and [career periods](</Users/ncteisen/git/website/src/pages/index.astro:394>) are `#444` at 10–11px; the [subtitle](</Users/ncteisen/git/website/src/pages/index.astro:306>) is `#555` at 13px. Against `#0a0a0a`, their calculated ratios are **2.03:1** and **2.66:1**. `#666` is **3.45:1**; even `#777` is only **4.42:1** on this background. Enabled reader navigation also uses `#666` at 11px (PROJECT-05).

Normal-size text has a 4.5:1 minimum contrast target under WCAG AA. Disabled controls and pure decoration are not the subject of this finding. [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)

**Action:** define a shared muted-text token that passes against the actual background, retain hierarchy with size/spacing/borders, and check hover/focus/selected states. `#888` measures 5.58:1 against the main background and is a reasonable starting point, subject to the other surfaces. Preserve the visual character rather than flattening all text to white.

**Acceptance:** measured enabled text meets its applicable contrast target and remains readable at narrow widths and text zoom. This audit was not a complete WCAG conformance assessment.

### SITE-06 — P3: rendered dates depend on the build machine's timezone

[index.astro:189](</Users/ncteisen/git/website/src/pages/index.astro:189>) and [journal.astro:102](</Users/ncteisen/git/website/src/pages/journal.astro:102>) parse date-only Letterboxd strings with `new Date()` and format without an explicit timezone. The synthetic value `2026-10-15` renders October 15 in UTC and October 14 in America/Los_Angeles. These are server-rendered dates, so a local build and a CI build can disagree. Activity dates have the same implicit-timezone formatting in [activities.astro:34](</Users/ncteisen/git/website/src/pages/activities.astro:34>) and [records.astro:63](</Users/ncteisen/git/website/src/pages/records.astro:63>).

**Action:** distinguish calendar dates from instants. Preserve a film's date-only calendar value directly; choose an explicit display timezone for timestamps or use the activity's local-date field if that is the intended meaning. Centralize the helpers.

**Acceptance:** build with UTC and America/Los_Angeles and compare the intended displayed dates, including midnight and year boundaries. Pair this with PIPE-10's hardcoded-2026 test fix.

### SITE-07 — P2: a failed optional map prevents unrelated homepage controls from initializing

The homepage calls `initLatestActivityMaps()` at [index.astro:1225](</Users/ncteisen/git/website/src/pages/index.astro:1225>) before registering career/review/period handlers. Map setup dereferences `window.L` without a guard or independent failure boundary. A fixture extracts the homepage script, removes its imports, transpiles TypeScript with esbuild, and executes it with a stubbed DOM/map constants, valid synthetic polyline, and missing Leaflet. It throws `Cannot read properties of undefined (reading 'map')`; neither the career nor statistics handler registration is reached.

Leaflet is declared as an npm dependency but these three pages also import it from unpkg. The built output retains the external import, so it remains a runtime dependency on that CDN. The normal local-browser load worked; this finding is about failure isolation, not a current CDN outage.

**Action:** bundle the installed Leaflet module consistently, initialize core controls independently, and make map failure leave readable activity text and links. Consolidate the three copies of polyline decoding/map setup, and isolate invalid-map failures per card. Initialize offscreen maps on demand.

**Acceptance:** blocked map script, failed tiles, and malformed synthetic route data cannot disable the career or statistics UI. A small [local reproduction](</Users/ncteisen/git/website/docs/audits/2026-10-22/repros/map-failure.mjs>) captures the present failure.

### SITE-08 — P2/P3 opportunity: reduce data and image work before changing hosting

The following are local build measurements, not live network timings. Gzip values are estimates from compressing local HTML; actual HTTP compression and browser cost were not profiled.

| Page/asset | Measured observation | Focused improvement |
| --- | --- | --- |
| Date My Globe | 2,112,050 bytes HTML; 344,536 gzip estimate; about 2.10 MB is embedded event/map JSON | Split compact event metadata from cacheable per-event geometry; prefetch likely next maps (PROJECT-07) |
| Journal | 717,399 bytes HTML; 61,386 gzip estimate; 581 entries and 8,278 DOM elements while initially showing 20 | Static pagination or a compact paged data source; preserve shareable filter/page state and no-JS navigation |
| Activities | 235,223 bytes HTML; 73,373 gzip estimate; initial setup creates maps for all 20 visible-by-limit rows regardless of viewport | Use intersection-based initialization; retain textual information immediately |
| Favorites | 41 eager image elements for separate desktop/mobile grids; browser observed 14 hidden-grid images already loaded at inspection time | Use lazy loading and intrinsic sizes; avoid two separate eager render trees where ordering can be expressed once |
| Flappy source sprite | 754,318-byte PNG used to build tiny frames at runtime, also loaded by menu preview | Pre-render the approved small atlas and preview; keep the original source asset (arcade improvement 1) |

The whole working-tree `dist` is about 151 MB, but much of that is optional PDFs and images. It is not a 151 MB initial page load. The existing 44 MB proof PDF is a deliberate downloadable source, not proof that every reader downloads it.

**Acceptance:** establish compressed transfer/DOM budgets, then measure cold load, first usable interaction, and long tasks on a throttled phone-sized viewport. Keep loading/error states for newly lazy resources. No hosting migration is necessary to make these improvements.

## Other worthwhile maintenance and product work

| Area | Concrete next action | Reason / scope |
| --- | --- | --- |
| Shared site structure | Extract a base document/head, typography tokens, navigation, date formatting, and activity-map helper | Repeated page CSS/metadata makes consistency fixes expensive; retain project-specific visual treatment |
| Product engines | Extract pure Globe and LLM transition models from large inline scripts | Globe correctness tests are currently absent despite copy/map audits; LLM route is about 5,006 lines |
| Reduced motion | Add Pets pause/static mode and collection-effect preferences | Pets currently runs continuously; do this alongside its lifecycle fix |
| Nonvisual experiences | Add concise live status to LLM steps and page-aligned manga transcripts | Real controls alone do not explain changing diagrams or illustrated dialogue |
| Globe usability | Add undo/edit answers and resumable, versioned state | Especially valuable when conflicts can be revisited |
| Score operations | Add aggregate failure/latency metrics, storage growth monitoring, and an explicit retention policy | Do not log credentials or casually delete UUID history needed for retry deduplication |
| Data freshness | Record successful fetch time and processing time separately for each source | A fresh aggregate timestamp does not mean the upstream data refreshed |
| Metadata/content | Validate favorites references/assets, event IDs/geometry, and generated social schemas | Current assets are complete; schemas should catch future malformed input before publication |
| SEO/navigation | Align canonical origin with the intended host (`CNAME` uses `www`, SocialPreview hardcodes apex); add sitemap and useful 404 navigation | Configuration consistency and discoverability, not an established search-ranking incident |
| Runtime reproducibility | Declare supported Node version/engines; document the venv and checks | Audit used Node 25.8.1, while deploy pins 22.12.0; both should follow a tested policy |
| Tooling/docs | Update README/AGENTS, remove obsolete root redesign scaffold if unused, and refresh the architecture description | README omits today's Worker and testing surface; the existing architecture PNG and Excalidraw source should be kept in sync |
| Legacy site | Preserve the archive deliberately, but inventory its CDN/vendored JS separately | jQuery 1.11.1 / Bootstrap 3.2.0 do not appear in npm's dependency report; same-origin execution deserves review |
| Date My Map | Decide whether to retain the explicit work-in-progress placeholder | It is intentionally unfinished, not a newly discovered broken implementation |

## Checks and evidence

| Check | Result | What it does and does not establish |
| --- | --- | --- |
| `npm run build` in working tree | Pass, 89 Astro routes | Includes preserved local LLM changes and untracked export route |
| Build from `git archive HEAD` in temporary directory | Pass, 27 Astro routes | Checks committed source using installed dependencies; no fresh `npm ci` performed |
| `npm run test:arcade` | Pass | Seeded physics/input/endurance checks; [output](</Users/ncteisen/git/website/docs/audits/2026-10-22/arcade-checks.log>) |
| `npm run test:scores` | Pass | Type checks and isolated local Worker/D1/client contracts; no live score submission |
| `npm run test:codewords` | Pass | 600 deterministic boards, seed behavior, reversible marks, saved-state migration |
| `source .venv/bin/activate && python -m pytest scripts/ -q` | 22 passed | Existing processor tests; failure-path fixtures revealed additional gaps |
| Fresh-build Globe validation/copy/map audits | All pass, 134 events | Editorial/map completeness; do not establish range-engine correctness |
| `tsc --noEmit` | Fail, 10 errors | Nine ambient-type errors plus readonly geometry mismatch |
| `tsc --noEmit --types astro/client` | Fail, one geometry error | Confirms the missing ambient types account for the other nine |
| `npm audit --json --ignore-scripts` | 12 affected package entries | Registry snapshot; exploitability depends on reachable code paths |
| Generated internal `href`/`src` target scan | Zero missing local file/route targets across 98 HTML files | Does not validate external links, all fragments, or JS-generated URLs |
| Generated image/metadata check | All current non-legacy content routes have titles/canonicals/descriptions; redirect stubs excepted; image alt attributes present | Existence does not imply sufficient semantic descriptions or good contrast |
| Local browser | Homepage statistics toggle, journal filter/load more, favorites assets, Globe contradictory result, LLM step verified | Desktop in-app browser; no physical-device or complete screen-reader acceptance |
| Resume consistency | Generator output matches checked-in TeX; both PDFs hash-identical | No new LaTeX compile or visual PDF review |
| Manga consistency | 43 pages; all 86 variants exist with expected widths; PDF hash/size matches manifest | Authoritative proof preserved; older 62-page package not substituted |
| Public read-only privacy verification | Confirmed live routes + public raw cache | No public data was modified; only aggregate evidence retained |

Normal preview and local Worker tests initially hit sandbox restrictions on binding localhost. They passed after allowing localhost operation; those environment restrictions are not repository failures. The first registry request also needed network access. No automatic-approval rejection remains unresolved.

Evidence for the Globe bug makes the mismatch visible without reading code:

![Globe result says 2018–2018 while its earliest and latest evidence cards show 2018 and 2016](/Users/ncteisen/git/website/docs/audits/2026-10-22/globe-contradictory-bounds.png)

Standalone audit fixtures are preserved under [repros](</Users/ncteisen/git/website/docs/audits/2026-10-22/repros/README.md>). They are supporting evidence, not a proposed replacement for the existing test suites. They use synthetic data and do not contact the production score service.

## Suggested implementation batches

1. **Public-data boundary:** PIPE-01, private raw-cache storage, visibility/deletion reconciliation, aggregate-only verification of repository and live output. Decide history response separately.
2. **Reliable automation:** token persistence, failure-safe fetch/process/write, source freshness, date normalization, clock-independent tests, and the CI/type-check gate.
3. **Correct interactions:** Globe conflict/name semantics, score quota ordering, Stacks boundary, local-best/queue/storage behavior, and Pets restore. Add regression tests for the reproduced failures.
4. **Accessible site:** keyboard disclosures/links, shared contrast tokens, selected/live states, reduced motion and pause, then the larger transcript content task.
5. **Performance and maintenance:** map/data splitting, sprite optimization, pagination, shared site helpers, import staging, dependency maintenance, and legacy/docs cleanup.

For each batch, keep source changes, commits, pushes, and deployment as separate explicit states. After a production change, verify the actual deployed result rather than treating a green build as release proof.

## Limits

This is a broad codebase audit, not a guarantee of defect absence or a penetration test. It did not exhaustively reread every historical source, fact-check every LLM claim, inspect all third-party service account settings, scan all Git history for secrets, audit Python packages against a live vulnerability database, or exercise every browser/device. No current provider-auth outage, score attack in production, compromised credential, or dependency exploit was established. Specific source/fixture/browser/public evidence is identified for each finding so the next change can be scoped and verified.
