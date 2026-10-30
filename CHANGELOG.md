# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Streamlined resume tailoring studio at `/[lang]/tailor` decoupled from inline profile editing with candidate headline badge and email verification status chip (see spec 0015).
- Friendly missing profile alert banner with direct CTA to `/profile` and disabled tailoring generation when no master candidate profile exists (see spec 0015).
- Composite index migration on `TailoredResume` for `[userId, language, createdAt(sort: Desc)]` and query optimization eliminating unused interview prep payload from initial data (see spec 0015).
- Collapsible lazy loaded outreach accordion beneath ATS match metrics with on demand payload fetching via `getOutreachMessageAction` (see spec 0015).
- Unified sticky bottom action bar with optimistic one click save to application tracker and deep link handoff to interview prep practice (see spec 0015).
- Deterministic base resume health audit engine in `src/lib/health/` scoring resumes across impact metrics, action verbs, ATS completeness, and content depth with localized issue detection for English and Arabic (see spec 0014).
- Bilingual health audit surface at `/[lang]/resume` and summary card at `/[lang]/profile` displaying overall score, score band badge, category meters, and prioritized issue cards with severity levels (see spec 0014).
- Interactive issue resolution allowing one click accept with master profile updates and 10 second undo, dismiss and restore with score recalculation, and AI bullet rewriting with grounding verification against hallucinations (see spec 0014).
- Real time profile language switch synchronization across both `/resume` and `/profile` views via cookie persistence, URL search params, and reactive client dispatch events (see spec 0014).
- PostgreSQL schema extension and Prisma migration adding `ProfileHealthAudit` and `ResumeHealthIssueAction` models (see spec 0014).
- Dedicated candidate profile hub at `/[lang]/profile` allowing candidates to manage personal identity, headline, summary, and contact information decoupled from tailoring (see spec 0013).
- Client side avatar photo crop modal with interactive HTML5 Canvas circle mask, zoom slider, and WebP compression persisted to `User.image` (see spec 0013).
- Structured profile management cards for work experiences, education, skills, and projects with up and down drag reordering and REST endpoints under `/api/profile/` (see spec 0013).
- Dedicated authentication pages at `/[lang]/login` and `/[lang]/signup` supporting email, password, and Google OAuth with bilingual English and Arabic layout (see spec 0011).
- Production transactional email delivery engine via Resend supporting password reset tokens and email verification workflows (see spec 0011).
- Workspace shell featuring `WorkspaceHeader`, `WorkspaceNav`, mobile drawer, and session aware `AccountMenu` with avatar display and sign out (see spec 0011).
- Promoted warm paper and deep emerald green palette to root CSS design tokens, unifying workspace and landing page aesthetics (see spec 0012).
- Core application foundation bootstrapped with Next.js App Router, React 19, TypeScript strict mode, and Tailwind CSS (see spec 0001).
- Local containerized PostgreSQL 16 service configured via Docker Compose with persistent storage volume (see spec 0001).
- Prisma ORM data layer configuration targeting PostgreSQL with development client singleton pattern (see spec 0001).
- Automated unit testing pipeline configured with Vitest (see spec 0001).
- PostgreSQL schema and initial migration supporting Auth.js v5 accounts, bilingual candidate profiles, parsed resumes, job postings, tailored resume snapshots, and kanban applications (see spec 0002).
- Symmetric encryption helpers in `src/lib/crypto.ts` using AES 256 GCM to secure user AI provider API keys at rest (see spec 0002).
- Zod validation schemas in `src/lib/validations/` verifying provider settings, bilingual profiles, parsed resume payloads, and Google XYZ achievement bullets (see spec 0002).
- Tenant scoped repository functions in `src/lib/db/` enforcing user isolation and relational cascade rules (see spec 0002).
- Bilingual database seed script in `prisma/seed.ts` populating sample English and Arabic profiles, tailored snapshots, and kanban stages (see spec 0002).
- Subpath localization routing at `/[lang]` with English (LTR) and Arabic (RTL) support via Next.js App Router (see spec 0003).
- Locale negotiation middleware supporting `NEXT_LOCALE` cookie persistence, RFC 9110 quality factor parsing, and clean HTTP 307 redirects for unlocalized routes (see spec 0003).
- Google Fonts integration pairing Geist Sans for Latin scripts and IBM Plex Sans Arabic for Arabic typography with zero layout shift (see spec 0003).
- Accessible core UI foundation components (`Button`, `Input`, `Textarea`, compound `Card`, `Badge`, `Dialog`, compound `DropdownMenu`, `LanguageSwitcher`, `ThemeSwitcher`) built with Radix UI headless primitives and Tailwind CSS v4 semantic tokens (see spec 0003).
- Bidirectional layout primitives using logical CSS properties and `RtlIcon` helper for automatic directional chevron mirroring (see spec 0003).
- Flicker free dark and light theme switching via `next-themes` and custom Tailwind v4 dark variants (see spec 0003).
- Typed translation dictionary loader with recursive deep merge fallback to canonical English copy in `src/lib/i18n/get-dictionary.ts` (see spec 0003).
- Interactive visual component showcase and token gallery at `/[lang]/design-system` (see spec 0003).
- Localized 404 view at `src/app/[lang]/not-found.tsx` matching the design system (see spec 0003).
- AI provider configuration settings page at `/[lang]/settings/providers` with bilingual English and Arabic layout, loading provider cards through React Suspense and Partial Prerendering (see spec 0004).
- Interactive `ProviderCard` component island providing credential validation, model fetching, model selection, active provider toggles, and deletion (see spec 0004).
- Server Actions in `src/app/actions/provider-settings.ts` executing credential validation, safe AES 256 GCM key encryption, atomic active provider transactions, and corrupted key recovery (see spec 0004).
- Model filtering and recommendation fallbacks in `src/lib/ai/provider-models.ts` supporting OpenAI, Anthropic Claude, Google Gemini, Groq, and local Ollama (see spec 0004).
- Reusable inline `ProviderSwitcher` component for upcoming AI feature pages, displaying active models and enabling quick provider switching (see spec 0004).
- Auth.js v5 authentication configuration in `src/auth.ts` with Prisma adapter and JWT user session forwarding (see spec 0004).
- Credentials authentication support in Auth.js v5 with bcrypt password hashing and seeded demo credentials for `demo@careercraft.ai` (see spec 0005).
- Candidate experience profile management and bilingual sample data loader for Senior Full Stack Engineers in English and Arabic (see spec 0005).
- Anti hallucination tailoring prompt engine formatting streaming outputs with structured section delimiters (see spec 0005).
- Real time AI streaming endpoint at `POST /api/tailor` that decrypts user provider keys in server memory and streams tailored content using Vercel AI SDK (see spec 0005).
- Automatic persistence of tailored resume snapshots and job postings to PostgreSQL with generation status tracking upon stream completion (see spec 0005).
- Bilingual resume tailoring studio workbench at `/[lang]/tailor` featuring candidate experience editing, job description input with character validation, inline provider switching, and live streaming output preview (see spec 0005).
- Interactive sign in card with one click demo access and localized English and Arabic layout guidance (see spec 0005).
- In memory resume text extraction engine in `src/lib/parsing/extract.ts` supporting PDF (via `unpdf`) and DOCX (via `mammoth`) with magic bytes validation (`%PDF` and `PK\x03\x04`), 10MB file size limit, 10 page limit for PDFs, 50,000 character limit for Word documents, and scanned image empty text detection (see spec 0006).
- AI structured resume parser in `src/lib/ai/prompts/resume-parser.ts` using Vercel AI SDK `generateObject` with 60 second timeout and bilingual Arabic and English schema extraction against the active AI provider (see spec 0006).
- Bilingual resume review workbench at `/[lang]/resume` and `/[lang]/resume/parse` wrapped with Radix `DirectionProvider` (`dir="rtl"` for Arabic, `dir="ltr"` for English) with interactive section level merge controls (`replace`, `append`, `skip`), inline field editing, and dynamic skill chip management (see spec 0006).
- Server Actions in `src/app/actions/resume-actions.ts` handling resume upload parsing, inline retry from preserved raw text without re-upload, and atomic profile commit with case insensitive skill deduplication (see spec 0006).
- First time applicant automatic master profile creation initializing a default profile during resume commit when no existing profile is found (see spec 0006).
- Deterministic ATS resume scoring engine computing match scores from 0 to 100 based on keyword match (50%), experience relevance (30%), and formatting compliance (20%) with support for English and Arabic tokens (see spec 0007).
- Google XYZ experience bullet point rewriting prompt engine with zero hallucination enforcement to detect and remove fabricated numbers (see spec 0007).
- Interactive ATS studio workbench in `src/components/ats/` displaying overall match score card, category meters, matched skills, interactive missing skill badges with add and dismiss actions, and Google XYZ single bullet rewrites (see spec 0007).
- Server Actions in `src/app/actions/ats-engine.ts` for ATS scoring calculations, single bullet optimization, and missing skill profile additions with automatic deterministic fallback on AI timeouts (see spec 0007).
- Ephemeral vector PDF export route handler at `GET /api/resumes/[id]/pdf` generating clean single column documents in server memory without saving binary files to disk, with RFC 5987 UTF-8 filename encoding and session ownership verification (see spec 0007).
- Bilingual PDF rendering engine using `@react-pdf/renderer` with embedded Geist Sans and IBM Plex Sans Arabic static fonts, cursive glyph joining via `arabic-persian-reshaper`, and visual BiDi reordering via `bidi-js` (see spec 0007).
- Cold career outreach message generator producing LinkedIn connection notes under 300 characters, InMail pitches, and cold emails with tone and recipient controls (see spec 0008).
- Interview preparation cheat sheet generator providing 3 targeted STAR questions grounded in authentic candidate records with zero hallucination enforcement and 3 strategic interviewer questions (see spec 0008).
- Interactive studio workbenches for outreach and interview prep integrated into `StudioContainer` with live character counters, copy to clipboard feedback, and `@media print` stylesheets (see spec 0008).
- Server Actions in `src/app/actions/outreach-actions.ts` and `src/app/actions/interview-prep-actions.ts` for generation, atomic autosaving with 1000ms debounce, and single item regeneration (see spec 0008).
- Bilingual localization strings for outreach and interview prep interfaces in English and Arabic dictionaries (see spec 0008).
- Responsive five column job application kanban tracker at `/[lang]/tracker` supporting right to left Arabic and left to right English layouts (see spec 0009).
- Accessible drag and drop reordering between and within columns using `@dnd-kit` with 8px pointer activation threshold, keyboard navigation with inverted right to left coordinates for Arabic, and live screen reader announcements (see spec 0009).
- Client fractional indexing midpoint sorting calculations persisting card positions without mass renumbering transactions (see spec 0009).
- Optimistic UI updates using React 19 `useOptimistic` hook with automatic rollback and error feedback on server failure (see spec 0009).
- Automatic `appliedAt` timestamp recording when transitioning application cards into `APPLIED` status (see spec 0009).
- Interactive kanban cards with quick status dropdown menu, ATS match score badge linking to studio, and one click outreach copy button (see spec 0009).
- Slide over details drawer for inspecting job descriptions, attached tailored resumes, compensation, location, interview date, recruiter contact details, and editable personal notes (see spec 0009).
- Follow up staleness warning badges identifying applications in `APPLIED` over seven days or `INTERVIEWING` past scheduled interview date (see spec 0009).
- Real time filter toolbar featuring text search, minimum ATS match threshold filtering, follow up filter toggle, and automatic drag reordering pausing (see spec 0009).
- Quick add modal on the kanban board and Add to Tracker button in Tailor Studio linking tailored resumes to tracked applications (see spec 0009).
- Bilingual public landing page at `/[lang]` that follows one sample role from job description to tailored draft, ATS coverage review, achievement rewrite, interview preparation, and next step, with localized English and Arabic copy and sample workspace data (see spec 0010).
- Shared light and dark appearance for the public site with a compact control in the desktop and mobile navigation that uses the same stored theme preference as the workspace (see spec 0010).
- Scroll driven workflow story with a pinned desktop stage, a stacked reading layout for small screens and reduced motion, direct stage navigation, and a progress indicator (see spec 0010).

### Changed

- Migrated root application layout and page into subpath structure under `src/app/[lang]/` with Radix `DirectionProvider` and `ThemeProvider` (see spec 0003).
- Configured PostCSS compilation via `@tailwindcss/postcss` for reliable Tailwind CSS v4 asset builds (see spec 0003).
- Updated provider settings validations and database helpers to permit updating default models or endpoints without re-entering existing secret keys (see spec 0004).
- Extended PostgreSQL schema with `passwordHash` field on `User` and `status` lifecycle tracking on `TailoredResume` (see spec 0005).
- Extended Prisma schema `ParsedResume` model with `ParsingStatus` lifecycle enum (`PROCESSING`, `REVIEWING`, `APPLIED`, `FAILED`), structured error tracking fields (`errorCode`, `errorMessage`), raw text preservation, and JSON payload caching (see spec 0006).
- Configured Next.js Server Actions body size limit to 10MB in `next.config.ts` to support document uploads (see spec 0006).
- Added navigation header link to `/resume` in English and Arabic navigation menus (see spec 0006).
- Updated `TailoredResume` entity in `prisma/schema.prisma` with `atsBreakdown` (JSON) and `lastExportedAt` (DateTime) columns while dropping obsolete `pdfExportPath` (see spec 0007).
- Integrated `AtsWorkbench` into the Resume Tailoring Studio at `/[lang]/tailor` (see spec 0007).
- Extended `StudioContainer` sub navigation tabs with Outreach Messages and Interview Prep tabs and initial data loading status badges (see spec 0008).
- Extended Prisma schema `Application` model with `interviewDate`, `compensation`, `location`, `contactName`, `contactEmail` fields and composite index on `[userId, interviewDate]` (see spec 0009).
- Updated Tailor Studio header in `src/components/tailor/StudioContainer.tsx` with one click Add to Tracker action button (see spec 0009).
- Rebuilt the public home page around one role walkthrough with hero, trust, orientation, workflow, capabilities, comparison, closing action, and footer sections in place of the previous feature grid (see spec 0010).
- Updated public page metadata with localized titles, descriptions, structured data, and social preview fields for both languages (see spec 0010).
- Applied a warm gallery light palette and a noir dark palette to the landing page while keeping resume paper surfaces light and readable in both themes (see spec 0010).
- Softened landing motion with calmer easing, shorter travel, lighter parallax, and no brightness pulsing between workflow panels (see spec 0010).

### Security

- Built SSRF protections for Ollama endpoints blocking cloud metadata IP addresses and internal database service ports (see spec 0004).
- Implemented credential masking exposing only the last four characters of decrypted API keys in settings cards (see spec 0004).
- Enforced session authentication guards across all provider Server Actions returning structured unauthorized responses before accessing the database (see spec 0004).
- Session authentication guards on tailoring API route and candidate profile Server Actions enforcing user ownership (see spec 0005).
- Server side active AI provider key decryption in memory without exposing provider credentials to browser client network requests (see spec 0005).
- Enforced magic bytes validation on all uploaded resume buffers to prevent file extension spoofing and executable binary uploads (see spec 0006).
- In memory text extraction discarding binary file buffers immediately after parsing without writing candidate resumes to cloud storage or temporary server disks (see spec 0006).
- Strict user session authorization and tenant isolation across all resume upload, retry, and profile commit actions (see spec 0006).
- Enforced session authentication and ownership validation on PDF export endpoint `GET /api/resumes/[id]/pdf` and ATS scoring Server Actions (see spec 0007).
- Ephemeral in memory PDF rendering streaming documents directly to clients without persisting generated PDF binary files to disk or storage (see spec 0007).
- Session authentication guards and resume ownership verification on outreach and interview prep Server Actions in memory without key logging (see spec 0008).
- Server side active AI provider key decryption in ephemeral memory via AES 256 GCM without exposing keys to browser client requests (see spec 0008).
- Enforced session authentication guards and user ownership verification across all application kanban Server Actions (see spec 0009).
