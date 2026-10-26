# 0008. Career outreach and interview prep

**Date**: 2026-10-25
**Status**: Accepted

## Summary

This specification defines the umbrella architecture for career outreach and interview preparation in CareerCraft AI. The system decouples post tailoring workflows into two focused capabilities: cold outreach messaging (LinkedIn connection notes, InMail pitches, and cold emails) and an interview preparation cheat sheet (structured STAR answers grounded strictly in authentic candidate records and strategic questions for the interviewer). Both capabilities operate through dedicated Server Actions using the Vercel AI SDK with typed Zod schemas, persisting structured payloads into existing JSON columns on TailoredResume without database migrations.

## Structure

This umbrella specification governs two decoupled child specifications:

- [0008-career-outreach.md](0008-career-outreach.md): Cold outreach generation, character limits, live counters, tone controls, recipient targeting, and one click copy.
- [0008-interview-prep.md](0008-interview-prep.md): Interview cheat sheet generation, bounded question sets, zero hallucination STAR answers, bracketed placeholders, and print styles.

### Cross child contract

Both child specifications share a unified foundation:

- **Data storage**: Both payloads reside on the `TailoredResume` entity (`outreachMessage` and `interviewPrep` JSONB columns) scoped to `userId`.
- **Security and keys**: Both capabilities authenticate through `auth()`, verify resume ownership, and decrypt BYOK API keys ephemerally in server memory via `src/lib/crypto.ts` with zero logging.
- **Studio integration**: Both capabilities render as dedicated sub navigation tabs inside `StudioContainer` alongside Resume Editor and ATS Workbench, with status badges populated from initial studio data loading.
- **Autosave and concurrency**: In place edits trigger a 1000 millisecond debounced autosave, and any pending autosave is flushed before triggering single item regeneration.
- **Bilingual fidelity**: Both capabilities match the target tailored resume language (`EN` or `AR`) with full right to left layout and font pairing (IBM Plex Sans Arabic and Geist Sans).

## Requirements

**User stories**:

- As a job applicant, I want tailored outreach messages and a targeted interview cheat sheet after tailoring my resume so that I can initiate contact and prepare for interviews.
- As a candidate, I want outreach copy and interview prep grounded strictly in my authentic background with zero fabricated claims.
- As a bilingual user, I want full English and Arabic support with dedicated studio tabs and in place editing.

**Acceptance criteria**:

- **AC-1**: Outreach generation produces three distinct message variants (LinkedIn connection note under 300 characters, InMail pitch, cold email) with tone and recipient controls, governed by [0008-career-outreach.md](0008-career-outreach.md).
- **AC-2**: Interview preparation generator produces exactly 3 categorized questions with authentic STAR answers, zero hallucination enforcement, and 3 strategic interviewer questions, governed by [0008-interview-prep.md](0008-interview-prep.md).
- **AC-3**: Studio user interface integrates dedicated sub navigation tabs for "Outreach Messages" and "Interview Prep" inside `StudioContainer`, displaying status badges from initial data loading.
- **AC-4**: In place text editing supports a 1000 millisecond autosave debounce with pending debounces flushed before item regeneration, live character counters, one click clipboard copy, and print stylesheets (`@media print`).
- **AC-5**: Server Actions in `src/app/actions/outreach-actions.ts` and `src/app/actions/interview-prep-actions.ts` execute generation and updates with strict session authentication and ephemeral key decryption via `src/lib/crypto.ts`.

## Decision

**Chosen option**: Decoupled umbrella architecture with focused child specs, modular Server Actions using Vercel AI SDK generateObject, atomic JSON persistence, and integrated studio tabs.

We will structure career outreach and interview prep under a unified umbrella spec with two dedicated child specifications, allowing each capability to evolve independently while sharing database entities, studio navigation, and security controls.

**Implementation skills**: `ai-sdk` (`vercel/ai`, `.agents/skills/ai-sdk/`) · `arabic-rtl-best-practices` (`almubarmij/arabic-ai-skills`, `.agents/skills/arabic-rtl-best-practices/`) · `ux-writing-arabic` (`almubarmij/arabic-ai-skills`, `.agents/skills/ux-writing-arabic/`) · `nextjs-app-router-patterns` (`wshobson/agents`, `.agents/skills/nextjs-app-router-patterns/`) · `prisma-client-api` (`prisma/skills`, `.agents/skills/prisma-client-api/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Build plan

Following the project Tracer Bullet approach, the build plan delivers the integrated thread across both child domains:

- [x] 1. Define shared Zod validation schemas, TypeScript interfaces, and bilingual mock fixtures in `src/lib/validations/career-prep.ts`, satisfies **AC-1**, **AC-2**.
- [x] 2. Implement AI prompt templates for outreach in `src/lib/ai/prompts/outreach.ts` and interview prep in `src/lib/ai/prompts/interview-prep.ts`, satisfies **AC-1**, **AC-2**.
- [x] 3. Create Server Actions for outreach generation, saving, and single variant regeneration in `src/app/actions/outreach-actions.ts`, satisfies **AC-1**, **AC-4**, **AC-5**.
- [x] 4. Create Server Actions for interview prep generation, saving, and single question regeneration in `src/app/actions/interview-prep-actions.ts`, satisfies **AC-2**, **AC-4**, **AC-5**.
- [x] 5. Build interactive outreach studio components (`OutreachCard`, `ConnectionNoteEditor`, `InMailCard`, `EmailCard`) in `src/components/outreach/`, satisfies **AC-1**, **AC-4**.
- [x] 6. Build interactive interview prep studio components (`InterviewPrepWorkbench`, `StarQuestionCard`, `InterviewerQuestionsList`) in `src/components/interview-prep/`, satisfies **AC-2**, **AC-4**.
- [x] 7. Integrate Outreach and Interview Prep tabs into `StudioContainer` with initial data queries and update bilingual dictionaries in `src/dictionaries/`, satisfies **AC-3**, **AC-4**.
- [x] 8. Write comprehensive Vitest unit and integration test suites for Server Actions and studio components, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**.

## Consequences

**Positive**:

- Decoupling into two child specs isolates LinkedIn messaging constraints from interview STAR framing, keeping each focused and maintainable.
- Candidates gain end to end application assets from a single tailored resume session without fragmented workflows.
- Reuses existing database columns without database schema migrations.
- Bounded question sets and prompt caps prevent server action timeouts and excessive token usage.

**Negative / tradeoffs**:

- Maintaining two child specs requires keeping shared contracts in sync across both documents.
- Candidates who do not want outreach copy still see the tab in the studio.

**Neutral**:

- Bilingual dictionary files require new strings for tabs, buttons, placeholders, and error messages in English and Arabic.

## Follow-up

- [ ] Add bilingual translation strings for outreach and interview prep controls to `src/dictionaries/en.json` and `src/dictionaries/ar.json`.
- [ ] Verify that print stylesheets cleanly format Arabic typography and right to left direction in browser print previews.
