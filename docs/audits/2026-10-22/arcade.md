# Arcade and leaderboard audit — 2026-10-22

Read-only review of `src/games/arcade/`, Sarah Jumps, Flappy Sarah, arcade page/layout/components, Worker/D1, and relevant scripts. No repository file was edited. No production endpoint was written or exercised. Existing unrelated dirty files remain untouched. Root is handling the central CI/dependency review.

## Confirmed actionable defects

### A1 — P2: Perfect Stacks bonuses eventually send the next block offscreen

- Primary references: [src/games/arcade/collection/Stacks.ts:18-21](/Users/ncteisen/git/website/src/games/arcade/collection/Stacks.ts:18) and `:36-41`; next-block setup at `:32`.
- Every third perfect drop expands the platform by 16 units, with only the world boundaries limiting its width. After 42 legitimate perfect drops, the block spans the entire 400-unit playfield. The movement/reflection code assumes positive travel room. At width 400, the left-edge and right-edge reflection branches both execute on successive ticks and drive x increasingly negative.
- Local reproduction used only `update(1/120, controls)` and legal `act('primary')` inputs. It reached score 42 and width 400 at simulated time 19.3917 seconds. Waiting two seconds without dropping moved the next block to x=-531, width=400 (entirely offscreen); the next drop ended the run with “Missed! Aim for the center of the last block.” No world state was patched for this reproduction.
- Fixture: `/Users/ncteisen/git/website/docs/audits/2026-10-22/repros/arcade-stacks.mjs`; run from repository root with `node /Users/ncteisen/git/website/docs/audits/2026-10-22/repros/arcade-stacks.mjs`.
- Recommended fix: Decide a maximum recoverable width below the viewport width (e.g. original base width or an explicit difficulty cap), and make movement handle zero travel distance safely. The bonus should restore lost room without eventually eliminating the intended timing challenge. If scoring/difficulty changes materially, bump only Stacks' leaderboard version.
- Validation: Extend the perfect-placement test beyond 42 drops, insert long waits between drops, and assert `0 <= moving.x <= 400-moving.width` at every step. Include width equal to 400 as a boundary unit case even if normal play is capped below it. Run arcade and score suites.

### A2 — P2: A public leaderboard ID can be used to exhaust someone else's write quota

- References: [workers/arcade/index.ts:38-42](/Users/ncteisen/git/website/workers/arcade/index.ts:38) parses/hashes a supplied credential but does not authenticate it; `:68-69` charges `player:${auth.id}`; token ownership is checked only at `:77-79` or `:82-84`. Public IDs are exposed by the leaderboard queries at `:56` and `:62`.
- An unauthenticated caller can use a known public player ID and any syntactically valid 64-character secret. Its rejected writes consume the real player's per-player bucket. This is distinct from the deliberately accepted casual-game limitation that scores are client-reported.
- Local isolated Wrangler/D1 reproduction: create a legitimate player (HTTP 200), submit 60 rename requests using that ID plus a wrong secret from a different simulated network IP (59 HTTP 403, then HTTP 429), then submit a valid run using the legitimate secret and original IP. The genuine run receives HTTP 429. The legitimate credential was never known to the simulated attacker. No production traffic was sent. This establishes temporary targeted write denial for requests sharing the applicable Cloudflare rate-limit location; the local harness does not establish global or cross-location denial or production exploitation. See [workers/arcade/README.md:50](/Users/ncteisen/git/website/workers/arcade/README.md:50).
- Fixture: `/Users/ncteisen/git/website/docs/audits/2026-10-22/repros/arcade-worker-quota.mjs`; run from repository root using `WRANGLER_LOG_PATH=/tmp/website-audit-worker-repro.log node /Users/ncteisen/git/website/docs/audits/2026-10-22/repros/arcade-worker-quota.mjs`. The local harness must be allowed to bind localhost.
- Recommended fix: Apply the per-player limiter only after authentication, or partition the quota by the credential hash as well as the ID so arbitrary secrets cannot consume the owner's bucket. Keep the existing network cap for unauthenticated noise. Do not log the authorization value/hash.
- Validation: Add a regression that floods an existing ID with wrong secrets and confirms a subsequent valid write still succeeds; separately confirm genuine same-credential requests are throttled. Preserve impersonation and registration retry checks.

### A3 — P2: A stale open game tab can overwrite a higher local best

- References: [src/games/arcade/storage.ts:11-12](/Users/ncteisen/git/website/src/games/arcade/storage.ts:11) unconditionally writes the provided value. Controllers cache best once: [src/games/sarah-jumps/js/core/GameEngine.ts:17](/Users/ncteisen/git/website/src/games/sarah-jumps/js/core/GameEngine.ts:17), then compare only against that cached value at `:135-138`; [src/games/flappy-sarah/FlappySarah.ts:17,137-140](/Users/ncteisen/git/website/src/games/flappy-sarah/FlappySarah.ts:17); collection games at [src/games/arcade/collection/Game.ts:41,80](/Users/ncteisen/git/website/src/games/arcade/collection/Game.ts:41). Pausing also saves (`GameEngine.ts:141-146`).
- This is more than a direct helper accepting a lower number: two game instances opened when best=0 retain independent cached values. Tab A later saves 100. Tab B, still comparing against its original 0, saves 20 and replaces 100. This can happen with two tabs, or a retained bfcache game page, and affects the local best display/menu; the server's D1 `bests` trigger remains monotonic and is unaffected.
- Confirmed with the actual bundled Sarah Jumps `GameEngine` and storage module, using two instances sharing a localStorage map. Only rendering/input/audio were stubbed. After A's `pause()` at world score 100 the stored best was `100`; after B's `pause()` at score 20 it was `20`. The broader direct-helper reproduction also yields 20 after save100/save20.
- Fixture: `/Users/ncteisen/git/website/docs/audits/2026-10-22/repros/controller-cross-tab.mjs` (real-controller reproduction); `arcade-client-storage.mjs` (helper reproduction).
- Recommended fix: Merge with the currently persisted best before saving and return/update the controller's effective best; synchronize controller state on storage/pageshow events. If strict cross-process concurrency is required, serialize the read/merge/write or use a storage representation that cannot lower the max.
- Validation: Two independent controllers with shared storage, low/high writes in both orders, reload/bfcache-style restore, and storage unavailable. Confirm local best never decreases without an explicit reset.

### A4 — P2: Retired-version offline runs survive forever and evade the 50-run bound

- References: [src/games/arcade/scores.ts:36-48](/Users/ncteisen/git/website/src/games/arcade/scores.ts:36) only includes entries accepted by current `isRun`; the shared validator at [src/games/arcade/score-contract.ts:34-39](/Users/ncteisen/git/website/src/games/arcade/score-contract.ts:34) rejects old scoring versions. Queue trimming at `scores.ts:97-98` and sync at `:112-120` operate only on that filtered view.
- After a scoring-version change, old stored entries are silently ignored instead of removed or explicitly migrated. The advertised 50-run cap excludes them. This scenario is directly relevant to the existing Skis/Rolls v1→v2 upgrade.
- Local fixture seeded 50 valid v1 Skis entries, then recorded 50 v2 runs: 100 queue keys remained. Successful nickname registration/sync submitted the 50 current runs but retained all 50 obsolete entries while reporting “Saved as Current.” These do not turn into public scores; they become unreachable local-storage debris and accumulate across future upgrades. The initial 50 old entries would normally be small, so this is a correctness/lifecycle gap rather than a claim of immediate quota exhaustion.
- Fixture: `/Users/ncteisen/git/website/docs/audits/2026-10-22/repros/arcade-client-storage.mjs`.
- Recommended fix: Parse stored-envelope structure separately from current-version eligibility. Explicitly remove retired or corrupt entries, bound all retained queue records, and optionally surface a one-time explanation when obsolete queued scores cannot be posted. Do not relabel an old score as the current rules version.
- Validation: Load a storage map containing old/current/malformed entries; confirm pruning, bounded key count, current runs still submit, and retired scores never enter a new-version leaderboard.

### A5 — P2/P3: A rename silently reverts when localStorage is readable but cannot be written

- References: [src/games/arcade/scores.ts:23-33](/Users/ncteisen/git/website/src/games/arcade/scores.ts:23), `:74-85`, and `:104-110`.
- `storePlayer` sets the new in-memory nickname, but if `setItem` throws (quota/full storage), `sync()` immediately calls `getPlayer()`, which rereads the older persisted object and overwrites that new in-memory value. The advertised session-only fallback therefore fails for an existing identity when reads still work.
- Local fixture: establish nickname “Before”, then make only `setItem` throw and call `setNickname('After')`. Return value is `{persistent:false}`, but `getPlayer().nickname` remains “Before”, the API receives “Before”, and the message is “Saved as Before.” Existing storage-denial tests cover all reads/writes unavailable, so they miss this partial-failure mode.
- Fixture: `/Users/ncteisen/git/website/docs/audits/2026-10-22/repros/arcade-client-storage.mjs`.
- Recommended fix: Track an unsaved session override or a revision/dirty marker and prefer it until storage is writable/synchronized. Surface a storage-specific message while retaining the user's intended nickname for the active tab.
- Validation: Writable-to-read-only transition, quota errors, rename during in-flight sync, and cross-tab nickname changes; ensure a genuine later external change can still be reconciled.

## Improvement opportunities / decisions, not confirmed incidents

1. **Ship a small prebuilt Flappy atlas.** [src/games/flappy-sarah/Sprite.ts:2,10-11,24-31](/Users/ncteisen/git/website/src/games/flappy-sarah/Sprite.ts:2) loads a 1536×1024 PNG (754,318 bytes) to sample a 681×416 crop down to 26×16 logical pixels, then builds four 40×40 frames at runtime. The existing build emits the unchanged 754,318-byte asset. [src/components/arcade/GamePreview.astro:37-42](/Users/ncteisen/git/website/src/components/arcade/GamePreview.astro:37) also loads the original in the arcade menu. Pre-render the approved atlas/preview at the required sizes and preserve the original as source art. This reduces transfer/decode time on a phone without changing appearance. Compare screenshots and cold-load transfer size; the >700 KB current transfer is measured, not an estimated new payload.
2. **Add score-service observability and retention decisions.** [workers/arcade/index.ts:111-114](/Users/ncteisen/git/website/workers/arcade/index.ts:111) converts all unexpected failures to generic 503 without application logging. `runs` retains every completed run indefinitely even though weekly queries need 168 hours and all-time bests have a separate table. Consider bounded aggregate error/latency/rate-limit visibility and D1-size monitoring, then document a retention/idempotency policy before adding pruning. Keep tokens/nicknames/raw payloads out of logs. No production outage or quota problem was established.
3. **Make identity clearing explicit.** In the local fixture, clearing storage while the page stays open leaves `getPlayer()` returning its in-memory identity (`scores.ts:23-28`). Full browser reload does start fresh. Treat this as a UX/privacy semantics decision: an explicit “forget this player/stop posting” action should clear memory and retry state, not merely storage. Do not imply browser storage deletion always erases an active page's JS memory.
4. **Extend reduced-motion behavior to collection effects.** Sarah Jumps and Flappy already use `prefers-reduced-motion`; collection `Renderer.ts` has no equivalent. Consider suppressing nonessential sparkles/stretch/rotation while preserving gameplay-critical motion. Manual reduced-motion and keyboard/screen-reader checks are still useful; no physical-device or assistive-technology acceptance test was run here.
5. **Automate browser lifecycle checks alongside the strong simulations.** Current checks comprehensively exercise DOM-free worlds and mocked inputs, but actual modal focus, bfcache, mobile viewport rotation, rendering readiness, quota transitions, and two-tab storage deserve a small browser smoke suite. Root is documenting the current missing CI wiring centrally.

## Validation evidence and strengths

- `npm run test:arcade` passed. Raw output: `/Users/ncteisen/git/website/docs/audits/2026-10-22/arcade-checks.log`.
  - Sarah Jumps: 100 seeded courses across viewport heights 595/772/950; 150 simulated minutes; 13,885 landings; at most 15 platforms; refresh rates 30/60/90/120/144 Hz.
  - Flappy Sarah: 100 seeded courses across the same heights; 150 simulated minutes; 6,300 cleared pipes; at most 4 pipes; same refresh-rate matrix.
  - Collection: 50 seeds/game, 60 seconds/run, all four games; input capture, drag/swipe/hold/release, cancellation, secondary touches, repeat, pause, cleanup.
  - Skis progression: 51 courses ×180 seconds with drag and keyboard controls; maximum speed 420.
  - Rolls endurance: 50 seeds ×180 seconds, 1,026 boosts, multiplier 5 reached; 47/50 full-throttle pilots lost (expected), with star-chain/reset, one-time collection, launches, gates, crumbling floors, braking, and bounded-effects checks passing.
- `npm run test:scores` passed TypeScript checks plus isolated Worker/D1 and client checks. Output reported identity, validation, retries, rankings, periods, moderation, CORS, body limits/throttling; opt-in, identity persistence, offline queue, lost-response retry, and total storage denial. The first sandboxed attempt failed to bind localhost/write default Wrangler logs; rerunning with `WRANGLER_LOG_PATH=/tmp/website-audit-wrangler.log` and localhost permission passed. This was an environment restriction, not a repository test failure.
- The server uses parameterized SQL, hashed browser tokens, immutable run UUIDs, duplicate/conflict verification, bounded streamed request bodies, current-version filtering, proper moderation filtering, and both network/player rate limits. Leaderboard names use textContent rather than HTML insertion. API errors do not expose internals.
- Worlds are independent of DOM/rendering, seedable, fixed-step, bounded in live object counts, and have careful pause/background cleanup. Existing tests substantiate these strengths.
- No live Worker, production D1, physical iPhone, screen reader, or rendered browser UI was exercised by this sub-audit. Root is performing the separate production-build/browser/codebase checks. Findings above rely on current source plus local deterministic reproductions, not prior release memories.

## Reproduction commands

Run from `/Users/ncteisen/git/website`:

```sh
node /Users/ncteisen/git/website/docs/audits/2026-10-22/repros/arcade-stacks.mjs
node /Users/ncteisen/git/website/docs/audits/2026-10-22/repros/controller-cross-tab.mjs
node /Users/ncteisen/git/website/docs/audits/2026-10-22/repros/arcade-client-storage.mjs
WRANGLER_LOG_PATH=/tmp/website-audit-worker-repro.log node /Users/ncteisen/git/website/docs/audits/2026-10-22/repros/arcade-worker-quota.mjs
```

The scripts resolve this repository’s installed esbuild/Wrangler runtimes and must be run from the repository root. They are standalone audit fixtures, not additions to the normal test suites. Worker tests create and dispose isolated local storage.
