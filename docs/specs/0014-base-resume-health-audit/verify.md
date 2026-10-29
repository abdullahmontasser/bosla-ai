# Verify: Base resume health audit and improvements · spec 0014 · updated 2026-10-29

_Steps derived from spec 0014 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [x] Visit `/[lang]/resume` signed out -> expect redirect to the login page with a callback -> AC-1, AC-9
- [x] Sign in with an empty profile and visit `/en/resume` -> expect a 0 score, the guided empty state, and links to upload and profile -> AC-1
- [x] Fill a profile with roles, bullets, summary, skills, and contact fields, then open `/en/resume` -> expect a score out of 100, four category bars, and the matching band -> AC-2
- [x] Inspect every category group -> expect counts, collapsible sections, and one card per issue with a title, original text, and rationale, anchored to the affected line or field -> AC-3
- [x] Open `/en/profile` -> expect the compact score card with the same score and band, linking to the resume audit -> AC-1, AC-12
- [x] Switch the panel to Arabic -> expect the Arabic profile audit, Arabic card copy, mirrored layout, and Arabic digits handled -> AC-1, AC-10
- [x] Request an AI rewrite on a bullet card -> expect a preview with original on top, proposed text below, highlighted differences, and no change to the profile yet -> AC-6
- [x] Accept the rewrite -> expect the profile bullet to change, the card to morph to accepted, the gauge to animate, and an undo control for about 10 seconds -> AC-4
- [x] Press undo -> expect the original bullet restored, the card back to pending, and the score restored -> AC-4, AC-8
- [x] Dismiss a card -> expect the card to leave, the score to move, and an excluded count in the breakdown -> AC-5
- [x] Reload the page -> expect the dismissal to persist and the dismissed card to stay hidden while its text is unchanged -> AC-5, AC-8
- [x] Restore a dismissed card -> expect it to return and the score to move back -> AC-5
- [x] Remove the active provider or use an invalid key, then request a rewrite -> expect the deterministic card to remain with an inline error and retry -> AC-7
- [x] Edit a line that has a pending AI rewrite -> expect a stale badge, disabled accept, and regenerate or dismiss actions -> AC-7
- [x] Open two tabs on the same card, accept in both -> expect the first decision to win and the second tab to show a conflict notice -> AC-8
- [x] Edit the profile or commit a parsed resume, then return to `/resume` -> expect a fresh score without a blank gauge -> AC-12
- [x] Enable reduced motion -> expect the score and cards to change without animation and all content to stay reachable -> AC-10
- [x] Tab through the panel -> expect visible focus, keyboard operable cards, and a live region announcement when the score changes -> AC-10
- [x] Check desktop, tablet, and 375px mobile in both `/en` and `/ar` -> expect no overflow, clipping, or lost controls -> AC-10
- [x] Make eleven AI rewrite requests in ten minutes -> expect a friendly rate limit message after the tenth -> AC-9
- [x] Request a rewrite on a card, then compare the proposed text with the source line and the profile context -> expect any invented number to be rejected with the ungrounded notice and no proposed text saved -> AC-6, AC-9
- [x] Dismiss one open card, then reopen `/en/profile` -> expect the compact card's open issue count to drop by exactly one -> AC-1, AC-5

## Commands

- [x] `npx tsc --noEmit` -> expect zero type errors -> AC-11
- [x] `npm run test` -> expect the full suite passing, including new health rules, actions, and component tests -> AC-11
- [x] `npm run lint` -> expect 0 errors and warnings across touched files -> AC-11
- [x] `npm run format:check` -> expect Prettier clean -> AC-11
- [x] `npm run build` -> expect a successful production build with the new tables and actions -> AC-11

## Acceptance-criteria coverage

- AC-1: Covered by session guard, page render tests for `/[lang]/resume` and `/[lang]/profile`, the empty state test, and the language switch test.
- AC-2: Covered by unit tests for the four category scores, the weights, and the bands in `src/lib/health/rules.test.ts`.
- AC-3: Covered by issue generation tests for every category and component tests for the grouped, collapsible card list.
- AC-4: Covered by accept action tests that assert the profile write, recalculation, morph state, and undo window.
- AC-5: Covered by dismiss and restore action tests, exclusion math tests, and persistence tests.
- AC-6: Covered by the AI rewrite action test, prompt context test, `generateObject` schema test, and component preview test.
- AC-7: Covered by no provider, provider error, stale detection, and retry tests.
- AC-8: Covered by upsert, fingerprint, merge, conflict, and reload persistence tests.
- AC-9: Covered by ownership denial tests, rate limit tests, prompt redaction tests, and log redaction review.
- AC-10: Covered by Arabic and English render tests, digit normalization tests, reduced motion test, focus review, and viewport screenshots.
- AC-11: Covered by the command list above.
- AC-12: Covered by the freshness tests for profile saves and parsed resume commits, plus the last known score state test.
