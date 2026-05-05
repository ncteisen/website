# Hosting Options Beyond GitHub Pages

_Last updated: May 5, 2026. Pricing and limits change often; verify before choosing._

## Goals for this comparison
- Keep your current strengths: low cost + simple GitHub-based deploys.
- Add room for server-side compute (APIs, scheduled jobs, SSR, background processing).
- Support nightly workflows for scraping/fetching data and committing generated artifacts.

## Quick recommendation
If you want the **least migration risk** from GitHub Pages while adding server-side options:
1. **Cloudflare Pages + Workers** (best price/performance for hobby-to-medium projects).
2. **Netlify** (very approachable all-in-one workflow, but keep an eye on usage-based billing).
3. **Render** (great if you want a more traditional always-on server model).
4. **Vercel** (excellent DX, especially for SSR-heavy frontend apps, but costs can scale quickly).

---

## Option 1: Cloudflare Pages + Workers

### Cost (high level)
- **Free tier available** for Pages static hosting and limited Workers usage.
- **Paid baseline** typically starts around **$5/month** on Workers paid plan.
- Good fit when you want edge functions and globally distributed compute at low entry cost.

### Ease of use
- GitHub integration is straightforward.
- Your Astro site can remain mostly static while specific routes/jobs move to Workers.
- Slight learning curve around Cloudflare-specific primitives (KV, D1, Durable Objects, Cron Triggers).

### Migration plan (high-level)
1. Connect repo to Cloudflare Pages and deploy current Astro static output.
2. Add preview/production environments with environment variables.
3. Move one small server-side task into a Worker (e.g., an API endpoint for cached recommendations).
4. Add **Cron Triggers** for nightly scraping/fetching.
5. Persist fetched data in KV/R2/D1 (or keep committing JSON to repo, depending on preference).
6. Add alerting/logging for failed nightly jobs.

### Nightly workflow pattern
- Nightly cron executes Worker.
- Worker fetches external sources, transforms data, writes to storage.
- Site reads latest data at build time or runtime.
- Optional: Worker opens a GitHub commit/PR if you still want data versioned in git.

---

## Option 2: Netlify (Static + Functions + Scheduled Functions)

### Cost (high level)
- Free tier exists.
- Pricing has moved toward **credit/usage-based billing** for many workloads.
- Can be very easy for small sites; costs may become less predictable as function/network usage grows.

### Ease of use
- Very beginner-friendly UI and GitHub flow.
- Easy deploy previews, forms, functions, and env var management.
- Good “single dashboard” experience.

### Migration plan (high-level)
1. Connect repo to Netlify and confirm Astro build settings.
2. Validate static site parity with current GitHub Pages output.
3. Introduce Netlify Functions for server-side endpoints you may need.
4. Add Scheduled Functions (or external scheduler) for nightly data refresh.
5. Store data in Netlify Blobs/external DB/object storage or commit generated files back to repo.
6. Add usage alerts to avoid billing surprises.

### Nightly workflow pattern
- Scheduled Function runs nightly.
- Pulls source data, transforms it, saves to storage and/or commits artifacts.
- Optional rebuild trigger after data update.

---

## Option 3: Vercel (Frontend-first + Serverless/Edge)

### Cost (high level)
- Hobby/free plan is great for personal projects.
- Paid plans are commonly per-seat plus usage; function-heavy workloads can scale cost.
- Strong for SSR/ISR-heavy web apps.

### Ease of use
- Excellent developer experience and GitHub integration.
- Very smooth preview deployments.
- Best fit if you plan to use frameworks that lean into Vercel platform features.

### Migration plan (high-level)
1. Import repo into Vercel and configure Astro build output.
2. Confirm static deployment parity and preview workflow.
3. Add Serverless or Edge Functions only where needed.
4. Configure Vercel Cron for nightly ingestion tasks.
5. Choose persistence: Vercel storage offerings or external DB/object storage.
6. Add observability + budget monitoring early.

### Nightly workflow pattern
- Vercel Cron triggers ingestion function nightly.
- Function updates stored data and invalidates/rebuilds routes as needed.
- Optional GitHub commit if you want audited data snapshots in repo.

---

## Option 4: Render (Web Services + Cron Jobs)

### Cost (high level)
- Includes free options plus paid service tiers.
- More “traditional hosting” feel; often easier to reason about when you want persistent processes.
- Cron/background workers are first-class concepts.

### Ease of use
- Easier than raw cloud infra, but slightly more ops-oriented than purely static hosts.
- Good option if you expect to run Python jobs/services directly.

### Migration plan (high-level)
1. Deploy Astro as static site (or via web service if needed).
2. Create a cron service/job for nightly scraping scripts.
3. Move `scripts/social-data/orchestrate.py` workflow into Render cron runtime.
4. Store generated outputs in object storage/DB or push commits back to GitHub.
5. Add secrets management and health checks.

### Nightly workflow pattern
- Render cron runs Python workflow nightly.
- Data saved to persistent storage and optionally triggers rebuild/deploy.
- Good fit when Python dependency/runtime control is important.

---

## Optional baseline: Stay on GitHub Pages + add server-side elsewhere

You can keep GitHub Pages for static hosting and add server-side computation separately:
- GitHub Actions nightly workflow for scraping/fetching and committing artifacts.
- Small API deployed to Cloudflare Workers/Render/Fly.io only when needed.

This gives the **lowest immediate migration effort** and keeps costs close to current.

---

## Decision matrix (1 = weak, 5 = strong)

| Platform | Upfront Cost | Cost Predictability | Ease of Use | Server-side Flexibility | Nightly Jobs |
|---|---:|---:|---:|---:|---:|
| Cloudflare Pages + Workers | 5 | 4 | 4 | 5 | 5 |
| Netlify | 4 | 3 | 5 | 4 | 4 |
| Vercel | 4 | 3 | 5 | 4 | 4 |
| Render | 3 | 4 | 3 | 5 | 5 |
| GitHub Pages + external compute | 5 | 5 | 4 | 3 | 4 |

---

## Suggested phased path for you

### Phase 0 (now)
- Keep GitHub Pages.
- Formalize nightly data workflow in GitHub Actions (if not already).
- Separate data-fetch logic from build logic cleanly.

### Phase 1
- Pilot **Cloudflare Workers** (or Netlify Functions) for one small API endpoint.
- Keep frontend static to reduce risk.

### Phase 2
- Move nightly scrape/fetch into platform-native cron.
- Decide source of truth for generated data:
  - Git-tracked JSON artifacts, or
  - Runtime storage (KV/R2/DB) with optional snapshots.

### Phase 3
- If needed, migrate selected pages to SSR/edge rendering.
- Add monitoring, retry/backoff, and budget guards.

---

## What to validate before final choice
- True monthly cost at your expected request volume + data transfer.
- Cron/scheduler limits and timeouts.
- Function runtime limits for your scraping jobs.
- Secret management ergonomics.
- Vendor lock-in concerns and export path.
- CI/CD ergonomics with your existing GitHub workflow.

## Pricing references (official)
- Cloudflare Workers pricing docs: https://developers.cloudflare.com/workers/platform/pricing/
- Cloudflare plans page: https://workers.cloudflare.com/plans
- Netlify pricing: https://www.netlify.com/pricing/
- Netlify billing docs: https://docs.netlify.com/accounts-and-billing/billing
- Vercel pricing: https://vercel.com/pricing
- Render pricing: https://render.com/pricing/
