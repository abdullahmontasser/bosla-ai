# 0014 Rationale: Base resume health audit and improvements

## Context

CareerCraft AI already scores a tailored resume against a specific job description in `src/lib/ats/scoring.ts`, and it already holds a structured master profile per language in `Profile`, `WorkExperience`, `Education`, `Skill`, and `Project`. What is missing is a judgment of the base resume on its own terms, before any job is chosen. Candidates upload a resume, the parser fills the profile, and the product then waits for a job description before it says anything useful about quality.

The forces that shape this decision:

- **No target job.** There is no job description to match against, so keyword overlap cannot carry the score. The audit must judge the resume itself.
- **Instant feedback.** The scope asks for a score on upload or edit. A round trip to a model provider cannot be the only way to get a number, and the product is Bring Your Own Key, so a call without a configured key must not break the feature.
- **The profile is the source of truth.** Fixes should not live in a parallel document. Accepted text must land in the same profile that tailoring and export already read.
- **Two surfaces, one truth.** The scope names `/resume` and `/profile`. They must show the same score and the same decisions.
- **Bilingual equality.** Arabic resumes need Arabic verbs, Arabic Indic digits, and mirrored layout. A shared vocabulary with the ATS engine is better than a second set of rules that drifts.
- **Small team, small surface.** Two tables and pure functions are supportable. A queue, a vector store, or a separate scoring service would be more machinery than the problem earns.

> ⚠️ Premise note: A single score out of 100 risks false precision. It can push a candidate toward keyword stuffing, invented metrics, or dismissing every uncomfortable issue until the number looks good. This spec mitigates the risk by showing the four category components, requiring a rationale on every card, grounding AI rewrites in existing text, and displaying the excluded count when issues are dismissed. The score is a guide for the candidate, not a prediction of hiring outcomes.

## Options considered

### Option 1: Deterministic audit with profile owned cards and on demand AI (chosen)

Rules compute the score and find every issue with no model call. Each issue becomes a card owned by the profile. AI is called only when the candidate asks to rewrite a selected bullet or summary. Accept writes into the master profile.

**Pros**:

- Instant, reproducible, and free to compute.
- Works with no provider key and degrades cleanly when a provider fails.
- Accepted fixes are real changes to the same profile that downstream features read.
- Dismissals and acceptances survive reloads and appear on both surfaces.

**Cons**:

- Two new tables and a lifecycle to maintain.
- Rules cannot judge nuance as well as a model, so some cards will be false positives.
- A stored score is derived data and needs a freshness rule.

### Option 2: AI first audit in one pass

One model call reads the whole profile, returns a score and a list of suggestions, and the result is shown as cards.

**Pros**:

- Richest feedback with the least rule writing.
- Can spot tone, seniority, and narrative problems that rules miss.

**Cons**:

- Slow, costs a call every time, and fails without a provider key.
- The score changes between runs, which makes accept and dismiss animation meaningless as progress.
- Suggestion identity is unstable, so dismissals are hard to persist.
- Sends the whole profile on every audit, a larger exposure than an on demand rewrite.

### Option 3: Client only audit with no persistence

The browser computes the score from profile data, shows cards, and keeps decisions in local storage.

**Pros**:

- No migration, no server action, and a very fast first paint.
- Easy to prototype and easy to remove.

**Cons**:

- `/profile` cannot show the score without loading the whole profile client side.
- Decisions are tied to one browser and disappear on another device.
- Server side ownership and AI calls still need a server path, so the simplicity is partial.
- Scoring rules would live in the client bundle, where they are easy to diverge from the ATS engine.

### Option 4: Extend the job specific ATS engine with a synthetic target

Reuse the existing job match engine by generating a target profile from the candidate's own headline and skills, then score the base resume against it.

**Pros**:

- One scoring code path for both features.
- No new scoring concepts.

**Cons**:

- A synthetic target is circular. The resume is scored against a description derived from itself, so the number says little.
- The existing weights are built for keyword match against a real job, not for resume hygiene.
- It would bend the meaning of the ATS engine and make both features harder to explain.

## Rationale

Option 1 wins because it matches the forces that actually constrain this feature. The score must be instant and must work with no provider key, which rules out an AI first design as the primary path. The profile is already the source of truth for tailoring and export, so writing accepted text back into it is the only version of "accept" that leaves the product in a better state. Persisting cards is what makes dismissal meaningful across two surfaces and across reloads, and the fingerprint is what keeps a decision attached to the text it was made about.

The engineer asked for every issue to be visible and for the AI to see the full professional profile. Both are honest choices. Every issue means the panel can be long, so the design pays for it with category groups, counts, and collapsible sections. Full profile context means each AI call carries more personal data, so the prompt excludes contact details and the key stays with the user.

The known weakness is the score itself. Dismissing an issue as satisfied can raise the number without changing the resume. The excluded count is the compromise: the scope asked for the score to move on discard, and transparency is the price of that behavior. If the number is later used for anything beyond guidance, this rule should be revisited.

Option 2 would be the right choice if the product had a platform funded model and no need for instant or reproducible scores. Option 3 is a reasonable prototype but cannot satisfy the profile surface or persistent decisions. Option 4 reuses code at the cost of meaning.

## Evidence: existing surfaces reused

- `prisma/schema.prisma`: `Profile`, `WorkExperience`, `Education`, `Skill`, `Project`, and `UserProviderSetting`.
- `src/lib/ats/scoring.ts`: English and Arabic action verb sets, normalization helpers, and the existing score band language that this feature keeps consistent.
- `src/lib/ai/provider-client.ts` and `src/lib/db/provider-settings.ts`: active provider resolution for the AI rewrite.
- `src/lib/telemetry/rate-limiter.ts`: the in memory limiter reused for the AI request cap.
- `src/lib/i18n/types.ts`, `src/dictionaries/en.json`, and `src/dictionaries/ar.json`: the bilingual copy path.
- `src/app/[lang]/resume/page.tsx`: the ingestion surface that gains the audit panel above it.
- `src/app/[lang]/profile/page.tsx` and `src/components/profile/ProfileHub.tsx`: the profile surface that gains the compact score card.
- `docs/specs/0007-ats-resume-engine-pdf-export/index.md`: the job specific score that this feature deliberately does not replace.
- `docs/specs/0013-candidate-profile-and-photo-management/index.md`: the master profile shape and the language per profile rule.
