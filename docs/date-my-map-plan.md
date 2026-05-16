# Date My Map — Project Page Plan

## Goal
Create a new project page under `src/pages/projects/` called **Date My Map** that helps users estimate when a printed map or globe was produced. The experience should use a guided sequence of questions, progressively narrowing a likely date range while also explaining *why* each clue matters through short historical context and optional “learn more” links.

## Product Concept
**Working URL:** `/projects/date-my-map`

**Core user flow:**
1. User lands on the page and sees a brief explanation of the tool.
2. User answers a series of multiple-choice questions about what they see on their map/globe.
3. After each answer:
   - Date range narrows.
   - Relevant historical event(s) are shown.
   - User can follow links to read deeper context.
4. User receives a final estimated date range plus rationale.
5. User can review an answer timeline and optionally restart.

## Why This Is Feasible
This is very feasible in the current repo because:
- Astro pages and project-specific JS patterns already exist (e.g., Sarah Jumps page structure).
- The interaction can be implemented with static data + client-side filtering, no backend required.
- Historical clues can be represented as structured JSON and rendered dynamically.
- The initial version can be scoped to a manageable set of high-signal geopolitical changes and expanded over time.

## MVP Scope (Phase 1)
Start with a tightly-scoped, high-value version:
- A single interactive questionnaire with ~10–20 canonical clues.
- Global/major-powers changes that are commonly visible on maps.
- A date-range engine that intersects constraints from selected answers.
- Explanatory “what changed and when” cards per answered clue.
- A final confidence summary (high / medium / low).

### Example clues for MVP
- Does the map show **USSR**?
- Is there a single country named **Germany**, or East/West Germany?
- Is **Yugoslavia** present?
- Is **Czechoslovakia** present?
- Is **South Sudan** shown?
- Is **Burma** labeled instead of Myanmar?
- Is **Siam** labeled instead of Thailand?
- Is **Persia** labeled instead of Iran?

## Information Architecture
### New page
- `src/pages/projects/date-my-map.astro`

### Suggested component/data split
- `src/components/projects/DateMyMapApp.astro` (wrapper/layout)
- `src/components/projects/date-my-map/QuestionCard.astro`
- `src/components/projects/date-my-map/ResultPanel.astro`
- `src/components/projects/date-my-map/EventDetail.astro`
- `src/data/date-my-map/questions.json`
- `src/data/date-my-map/events.json`

If preferred, Phase 1 can keep rendering logic mostly on the page file and split later.

## Data Model Proposal
Use declarative JSON so content updates don’t require code changes.

### `questions.json` (concept)
Each question:
- `id`
- `prompt`
- `description`
- `options[]`
  - `id`
  - `label`
  - `constraints[]` (date bounds and conditions)
  - `eventIds[]`

### `events.json` (concept)
Each event:
- `id`
- `title`
- `dateStart` / `dateEnd` (or single date)
- `summary`
- `regions`
- `sourceLinks[]` (primary and reputable secondary references)

## Date Inference Engine
A simple deterministic engine is enough for MVP:
1. Start with full range (e.g., 1600–present, or 1800–present for practicality).
2. For each answer, apply constraints:
   - `minYear`
   - `maxYear`
   - optional condition tags (e.g., “if colonial names visible”)
3. Intersect all constraints.
4. If intersection is empty, show conflict state:
   - “Your answers may reflect mixed editions, later annotations, or ambiguous labels.”
5. Compute confidence from:
   - number of answered questions,
   - specificity of constraints,
   - consistency (non-conflicting signals).

## UX Plan
### Page sections
- Hero intro and “How this works.”
- Questionnaire panel.
- “Why this matters” historical context panel (updates each step).
- Final range + explanation.
- Reset + share state (optional in MVP, nice for Phase 2).

### Interaction details
- Progressive disclosure (show one question at a time).
- Back button to revise previous answers.
- Optional “I’m not sure” path (skip without penalty).
- Keyboard accessible controls.
- Mobile-first layout with concise cards.

## Content & Source Strategy
To keep quality high:
- Prioritize sources such as Britannica, Library of Congress, CIA World Factbook historical pages, national archives, and major encyclopedias.
- Include 1–2 links per event in MVP.
- Add a lightweight content-review checklist before publishing changes.

## Implementation Steps
1. **Scaffold page** under `src/pages/projects/date-my-map.astro` with static placeholder.
2. **Create data files** for questions/events with 10–20 vetted clues.
3. **Build filtering logic** (client-side state + constraint intersection).
4. **Render context cards** tied to selected answers.
5. **Add result summary** with date window and confidence label.
6. **Polish UX** (back/reset, empty/conflict states, accessibility text).
7. **Integrate into site navigation/projects listing** if applicable.
8. **Validate build and preview**.

## Testing Plan
Because there is no dedicated frontend test suite, use:
- `npm run build` (must pass).
- `npm run preview` manual smoke test.
- Manual checks:
  - happy path for likely map examples,
  - conflict path where answers are inconsistent,
  - mobile viewport readability,
  - keyboard navigation and focus order.

Optional future enhancement:
- Add lightweight unit tests for the date-range intersection utility if/when test tooling is added.

## Risks and Mitigations
- **Ambiguous map labels:** Offer “Not sure” and explain ambiguity.
- **Historically contested transitions:** Provide date ranges and region notes rather than hard exact dates.
- **Source reliability drift:** Keep links centralized in `events.json` for easier audits.
- **Scope creep:** Start with high-signal 20 clues and iterate.

## Future Enhancements (Phase 2+)
- Region selector (world map vs. regional atlases).
- Visual label guide (image examples of old/new names).
- Confidence breakdown by clue.
- Saved/shareable result URL with encoded answers.
- “Compare two editions” mode.
- Optional AI-assisted OCR of labels from uploaded map photos (requires privacy and moderation planning).

## Rough Effort Estimate
- MVP content modeling + UI + logic: **1–3 focused days**.
- Expanded clue library and source QA: **additional 2–5 days**.

## Definition of Done (MVP)
- New project page is live and reachable.
- User can answer questions and receive a plausible date range.
- Each answered clue shows historical rationale and at least one reference link.
- Build passes and manual smoke test completed.
