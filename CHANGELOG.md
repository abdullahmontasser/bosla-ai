# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Core application foundation bootstrapped with Next.js App Router, React 19, TypeScript strict mode, and Tailwind CSS (see spec 0001).
- Local containerized PostgreSQL 16 service configured via Docker Compose with persistent storage volume (see spec 0001).
- Prisma ORM data layer configuration targeting PostgreSQL with development client singleton pattern (see spec 0001).
- Automated unit testing pipeline configured with Vitest (see spec 0001).
- PostgreSQL schema and initial migration supporting Auth.js v5 accounts, bilingual candidate profiles, parsed resumes, job postings, tailored resume snapshots, and kanban applications (see spec 0002).
- Symmetric encryption helpers in `src/lib/crypto.ts` using AES 256 GCM to secure user AI provider API keys at rest (see spec 0002).
- Zod validation schemas in `src/lib/validations/` verifying provider settings, bilingual profiles, parsed resume payloads, and Google XYZ achievement bullets (see spec 0002).
- Tenant scoped repository functions in `src/lib/db/` enforcing user isolation and relational cascade rules (see spec 0002).
- Bilingual database seed script in `prisma/seed.ts` populating sample English and Arabic profiles, tailored snapshots, and kanban stages (see spec 0002).
- Subpath localization routing at `/[lang]` with English (LTR) and Arabic (RTL) support via Next.js App Router (see spec 0003).
- Locale negotiation middleware supporting `NEXT_LOCALE` cookie persistence, RFC 9110 quality factor parsing, and clean HTTP 307 redirects for unlocalized routes (see spec 0003).
- Google Fonts integration pairing Geist Sans for Latin scripts and IBM Plex Sans Arabic for Arabic typography with zero layout shift (see spec 0003).
- Accessible core UI foundation components (`Button`, `Input`, `Textarea`, compound `Card`, `Badge`, `Dialog`, compound `DropdownMenu`, `LanguageSwitcher`, `ThemeSwitcher`) built with Radix UI headless primitives and Tailwind CSS v4 semantic tokens (see spec 0003).
- Bidirectional layout primitives using logical CSS properties and `RtlIcon` helper for automatic directional chevron mirroring (see spec 0003).
- Flicker free dark and light theme switching via `next-themes` and custom Tailwind v4 dark variants (see spec 0003).
- Typed translation dictionary loader with recursive deep merge fallback to canonical English copy in `src/lib/i18n/get-dictionary.ts` (see spec 0003).
- Interactive visual component showcase and token gallery at `/[lang]/design-system` (see spec 0003).
- Localized 404 view at `src/app/[lang]/not-found.tsx` matching the design system (see spec 0003).

### Changed

- Migrated root application layout and page into subpath structure under `src/app/[lang]/` with Radix `DirectionProvider` and `ThemeProvider` (see spec 0003).
- Configured PostCSS compilation via `@tailwindcss/postcss` for reliable Tailwind CSS v4 asset builds (see spec 0003).
