# Scope: CareerCraft AI

An open source autonomous career agent that helps job seekers tailor resumes for applicant tracking systems, generate targeted outreach, and prepare for interviews using their own AI provider keys.

**Build approach:** Tracer Bullet (vertical slices through every layer, proving the whole pipe early).
**Workflow:** Beta (after develop, check verify then test). The project default level of rigor. /architect is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (e.g. · GA) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use /develop and skip /architect. You decide when a feature is done._

## At a glance

| #   | Feature                                    | Phase      | Status  |
| --- | ------------------------------------------ | ---------- | ------- |
| 1   | Stack & architecture                       | Foundation | done    |
| 2   | Coding standards & tooling                 | Foundation | done    |
| 3   | Data model                                 | Foundation | done    |
| 4   | Design system & bilingual UI foundation    | Foundation | done    |
| 5   | AI provider configuration (BYOK)           | Foundation | done    |
| 6   | Core resume tailoring thread               | Slice 1    | done    |
| 7   | Resume parsing and ingestion               | Slice 2    | done    |
| 8   | ATS resume engine and PDF export           | Slice 3    | done    |
| 9   | Career outreach and interview prep         | Slice 4    | done    |
| 10  | Job application kanban tracker             | Slice 5    | done    |
| 11  | Public showcase and landing page           | Slice 6    | done    |
| 12  | Account access and session controls        | Slice 7    | done    |
| 13  | Workspace shell and navigation             | Slice 7    | done    |
| 14  | Landing refinement and palette unification | Slice 7    | done    |
| 15  | Candidate profile and photo management     | Slice 8    | done    |
| 16  | Base resume health audit and improvements  | Slice 8    | done    |
| 17  | Streamlined tailor studio and outreach     | Slice 8    | planned |
| 18  | Dedicated career prep and STAR hub         | Slice 8    | planned |

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

### 6. Core resume tailoring thread · done

spec [0005](../specs/0005-core-resume-tailoring-thread/index.md) · code in src/
The walking skeleton slice. A user signs in, saves an AI key, inputs a job description and basic experience, and watches a tailored summary stream live in English or Arabic.
**Done when:** the full pipeline (auth, database, AI streaming, and bilingual UI) runs end to end with real data.

- [x] Design it (spec): `/architect core resume tailoring thread`
- [x] Build it: `/develop core resume tailoring thread`
  - [x] Credentials authentication and demo user seed (AC-1)
  - [x] Candidate profile management and sample data actions (AC-3, AC-10)
  - [x] Tailoring prompt engine and AI streaming route handler (AC-4, AC-5, AC-6, AC-7, AC-8)
  - [x] Bilingual studio page and live streaming components (AC-2, AC-9, AC-10)
  - [x] End to end verification and full test pass (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10)
- [x] Verify it: `/check verify core resume tailoring thread`
- [x] Test it: `/test core resume tailoring thread`

## Slice 2: Resume parsing and ingestion

### 7. Resume parsing and ingestion · done

spec [0006](../specs/0006-resume-parsing-and-ingestion/index.md) · code in src/components/resume/
Upload PDF and Word files in English or Arabic, extract structured candidate data, and present an interactive review screen.
**Done when:** uploaded documents are converted into structured records, and users can review or correct fields before saving their master profile.

- [x] Design it (spec): `/architect resume parsing and ingestion`
- [x] Build it: `/develop resume parsing and ingestion`
  - [x] Database schema migration for parsing lifecycle and error tracking (AC-5, AC-6)
  - [x] In memory text extraction service for PDF and DOCX with magic bytes validation and empty text detection (AC-1, AC-2)
  - [x] Server Actions for AI structured extraction, retry handling, and atomic profile commit with merge strategies (AC-1, AC-3, AC-5, AC-6, AC-7)
  - [x] Bilingual upload dropzone and interactive review screen with section level controls and inline editing (AC-1, AC-2, AC-4)
- [x] Verify it: `/check verify resume parsing and ingestion`
- [x] Test it: `/test resume parsing and ingestion`

## Slice 3: ATS resume engine and PDF export

### 8. ATS resume engine and PDF export · done

spec [0007](../specs/0007-ats-resume-engine-pdf-export/index.md) · code in src/lib/ats/, src/lib/pdf/, src/components/ats/
Analyze job descriptions for skill gaps, tailor experience bullets using the Google XYZ formula without hallucination, and export a clean single column searchable PDF.
**Done when:** users see match scores and missing skills, review tailored bullet points, and download an ATS compliant PDF in either language.

- [x] Design it (spec): `/architect ATS resume engine and PDF export`
- [x] Build it: `/develop ATS resume engine and PDF export`
  - [x] Database schema migration for atsBreakdown and lastExportedAt with Zod schemas (AC-1, AC-4)
  - [x] Deterministic ATS scoring engine and prompt engine for Google XYZ bullet optimization (AC-1, AC-2, AC-4)
  - [x] Server Actions for scoring, single bullet rewrite, and missing skill management (AC-3, AC-4, AC-8)
  - [x] Bilingual vector PDF export engine with React PDF and Arabic text shaping (AC-5, AC-6, AC-7)
  - [x] Interactive ATS workbench studio components and streaming PDF route handler (AC-3, AC-5, AC-8)
- [x] Verify it: `/check verify ATS resume engine and PDF export`
- [x] Test it: `/test ATS resume engine and PDF export`

## Slice 4: Career outreach and interview prep

### 9. Career outreach and interview prep · done

spec [0008](../specs/0008-career-outreach-and-interview-prep/index.md)
Generate customized LinkedIn connection notes, InMail messages, and an interview preparation cheat sheet with STAR questions based on real user projects.
**Done when:** users can copy tailored outreach messages and review targeted interview questions with STAR answers in both languages.

- [x] Design it (spec): `/architect career outreach and interview prep`
- [x] Build it: `/develop career outreach and interview prep`
  - [x] Zod schemas, TypeScript types, and AI prompt templates for outreach and STAR interview answers (AC-1, AC-2, AC-3, AC-4)
  - [x] Server Actions for generation, saving, and single item regeneration with character and error safeguards (AC-1, AC-2, AC-3, AC-4, AC-5)
  - [x] Interactive outreach cards and interview prep workbench with live character counters, print styles, and studio tab integration (AC-1, AC-2, AC-3, AC-4, AC-5)
  - [x] Comprehensive bilingual unit and integration test suite with dictionary localization (AC-1, AC-2, AC-3, AC-4, AC-5)
        code in `src/components/outreach/`, `src/components/interview-prep/`, `src/app/actions/outreach-actions.ts`, `src/app/actions/interview-prep-actions.ts`
- [x] Verify it: `/check verify career outreach and interview prep`
- [x] Test it: `/test career outreach and interview prep`

## Slice 5: Job application kanban tracker

### 10. Job application kanban tracker · done

spec [0009](../specs/0009-job-application-kanban-tracker/index.md) · code in src/components/tracker/, src/app/[lang]/tracker/, src/app/actions/application-actions.ts
A kanban board tracking application stages from saved to offer, connecting each card to its specific tailored resume version and follow up message templates.
**Done when:** users can move application cards across stages, inspect the tailored resume attached to each company, and copy follow up messages.

- [x] Design it (spec): `/architect job application kanban tracker`
- [x] Build it: `/develop job application kanban tracker`
  - [x] Prisma schema migration and application Server Actions with fractional indexing (AC-3, AC-5)
  - [x] Bilingual kanban layout and accessible drag and drop integration with optimistic updates (AC-1, AC-2, AC-4)
  - [x] Interactive application cards, quick actions, and slide over details drawer (AC-6, AC-7)
  - [x] Search and filter toolbar, follow up staleness indicators, and empty states (AC-8, AC-9)
  - [x] Quick add application modal and Studio integration action (AC-10)
- [x] Verify it: `/check verify job application kanban tracker`
- [x] Test it: `/test job application kanban tracker`

## Slice 6: Public showcase and landing page

### 11. Public showcase and landing page · done

spec [0010](../specs/0010-public-showcase-and-landing-page/index.md) · code in src/components/showcase/, src/app/[lang]/page.tsx
A public landing page showcasing the open source application, architecture highlights, GitHub repository links, SEO metadata, and product analytics.
**Done when:** visitors and recruiters can explore product features, access the GitHub repository, and activation events are tracked.

- [x] Design it (spec): `/architect public showcase and landing page`
- [x] Build it: `/develop public showcase and landing page`
  - [x] Prisma schema migration and telemetry route handler with in memory rate limiting (AC-7, AC-8, AC-9)
  - [x] Interactive ATS benchmark showcase component and bilingual preset dataset (AC-3)
  - [x] Architecture blueprint card, developer quickstart, and feature breakdown sections (AC-4, AC-5, AC-6)
  - [x] Public showcase page assembly and bilingual responsive layout (AC-1, AC-2)
  - [x] Dynamic Open Graph image generation and JSON LD software application metadata (AC-10)
- [x] Verify it: `/check verify public showcase and landing page`
- [x] Test it: `/test public showcase and landing page`

### 12. Account access and session controls · done

spec [0011](../specs/0011-account-access-and-workspace-shell/index.md) · code in src/components/auth/, src/app/[lang]/login/, src/app/[lang]/signup/, src/auth.ts
Dedicated sign in and signup pages with email, password, and optional OAuth, safe callback redirects, and a working sign out.
**Done when:** a visitor can create an account, sign in, return to the page they meant to open, and sign out from anywhere.

- [x] Design it (spec): `/architect account access and session controls`
- [x] Build it: `/develop account access and session controls`
  - [x] Callback sanitizer with tests, conditional OAuth providers, and the auth route handler (AC-3, AC-4)
  - [x] Signup, OAuth start, and sign out server actions (AC-2, AC-7)
  - [x] Bilingual login and signup pages with inline errors and a demo shortcut (AC-1, AC-2, AC-5)
- [x] Verify it: `/check verify account access and session controls`
- [x] Test it: `/test account access and session controls`

### 13. Workspace shell and navigation · done

spec [0011](../specs/0011-account-access-and-workspace-shell/index.md) · code in src/components/workspace/, src/lib/auth/require-session.ts
One shared header and account menu for every signed in page, plus page level guards for the workspace routes.
**Done when:** every workspace surface shares the same navigation, shows who is signed in, and a signed out visitor is routed to login with a return path.

- [x] Design it (spec): `/architect workspace shell and navigation`
- [x] Build it: `/develop workspace shell and navigation`
  - [x] Page level `requireSession` guard on tailor, resumes, tracker, and providers (AC-6)
  - [x] Shared header, workspace links, mobile menu, and account menu with sign out (AC-7, AC-9)
  - [x] Session aware landing navigation with sign in and open workspace (AC-8)
- [x] Verify it: `/check verify workspace shell and navigation`
- [x] Test it: `/test workspace shell and navigation`

### 14. Landing refinement and palette unification · done

spec [0012](../specs/0012-palette-unification-and-landing-refinement/index.md) · code in src/app/globals.css, src/components/landing/
Promote the landing paper and green palette to the root tokens and simplify the landing page into a calm, one idea per section read.
**Done when:** the workspace and landing share one palette, the landing page no longer reads as text heavy, and every surface is verified in both locales and themes.

- [x] Design it (spec): `/architect landing refinement and palette unification`
- [x] Build it: `/develop landing refinement and palette unification`
  - [x] Root palette promotion and `.landing-shell` override removal (AC-1, AC-2)
  - [x] Compact capability grid and single line foundation links (AC-4)
  - [x] Accordion walkthrough for reduced motion and small screens (AC-5)
  - [x] Tighter section rhythm across orientation, comparison, closing action, and trust (AC-6)
  - [x] `design.md` rewritten for Bosla, auth, and workspace surfaces (AC-3)
- [x] Verify it: `/check verify landing refinement and palette unification`
- [x] Test it: `/test landing refinement and palette unification`

## Slice 8: Workspace refinement and modular career tools

### 15. Candidate profile and photo management · done

spec [0013](../specs/0013-candidate-profile-and-photo-management/index.md) · code in src/app/[lang]/profile/
A dedicated profile hub at /profile for candidate identity, avatar upload with client crop and storage to User.image, contact details, headline, summary, and work experiences decoupled from the tailoring studio.
**Done when:** you can manage your master profile and avatar in one dedicated space, and other workspace surfaces read from this profile automatically.

- [x] Design it (spec): `/architect candidate profile and photo management`
- [x] Build it: `/develop candidate profile and photo management`
  - [x] Tracer bullet foundation and identity slice (AC-1, AC-4, AC-6)
  - [x] Avatar crop modal and client WebP compression (AC-2, AC-3)
  - [x] Structured experiences, education, skills, and projects (AC-5)
  - [x] Bilingual switching and downstream sync (AC-6, AC-7)
  - [x] Workspace integration and test suite (AC-1, AC-8)
- [x] Verify it: `/check verify candidate profile and photo management`
- [x] Test it: `/test candidate profile and photo management`

### 16. Base resume health audit and improvements · done

spec [0014](../specs/0014-base-resume-health-audit/index.md) · code in src/app/[lang]/resume/, src/app/[lang]/profile/, src/components/health/, src/lib/health/, and src/app/actions/resume-health.ts
Audit base resume and profile hygiene in /resume and /profile across action verbs, Google XYZ metrics, and ATS completeness, with interactive preview cards where accepted suggestions morph smoothly and dismissed suggestions fall away.
**Done when:** you see an instant CV health score out of 100 on upload or edit, can preview AI suggestions before accepting, and see score updates with animations on accept or discard.

- [x] Design it (spec): `/architect base resume health audit and improvements`
- [x] Build it: `/develop base resume health audit and improvements`
  - [x] Schema, shared text helpers, and scoring rules with tests (AC-2, AC-10)
  - [x] Audit read, gauge, empty state, and last known score (AC-1, AC-2, AC-12)
  - [x] Issue cards, accept, undo, dismiss, restore, and conflicts (AC-3, AC-4, AC-5, AC-8)
  - [x] AI rewrite, stale handling, grounding guard, rate limit, profile card, language switch, and telemetry (AC-1, AC-6, AC-7, AC-9, AC-12)
  - [x] Bilingual, accessibility, responsive polish, full test suite, and build (AC-10, AC-11)
- [x] Verify it: `/check verify base resume health audit and improvements`
- [x] Test it: `/test base resume health audit and improvements`

### 17. Streamlined tailor studio and outreach · planned · needs a decision

Refactor /tailor to focus strictly on job input, live streaming, job specific ATS match scoring, vector PDF export, and a collapsible outreach accordion, with direct handoffs to the tracker and career prep.
**Done when:** the tailor studio loads without inline profile editing clutter, handles missing profiles with a friendly prompt, shows job specific match scoring and PDF export cleanly, and offers one click handoff to career prep and tracker.

- [ ] Design it (spec): `/architect streamlined tailor studio and outreach`

### 18. Dedicated career prep and STAR hub · planned · needs a decision

A standalone interview preparation page at /career-prep with a job selector dropdown, deep linking from tailored resumes, STAR question and answer breakdowns, copy actions, and printable cheat sheets.
**Done when:** you can pick any past tailored application or follow a deep link from tailoring to practice job specific STAR interview questions in a dedicated focus view.

- [ ] Design it (spec): `/architect dedicated career prep and STAR hub`

## Deferred

Out of scope for the current build pass, kept so the plan stays honest.

- **Interactive AI voice mock interviews**: real time voice practice sessions · needs a decision
- **Browser extension**: direct job posting capture from job boards · needs a decision
- **Automated job application bots**: auto apply scripts for job platforms · needs a decision
- **Team workspace sharing**: mentor and peer review sharing · needs a decision
- **Resume health score history and trends**: past audit snapshots and a score chart · from spec 0014

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
