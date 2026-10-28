# Next Read

`/projects/next-read` is a static Astro page backed by a Cloudflare Worker. New requests use `/recommend-v2`: GPT-5.4 mini proposes a shortlist, Open Library verifies the identities and supplies descriptive evidence, and GPT-5.4 selects supported matches. Discovery is no longer restricted to the original 94 books. It is still a bounded shortlist per request, not an exhaustive search of every book in Open Library.

## Recommendation flow

1. Interpret all three phrases, separating literal requirements (setting, topic, form, length, exclusions) from softer preferences. Propose up to eight title/author pairs, with feedback and recent exclusions. A random variation value encourages different starting shortlists.
2. Look up the candidates in small batches through Open Library Search. Require matching title **and** author; allow a matching translated edition title. Reject a returned work with a different author or an unrelated title. Fetch the work record and require consistent work/author identifiers. Titles, authors, cover IDs, dates and page estimates come from the catalog, never the model.
3. Compare the record's description, subjects and approximate length to every requirement. The reviewer must provide verbatim catalog evidence for each supported/partial match. The server rejects invented excerpts, contradicted requirements, unknown requirements, partial hard requirements, insufficient phrase coverage, duplicate books/authors, exclusions, and page counts exceeding the requested limit.
4. Return up to three recommendations. If fewer survive, say so; if none survive, ask the reader to adjust a phrase. Do not fill empty slots with weaker books. A replacement returns one book and preserves the others.

This improves grounding, not certainty: Open Library is community maintained, records can be incomplete or mistaken, and interpreting mood remains subjective. Page counts are medians across editions. "Something short" defaults to at most 250 pages, "very short" to 150; explicit limits override those defaults. Missing content warnings cannot establish the absence of sensitive material. The model is instructed to leave such unverified constraints unsatisfied.

## Interface and compatibility

- The quiet reading-list design includes small real edition covers, loaded directly from Open Library's Covers API by numeric cover ID. Failed or blank covers disappear without breaking the entry. Each book links to its canonical work page.
- Waiting shows a small page-turn animation and a random sourced literary excerpt. Reduced motion disables the animation. No artificial minimum waiting time.
- Likes/dislikes inform subsequent discovery. A skip only excludes a book. Exclusions check work ID and title/author to catch duplicate records and preserve legacy reactions.
- Saved books, up to 100 reactions, and 60 recent recommendations stay in localStorage, along with bounded book metadata. Existing v1 storage is retained and migrated on write. Blocked storage falls back to the current tab.
- Version 2 shared fragments carry the book metadata and exact recommendation notes, not preferences or saved books. Parsing validates identifiers, numeric cover IDs and text bounds, and rendering uses `textContent`. Source/image URLs are built from validated IDs. Shared text is untrusted; it is not a fresh catalog verification.
- Version 1 shared links and saved books still render using the old catalog. `/recommend` remains as the legacy endpoint for already-open/cached v1 clients; the current frontend always calls `/recommend-v2`. Legacy shared books remain coverless until replaced by a new verified recommendation.
- Downloaded reading-list images contain text only, avoiding cross-origin canvas issues. The share link includes covers.

## Privacy, caching and limits

`OPENAI_API_KEY` is a Worker secret, never a `PUBLIC_` variable. OpenAI receives bounded phrases, book feedback, exclusions and catalog evidence with `store: false`; this is not a guarantee of zero provider retention. Open Library receives title/author lookups, and the reader's browser requests cover images. Neither provider receives a saved account profile from this app.

D1 stores public lookup responses (one day for searches, seven days for work records), plus short-lived usage counters. Search-cache keys contain candidate titles/authors, not reader phrases or identities. Expired rows are pruned on new requests. The app logs only allowlisted coarse provider error codes, never prompts, model bodies, credentials or reading profiles.

A shared D1 gate spaces public catalog requests by at least 1.05 seconds across Worker locations; concurrent requests may wait briefly or fail when the queue fills. There is no IP rotation, scraping, bulk harvesting or automatic retry. Requests identify the application by its public URL. The rate matches the default unidentified allowance of one request per second; contact details would be needed before using Open Library's higher allowance.

The existing global allowance remains **250 model-call units/day UTC**. Expanded requests atomically reserve **two units** before either model call, even if they later fail or finish early. Each network gets 25 requests/day plus an approximate limit of six/minute. This bounds token spending, although abuse can exhaust the public allowance. Network counter keys are daily SHA-256 hashes of IPs, not strong anonymization, and are pruned after two days.

Each expanded model call has a 3,200-output-token limit including reasoning. Candidate count, evidence sizes, response sizes and request bodies (128 KB) are bounded. The whole pipeline times out after 75 seconds; the browser waits up to 85 seconds. No automatic model retries. Sparse/unavailable records are omitted; catalog outages never fall back to unverified model output.

## Local setup and verification

Put the authorized key in ignored `workers/next-read/.dev.vars` as `OPENAI_API_KEY=...`.

```sh
npx wrangler d1 migrations apply DB --local --config workers/next-read/wrangler.jsonc
npm run dev:next-read
PUBLIC_NEXT_READ_API_URL=http://127.0.0.1:8788 npm run dev -- --host 127.0.0.1
npm run test:next-read
npm run check:types
npm run build
```

Tests use an isolated real D1 runtime and stubbed providers. They cover legacy compatibility, unknown/wrong-author titles, translated editions, cover metadata, evidence grounding, hard constraints, length, fewer results, sharing validation, exclusions, replacements, caching, errors, CORS and atomic budgets across concurrent two-stage calls.

## Deployment

```sh
npm run deploy:next-read
```

This applies D1 migrations before deploying the Worker. Publish Astro separately through GitHub Pages, after the expanded Worker is ready. `/health` reports configuration readiness and the catalog provider; only a successful real recommendation verifies the full path.

References: [Open Library Search](https://openlibrary.org/dev/docs/api/search), [Works API](https://openlibrary.org/dev/docs/api/books), [Covers](https://openlibrary.org/dev/docs/api/covers), [API usage and limits](https://openlibrary.org/developers/api), [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs).
