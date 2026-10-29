# 0014. Base resume health audit and improvements

**Date**: 2026-10-28
**Status**: Accepted

## Summary

This spec adds a base resume health audit to the workspace. It scores the candidate's master profile out of 100 across impact, action verbs, ATS completeness, and content depth, then shows every issue as a card that can be accepted, dismissed, or improved with AI. The score is computed from rules with no AI dependency, accepted fixes are written back to the master profile, and the same audit appears as a compact card on the profile page.

## Requirements

**User stories**:

- As a candidate, I want an instant health score for my base resume so that I know where to improve before applying.
- As a candidate, I want every issue grouped by category with a clear explanation so that I can decide what to fix first.
- As a candidate, I want to preview an AI rewrite before accepting it so that my voice and facts stay mine.
- As a candidate, I want accepted fixes saved to my master profile so that I do not retype them.
- As a candidate, I want to dismiss issues that do not apply to me and see the score reflect that decision.
- As a bilingual candidate, I want the audit in English or Arabic with the same scoring quality.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):

- **AC-1**: The audit renders as a full panel on `/[lang]/resume` above the ingestion flow and as a compact score card on `/[lang]/profile`, both behind the session guard, defaulting to the profile for the page language, with an in panel English and Arabic switch and a guided empty state that shows 0 and links to upload and profile when no profile exists.
- **AC-2**: A deterministic score from 0 to 100 is computed on the server from four weighted categories (impact and metrics 30, action verbs 20, ATS completeness 25, content depth 25) using the rules in this spec, with bands at 50, 75, and 90, and it renders without any AI call.
- **AC-3**: The audit produces one suggestion card per issue, anchored to the affected line or field across the four categories, grouped by category with counts and collapsible sections, each card showing a title, the original text or field, a plain rationale, and the target it will change.
- **AC-4**: Accepting a card with a proposed rewrite writes the text into the master profile (`Profile.summary` or the exact `WorkExperience.bullets` entry), marks the card accepted, recalculates the score, animates the gauge and the card, and offers an undo for 10 seconds.
- **AC-5**: Dismissing a card marks it dismissed, counts the issue as satisfied in the score so the score moves, displays an excluded count in the breakdown, keeps the decision tied to the text fingerprint, and offers a restore control.
- **AC-6**: AI rewrite is requested per card for experience bullets and the professional summary, uses the active provider from the user's saved provider settings, returns a validated proposed text and rationale, never applies anything automatically, and is marked as AI generated in the UI.
- **AC-7**: When no provider is configured or the AI call fails, the deterministic card and its advice remain with an inline error and a retry action. When the source text changes, a pending AI rewrite is marked stale, accept is disabled, and regenerate or dismiss are offered.
- **AC-8**: The audit and its cards persist per profile. Recalculation upserts one audit row, keeps accepted and dismissed cards, deletes pending cards that no longer apply, and the first decision wins when two tabs act on the same card, with a conflict notice in the losing tab.
- **AC-9**: Every read and action requires a signed in session and checks that the profile and suggestion belong to that user. AI rewrite requests are limited to 10 per user in a rolling 10 minutes, prompts include the full professional profile but exclude contact details, and server logs never contain resume text.
- **AC-10**: The audit renders correctly in English and Arabic, including right to left layout, Arabic action verbs, Arabic Indic digits, logical spacing, keyboard focus, a live region announcement when the score changes, a reduced motion fallback, and a single column layout down to 375px.
- **AC-11**: Unit tests cover the scoring rules, fingerprinting, and grounding guard. Server action tests cover accept, dismiss, restore, undo, ownership, stale text, conflicts, and rate limits. Component tests cover the gauge, groups, cards, empty state, and reduced motion. Typecheck, lint, format, and production build pass.
- **AC-12**: Editing the profile or committing a parsed resume produces a fresh deterministic score on the next read of `/resume` or `/profile`, while the last known score stays visible with a small updating state instead of a blank gauge.

## Decision

**Chosen option**: Option 1: Deterministic base resume audit with profile owned suggestion cards and on demand AI rewrites.

The audit is a rules engine over the existing master profile, backed by one audit row and one suggestion row per card, with AI used only to rewrite a selected bullet or summary after the candidate asks.

**Implementation skills**: `nextjs-app-router-patterns` (`wshobson/agents`, `.agents/skills/nextjs-app-router-patterns/`) · `prisma-client-api` (`prisma/skills`, `.agents/skills/prisma-client-api/`) · `ai-sdk` (`vercel/ai`, `.agents/skills/ai-sdk/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `arabic-rtl-best-practices` (`almubarmij/arabic-ai-skills`, `.agents/skills/arabic-rtl-best-practices/`) · `ux-writing-arabic` (`almubarmij/arabic-ai-skills`, `.agents/skills/ux-writing-arabic/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

### Data model sketch

Two new tables and three enums in `prisma/schema.prisma`. Existing `Profile` rows gain two relations and no new columns.

```prisma
enum HealthCategory {
  IMPACT_METRICS
  ACTION_VERBS
  ATS_COMPLETENESS
  CONTENT_DEPTH
}

enum HealthSuggestionStatus {
  PENDING
  ACCEPTED
  DISMISSED
}

enum HealthTargetKind {
  WORK_EXPERIENCE_BULLET
  WORK_EXPERIENCE
  PROFILE_SUMMARY
  PROFILE_CONTACT
  PROFILE_SKILLS
  PROFILE_EDUCATION
  PROFILE_GENERAL
}

model ResumeHealthAudit {
  id             String   @id @default(cuid())
  profileId      String   @unique @map("profile_id")
  overallScore   Int      @map("overall_score")
  breakdown      Json
  ruleSetVersion String   @map("rule_set_version") @db.VarChar(32)
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  profile     Profile                  @relation(fields: [profileId], references: [id], onDelete: Cascade)
  suggestions ResumeHealthSuggestion[]

  @@map("resume_health_audits")
}

model ResumeHealthSuggestion {
  id             String                   @id @default(cuid())
  profileId      String                   @map("profile_id")
  auditId        String?                  @map("audit_id")
  category       HealthCategory
  title          String                   @db.VarChar(200)
  rationale      String                   @db.Text
  targetKind     HealthTargetKind         @map("target_kind")
  targetId       String?                  @map("target_id")
  targetIndex    Int?                     @map("target_index")
  targetField    String?                  @map("target_field") @db.VarChar(64)
  originalText   String                   @map("original_text") @db.Text
  proposedText   String?                  @map("proposed_text") @db.Text
  status         HealthSuggestionStatus   @default(PENDING)
  isAiGenerated  Boolean                  @default(false) @map("is_ai_generated")
  isAiStale      Boolean                  @default(false) @map("is_ai_stale")
  fingerprint    String                   @db.VarChar(64)
  decidedAt      DateTime?                @map("decided_at")
  createdAt      DateTime                 @default(now()) @map("created_at")
  updatedAt      DateTime                 @updatedAt @map("updated_at")

  profile Profile             @relation(fields: [profileId], references: [id], onDelete: Cascade)
  audit   ResumeHealthAudit?  @relation(fields: [auditId], references: [id], onDelete: SetNull)

  @@unique([profileId, fingerprint])
  @@index([profileId, status])
  @@index([auditId])
  @@map("resume_health_suggestions")
}

model Profile {
  // existing fields unchanged
  healthAudit       ResumeHealthAudit?
  healthSuggestions ResumeHealthSuggestion[]
}
```

`targetField` narrows a contact level target (`email`, `phone`, `location`, `linkedinUrl`, `websiteUrl`, `githubUrl`) and is null for every other target kind. It is the one refinement added after the data model review, because the contact check needs to name the exact field it wants filled.

**Breakdown shape** (stored as JSON, versioned by `ruleSetVersion`):

```ts
interface HealthBreakdown {
  overallScore: number
  categories: {
    impactMetrics: {
      score: number
      weight: 30
      quantified: number
      total: number
      dismissed: number
    }
    actionVerbs: {
      score: number
      weight: 20
      strongStarts: number
      total: number
      dismissed: number
    }
    atsCompleteness: {
      score: number
      weight: 25
      checks: Array<{ key: string; satisfied: boolean; dismissed: boolean }>
    }
    contentDepth: {
      score: number
      weight: 25
      checks: Array<{ key: string; satisfied: boolean; dismissed: boolean }>
    }
  }
  excludedCount: number
  evaluatedAt: string
  ruleSetVersion: string
}
```

### Scoring rules

**Impact and metrics (30).** A bullet is quantified when it contains a concrete measure: a Western or Arabic Indic digit, a percent sign or percent word, a currency symbol or code, a scale word such as million or thousand, or a volume or time figure such as users, requests, hours, or days. The category score is `min(100, round((quantified / total) / 0.6 * 100))`, so 60 percent of bullets quantified earns 100. A profile with no bullets scores 0 in this category.

**Action verbs (20).** For each experience bullet the first word is compared with the shared English and Arabic action verb sets after case, punctuation, and diacritic normalization. The category score is `round(strongStarts / total * 100)`. When there are no bullets the category scores 0. The verb sets move from `src/lib/ats/scoring.ts` into `src/lib/text/action-verbs.ts` and both engines import them.

**ATS completeness (25).** Weighted checks inside the category:

| Check           | Weight | Satisfied when                                                                                                                                                    |
| --------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Contact block   | 30     | Email is valid, phone or location is present, and one link is present among LinkedIn, website, and GitHub                                                         |
| Summary present | 20     | `Profile.summary` is not empty                                                                                                                                    |
| Role block      | 25     | At least one role has company, title, start date, and at least one bullet                                                                                         |
| Skills          | 15     | At least five skills are recorded                                                                                                                                 |
| Education       | 10     | Every education row has institution, degree, and dates. When no education rows exist the check is not applicable and its weight is shared across the other checks |

**Content depth (25).** Four checks, each worth 25 inside the category:

1. Every role has at least two bullets, scored as the share of roles that do.
2. The average bullet length is at least 8 words.
3. No duplicate bullets across the profile, compared after lowercasing and removing punctuation.
4. The professional summary has at least 30 words.

**Overall.** `round(0.30 * impact + 0.20 * verbs + 0.25 * completeness + 0.25 * depth)`, clamped to 0 through 100. Bands: 0 through 49 needs work, 50 through 74 fair, 75 through 89 strong, 90 through 100 excellent.

**Dismissed issues.** A dismissed issue is scored as satisfied. The breakdown records the count in `dismissed` and `excludedCount`, and the UI labels the exclusion so the number stays honest. The same rule applies to every category.

### Issue generation

Each issue becomes one card for the exact line or field that failed. Two issues can target the same line in different categories. Titles and rationales are generated in the profile language at audit time and stored on the card, so the Arabic profile shows Arabic cards and the English profile shows English cards.

| Category     | Issue                                    | Target                                     | Has proposed text    |
| ------------ | ---------------------------------------- | ------------------------------------------ | -------------------- |
| Impact       | Bullet has no concrete measure           | `WORK_EXPERIENCE_BULLET`                   | No, AI can add one   |
| Action verbs | Bullet does not start with a strong verb | `WORK_EXPERIENCE_BULLET`                   | No, AI can rewrite   |
| Completeness | A contact field is missing or malformed  | `PROFILE_CONTACT` plus `targetField`       | No, links to profile |
| Completeness | Summary is empty                         | `PROFILE_SUMMARY`                          | No, links to profile |
| Completeness | No complete role block                   | `PROFILE_GENERAL`                          | No, links to profile |
| Completeness | Fewer than five skills                   | `PROFILE_SKILLS`                           | No, links to profile |
| Completeness | An education row is incomplete           | `PROFILE_EDUCATION` plus row id            | No, links to profile |
| Depth        | Role has fewer than two bullets          | `WORK_EXPERIENCE` plus row id              | No, links to profile |
| Depth        | Bullet is shorter than 8 words           | `WORK_EXPERIENCE_BULLET`                   | No, AI can expand    |
| Depth        | Duplicate bullet                         | `WORK_EXPERIENCE_BULLET` on the later copy | No, links to profile |
| Depth        | Summary is shorter than 30 words         | `PROFILE_SUMMARY`                          | No, AI can expand    |

A card without `proposedText` offers accept only when an AI rewrite supplies one. Otherwise it offers a link to the relevant profile section and a dismiss action.

### UI composition

- `/resume` renders `ResumeHealthPanel` above `ResumeIngestionContainer`. The panel header carries the title, the score band, and the English and Arabic switch. The page heading and subtitle change to cover health and ingestion in both languages.
- The switch changes the audit target and the card language, not the page locale or the surrounding workspace chrome.
- `HealthScoreGauge` shows the radial score and the four category bars. The score counts up or down with a CSS transition and respects reduced motion.
- `HealthCategorySection` is a collapsible group with a count and every card for that category. A quiet restore control sits in the group footer when dismissed cards exist.
- `HealthSuggestionCard` shows the title, original text, rationale, the stacked preview when a rewrite exists, and accept, dismiss, restore, undo, or ask AI actions as they apply.
- `/profile` renders `HealthProfileCard` above the profile hub. It shows the score, the band, the count of open issues, and a link to the resume audit.
- New components live in `src/components/health/` and reuse the existing `Card`, `Button`, and `Badge` primitives and the tokens in `design.md`.

### AI rewrite

- **Request**: `generateHealthRewriteAction(suggestionId)` accepts only a `PENDING` card in the current audit whose target is `WORK_EXPERIENCE_BULLET` or `PROFILE_SUMMARY`.
- **Prompt context**: the profile headline and summary, every role with company, title, dates, and bullets, the projects, the education entries, the skills list, the profile language, and the selected line with its issue title. Contact fields, URLs, and the user's email are excluded.
- **Model call**: AI SDK `generateObject` with a Zod schema for `proposedText` (1 to 600 characters) and `rationale` (1 to 300 characters). The active provider and model come from the user's saved settings. The call aborts after 30 seconds and returns `AI_FAILED`.
- **Grounding guard**: a proposed rewrite may keep or remove numbers from the original line, but it may not introduce a number that is absent from the original line or the professional profile context. Western and Arabic Indic digits are normalized before comparison. A rewrite that fails the guard is rejected with `UNGROUNDED_REWRITE` and nothing is saved.
- **Grounding instruction**: the prompt tells the model to use only facts present in the profile and never to invent employers, dates, tools, or results.
- **Result**: the proposed text is saved on the same pending card, the AI rationale replaces the rule rationale, `isAiGenerated` is true, and the score does not change until the candidate accepts.
- **Limit**: 10 requests per user in a rolling 10 minutes, checked with the existing in memory limiter keyed by a SHA 256 hash of the user id.

### State transitions

Audit:

`No audit` -> `Created on first read` -> `Updating` (recalculation in progress) -> `Fresh`.

Suggestion:

`PENDING` -> `PENDING with AI rewrite` -> `PENDING with stale AI rewrite` (source text changed) -> `PENDING with AI rewrite` (regenerate) or `DISMISSED`.

A stale rewrite cannot be accepted. From `PENDING with AI rewrite` the card can move to `ACCEPTED` or `DISMISSED`.

`ACCEPTED` -> `PENDING` through undo while the target still equals `proposedText`.

`DISMISSED` -> `PENDING` through restore.

Recalculation merges issues by fingerprint, keeps `ACCEPTED` and `DISMISSED` rows, and deletes `PENDING` rows that no longer match an issue.

Before that merge, every pending AI card in the current audit has its target text resolved. If the text changed, the card keeps its proposed text, updates `originalText` to the current text, recomputes its fingerprint, and sets `isAiStale` to true. The generated issue with the refreshed fingerprint merges into that stale card, and any duplicate generated card is deleted. If the changed text no longer triggers the issue, the stale card is deleted because there is nothing left to improve.

Status guards: accept requires `PENDING` with a current `proposedText` and `isAiStale` false. Dismiss requires `PENDING`. Restore requires `DISMISSED`. Undo requires `ACCEPTED`. Any other state returns `CONFLICT`.

### API surface

All mutations are Server Actions in `src/app/actions/resume-health.ts`. Reads happen in Server Components through helpers in `src/lib/health/queries.ts`, which load the profile with work experiences, education, skills, and projects in one query and upsert the audit when it is older than the profile or any related row, or when the stored `ruleSetVersion` differs from `HEALTH_RULE_SET_VERSION`.

| Action                          | Method      | Key inputs            | Key outputs                                                                                            | Auth                  | Key errors                                                                                                        |
| ------------------------------- | ----------- | --------------------- | ------------------------------------------------------------------------------------------------------ | --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `getResumeHealthForLanguage`    | server read | `userId`, `language`  | audit, category breakdown, cards for the current audit, excluded count, or null when no profile exists | session and ownership | none, a missing profile returns null                                                                              |
| `getResumeHealthForProfile`     | server read | `userId`, `profileId` | audit, category breakdown, cards for the current audit, excluded count                                 | session and ownership | `NOT_FOUND`                                                                                                       |
| `acceptHealthSuggestionAction`  | action      | `suggestionId`        | updated score, breakdown, card, `previousScore`                                                        | session and ownership | `UNAUTHORIZED`, `NOT_FOUND`, `CONFLICT`, `STALE`, `NO_PROPOSED_TEXT`                                              |
| `dismissHealthSuggestionAction` | action      | `suggestionId`        | updated score, breakdown, card                                                                         | session and ownership | `UNAUTHORIZED`, `NOT_FOUND`, `CONFLICT`                                                                           |
| `restoreHealthSuggestionAction` | action      | `suggestionId`        | updated score, breakdown, card                                                                         | session and ownership | `UNAUTHORIZED`, `NOT_FOUND`, `CONFLICT`                                                                           |
| `undoHealthSuggestionAction`    | action      | `suggestionId`        | updated score, breakdown, restored card                                                                | session and ownership | `UNAUTHORIZED`, `NOT_FOUND`, `CONFLICT` (target changed after accept)                                             |
| `generateHealthRewriteAction`   | action      | `suggestionId`        | proposed text, rationale, stale flag                                                                   | session and ownership | `UNAUTHORIZED`, `NOT_FOUND`, `RATE_LIMITED`, `NO_PROVIDER`, `AI_FAILED`, `UNGROUNDED_REWRITE`, `VALIDATION_ERROR` |

### Value sourcing

| Action     | Value produced or displayed        | Source                                                                                                                                                                                                                                                                                             |
| ---------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Audit read | Active profile                     | `session.user.id` plus the resolved audit language (`auditLang` query param when present, validated against the supported locales, else page locale); `getDefaultProfile` returns the profile or null, and the read never creates one. On `/profile` the page passes the profile it already loaded |
| Audit read | Overall and category scores        | Pure rules in `src/lib/health/rules.ts` over `Profile`, `WorkExperience`, `Education`, and `Skill`                                                                                                                                                                                                 |
| Audit read | Score band and label               | Constants in the rules module plus dictionary copy                                                                                                                                                                                                                                                 |
| Audit read | Cards and excluded count           | `ResumeHealthSuggestion` rows linked to the current audit                                                                                                                                                                                                                                          |
| Audit read | Open issue count                   | Count of `PENDING` cards linked to the current audit                                                                                                                                                                                                                                               |
| Accept     | Target line or field               | `targetKind`, `targetId`, `targetIndex`, and `targetField` on the card, validated against the owned profile                                                                                                                                                                                        |
| Accept     | Previous score                     | `audit.overallScore` read before recalculation                                                                                                                                                                                                                                                     |
| Accept     | New score                          | Recomputed from the profile after the write                                                                                                                                                                                                                                                        |
| Accept     | Undo window                        | `UNDO_WINDOW_MS` constant plus a client timer                                                                                                                                                                                                                                                      |
| Undo       | Text to restore                    | `originalText` on the card                                                                                                                                                                                                                                                                         |
| AI rewrite | Provider and model                 | Active `UserProviderSetting` through `getActiveProviderSettings`                                                                                                                                                                                                                                   |
| AI rewrite | Language and context               | `Profile.language` plus profile headline, summary, roles, projects, education, and skills                                                                                                                                                                                                          |
| AI rewrite | Grounding corpus                   | Original card text plus the same professional profile context, with contact fields removed                                                                                                                                                                                                         |
| Rate limit | Key                                | SHA 256 of the user id using the existing limiter salt                                                                                                                                                                                                                                             |
| Telemetry  | Event name, locale, path, metadata | Server actions for card decisions and AI requests; the existing `trackEvent` client helper for `health_audit_viewed` on panel mount; no resume text and no anonymous id                                                                                                                            |

### Key invariants

- One `ResumeHealthAudit` per profile, upserted in place.
- Every suggestion belongs to exactly one profile and points at most one current audit.
- `fingerprint` is a SHA 256 of category, target kind, target id, target index, target field, and the normalized original text.
- A card without `proposedText` cannot be accepted.
- Accept, undo, and stale detection compare the current target text with `originalText` or `proposedText` before writing.
- Recalculation never deletes `ACCEPTED` or `DISMISSED` cards. It deletes pending cards that no longer match an issue.
- The score is always recomputed from the profile. No code path increments it by hand.
- The read path recalculates when the audit is older than the profile or a related row, or when `ruleSetVersion` differs from the current constant.
- Two cards may target the same line in different categories. Accepting one recalculates and refreshes or removes the other, so no card points at stale text.
- An AI rewrite never introduces a number absent from the source line or the professional profile context, after digit normalization.
- A dismissed issue is scored as satisfied and is included in `excludedCount`.

### Security model

- Only the signed in owner can read or change an audit, card, or profile. Every action checks `profile.userId` and returns `NOT_FOUND` for another user's identifiers.
- Audit and suggestion rows are private. There is no public route and no share link.
- AI calls use the user's own provider key. Prompts include the full professional profile but exclude email, phone, location, and URLs.
- Server logs may contain identifiers, error codes, and timings. They never contain bullet text, summary text, or contact details.
- Telemetry is anonymous and carries event names and category counts only. Events are `health_audit_viewed`, `health_suggestion_accepted`, `health_suggestion_dismissed`, `health_suggestion_restored`, `health_suggestion_undone`, `health_rewrite_requested`, and `health_rewrite_failed`.
- The AI request limit is 10 per user in a rolling 10 minutes.

### Configuration required

No new environment variables. The feature reuses the active provider setting and these constants in `src/lib/health/constants.ts`:

- `HEALTH_RULE_SET_VERSION = '1'`
- Category weights 30, 20, 25, 25
- Score bands 50, 75, 90
- `AI_REWRITE_LIMIT = 10`, `AI_REWRITE_WINDOW_MS = 600000`
- `AI_REWRITE_TIMEOUT_MS = 30000`
- `UNDO_WINDOW_MS = 10000`

### Critical test scenarios

- Happy path: an empty profile shows 0 with the guided state, a filled profile shows a score and grouped cards, an AI rewrite is previewed, accepted, saved to the profile, the score moves, and undo restores the line, verifies **AC-1**, **AC-2**, **AC-4**, **AC-6**.
- Dismissal: dismissing a card raises the score, shows the excluded count, survives reload, and restore brings the card back, verifies **AC-5**, **AC-8**.
- AI failure: no provider and a provider timeout both keep the deterministic card with an inline error and retry, verifies **AC-7**.
- Stale rewrite: editing the source line marks a pending AI rewrite stale, disables accept, and allows regenerate, verifies **AC-7**.
- Conflict: two tabs accept the same card, the first wins, the second receives a conflict notice, verifies **AC-8**.
- Ownership: another user's suggestion id returns not found and changes nothing, verifies **AC-9**.
- Rate limit: the eleventh AI request in ten minutes returns a friendly limit message, verifies **AC-9**.
- Arabic: Arabic verbs and Arabic Indic digits score correctly, and the layout mirrors, verifies **AC-10**.
- Reduced motion: with reduced motion enabled the score updates without animation and every card stays reachable, verifies **AC-10**.
- Freshness: saving the profile or committing a parsed resume updates the score on the next read, verifies **AC-12**.

## Build plan

The project builds in Tracer Bullet slices. The first slice proves the whole pipe, from schema through rules, server read, and a live gauge, before any card action exists. Later slices thicken the same thread one behavior at a time.

1. [x] Create the Prisma migration for the two tables and three enums, add the `Profile` relations, move the action verb sets into `src/lib/text/action-verbs.ts`, add shared Arabic digit normalization, and build `src/lib/health/rules.ts` with unit tests, satisfies **AC-2**, **AC-10**.
2. [x] Build the audit upsert and read helper, render the panel on `/resume` with the radial gauge, category bars, bands, empty state, and last known score with an updating state, satisfies **AC-1**, **AC-2**, **AC-12**.
3. [x] Generate one card per affected line or field, persist them by fingerprint, and render the grouped collapsible list with titles, original text, and rationales, with no actions yet, satisfies **AC-3**, **AC-8**.
4. [x] Add the accept action for proposed rewrites, the profile write, recalculation, gauge and card morph, and the 10 second undo with its conflict guard, satisfies **AC-4**, **AC-8**.
5. [x] Add dismiss and restore, the excluded count in the breakdown, persisted decisions, and the conflict notice for a second tab, satisfies **AC-5**, **AC-8**.
6. [x] Add the AI rewrite action with provider resolution, the professional profile prompt, `generateObject` validation, the grounding guard, stale flags, error and retry states, and the 10 per 10 minute limit, satisfies **AC-6**, **AC-7**, **AC-9**.
7. [x] Add the compact score card on `/profile`, the in panel English and Arabic switch, and the anonymous `health_audit_viewed` telemetry on panel mount. Path revalidation needs no `revalidatePath` calls: every audit read recalculates when the profile is newer than the stored audit (AC-12), so a fresh read already yields a fresh score, satisfying **AC-1**, **AC-9**, **AC-12**.
8. [x] Finish bilingual and accessibility work: logical properties, right to left cards and gauge, Arabic card copy, keyboard focus, the score live region, reduced motion, and the single column layout down to 375px, satisfies **AC-10**.
9. [x] Write the remaining unit, server action, component, and page tests, then run typecheck, lint, format, the full test suite, and the production build, satisfies **AC-11**.

## Consequences

**Positive**:

- The core score is instant, deterministic, and available without an AI provider or a job description.
- Every fix is real. Accepted text lands in the master profile, so resume tailoring starts from a better base.
- The two surfaces share one audit, one score, and one set of cards.
- Dismissals are visible in the excluded count, so a rising score has a clear explanation.
- English and Arabic share one scoring vocabulary instead of drifting rule sets.

**Negative / tradeoffs**:

- A single score can oversimplify resume quality and create false precision. The four category bars and the rationale on every card are the mitigation, not a complete cure.
- Dismissing issues can inflate the score. The excluded count makes this transparent, but a candidate can still reach a high number by dismissing real problems.
- AI prompts now carry the full professional profile, which is more personal data per call than a single line. Contact details are excluded and the key belongs to the user, but the exposure is larger than a minimal prompt.
- Recalculating on read adds a write on the first read after an edit, and the in memory rate limit is per server instance, not global.
- A very long resume can produce many cards. Grouping and collapsing keeps the page usable, but the screen still carries every issue.
- Storing the score and breakdown is a cache of derived data. It is only safe because the read path recalculates whenever the profile or a related row is newer than the audit.

**Neutral**:

- `/resume` now carries two jobs, the audit and the ingestion flow. The audit sits above the upload control.
- The ATS engine keeps its job specific scoring. Only the action verb lists move to a shared module.
- New dictionary keys are needed in `src/lib/i18n/types.ts`, `src/dictionaries/en.json`, and `src/dictionaries/ar.json`.
- Two new tables add one migration, with no destructive change to existing tables.

## Follow-up

- [ ] Score history and trend charts are out of scope. Revisit them after the audit has enough real use to make a trend meaningful.
- [ ] Replace the in memory AI rate limit with a database backed limit if the app is deployed on more than one server instance.
- [ ] Add the new health components to `src/components/AGENTS.md` during the next `/sync` after the feature ships.
