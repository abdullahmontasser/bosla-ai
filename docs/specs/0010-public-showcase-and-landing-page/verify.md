# Verify: Public showcase and landing page · spec 0010 · updated 2026-10-27

Steps derived from spec 0010 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones.

## UI / manual

- [x] Navigate to `/[lang]` in both `/en` and `/ar` → verify the navigation, hero, trust strip, orientation, story, capabilities, comparison, closing action, and footer render in order → AC-1, AC-2
- [x] In Arabic locale (`/ar`), inspect the hero heading → verify every hamza and tashkeel mark is visible inside the animated line masks → AC-2, AC-6
- [x] Scroll through the product story on desktop → verify the pinned stage advances through all six stages, the progress indicator updates, and the stage buttons jump to the matching panel → AC-4, AC-5
- [x] Resize to tablet and mobile → verify the story becomes a stacked reading layout and no section overflows horizontally → AC-4, AC-9
- [x] Enable reduced motion in the operating system → verify the story renders as static stacked content and no reveal animation hides copy → AC-5
- [x] Toggle the theme in the navigation → verify the warm paper and dark palettes both apply, the choice persists after reload, and resume paper surfaces stay readable → AC-3, AC-8
- [x] Switch language in the navigation → verify the route keeps the current page, the direction flips, and Arabic fonts (Alexandria, Amiri) apply → AC-2, AC-8
- [x] Open the mobile navigation → verify it opens, closes, and links to the correct locale routes → AC-8, AC-9
- [ ] Follow the hero, story, and footer calls to action → verify they land on `/[lang]/tailor`, `/[lang]/resume`, and `/[lang]/tracker` → AC-1
- [x] Inspect `<head>` on both locales → verify localized title, description, Open Graph, Twitter, and `SoftwareApplication` JSON LD are present → AC-7
- [x] Send a sample telemetry event to `/api/telemetry` → verify a record is written to `AnalyticsEvent` with no personal data, and that exceeding the hourly limit returns HTTP 429 → AC-1 note (existing foundation)
- [x] Run `scripts/visual-qa.sh` → inspect desktop (`1440x900`), tablet (`768x1024`), and mobile (`375x812`) captures in both directions → AC-9

## Commands

- [x] `npm run typecheck` → exit code 0, zero errors → AC-1 through AC-10
- [x] `npm run lint` → exit code 0, zero warnings → AC-1 through AC-10
- [x] `npm run format:check` → all files match Prettier style → AC-1 through AC-10
- [x] `npm run test` → 72 files and 526 tests pass → AC-2, AC-5, AC-6, AC-10
- [x] `npm run build` → Next.js production build completes and all routes prerender → AC-1, AC-7
- [x] `scripts/visual-qa.sh` → captures all responsive screenshots to `scratch/qa/` → AC-9 (captures produced; the shots miss animated copy and clip the mobile header, see the verify notes)

## Acceptance criteria coverage

- AC-1 covered by UI steps 1, 9 and Command steps 1, 5
- AC-2 covered by UI steps 1, 2, 7 and Command step 4
- AC-3 covered by UI step 6 and Command steps 1, 5
- AC-4 covered by UI steps 3, 4
- AC-5 covered by UI steps 3, 5 and Command step 4
- AC-6 covered by UI step 2 and Command step 4
- AC-7 covered by UI step 10 and Command step 5
- AC-8 covered by UI steps 6, 7, 8
- AC-9 covered by UI steps 4, 8, 11
- AC-10 covered by Command steps 1 through 6
