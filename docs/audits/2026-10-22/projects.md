# Non-arcade interactive-project audit

Read-only audit on 2026-10-22. No application source, user drafts, generated maps, or manga assets were changed by this sub-audit. Covered Codewords, Date My Globe and its event/map data and validators, Date My Map, map-my-globe reference route, Pets/Playpen, ComicReader and manga importer, writing routes, and LLMs 101. The existing dirty LLMs route was reviewed as the local state, not represented as a committed or deployed release.

## Confirmed defects and product correctness issues

### PROJECT-01 — P2: Date My Globe turns contradictory answers into a falsely precise year

**References:** [src/pages/projects/date-my-globe.astro:1277-1291](/Users/ncteisen/git/website/src/pages/projects/date-my-globe.astro:1277), especially `1283` and `1289-1290`; shared input replay at `1355-1378`.

The engine computes inclusive year bounds, but when the latest year falls below the earliest year it replaces the latest year with the earliest year. This converts an empty intersection into a believable exact-year answer. A local browser load of `/projects/date-my-globe/?globe=eswatini-name:y,czechia-name:n#checklist` visibly produced **2018–2018**, with its own two cards saying earliest bound Eswatini (2018) and latest bound Czechia (2016). This is not only malformed-URL behavior: a DFS applying the normal yes/no selection algorithm found 38 paths that cross bounds because separate events share a year. Example normal path: `ghana-independence:y,vietnam-unification:y,german-reunification:y,zaire-dr-congo:n,yugoslavia-dissolution:y,eritrea-independence:n,czechoslovakia:y`; the underlying constraints reach earliest=1993, latest=1992 before clamping.

**Impact:** The central result misrepresents conflicting clues as certainty, including legitimate globes that mix naming conventions or update maps asynchronously.

**Action:** Model inconsistent/uncertain results explicitly, preserve both constraints, show which answers conflict, and let the reader revisit them. Model same-year transitions at supported granularity rather than alphabetically ordering them and then subtracting a whole year. Extract the selection/range engine into a pure module.

**Validation:** Test every binary-search leaf, same-year events, mixed/contradictory clues, all-unsure answers, and share-state replay. A conflict must never become a nonempty range by clamping.

**Evidence:** `/Users/ncteisen/git/website/docs/audits/2026-10-22/globe-contradictory-bounds.png` shows the result and both bound cards in one frame; browser AX confirmed the same strings. The 38-path count is from a Node reproduction of the current algorithm/data, not a new checked-in test.

### PROJECT-02 — P2: Optional modern names are treated as mandatory historical cutoffs

**References:** [src/data/dateMyGlobeEvents.ts:454](/Users/ncteisen/git/website/src/data/dateMyGlobeEvents.ts:454), `3012-3018`; [src/pages/projects/date-my-globe.astro:1281-1284](/Users/ncteisen/git/website/src/pages/projects/date-my-globe.astro:1281).

Every “Before” answer imposes `event.year - 1`. The Czechia clue asks whether a globe uses Czechia instead of Czech Republic. Yet the dataset's own editorial description explicitly states that the short name joined the country's formal name rather than replacing it. Thus a newer globe using “Czech Republic” is forced into <=2015. The visible conflicting result in PROJECT-01 can arise from this legitimate combination, independently of users making mistakes.

**Impact:** Users receive incorrect date estimates even when they accurately answer the map questions. Similar optional names, transliterations, regional naming conventions, and delayed publisher adoption should be reviewed.

**Action:** Give clues explicit applicability/strength and asymmetric constraints. A new label can establish a lower bound while absence of an optional label should remain inconclusive. Surface date-window/publisher caveats where needed rather than labeling every answer a strict cutoff. The type already declares `sourceConfidence` and `dateWindowNote` ([src/data/dateMyGlobeEvents.ts:61-62](/Users/ncteisen/git/website/src/data/dateMyGlobeEvents.ts:61)), but the checklist does not use them.

**Validation:** Add fixtures for modern globes using formal “Czech Republic,” mixed labels, and post-independence/rename publisher lag. This finding is grounded in the repository's internally conflicting content/model; this pass did not independently re-research all 134 historical events.

### PROJECT-03 — P2: Pets irreversibly disposes itself when a page enters the back/forward cache

**References:** [src/pages/projects/pets.astro:278-280](/Users/ncteisen/git/website/src/pages/projects/pets.astro:278); [src/games/pets/PetsHabitat.ts:118-123](/Users/ncteisen/git/website/src/games/pets/PetsHabitat.ts:118), `213-221`.

Every `pagehide` calls `cleanup()`, which sets `isDisposed=true`, cancels animation, removes resize handling, and disconnects the observer. There is no `pageshow` handling. A browser restoring the same document from its back/forward cache does not rerun the startup script, so the displayed habitat remains frozen and cannot resize. A fixture using the actual bundled class confirmed start schedules one animation frame, cleanup cancels it, and a subsequent tick exits without scheduling another (isDisposed remains true).

**Action:** Separate pause/resume from final disposal. Pause on persisted pagehide and resume on pageshow, or reconstruct on persisted pageshow. Ensure pending image loads behave correctly if a page is cached before ready.

**Validation:** Load the habitat, navigate to Projects, press Back, and confirm sprite positions continue to change and resizing still works in Safari/Chromium with a persisted pageshow. The fixture proves the lifecycle behavior; a real browser cache restoration was not conclusively measured in this pass.

### PROJECT-04 — P3: LLM training demo raises incorrect token probabilities on its first step

**References:** [src/pages/projects/llms-101.astro:40-43](/Users/ncteisen/git/website/src/pages/projects/llms-101.astro:40), `4782-4786` (preexisting local work).

The Capital example begins with Paris, Big, and Danger each at .01%. The Step handler subtracts four percentage points from incorrect candidates but floors them at 1%, then rounds all values to integers. Browser verification shows a single Step changes these to **8%, 1%, 1%**. Both incorrect candidates therefore rise 100x instead of following the intended decreasing transition, and the example's carefully retained small probabilities are lost immediately.

**Impact:** The interactive teaching example communicates a misleading update and cannot preserve sub-percent values.

**Action:** Use an explicit, coherent toy probability model (including unshown vocabulary mass), retain fractional values, and decrease non-target probabilities monotonically for this illustrative exercise. Label the numbers as illustrative rather than a real training update.

**Validation:** Reset must restore .01%; a step must raise the intended token while handling the others as the stated teaching model describes; total shown probability must remain <=100. Cover both Capital and Toast examples and saturation.

**Evidence:** `/Users/ncteisen/git/website/docs/audits/2026-10-22/llms-training-step.png`; browser AX before and after was .01/.01/.01 → 8/1/1. Do not overwrite unrelated LLM work to fix this.

### PROJECT-05 — P2: Manga navigation text is difficult to read at its shipped contrast and size

**References:** [src/components/ComicReader.astro:65](/Users/ncteisen/git/website/src/components/ComicReader.astro:65), `79-84`; [src/pages/writing/to-sleep-perchance-to-dream/manga/index.astro:53](/Users/ncteisen/git/website/src/pages/writing/to-sleep-perchance-to-dream/manga/index.astro:53), `60`, `65`.

Enabled navigation and selection controls use #666 on the #0a0a0a background, about **3.45:1** contrast, at only 11px. Hints/footer use #555, about **2.66:1**, at 10px. These are actual code colors, not a screenshot guess. The disabled control color is excluded from this finding.

**Action:** Brighten enabled labels to a normal-text contrast target, raise their font size, and retain the muted aesthetic through spacing/borders rather than low readability. Share a contrast-checked muted-text token with the site-wide cleanup.

**Validation:** Check default, hover, focus, selected, and disabled states at mobile width and browser text zoom; ensure the 44px touch targets already present are retained. Automated contrast numbers are not a full screen-reader or mobile accessibility audit.

### PROJECT-06 — P2 maintenance risk: Failed proof import can leave old manifest pointing to mixed new/old pages

**References:** [scripts/manga/import-proof.mjs:21-50](/Users/ncteisen/git/website/scripts/manga/import-proof.mjs:21), especially `31-32` vs manifest write at `44`.

The importer overwrites each public page in place and writes the manifest/PDF only after the full image loop. If a Sharp or disk-write failure occurs after a few pages, the previous manifest and source hash remain while some images now come from the new proof. Its temporary directory is only for PNG renders, not the published output. This is a source-confirmed failure path; no destructive fault injection was performed against the user's proof assets.

**Action:** Produce the entire manifest, PDF, and WebPs in a staging directory; validate the complete set; publish atomically or with a rollback-safe directory swap. Keep old assets until the new output is complete. Put initial pdfinfo/read work under cleanup handling as well.

**Validation:** Inject a failure mid-conversion in a fixture output directory and verify all previously published bytes and the old manifest are unchanged. Successful import must have exactly one source hash and a complete set of expected outputs.

## Improvements and design/maintenance opportunities

### PROJECT-07 — P2 performance opportunity: Globe embeds all 134 map pairs in the initial HTML

**Reference:** [src/pages/projects/date-my-globe.astro:790-797](/Users/ncteisen/git/website/src/pages/projects/date-my-globe.astro:790).

Fresh build measurement: **2,112,050 bytes HTML**, of which **2,103,859 bytes** is the event JSON. The root audit’s consistent gzip measurement is 344,536 bytes for the whole HTML; the embedded JSON is 342,025 bytes at the same gzip level 9. These are local compression estimates, not measured HTTP transfer. The initial page parses all geometry although a normal yes/no flow needs roughly seven events. This is a measured payload issue, not a claim that actual production navigation was timed or uncompressed.

**Action:** Separate small event metadata from map geometry; serve cacheable per-event map packs and prefetch likely next choices, with loading/failure/retry UI. At minimum simplify/quantize coordinates and deduplicate identical surrounding geometry.

**Validation:** Compare compressed transfer, parse/main-thread cost, and time until first working choice on throttled mobile. Ensure rapid answers and share-state loading cannot display a stale map.

### PROJECT-08 — P2 accessibility opportunity: Pets has no reduced-motion or pause affordance

**References:** [src/games/pets/PetsHabitat.ts:213-221](/Users/ncteisen/git/website/src/games/pets/PetsHabitat.ts:213); [src/pages/projects/pets.astro:240-250](/Users/ncteisen/git/website/src/pages/projects/pets.astro:240).

The decorative animation runs continuously with no visible pause control and no reduced-motion preference handling. It also continues while the habitat is outside the viewport (browser background-tab RAF throttling is separate).

**Action:** Provide Pause/Play with an accessible pressed state, start static under reduced motion, and suspend frames offscreen. Keep a static illustration and readable names/description available if canvas or sprites fail.

**Validation:** Toggle OS reduced motion and keyboard-operable pause, scroll the habitat offscreen, and check redraw scheduling stops/resumes correctly. Integrate this with PROJECT-03 rather than adding competing lifecycle flags.

### PROJECT-09 — P2 accessibility opportunity: Dynamic LLM demo steps have no spoken phase/status output

**References:** [src/pages/projects/llms-101.astro:3908-3945](/Users/ncteisen/git/website/src/pages/projects/llms-101.astro:3908), `4915-4948`.

Inference indicates phases through classes/colors and replaces probability/generated-token nodes while focus stays on the Step button. There is no live status region announcing the phase, selected token, or completion. Visual diagrams have labels, and controls are real buttons, which are good foundations.

**Action:** Add a concise polite status region such as “Probability map, Paris 92%” / “Selected Paris” / “Appended Paris.” Avoid announcing every decorative node. Give repeated Step/Reset controls contextual accessible names.

**Validation:** Keyboard plus VoiceOver/NVDA walkthrough should communicate each step and completion without the reader searching the entire changed diagram. No real screen-reader session was conducted here.

### PROJECT-10 — P2 accessibility opportunity: Manga needs a page-level text alternative

**Reference:** [src/components/ComicReader.astro:35](/Users/ncteisen/git/website/src/components/ComicReader.astro:35).

Story pages have only “title, page N of 42” as alt text, so the illustrated adaptation's dialogue and scene progression are unavailable to nonvisual readers. The nearby original prose story is a useful fallback but not a page-aligned transcript of the manga adaptation.

**Action:** Add expandable page transcripts/descriptions or structured text for dialogue and meaningful visual action, keyed to the manifest. Preserve brief alt text while linking to that richer text.

**Validation:** Read the adaptation with images disabled and with a screen reader, ensuring a reader can follow each page rather than only hear page numbers. A transcript is content work and should be reviewed against the finished 43-page proof, not the older 62-page package.

### PROJECT-11 — P3 usability: Globe answers cannot be corrected or resumed mid-flow

**References:** [src/pages/projects/date-my-globe.astro:1160-1173](/Users/ncteisen/git/website/src/pages/projects/date-my-globe.astro:1160), `1303-1310`, `1312-1352`; result-only share/restart UI at `760-761`.

There is no Back/edit answer action; a mistaken tap requires finishing/restarting. State lives in memory during the questionnaire; share state is generated only by the final result action. A reload loses an ordinary in-progress session. An answer history exists, so this is a small extension of the current model, and it becomes more valuable when conflict review is added.

**Action:** Offer Undo/Back with replay from the remaining answer log and optionally update a versioned URL or local save after each answer. Preserve the original shared input until the user deliberately changes it, with a clear restart behavior.

**Validation:** Undo both bounds and unsure, edit earlier choices, reload mid-flow, and replay an older shared link after event-list changes. Do not introduce silent server persistence.

### PROJECT-12 — P3 maintainability: Extract the large inline interactive state machines and validate content schemas

**References:** [src/pages/projects/llms-101.astro:4539-5004](/Users/ncteisen/git/website/src/pages/projects/llms-101.astro:4539); [src/pages/projects/date-my-globe.astro:791-1490](/Users/ncteisen/git/website/src/pages/projects/date-my-globe.astro:791); [scripts/date-my-globe/validate-events.mjs:3-91](/Users/ncteisen/git/website/scripts/date-my-globe/validate-events.mjs:3).

The LLM and globe routes mix large blocks of page content and CSS, event data, and stateful behavior. Globe audits cover editorial form and map presentation, but not range invariants, user interactions, event ID uniqueness, finite coordinates/ring validity, or stale `dist` (the validator reads built HTML). This is why all three globe checks passed despite PROJECT-01.

**Action:** Separate pure engines, authored data, map rendering and DOM adapters. Add a schema/invariant check for IDs, monotone/explicit chronology, optional-bound semantics, finite viewport/geometry, and share versioning. Make fresh build a declared prerequisite of built-output validation.

**Validation:** Small pure tests should cover behavior rather than mirroring DOM implementation. Keep existing map/copy audits; add boundary cases and fixtures rather than replacing their useful checks.

### PROJECT-13 — P3 product inventory: Date My Map is intentionally a placeholder

**Reference:** [src/pages/projects/date-my-map.astro:78-80](/Users/ncteisen/git/website/src/pages/projects/date-my-map.astro:78).

The page currently states that the project is being restarted from scratch. This is not a broken implementation. Decide whether to keep it as an explicitly labeled work-in-progress listing, hide it from prominent discovery, or redirect to the working Globe tool if their scope converges. `playpen.astro` intentionally redirects to Pets and is working by inspection.

## Verified positives and checks

- `npm run test:codewords` passed: 600 deterministic boards, existing seed compatibility, reversible marks, counts, no lockouts, saved-state migration. Engine saves validate packs, normalized seed, bounded/unique selected indexes; localStorage failures are caught. The spymaster key is not persisted and is hidden on visibility loss. Real buttons, pressed states and an announcement region are used. No material Codewords defect was established in this pass; the intentionally client-visible answer key is documented, not an access-control bug.
- After the root's fresh build, `npm run validate:date-my-globe`, `npm run audit:date-my-globe-copy`, and `npm run audit:date-my-globe-maps` all passed for 134 events, with zero issues/warnings. The validator lists duplicate years but does not fail them. Every mapped event has a source note. Local browser reproduced the explicit bounds issue above.
- Source inspection confirms strong reader progressive enhancement: no-JS displays all pages, storage errors do not prevent reading, image sizes/srcset and lazy loading exist, touch logic protects vertical/diagonal/pinch/edge gestures, controls have 44px targets, and source-hash storage keys prevent mixing resume positions across proof versions.
- The manga manifest and README identify the finished 43-page proof as the authoritative reader source, distinct from the user's existing older/untracked 62-page package. No assets were regenerated or substituted.
- Writing routes generate from structured local story data. Their `set:html` paragraphs are authored repository content; no visitor-controlled HTML input or exploitable XSS path was established here.
- LLM demo source HTML strings are escaped, dynamic inference output uses textContent/created elements, examples distinguish illustrative data from live inference, and reduced-motion CSS exists for the main demo animations.
- Pets has DPR capping, resize observation, bounded time deltas and visible image-load failure state. Its remaining lifecycle issue is specific and repairable.

## Limits

This was not a factual revalidation of every historical claim or every LLM source paper; not a physical-device, full cross-browser, full screen-reader, real production-performance, or external-provider/privacy audit; not a release check. Browser confirmation used local Astro preview at 127.0.0.1:4328. Tests/fixtures only operated on local deterministic data. No external messages, remote changes, deployment, imports, or source edits were made. Root covers general site, dependency/build/CI/deployment issues and other workstreams.
