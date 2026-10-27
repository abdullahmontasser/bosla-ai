# Verify: Public showcase and landing page · spec 0010 · updated 2026-10-26

Steps derived from spec 0010 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones.

## UI / manual

- [ ] Navigate to `/[lang]` (both `/en` and `/ar`) → verify thesis driven hero, tactile palette, and bilingual symmetry render without layout shift → AC-1, AC-2
- [ ] On the ATS benchmark preview, toggle between preset job profiles (Software Engineer, Product Manager, Designer) → verify score dial, keyword breakdown, and Google XYZ bullet comparisons update instantly without page reloads → AC-3
- [ ] In Arabic locale (`/ar`), verify all benchmark progress bars, score dials, and XYZ bullets mirror from right to left with correct Arabic font shaping → AC-2, AC-3
- [ ] Inspect the Architecture Blueprint section → verify interactive layers expand to show tech stack details (PostgreSQL, Prisma, Vercel AI SDK, React PDF) → AC-4
- [ ] Click the Copy Command button on the Developer Quickstart card → verify clipboard receives command string and visual confirmation appears → AC-5
- [ ] Click feature links to Tailor Studio, Resume Ingestion, and Kanban Tracker → verify routes load cleanly → AC-6
- [ ] Run `scripts/visual-qa.sh` → inspect captured screenshots across desktop (1440x900), tablet (768x1024), and mobile (375x812) in both languages → AC-1, AC-2
- [ ] Send sample telemetry event via client beacon → verify database record in `TelemetryEvent` with anonymized IP and valid payload → AC-7, AC-9
- [ ] Send sixty one requests within one minute to `/api/telemetry` from single IP → verify HTTP 429 Too Many Requests response on sixty first request → AC-8
- [ ] Inspect `<head>` tags on `/[lang]` → verify Open Graph tags, Twitter card tags, and JSON LD software application schema are present and localized → AC-10

## Commands

- [ ] `npm run lint && npx tsc --noEmit` → exit code 0, zero errors → AC-1 through AC-10
- [ ] `npm run test` → all unit and component test suites pass cleanly → AC-1 through AC-10
- [ ] `npm run build` → Next.js production build completes cleanly → AC-1 through AC-10
- [ ] `scripts/visual-qa.sh` → captures all responsive screenshots to `scratch/qa/` → AC-1, AC-2

## Acceptance criteria coverage

- AC-1 covered by UI steps 1, 7 and Command steps 1, 3, 4
- AC-2 covered by UI steps 1, 3, 7 and Command steps 1, 3, 4
- AC-3 covered by UI steps 2, 3 and Command steps 1, 2, 3
- AC-4 covered by UI step 4 and Command steps 1, 2, 3
- AC-5 covered by UI step 5 and Command steps 1, 2, 3
- AC-6 covered by UI step 6 and Command steps 1, 3
- AC-7 covered by UI step 8 and Command steps 1, 2, 3
- AC-8 covered by UI step 9 and Command steps 1, 2, 3
- AC-9 covered by UI step 8 and Command steps 1, 2, 3
- AC-10 covered by UI step 10 and Command steps 1, 3
