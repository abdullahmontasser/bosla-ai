# Verify: Account access and workspace shell · spec 0011 · updated 2026-10-28

_Steps derived from spec 0011 acceptance criteria and best practice hardening plan. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [ ] Visit `/[lang]/signup` → Type weak password (`short`) → Verify strength meter displays "Weak" (ضعيفة in Arabic) with unmet checklist items → AC-2, Hardening-3
- [ ] Visit `/[lang]/signup` → Type `V3ry$ecureP@ssword!` → Verify 4-segment strength bar animates to full green ("Strong" / قوية جداً) with green checkmarks → AC-2, Hardening-3
- [ ] Visit `/[lang]/signup` → Enter disposable email (`user@mailinator.com`) → Blur input → Verify inline warning rejecting disposable domain → AC-2, Hardening-3
- [ ] Visit `/[lang]/login` → Enter invalid credentials 5 times → Verify 6th attempt triggers 15-minute temporary lockout with `too_many_requests` code → Hardening-1
- [ ] Visit `/[lang]/tailor` directly without session cookies → Verify edge middleware issues HTTP 307 redirect to `/[lang]/login?callbackUrl=%2F[lang]%2Ftailor` → AC-6, Hardening-4

## Commands

- [ ] `npx vitest run src/lib/validations/auth.test.ts` → 22 tests pass verifying Zod schemas, disposable email rejection, and strength evaluation → Hardening-3
- [ ] `npx vitest run src/app/actions/auth.test.ts` → 15 tests pass verifying credentials actions and failed attempt lockout → AC-2, Hardening-1
- [ ] `npx vitest run src/components/auth/AuthForm.test.tsx` → 6 tests pass verifying bilingual form behavior and strength checklist → AC-1, Hardening-3
- [ ] `npx vitest run src/middleware.test.ts` → 18 tests pass verifying middleware defense-in-depth route redirects → AC-6, Hardening-4
- [ ] `npm run build` → Production Next.js build compiles clean with 43 routes → AC-10

## Acceptance-criteria coverage

- AC-1 covered by AuthForm.test.tsx · AC-2 covered by auth.test.ts and auth validation tests · AC-6 covered by middleware.test.ts · AC-10 covered by npm run build · Hardening items 1, 2, 3, 4 covered by rate limiter and validation test suites
