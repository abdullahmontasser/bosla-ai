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
- AI provider configuration settings page at `/[lang]/settings/providers` with bilingual English and Arabic layout, loading provider cards through React Suspense and Partial Prerendering (see spec 0004).
- Interactive `ProviderCard` component island providing credential validation, model fetching, model selection, active provider toggles, and deletion (see spec 0004).
- Server Actions in `src/app/actions/provider-settings.ts` executing credential validation, safe AES 256 GCM key encryption, atomic active provider transactions, and corrupted key recovery (see spec 0004).
- Model filtering and recommendation fallbacks in `src/lib/ai/provider-models.ts` supporting OpenAI, Anthropic Claude, Google Gemini, Groq, and local Ollama (see spec 0004).
- Reusable inline `ProviderSwitcher` component for upcoming AI feature pages, displaying active models and enabling quick provider switching (see spec 0004).
- Auth.js v5 authentication configuration in `src/auth.ts` with Prisma adapter and JWT user session forwarding (see spec 0004).
- Credentials authentication support in Auth.js v5 with bcrypt password hashing and seeded demo credentials for `demo@careercraft.ai` (see spec 0005).
- Candidate experience profile management and bilingual sample data loader for Senior Full Stack Engineers in English and Arabic (see spec 0005).
- Anti hallucination tailoring prompt engine formatting streaming outputs with structured section delimiters (see spec 0005).
- Real time AI streaming endpoint at `POST /api/tailor` that decrypts user provider keys in server memory and streams tailored content using Vercel AI SDK (see spec 0005).
- Automatic persistence of tailored resume snapshots and job postings to PostgreSQL with generation status tracking upon stream completion (see spec 0005).
- Bilingual resume tailoring studio workbench at `/[lang]/tailor` featuring candidate experience editing, job description input with character validation, inline provider switching, and live streaming output preview (see spec 0005).
- Interactive sign in card with one click demo access and localized English and Arabic layout guidance (see spec 0005).

### Changed

- Migrated root application layout and page into subpath structure under `src/app/[lang]/` with Radix `DirectionProvider` and `ThemeProvider` (see spec 0003).
- Configured PostCSS compilation via `@tailwindcss/postcss` for reliable Tailwind CSS v4 asset builds (see spec 0003).
- Updated provider settings validations and database helpers to permit updating default models or endpoints without re-entering existing secret keys (see spec 0004).
- Extended PostgreSQL schema with `passwordHash` field on `User` and `status` lifecycle tracking on `TailoredResume` (see spec 0005).

### Security

- Built SSRF protections for Ollama endpoints blocking cloud metadata IP addresses and internal database service ports (see spec 0004).
- Implemented credential masking exposing only the last four characters of decrypted API keys in settings cards (see spec 0004).
- Enforced session authentication guards across all provider Server Actions returning structured unauthorized responses before accessing the database (see spec 0004).
- Session authentication guards on tailoring API route and candidate profile Server Actions enforcing user ownership (see spec 0005).
- Server side active AI provider key decryption in memory without exposing provider credentials to browser client network requests (see spec 0005).
