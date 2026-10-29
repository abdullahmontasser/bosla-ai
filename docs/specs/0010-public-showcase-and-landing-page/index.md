# 0010. Public showcase and landing page

**Date**: 2026-10-26
**Updated**: 2026-10-27
**Status**: Accepted

## Summary

This specification covers the public landing page for Bosla AI at `/[lang]`. The page replaces a generic feature grid with one continuous role walkthrough: a sample job description becomes a tailored resume, an ATS coverage review, a stronger achievement, an interview brief, and a next step. The page shell stays a Server Component; scroll motion and the interactive story are isolated client islands.

A first implementation pass built an interactive benchmark studio under `src/components/showcase/`. That pass was removed in the rebuild because it read as a dashboard tour and competed with the single narrative the page needed to tell. It is not part of the delivered surface.

## Requirements

**User stories**:

- As a prospective user or recruiter, I want to understand what the product does and follow one realistic role from posting to interview without signing in or supplying an API key.
- As an Arabic speaking visitor, I want the page written in Arabic, laid out right to left, and typeset with Arabic fonts rather than a mirrored English translation.
- As a technical evaluator, I want to see real product surfaces and a link to the open source repository instead of abstract marketing illustrations.
- As a returning visitor, I want the page to remember my theme and let me switch language without losing my place.

**Acceptance criteria**:

- **AC-1**: Serve the landing page at `/[lang]` for `en` and `ar`, composed of a navigation bar, hero, trust strip, orientation section, role walkthrough, capabilities, comparison, closing action, and footer, with the page shell rendered as a Server Component.
- **AC-2**: Provide complete English and Arabic copy through `getLandingCopy(lang)` and a localized sample role through `getShowcaseSample(lang)`, with no runtime translation fallback for the landing surface.
- **AC-3**: Apply a landing scoped visual system in `src/app/globals.css`: warm paper surfaces, deep green primary, hairline rules, grain texture, layered shadows, and a matching dark palette, all using logical properties.
- **AC-4**: Present the product story as a six stage walkthrough (job description, tailored resume, ATS coverage, achievement rewrite, interview preparation, next step) with a pinned desktop stage, a stacked small screen layout, direct stage navigation, and a progress indicator.
- **AC-5**: Drive motion with GSAP and ScrollTrigger through shared `Reveal`, `Hero`, and `ProductStory` islands, including a reduced motion path where the story reads as static content.
- **AC-6**: Keep the animated heading masks from clipping Arabic marks by using the `line-mask` utility, which clips with an extended clip margin instead of `overflow-hidden`.
- **AC-7**: Provide localized metadata with title, description, Open Graph, and Twitter fields, plus `SoftwareApplication` JSON LD structured data.
- **AC-8**: Provide a shared theme toggle and language switcher in the desktop and mobile navigation, a skip to content link, visible focus rings, associated form labels, and larger touch targets on mobile chrome and primary actions.
- **AC-9**: Keep the page responsive across desktop (`1440x900`), tablet (`768x1024`), and mobile (`375x812`) in both directions, with no horizontal overflow.
- **AC-10**: Cover the surface with Vitest tests for copy, sample data, theme toggle, and the Arabic line mask, and verify the branch with typecheck, lint, tests, and a production build.

**Existing foundations reused, not added by this slice**:

- The telemetry endpoint at `/api/telemetry`, the `AnalyticsEvent` Prisma model, the in memory rate limiter, and the client dispatch helpers predate this slice. The landing page does not dispatch activation events yet; wiring them is follow up work rather than delivered scope.

## Decision

**Chosen option**: One role walkthrough with a Server Component shell and isolated client islands.

The page follows a single sample role instead of presenting a suite of instruments. A visitor sees the job description, the tailored resume, the ATS gaps, a rewritten achievement, the interview brief, and the next action in sequence. Static copy and layout stay server rendered for search and first paint, while GSAP motion and the pinned story are the only client islands.

**Implementation skills**: `nextjs-app-router-patterns` (`wshobson/agents`, `.agents/skills/nextjs-app-router-patterns/`) · `arabic-rtl-best-practices` (`almubarmij/arabic-ai-skills`, `.agents/skills/arabic-rtl-best-practices/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `impeccable` (`.agents/skills/impeccable/`)

## Build plan

Following the Tracer Bullet build approach, this slice landed in five passes:

1. **Brand and visual foundation**
   - [x] Rebrand the public shell to Bosla AI and refresh the shared design tokens.
   - [x] Add the landing scoped warm paper and deep green palette with a dark variant in `src/app/globals.css`.
   - [x] Add Newsreader for English display type, Alexandria for Arabic UI, and Amiri for Arabic editorial accents in `src/lib/fonts.ts`.
   - [x] Record the art direction in `design.md`.
2. **Bilingual content model**
   - [x] Author the full English and Arabic landing copy in `src/components/landing/content.ts`.
   - [x] Author a bilingual sample role in `src/components/landing/showcase-data.ts`.
3. **Section composition**
   - [x] Assemble `src/app/[lang]/page.tsx` from `LandingNav`, `Hero`, `TrustStrip`, `HowItWorks`, `ProductStory`, `Features`, `Comparison`, `FinalCta`, and `LandingFooter`.
   - [x] Add `BrandMark`, `LandingMobileNav`, `LandingThemeToggle`, `Highlight`, and `StoryPanels` for the shared chrome and story panels.
4. **Scroll narrative and motion**
   - [x] Build the pinned six stage `ProductStory` with stage navigation, progress, and a stacked small screen fallback.
   - [x] Add the shared `Reveal`, `Hero` timeline, and `useIsomorphicLayoutEffect` helpers.
   - [x] Replace the clipped heading masks with the `line-mask` utility so Arabic hamza and tashkeel render fully.
5. **Controls, metadata, accessibility, and verification**
   - [x] Add localized metadata, Open Graph, Twitter, and JSON LD output.
   - [x] Add the theme toggle, language switcher, skip link, label associations, and larger touch targets.
   - [x] Add `scripts/visual-qa.sh` and landing tests.
   - [x] Run typecheck, lint, format check, Vitest, and the production build.
   - [ ] Run the full visual QA capture across three viewports and both directions and inspect every section.
   - [ ] Dispatch activation events from the landing page through the existing telemetry client.

## Consequences

- **Positive**:
  - The page tells one complete story instead of listing features, so a visitor can judge the product from a realistic role.
  - The Server Component shell keeps static copy cheap to render and index.
  - The shared design tokens and fonts give the public site and the workspace one identity.
  - The reduced motion path keeps the story readable without scroll animation.
- **Negative / Tradeoffs**:
  - GSAP and the story client islands add JavaScript weight to the public route.
  - The pinned story depends on scroll, so small screens and reduced motion need a separate stacked layout.
  - Landing copy lives in `content.ts` rather than the dictionary loader, which keeps long form copy type safe but bypasses the shared translation pipeline.
  - The sample role is illustrative data, not a live product run, and the page must say so.

## Follow-up

- Wire `page_view` and call to action events through `src/lib/telemetry/client.ts`.
- Generate a localized Open Graph image; the current metadata declares social fields without an image.
- Refresh `design.md` and `PRODUCT.md`, which still describe the CareerCraft name, the cobalt palette, and the retired showcase folder.
- Add automated visual regression diffing once the landing surface stabilizes.
- Consider letting visitors paste their own job description into the story preview.

## Rationale

Detailed options analysis, reference benchmarks, and design audit notes: see [rationale.md](rationale.md)
