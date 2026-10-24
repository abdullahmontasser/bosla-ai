# Verify: Stack & architecture · spec 0001 · updated 2026-10-22

_Steps derived from spec 0001 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [x] Run `npm run dev` and navigate to `http://localhost:3000` (or `http://localhost:3001`) → Next.js starter page renders cleanly with Tailwind CSS styles applied → AC-1

## Commands

- [x] `npm run build` → Production build finishes cleanly with TypeScript verification and static route generation → AC-1
- [x] `npm run lint` → ESLint executes across all source files with zero errors → AC-1
- [x] `npx prisma generate` → Generates Prisma Client to node_modules/@prisma/client from schema → AC-2

## Acceptance-criteria coverage

- AC-1 (Next.js App Router with TypeScript, Tailwind CSS, and ESLint builds cleanly) covered by `npm run build`, `npm run lint`, and browser check
- AC-2 (PostgreSQL and Prisma ORM configuration present with runnable local setup) covered by `docker-compose.yml` inspection and `npx prisma generate`
