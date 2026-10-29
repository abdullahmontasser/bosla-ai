# Verify: Candidate profile and photo management · spec 0013 · updated 2026-10-28

_Steps derived from spec 0013 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [x] Visit `/[lang]/profile` unauthenticated -> expect redirect to `/[lang]/login?callbackUrl=...` -> AC-1
- [x] Sign in and visit `/en/profile` -> expect responsive two-column layout on desktop and single column on mobile down to 375px -> AC-1
- [x] Check avatar display when no photo is set -> expect brand gradient circle with uppercase user initials -> AC-3
- [x] Click camera button on avatar -> expect accessible dialog modal with circle mask, zoom slider, and drag pan controls -> AC-2
- [x] Upload JPG/PNG/WebP image under 5MB, adjust zoom, pan position, and click "Save photo" -> expect client WebP compression under 50KB saved to `User.image` -> AC-2
- [x] Click "Remove current photo" in avatar modal -> expect avatar to revert cleanly to initials monogram -> AC-2, AC-3
- [x] Edit personal name, headline, summary, location, and social links in Identity card -> click "Save Identity" -> expect success confirmation -> AC-4
- [x] Enter malformed URL in website or LinkedIn field -> expect descriptive Zod validation error without saving -> AC-4
- [x] Add a new Work Experience with job title, company, dates, and bullets -> expect item rendered with formatted dates and bullets -> AC-5
- [x] Click Up/Down reorder arrows on experiences, educations, skills, or projects -> expect immediate visual reordering and atomic `sortOrder` persistence -> AC-5
- [x] Toggle profile language to Arabic (`AR`) -> expect active view to switch to Arabic master profile copy while retaining shared user photo -> AC-6
- [x] Open workspace header navigation and account dropdown menu -> expect "Candidate profile" / "الملف الشخصي" link navigating directly to `/[lang]/profile` -> AC-1
- [x] Verify downstream surfaces (`/[lang]/tailor`, `/[lang]/resume`) reflect updated avatar and profile data without stale cache -> AC-7

## Commands

- [x] `npm run test` -> expect 495+ tests passing including profile validation, API routes, and page render tests -> AC-8
- [x] `npm run lint` -> expect 0 ESLint errors and warnings across all touched components and API routes -> AC-8
- [x] `npm run format:check` -> expect Prettier formatting check clean -> AC-8
- [x] `npm run build` -> expect production build to compile successfully with Partial Prefetching and dynamic routes -> AC-1, AC-8

## Acceptance-criteria coverage

- AC-1: Covered by session guard test, profile page render test, and responsive layout verification
- AC-2: Covered by avatar validation tests, canvas crop modal, client WebP size check, and `PATCH /api/profile/avatar` test
- AC-3: Covered by monogram fallback test in `page.test.tsx` and `ProfileOverviewCard`
- AC-4: Covered by `IdentityUpdateInputSchema` tests, `PUT /api/profile/identity` test, and `IdentityCard`
- AC-5: Covered by section item validation tests, CRUD routes, and reorder tests in `profile-api.test.ts`
- AC-6: Covered by Arabic and English profile rendering tests in `page.test.tsx` and `LanguageProfileSwitch`
- AC-7: Covered by path revalidation calls in `avatar`, `identity`, and CRUD route handlers
- AC-8: Covered by full Vitest suite (495 tests), ESLint check, and Next.js production build
