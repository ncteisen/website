# Sarah Arcade scores

The static Astro site stays on GitHub Pages. A Cloudflare Worker and D1 database handle anonymous players, completed runs, and a top-20 leaderboard for each of the six games. The default API is `https://sarah-arcade-scores.astro-test.workers.dev`.

## Player behavior

- Choose a public nickname once. A random browser-held token identifies the player; only its SHA-256 hash is stored in D1. Nicknames are editable and need not be unique. A name alone cannot claim another player's scores.
- Joining posts recent completed runs, then subsequent runs post automatically at game over. Pause, page exit, and local high-score saves never create leaderboard entries. Historical local bests are not imported.
- Each run has an immutable UUID. Retrying a request, including after a lost response, cannot count it twice or change its score.
- Up to 50 pending runs are kept in browser storage. Failed requests retry with backoff and on reconnect/page load. With storage blocked, identity and pending runs last only for the open page; the UI explains this.
- Clearing browser storage or switching devices creates a new player. There is no login or account recovery.
- All-time rankings use each player's best in the current scoring version. “Last 7 days” uses server receipt times in the preceding 168 hours, including scores queued offline and received later. Equal scores share a displayed rank. Each board shows at most 20 players.
- This is a casual leaderboard. Validation, private player tokens, body limits, and per-player/network throttles prevent common abuse, but scores are client-reported, not replay-verified. CORS is not authentication.

## Local development

```sh
npm install
npx wrangler d1 migrations apply DB --local --config workers/arcade/wrangler.jsonc
npm run dev:scores
```

In another terminal:

```sh
PUBLIC_ARCADE_API_URL=http://localhost:8787 npm run dev -- --host 127.0.0.1
```

The API dev script allows only localhost/127.0.0.1 port 4321 origins. Local D1 data is isolated from production. For a production-build preview against local D1, build with the same `PUBLIC_ARCADE_API_URL` and run `npm run preview -- --host 127.0.0.1 --port 4321`.

## Validation

```sh
npm run test:scores
npm run test:arcade
npm run build
```

The score tests type-check both sides and use Wrangler's isolated local test harness with the real migration. They cover authentication/impersonation, duplicate and conflicting retries, score validation, game separation, weekly cutoffs, renames, moderation, CORS, body sizes, rate limits, anonymous opt-in, durable offline queuing, lost responses, and unavailable browser storage. They never touch production.

## Deployment

The database ID and public hostname are configuration, not credentials. Wrangler credentials stay outside this repository.

```sh
npx wrangler login
npm run deploy:scores
```

This applies pending remote migrations and deploys only the score Worker. The production origin allowlist is in `wrangler.jsonc`. No paid plan is required for this setup within Cloudflare's free allowances. The per-network rate limit is deliberately generous for shared Wi-Fi; Cloudflare's rate-limit bindings are per location, not a global hard cap.

Publishing the frontend is a separate GitHub Pages release. The default API URL is compiled from `src/games/arcade/scores.ts`; an explicit `PUBLIC_ARCADE_API_URL` overrides it for local/staging builds. Set it to an empty string to disable the connection. After a frontend release, verify nickname creation and a real completed run from `https://noaheisen.com`.

## Moderation and scoring changes

Use the Cloudflare D1 console to inspect the `players`, `runs`, and `bests` tables. Set `players.blocked = 1` for a confirmed abusive player to hide all of their scores and reject further submissions. Use the exact player ID, not a nickname, because names can repeat. Resetting that flag restores visibility. Do not expose token hashes in public APIs or screenshots.

If difficulty/scoring changes invalidate old comparisons, bump `SCORE_VERSION` in `src/games/arcade/score-contract.ts` and release the Worker and frontend together. Old runs remain stored but no longer appear in the current boards.
