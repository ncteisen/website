# Next Read

`/projects/next-read` is a static Astro page. This Worker uses the OpenAI Responses API to choose from an editorial catalog and write a specific, spoiler-free explanation for each choice. The current model is `gpt-5.4` with low reasoning effort, configurable in Wrangler. No model-generated title/author is trusted: responses contain only catalog IDs, and are validated again on the server and client.

## Product behavior

- Three phrases yield a match, a different angle, and a wildcard. Each request shuffles the catalog; the model prioritizes the combined mood and explicit constraints.
- Read/loved and read/disliked reactions inform future requests. A skip excludes that book without implying a broader preference. Reacting immediately requests one replacement while keeping the other two picks.
- Saved books, up to 100 reactions, and 60 recent recommendations stay in localStorage. A blocked store falls back to the current tab. Reset taste notes preserves saved books.
- Sharing explicitly encodes only the three phrases and current results in a validated URL fragment. Opening it makes no AI request and does not import someone else's reactions. The static page has a generic social preview; the downloadable reading list includes the specific books and recommendation notes. Text from the model or URL is always rendered with `textContent`.
- This is an intentionally bounded first-edition catalog, not open-ended book search. Results are plain bibliographic entries with short recommendation notes and reservations. Open Library links search for the title and author.
- The interface uses restrained type, rules, and a single accent color. No simulated book jackets, decorative illustrations, marketing sections, generated mood names, or animated loading messages. Model instructions favor specific observations and candid reservations over promotional or whimsical prose.

## Privacy and cost controls

The API key exists only as the Worker secret `OPENAI_API_KEY`. Never use a `PUBLIC_` environment variable for it. OpenAI receives phrases, bounded reactions, and the catalog; the request sets `store: false`. The app does not log prompts or save reading profiles on the server. Do not interpret `store: false` as a guarantee of zero provider retention.

An atomic D1 counter caps **all model attempts at 250/day UTC**, including failures. Each network gets 25/day, plus an approximate Cloudflare rate limit of 6/minute. The D1 limit works across locations; CORS and per-location limits alone are not spending protection. Network keys are daily SHA-256 hashes, not raw IPs; old buckets are pruned on requests after two days. These are pseudonymous usage counters, not strong anonymization. The fixed catalog, body limits, and 2,000-output-token limit (including reasoning) bound request size. No automatic provider retries. Authentication is intentionally absent for this public prototype; the daily global cap bounds abuse but also means abuse can exhaust the public allowance.

## Local setup

Put an authorized key into ignored `workers/next-read/.dev.vars` (`OPENAI_API_KEY=...`).

```sh
npx wrangler d1 migrations apply DB --local --config workers/next-read/wrangler.jsonc
npm run dev:next-read
PUBLIC_NEXT_READ_API_URL=http://localhost:8788 npm run dev -- --host 127.0.0.1
```

For a production-build preview against the local backend, build with the same public API URL and run `npm run preview -- --host 127.0.0.1 --port 4321`.

```sh
npm run test:next-read
npm run check:types
npm run build
```

The API tests use an isolated real D1 runtime and a stubbed model, never production calls. They cover malformed and oversized inputs, safe sharing, exclusions, replacements, upstream errors, origin rejection and concurrent quota reservations.

## Deployment

```sh
npx wrangler secret put OPENAI_API_KEY --config workers/next-read/wrangler.jsonc
npm run deploy:next-read
```

Deploying the Worker is separate from publishing Astro through GitHub Pages. The frontend defaults to `https://next-read.astro-test.workers.dev`. `/health` returns configuration readiness and catalog size, not proof of provider availability. A real recommendation from the site verifies that path.

API references: [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [Cloudflare rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).
