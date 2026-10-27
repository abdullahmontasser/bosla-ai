# 0010. Public showcase and landing page

**Date**: 2026-10-26  
**Status**: In Progress

## Summary

This specification defines the award caliber public showcase and landing page for CareerCraft AI at `/[lang]`. Moving beyond generic artificial intelligence landing page tropes (repetitive three column card grids, decorative gradients, and abstract icons), the showcase implements a thesis driven layout grounded in reference systems from Notion, Slite, Voicenotes, and Aboard. It features an interactive ATS scoring benchmark workbench with real candidate and job data, an interactive architecture card detailing the open source stack, a bilingual feature preview, and privacy preserving telemetry with in memory rate limiting.

## Requirements

**User stories**:

- As a prospective user or recruiter, I want to experience CareerCraft AI's core capabilities directly on the public landing page without signing in or creating an account.
- As a technical evaluator or hiring manager, I want to inspect the system architecture, technology stack, and developer quickstart to evaluate the code quality and open source design.
- As an Arabic speaking user, I want the showcase to mirror naturally in right to left with authentic Arabic typography and localized sample data.
- As an open source contributor, I want to view GitHub repository statistics, release notes, and documentation links clearly positioned on the page.

**Acceptance criteria**:

- **AC-1**: Assemble an award caliber public landing page at `/[lang]` using Next.js 16 Server Components by default, applying the tactile palette (warm paper canvas `#f6f5f4`, white cards `#ffffff`, hairline borders `rgba(0,0,0,0.08)`, and Electric Cobalt accent `#3e7ff0`).
- **AC-2**: Provide complete bilingual symmetry across all showcase sections, correctly applying logical properties and font pairings (Geist Sans for English and IBM Plex Sans Arabic for Arabic).
- **AC-3**: Implement an interactive ATS benchmark showcase component in `src/components/showcase/AtsBenchmarkShowcase.tsx` allowing visitors to toggle between sample engineering, product, and design resumes to observe real time ATS scoring, Google XYZ bullet improvements, and skill gap analysis without requiring authentication or external API calls.
- **AC-4**: Build an interactive Architecture Blueprint card in `src/components/showcase/ArchitectureCard.tsx` detailing the vertical layers of the application (PostgreSQL 16, Prisma ORM, Auth.js v5, Vercel AI SDK, React PDF vector rendering, and Vitest test suite).
- **AC-5**: Provide a developer quickstart terminal card displaying copyable local development and Docker commands (`docker compose up -d`, `npm install`, `npm run dev`).
- **AC-6**: Present a feature breakdown section with direct deep links to the Tailor Studio (`/[lang]/tailor`), ATS Resume Ingestion (`/[lang]/resume`), and Application Tracker (`/[lang]/tracker`).
- **AC-7**: Add a privacy preserving telemetry event collection route at `/api/telemetry` backed by a Prisma `TelemetryEvent` model, recording anonymous visit and interaction metrics (`event_name`, `locale`, `referrer_domain`, `timestamp`) with zero personal identifiable information.
- **AC-8**: Enforce an in memory sliding window rate limiter on the telemetry endpoint limiting each IP to sixty requests per minute, returning HTTP 429 when exceeded.
- **AC-9**: Persist telemetry client helpers in `src/lib/telemetry/client.ts` to dispatch non blocking activation events using `navigator.sendBeacon` with `fetch` fallback.
- **AC-10**: Implement dynamic Open Graph and Twitter card metadata for both languages, including localized titles, descriptions, and JSON LD software application structured data.

## Decision

**Chosen option**: Interactive Product Workbench Showcase with Client Component Islands, Server Component Shell, and Privacy Preserving Telemetry.

This architecture avoids generic marketing templates by embedding real, interactive slices of CareerCraft AI directly into the public route. The outer layout and static copy remain pure Server Components for optimal search engine optimization and zero client side bundle bloat, while the interactive benchmark workbench runs inside isolated client islands.

**Implementation skills**: `nextjs-app-router-patterns` (`wshobson/agents`, `.agents/skills/nextjs-app-router-patterns/`) · `arabic-rtl-best-practices` (`almubarmij/arabic-ai-skills`, `.agents/skills/arabic-rtl-best-practices/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `prisma-client-api` (`prisma/skills`, `.agents/skills/prisma-client-api/`)

## Build plan

Following the Tracer Bullet build approach, this slice is structured into four sequential milestones:

1. **Telemetry Pipeline and Data Layer (Tracer Bullet)**:
   - Add `TelemetryEvent` model to `prisma/schema.prisma` and run database migration.
   - Implement in memory rate limiter and `/api/telemetry` POST route handler with Zod validation.
   - Create client telemetry dispatcher with `sendBeacon`.
2. **Interactive Benchmark and Blueprint Components**:
   - Create bilingual preset resume and job posting fixtures.
   - Build `AtsBenchmarkShowcase` client island with interactive score dials and XYZ bullet diffs.
   - Build `ArchitectureCard` and developer quickstart component.
3. **Showcase Page Assembly and Responsive Polish**:
   - Rebuild `src/app/[lang]/page.tsx` with thesis driven hero, inline keyword pills, and section composition.
   - Update English and Arabic dictionary files (`src/dictionaries/en.json`, `src/dictionaries/ar.json`) with showcase copy.
   - Add Open Graph metadata and JSON LD structured data.
4. **Verification and Visual QA**:
   - Run `scripts/visual-qa.sh` to capture and inspect desktop, tablet, and mobile screenshots in LTR and RTL.
   - Execute Vitest suites and end to end runtime checks (`/check verify`).

## Consequences

- **Positive**:
  - Immediate demonstration of product value for visitors and recruiters without signup friction.
  - Distinctive visual identity aligned with top tier design benchmarks (Notion, Slite, Voicenotes, Aboard).
  - Preserves Server Component architecture and fast initial page loads.
  - Zero heavy external 3D libraries or layout shift.
- **Negative / Tradeoffs**:
  - Interactive benchmark island requires shipping static sample resume data to the client bundle (approximately 4kb gzipped).
  - Headless Chrome screenshot verification requires local Chrome binary availability.

## Follow-up

- Consider adding an interactive demo mode where users can paste their own custom job descriptions directly into the public benchmark preview.
- Integrate automated visual regression diffing in continuous integration if pull requests alter public showcase styling.

## Rationale

Detailed options analysis, reference benchmarks, and design audit notes: see [rationale.md](rationale.md)
