# Audit reproduction fixtures

These preserve the original audit reproductions. For maintained post-fix assertions, run `npm run test:site`, `npm run test:projects`, `npm run test:arcade`, `npm run test:scores`, and the Python test suite. See [fix status](/Users/ncteisen/git/website/docs/audits/2026-10-22/fixes.md).

These reproduce the October 22 findings against the reviewed source. They are expected to demonstrate current bugs; they do not fix application code or replace the normal test suites. Run from `/Users/ncteisen/git/website` with its installed dependencies.

```sh
node docs/audits/2026-10-22/repros/arcade-stacks.mjs
node docs/audits/2026-10-22/repros/controller-cross-tab.mjs
node docs/audits/2026-10-22/repros/arcade-client-storage.mjs
node docs/audits/2026-10-22/repros/map-failure.mjs
WRANGLER_LOG_PATH=/tmp/website-audit-worker-repro.log node docs/audits/2026-10-22/repros/arcade-worker-quota.mjs
```

Expected observations before fixes:

| Fixture | Result |
| --- | --- |
| Stacks | 42 perfect drops reach width 400; after a two-second wait the next block is entirely offscreen |
| Cross-tab controllers | A stored best of 100 is overwritten by a stale controller saving 20 |
| Client storage | Readable-but-unwritable storage reverts a nickname; 50 retired plus 50 current runs occupy 100 keys; 50 obsolete keys remain after sync |
| Missing map library | Map initialization throws before career/statistics handlers are registered |
| Worker quota | Rejected wrong-secret writes consume the victim ID's bucket; a subsequent valid write receives 429 |

All identities, network addresses, map data, and requests in these fixtures are synthetic. Client network calls are mocked. The Worker harness starts an isolated local runtime and applies migrations only there; `https://scores.example` is routed through that local harness. It does not call the deployed Worker or production D1. Localhost binding must be permitted for that one fixture. Its output contains status counts, not bearer credentials.

The cross-tab fixture uses actual game controllers with rendering/input/audio stubbed. The Stacks fixture supplies legal inputs to the real world engine. The client fixture includes direct private-state inspection as audit evidence. After implementation, promote focused regression cases into the existing maintained suites and update these historical results only with an explicit note.
