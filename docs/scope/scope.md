# Scope: CareerCraft AI

An open source autonomous career agent that helps job seekers tailor resumes for applicant tracking systems, generate targeted outreach, and prepare for interviews using their own AI provider keys.

**Build approach:** Tracer Bullet (vertical slices through every layer, proving the whole pipe early).
**Workflow:** Beta (after develop, check verify then test). The project default level of rigor. /architect is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (e.g. · GA) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use /develop and skip /architect. You decide when a feature is done._

## At a glance

| #   | Feature                                 | Phase      | Status  |
| --- | --------------------------------------- | ---------- | ------- |
| 1   | Stack & architecture                    | Foundation | done    |
| 2   | Coding standards & tooling              | Foundation | done    |
| 3   | Data model                              | Foundation | done    |
| 4   | Design system & bilingual UI foundation | Foundation | done    |
| 5   | AI provider configuration (BYOK)        | Foundation | done    |
| 6   | Core resume tailoring thread            | Slice 1    | planned |
| 7   | Resume parsing and ingestion            | Slice 2    | planned |
| 8   | ATS resume engine and PDF export        | Slice 3    | planned |
| 9   | Career outreach and interview prep      | Slice 4    | planned |
| 10  | Job application kanban tracker          | Slice 5    | planned |
| 11  | Public showcase and landing page        | Slice 6    | planned |

## Foundations

### 1. Stack & architecture · done

spec [0001](../specs/0001-stack-and-architecture/index.md) · code in src/
Decide the framework, backend runtime, database, and scaffold a runnable project so every later slice builds on real structure.
**Done when:** the stack is recorded in a spec, and the empty scaffold boots locally and passes build.

- [x] Decide the stack (spec): `/architect stack & architecture`
- [x] Scaffold from the decision: `/develop stack & architecture`
- [x] Verify it: `/check verify stack & architecture`
- [x] Test it: `/test stack & architecture`

### 2. Coding standards & tooling · done

Capture conventions, then install lint, format, and git hygiene tools from the real scaffolded project.
**Done when:** root `AGENTS.md` reflects the real stack, and lint, format, and pre commit enforcement run clean.

- [x] Capture conventions and tooling choices: `/audit`
- [x] Install the tooling: `/develop tooling`
- [x] Check it runs clean: `/test`

### 3. Data model · done

spec [0002](../specs/0002-data-model/index.md) · code in src/lib/db/
Core entities for user accounts, master profiles, resumes, job descriptions, tailored versions, applications, and provider settings.
**Done when:** schemas, relationships, and migrations support all planned slices without breaking database updates.

- [x] Design it (spec): `/architect data model`
- [x] Build it: `/develop data model`
  - [x] Complete Prisma schema and initial PostgreSQL migration (AC-1, AC-8)
  - [x] Symmetric encryption helpers and provider settings validation (AC-2)
  - [x] Zod payload validation and user scoped repository functions (AC-3, AC-4, AC-5, AC-6, AC-7)
  - [x] Bilingual seed data and relational cascade test suite (AC-3, AC-7, AC-8)
- [x] Verify it: `/check verify data model`
- [x] Test it: `/test data model`

### 4. Design system & bilingual UI foundation · done

spec [0003](../specs/0003-design-system-and-bilingual-ui/index.md) · code in src/components/ui/
Design tokens, right to left and left to right layout primitives, dark and light themes, typography for Arabic and English, and accessible base components.
**Done when:** base components render cleanly in both language directions, with smooth theme switching and responsive layout.

- [x] Design it (spec): `/architect design system & bilingual UI foundation`
- [x] Build it: `/develop design system & bilingual UI foundation`
  - [x] Install foundation runtime and test harness dependencies (AC-2, AC-4, AC-7, AC-10)
  - [x] Design tokens, semantic color scale, and custom dark variant in globals.css (AC-4, AC-5)
  - [x] Typography and font variables pairing Geist Sans and IBM Plex Sans Arabic (AC-3)
  - [x] Subpath routing, locale middleware, and typed dictionary loader with fallback (AC-1, AC-8)
  - [x] Layout hierarchy migration, DirectionProvider, and accessible base component library (AC-2, AC-6, AC-7, AC-9)
- [x] Verify it: `/check verify design system & bilingual UI foundation`
- [x] Test it: `/test design system & bilingual UI foundation`

### 5. AI provider configuration (BYOK) · done

spec [0004](../specs/0004-ai-provider-configuration/index.md) · code in src/components/provider-settings/
User settings to configure API keys for OpenAI, Anthropic, Gemini, Groq, or local Ollama, with key validation and model selection.
**Done when:** users can enter, test, and save provider keys securely, and switch active models with clear feedback.

- [x] Design it (spec): `/architect AI provider configuration (BYOK)`
- [x] Build it: `/develop AI provider configuration (BYOK)`
  - [x] Install auth and AI SDK runtime dependencies and configure SSRF and model filters (AC-2, AC-3, AC-8)
  - [x] Server Actions for key validation, safe encryption, active provider transactions, and card configuration loader (AC-2, AC-4, AC-5, AC-6, AC-7, AC-8)
  - [x] Bilingual settings page and interactive ProviderCard component island with masked key hints (AC-1, AC-3, AC-7, AC-10)
  - [x] Exportable ProviderSwitcher component and comprehensive unit and component test suites (AC-1, AC-2, AC-5, AC-7, AC-8, AC-9, AC-10)
- [x] Verify it: `/check verify AI provider configuration (BYOK)`
- [x] Test it: `/test AI provider configuration (BYOK)`

## Slice 1: Core resume tailoring thread

### 6. Core resume tailoring thread · needs a decision

The walking skeleton slice. A user signs in, saves an AI key, inputs a job description and basic experience, and watches a tailored summary stream live in English or Arabic.
**Done when:** the full pipeline (auth, database, AI streaming, and bilingual UI) runs end to end with real data.

- [ ] Design it (spec): `/architect core resume tailoring thread`

## Slice 2: Resume parsing and ingestion

### 7. Resume parsing and ingestion · needs a decision

Upload PDF and Word files in English or Arabic, extract structured candidate data, and present an interactive review screen.
**Done when:** uploaded documents are converted into structured records, and users can review or correct fields before saving their master profile.

- [ ] Design it (spec): `/architect resume parsing and ingestion`

## Slice 3: ATS resume engine and PDF export

### 8. ATS resume engine and PDF export · needs a decision

Analyze job descriptions for skill gaps, tailor experience bullets using the Google XYZ formula without hallucination, and export a clean single column searchable PDF.
**Done when:** users see match scores and missing skills, review tailored bullet points, and download an ATS compliant PDF in either language.

- [ ] Design it (spec): `/architect ATS resume engine and PDF export`

## Slice 4: Career outreach and interview prep

### 9. Career outreach and interview prep · needs a decision

Generate customized LinkedIn connection notes, InMail messages, and an interview preparation cheat sheet with STAR questions based on real user projects.
**Done when:** users can copy tailored outreach messages and review targeted interview questions with STAR answers in both languages.

- [ ] Design it (spec): `/architect career outreach and interview prep`

## Slice 5: Job application kanban tracker

### 10. Job application kanban tracker · needs a decision

A kanban board tracking application stages from saved to offer, connecting each card to its specific tailored resume version and follow up message templates.
**Done when:** users can move application cards across stages, inspect the tailored resume attached to each company, and copy follow up messages.

- [ ] Design it (spec): `/architect job application kanban tracker`

## Slice 6: Public showcase and landing page

### 11. Public showcase and landing page · needs a decision

A public landing page showcasing the open source application, architecture highlights, GitHub repository links, SEO metadata, and product analytics.
**Done when:** visitors and recruiters can explore product features, access the GitHub repository, and activation events are tracked.

- [ ] Design it (spec): `/architect public showcase and landing page`

## Deferred

Out of scope for the current build pass, kept so the plan stays honest.

- **Interactive AI voice mock interviews**: real time voice practice sessions · needs a decision
- **Browser extension**: direct job posting capture from job boards · needs a decision
- **Automated job application bots**: auto apply scripts for job platforms · needs a decision
- **Team workspace sharing**: mentor and peer review sharing · needs a decision

## Legend

**The decision box.** Every feature carries exactly one, the sub task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally, `Decide the stack (spec)` on Stack & architecture), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it:

| State                        | Set by                                                                                 | The feature shows                                                                                                                                                                                                                          |
| ---------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `planned` · needs a decision | `/scope`                                                                               | one box: `Design it (spec): /architect <feature>`                                                                                                                                                                                          |
| `in-progress` (designed)     | **`/architect` at spec capture**                                                       | `Design it` ticked; spec linked; `Build it: /develop <feature>` + **2 to 5 milestones**; the tier closing boxes (`Verify it` Alpha+, `Test it` Beta+, `Review it` + `Document it` GA); any surfaced follow up enrolled                     |
| `in-progress` (building)     | `/develop`                                                                             | milestone sub boxes tick one by one; code pointer filled                                                                                                                                                                                   |
| `in-progress` (verified)     | `/check verify`                                                                        | `Build it` + milestones ticked; `Verify it` ticked                                                                                                                                                                                         |
| `done`                       | **you, when you decide it is** (any skill sets it when you say so); `/sync` reconciles | boxes you ran ticked, skipped ones marked skipped; the tier last stage (`Prototype` → after `/develop`; `Alpha` → after `/check verify`; `Beta`/`GA` → after `/test`) is the suggested point to call it done; `/sync` captures conventions |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first; otherwise straight to `/develop` (or `/audit` for standards & tooling). The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre workflow) and `dropped` (de scoped, kept for history).
- **Approach tag** beside a heading (e.g. `· Facade`) overrides the project default for that feature; no tag = inherits it.
- **Workflow tier tag** beside a heading (e.g. `· GA`, `· Prototype`) sets that one feature rigor above or below the project default; no tag inherits the default. It decides the feature check boxes and each skill next suggestion.
- **Workflow** (header line) is the project default, what runs after `/develop`: **Prototype** = nothing (trust develop own build time self check); **Alpha** = `/check verify`; **Beta** = `/check verify` then `/test`; **GA** = adds a fresh model `/check review` then `/document`. A feature built on an unratified decision (an `Assumed` spec) stays flagged, but that never blocks `done`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
