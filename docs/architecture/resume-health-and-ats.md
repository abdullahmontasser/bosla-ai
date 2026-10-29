# Resume Health Audit and ATS Scoring Architecture

This document describes the algorithms, rules engine, and interactive lifecycles powering CareerCraft AI base resume health audits and ATS match scoring.

## Base Resume Health Audit

The base resume health audit evaluates a candidate master profile to ensure baseline quality, ATS parseability, and bullet point impact before tailoring against specific job descriptions.

### Scoring Dimensions and Weights

The audit computes an overall score from 0 to 100 derived from four weighted categories:

1. **Impact and Metrics (30%)**: Measures the presence of quantified business outcomes, percentages, user counts, dollar figures, latency reductions, and scale indicators within experience bullets.
2. **Action Verbs (20%)**: Checks whether bullet points begin with strong, active verbs (such as _architected_, _engineered_, _spearheaded_, _shipped_, or Arabic equivalents like _صمم_, _طوّر_, _قاد_, _أطلق_) rather than passive phrasing.
3. **ATS Completeness (25%)**: Confirms essential fields are populated, including headline, summary, email, phone, location, at least one education record, at least two skills, and valid start and end dates.
4. **Content Depth (25%)**: Evaluates summary length, number of experience entries, bullet point count per role, and total profile fullness to avoid sparse submissions.

### Score Bands

- **Needs Work (0 to 49)**: Red badge. Indicates critical structural deficiencies or missing mandatory contact and experience information.
- **Good Start (50 to 74)**: Amber badge. Basic structure exists, but bullets lack quantified metrics or use weak verbs.
- **Strong (75 to 89)**: Blue badge. Solid profile ready for most applications, with minor refinement opportunities.
- **Exceptional (90 to 100)**: Emerald badge. Outstanding impact, quantified bullets, and comprehensive completeness.

### Deterministic Rule Engine

All scoring runs deterministically on the server inside `src/lib/health/rules.ts`.

Key architectural benefits of deterministic rules:

- **Zero Latency**: Scores compute instantaneously during page load or profile save without waiting on AI roundtrips.
- **Cost Free**: No model tokens are consumed to calculate or update scores.
- **Predictable**: Identical profile inputs yield identical scores every time.

## Issue Generation and Categorization

When the rules engine detects an issue, it generates a structured `HealthIssue` record containing:

- Unique issue code (for example `MISSING_METRICS_EXPERIENCE`, `WEAK_ACTION_VERB`)
- Target section (`experience`, `education`, `skills`, `identity`, `summary`)
- Target ID (referencing the specific experience bullet or profile field)
- Severity level (`high`, `medium`, `low`)
- Human readable title and explanation
- Concrete suggested replacement or action

## Interactive Lifecycle and Undo Transactions

Candidates interact with health suggestions directly on `/[lang]/resume` and `/[lang]/profile`:

```
           [ Candidate Master Profile ]
                         │
                         ▼
             [ Rules Engine Evaluates ]
                         │
                         ▼
             [ Issues Grouped & Shown ]
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
  [ Accept Fix ]   [ AI Rewrite ]   [ Dismiss Issue ]
        │                │                │
        ▼                ▼                ▼
[ Profile Updated ] [ Preview ]    [ Score Adjusted ]
        │                │                │
        ▼                ▼                ▼
[ 10s Undo Window ]  [ Accept ]     [ Restore Option ]
```

### 1. One Click Accept

Accepting a suggestion immediately updates the master profile in PostgreSQL via Server Action `acceptHealthIssueAction()`. The affected issue disappears from the list, and category subscores and overall score update dynamically.

### 2. 10 Second Undo Window

Accidental clicks are mitigated through a temporary undo snackbar. Candidates have 10 seconds to reverse the change. If clicked, `undoHealthIssueAction()` restores the previous text or state, returning the score to its earlier value.

### 3. Dismiss and Restore

Candidates may dismiss issues that do not apply to their industry. Dismissed issues are tracked in `ResumeHealthIssueAction`. Dismissing removes the penalty from the category subscore, allowing candidates to reach high hygiene levels on their own terms. Candidates can restore dismissed issues at any time.

## Profile Language Change Reactivity

Because candidates may maintain both English and Arabic profiles, the health audit updates reactively whenever the candidate toggles language:

- The profile switcher writes the active profile language to cookie `careercraft_profile_lang` and appends `?profileLang=ar` to the URL.
- The client dispatches a custom browser event `profile-language-changed`.
- `HealthProfileCardClient` on `/profile` and `ResumeHealthPanel` on `/resume` listen to this event and reload the health score for the selected language without requiring a full page refresh.

## ATS Match Scoring Engine

While base resume health audits evaluate standalone resume hygiene, the ATS match engine in `src/lib/ats/scoring.ts` evaluates candidate compatibility against a specific target job posting:

- **Keyword Match (50%)**: Extracts technical and domain skills from the job description and computes semantic overlap against the candidate profile.
- **Experience Relevance (30%)**: Matches candidate job titles, industry domain terms, and years of experience against posting requirements.
- **Formatting Compliance (20%)**: Checks for clean single column layout suitability, contact info parseability, and standard section naming conventions.
