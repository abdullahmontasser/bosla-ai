# Verify: Data model · spec 0002 · updated 2026-10-22

_Steps derived from spec 0002 acceptance criteria and value sourcing table. `/check verify` runs these; `/test` locks the durable ones._

## Commands

- [x] `/opt/homebrew/bin/node node_modules/.bin/prisma validate` → schema compiles with all models, enums, indexes, and relations valid → AC-1
- [x] `/opt/homebrew/bin/node node_modules/.bin/tsc --noEmit` → zero TypeScript type errors across schema, validations, and database access layers → AC-1, AC-3, AC-7
- [x] `/opt/homebrew/bin/node node_modules/.bin/vitest run src/lib/crypto.test.ts` → symmetric encryption uses AES 256 GCM with unique initialization vectors and fails on tampered tags → AC-2
- [x] `/opt/homebrew/bin/node node_modules/.bin/vitest run src/lib/db/repository.test.ts` → Zod validation schemas enforce commercial API keys, allow keyless Ollama, and validate Google XYZ bullets → AC-2, AC-3, AC-5, AC-6, AC-7
- [x] `/opt/homebrew/bin/node node_modules/.bin/eslint src prisma` → zero lint errors across repository and database seed files → AC-1
- [x] `/opt/homebrew/bin/node node_modules/.bin/prettier --check "src/**/*.{ts,tsx}" "prisma/**/*.ts"` → code formatted cleanly per project standards → AC-1

## Logical / Value Sourcing

- [x] Save OpenAI provider setting with plaintext key → ciphertext, iv, and authTag stored at rest, key never in plaintext → AC-2
- [x] Save local Ollama provider setting without key → allows null encryptedKey with valid endpointUrl → AC-2
- [x] Create bilingual master profiles → supports distinct English and Arabic profiles with language tags and enforces single default profile per language → AC-3
- [x] Ingest parsed resume payload → validates structured JSON experiences and skills via ParsedResumePayloadSchema → AC-4
- [x] Create job posting with parsed skills → persists raw posting text and stores parsedSkills array with GIN index → AC-5
- [x] Create tailored resume snapshot → saves immutable snapshot payload with Google XYZ bullet points and atsScore, defaulting title if omitted → AC-6
- [x] Create kanban application card → assigns next sortOrder float in SAVED column, prevents duplicate card for same job posting → AC-7
- [x] Move kanban card from SAVED to APPLIED → sets appliedAt to current timestamp; moving back clears timestamp → AC-7
- [x] Delete application card → removes application card without deleting associated job posting or tailored resume snapshot → AC-8
- [x] Delete job posting with active application → blocks deletion to protect relational integrity → AC-8

## Acceptance-criteria coverage

- AC-1: covered by prisma validate, tsc typecheck, and eslint checks
- AC-2: covered by crypto test suite, provider settings validation, and encryption repository tests
- AC-3: covered by bilingual profile validation and profile repository logic
- AC-4: covered by parsed resume payload validation schema and repository save function
- AC-5: covered by job posting validation and GIN index schema definition
- AC-6: covered by tailored resume snapshot validation and title sourcing logic
- AC-7: covered by application validation, kanban card uniqueness, and stage transition timestamp logic
- AC-8: covered by relational integrity rules, foreign key cascade definitions, and delete constraints
