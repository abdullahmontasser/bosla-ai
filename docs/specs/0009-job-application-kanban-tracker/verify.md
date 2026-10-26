# Verify: Job application kanban tracker · spec 0009 · updated 2026-10-26

Steps derived from spec 0009 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones.

## UI / manual

- [x] Navigate to `/[lang]/tracker` → verify five columns rendered (Saved, Applied, Interviewing, Offer, Rejected) in English left to right, and Arabic right to left with mirrored layout → AC-1
- [x] Drag an application card from Saved to Applied using mouse or touch → verify instantaneous card position update in UI without layout shift → AC-2, AC-4
- [x] With card in Applied, verify database stores `appliedAt` timestamp automatically without overriding existing timestamps → AC-3, AC-5
- [x] Move card between two existing cards in a column using keyboard navigation (Space, Arrow keys, Space) → verify fractional sortOrder calculated correctly between adjacent items → AC-2, AC-3
- [x] In Arabic locale, verify keyboard Arrow keys navigate stages according to right to left visual flow → AC-1, AC-2
- [x] Click a card with less than eight pixels mouse travel → verify slide over drawer opens without triggering drag gestures → AC-2, AC-7
- [x] Simulate network failure or throw error during drop action → verify card rolls back smoothly to original column and localized error toast appears → AC-4
- [x] On an application card, click the quick status dropdown menu and select Interviewing → verify card moves to Interviewing column immediately → AC-6
- [x] On an application card with an attached tailored resume, click Copy Outreach Note → verify clipboard receives saved LinkedIn connection note and visual confirmation appears → AC-6
- [x] In slide over drawer, edit interview date, contact person, and notes and click Save → verify application record updates in database → AC-7
- [x] In tracker toolbar, enter text in search bar or toggle Needs Follow Up → verify cards filter in real time and drag reordering is safely disabled with informative helper text → AC-8, AC-9
- [x] In tracker toolbar, click New Application button, fill out title and company, and submit → verify card appears in Saved column with spaced initial sortOrder → AC-10
- [x] Navigate to `/[lang]/tailor` studio with a tailored resume, click Add to Tracker in studio header → verify application record is created and linked to the active job posting without duplication → AC-10

## Commands

- [x] `npm run lint && npx tsc --noEmit` → exit code 0, zero errors → AC-1 through AC-10
- [x] `npx vitest run src/app/actions/application-actions.test.ts src/components/tracker/` → all unit and component tests pass → AC-1 through AC-10
- [x] `npm run build` → Next.js production build completes cleanly → AC-1 through AC-10

## Acceptance criteria coverage

- AC-1 covered by UI steps 1, 5 and Command steps 1, 2, 3
- AC-2 covered by UI steps 2, 4, 5, 6 and Command steps 1, 2, 3
- AC-3 covered by UI steps 3, 4 and Command steps 1, 2, 3
- AC-4 covered by UI steps 2, 7 and Command steps 1, 2, 3
- AC-5 covered by UI step 3 and Command steps 1, 2, 3
- AC-6 covered by UI steps 8, 9 and Command steps 1, 2, 3
- AC-7 covered by UI steps 6, 10 and Command steps 1, 2, 3
- AC-8 covered by UI step 11 and Command steps 1, 2, 3
- AC-9 covered by UI step 11 and Command steps 1, 2, 3
- AC-10 covered by UI steps 12, 13 and Command steps 1, 2, 3
