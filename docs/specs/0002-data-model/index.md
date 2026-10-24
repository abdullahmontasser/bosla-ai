# 0002. Core Relational and Structured JSON Schema for CareerCraft AI

**Date**: 2026-10-22
**Status**: Accepted

## Summary

This specification establishes the core data model for CareerCraft AI using PostgreSQL 16 and Prisma ORM. We adopt a hybrid approach that combines strict relational tables for user identities, profiles, job postings, and kanban applications with structured JSON columns for raw parsed resumes and tailored snapshots. All user credentials and API keys use symmetric encryption at rest (AES 256 GCM) with strict user scoping across every database query.

## Requirements

**User stories**:

- As a job seeker, I want to store my candidate work history, education, and skills in English or Arabic so that I can reuse them across multiple applications.
- As a job seeker, I want to save my personal AI provider keys securely so that the platform can tailor resumes without storing my keys in plain text.
- As a job seeker, I want to generate immutable tailored resume snapshots for specific job descriptions so that I keep an exact record of what was submitted.
- As a job seeker, I want to organize my job applications on a kanban board connected to my tailored resumes so that I can track my hiring pipeline.

**Acceptance criteria**:

- **AC-1**: Auth.js v5 entities (User, Account, Session, VerificationToken) exist in the Prisma schema with cuid primary keys, composite primary key on VerificationToken, cascading user deletions, and unique constraints.
- **AC-2**: UserProviderSetting records store encrypted provider credentials (ciphertext, iv, authTag) using AES 256 GCM with optional endpoint URLs for local Ollama, supporting OpenAI, Anthropic, Gemini, Groq, and Ollama with a unique index on user ID and provider.
- **AC-3**: Profile records support bilingual resumes with an explicit language code (EN, AR) and default profile enforcement, containing relational children for WorkExperience, Education, Skill, and Project entities.
- **AC-4**: ParsedResume entities capture uploaded document metadata, raw extracted text, and structured extraction JSON, linked to the uploading user and optional target Profile.
- **AC-5**: JobPosting entities record the target position title, company name, posting URL, raw job description text, and extracted required skills with PostgreSQL GIN indexing.
- **AC-6**: TailoredResume records store immutable snapshots including tailored executive summary, Google XYZ formatted bullet points in JSON, ATS match percentage, missing skills, and outreach message templates.
- **AC-7**: Application records represent kanban cards with a status enum (SAVED, APPLIED, INTERVIEWING, REJECTED, OFFER), a unique constraint per user and job posting, a float sortOrder for column reordering, automatic appliedAt timestamps, and references to the target JobPosting and TailoredResume.
- **AC-8**: Relational integrity prevents accidental deletion of job postings or tailored resume history when application cards are removed, while cascading deletions cleanly when a user account is deleted without foreign key ordering deadlocks.

## Decision

**Chosen option**: Option 1: Hybrid relational tables with structured JSON columns in PostgreSQL via Prisma ORM.

We will back CareerCraft AI with a hybrid relational schema in PostgreSQL 16 managed by Prisma ORM, utilizing normalized relational tables for identity, work history, and kanban cards alongside validated JSON columns for raw parser payloads and frozen tailored resume snapshots.

**Implementation skills**: `prisma-client-api` (`prisma/skills`, `.agents/skills/prisma-client-api/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch**:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Language {
  EN
  AR
}

enum AiProvider {
  OPENAI
  ANTHROPIC
  GEMINI
  GROQ
  OLLAMA
}

enum DocumentFormat {
  PDF
  DOCX
  TXT
}

enum ApplicationStatus {
  SAVED
  APPLIED
  INTERVIEWING
  REJECTED
  OFFER
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts         Account[]
  sessions         Session[]
  providerSettings UserProviderSetting[]
  profiles         Profile[]
  parsedResumes    ParsedResume[]
  jobPostings      JobPosting[]
  tailoredResumes  TailoredResume[]
  applications     Application[]

  @@map("users")
}

model Account {
  id                String  @id @default(cuid())
  userId            String  @map("user_id")
  type              String
  provider          String
  providerAccountId String  @map("provider_account_id")
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@index([userId])
  @@map("accounts")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique @map("session_token")
  userId       String   @map("user_id")
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String
  expires    DateTime

  @@id([identifier, token])
  @@map("verification_tokens")
}

model UserProviderSetting {
  id           String     @id @default(cuid())
  userId       String     @map("user_id")
  provider     AiProvider
  encryptedKey String?    @map("encrypted_key") @db.Text
  iv           String?    @db.VarChar(64)
  authTag      String?    @map("auth_tag") @db.VarChar(64)
  defaultModel String     @map("default_model") @db.VarChar(128)
  endpointUrl  String?    @map("endpoint_url") @db.Text
  isActive     Boolean    @default(true) @map("is_active")
  createdAt    DateTime   @default(now()) @map("created_at")
  updatedAt    DateTime   @updatedAt @map("updated_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, provider])
  @@index([userId])
  @@map("user_provider_settings")
}

model Profile {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  language    Language @default(EN)
  fullName    String   @map("full_name") @db.VarChar(255)
  headline    String?  @db.VarChar(255)
  summary     String?  @db.Text
  email       String?  @db.VarChar(255)
  phone       String?  @db.VarChar(50)
  location    String?  @db.VarChar(255)
  websiteUrl  String?  @map("website_url") @db.Text
  linkedinUrl String?  @map("linkedin_url") @db.Text
  githubUrl   String?  @map("github_url") @db.Text
  isDefault   Boolean  @default(false) @map("is_default")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user             User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  workExperiences  WorkExperience[]
  educations       Education[]
  skills           Skill[]
  projects         Project[]
  parsedResumes    ParsedResume[]
  tailoredResumes  TailoredResume[]

  @@index([userId, language])
  @@map("profiles")
}

model WorkExperience {
  id          String    @id @default(cuid())
  profileId   String    @map("profile_id")
  companyName String    @map("company_name") @db.VarChar(255)
  jobTitle    String    @map("job_title") @db.VarChar(255)
  location    String?   @db.VarChar(255)
  startDate   DateTime  @map("start_date")
  endDate     DateTime? @map("end_date")
  isCurrent   Boolean   @default(false) @map("is_current")
  bullets     String[]
  sortOrder   Int       @default(0) @map("sort_order")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@index([profileId, sortOrder])
  @@map("work_experiences")
}

model Education {
  id           String    @id @default(cuid())
  profileId    String    @map("profile_id")
  institution  String    @db.VarChar(255)
  degree       String    @db.VarChar(255)
  fieldOfStudy String?   @map("field_of_study") @db.VarChar(255)
  startDate    DateTime? @map("start_date")
  endDate      DateTime? @map("end_date")
  grade        String?   @db.VarChar(50)
  sortOrder    Int       @default(0) @map("sort_order")
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")

  profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@index([profileId, sortOrder])
  @@map("educations")
}

model Skill {
  id          String   @id @default(cuid())
  profileId   String   @map("profile_id")
  name        String   @db.VarChar(128)
  category    String?  @db.VarChar(64)
  proficiency String?  @db.VarChar(32)
  sortOrder   Int      @default(0) @map("sort_order")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@index([profileId, category])
  @@map("skills")
}

model Project {
  id           String   @id @default(cuid())
  profileId    String   @map("profile_id")
  name         String   @db.VarChar(255)
  description  String   @db.Text
  role         String?  @db.VarChar(128)
  technologies String[]
  url          String?  @db.Text
  sortOrder    Int      @default(0) @map("sort_order")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  profile Profile @relation(fields: [profileId], references: [id], onDelete: Cascade)

  @@index([profileId, sortOrder])
  @@map("projects")
}

model ParsedResume {
  id               String         @id @default(cuid())
  userId           String         @map("user_id")
  profileId        String?        @map("profile_id")
  originalFileName String         @map("original_file_name") @db.VarChar(255)
  fileFormat       DocumentFormat @map("file_format")
  rawText          String         @map("raw_text") @db.Text
  parsedPayload    Json           @map("parsed_payload")
  createdAt        DateTime       @default(now()) @map("created_at")

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  profile Profile? @relation(fields: [profileId], references: [id], onDelete: SetNull)

  @@index([userId])
  @@index([profileId])
  @@map("parsed_resumes")
}

model JobPosting {
  id             String   @id @default(cuid())
  userId         String   @map("user_id")
  title          String   @db.VarChar(255)
  companyName    String   @map("company_name") @db.VarChar(255)
  jobUrl         String?  @map("job_url") @db.Text
  rawDescription String   @map("raw_description") @db.Text
  parsedSkills   String[] @map("parsed_skills")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  applications    Application[]
  tailoredResumes TailoredResume[]

  @@index([userId])
  @@index([parsedSkills], type: Gin)
  @@map("job_postings")
}

model TailoredResume {
  id              String   @id @default(cuid())
  userId          String   @map("user_id")
  profileId       String   @map("profile_id")
  jobPostingId    String   @map("job_posting_id")
  language        Language @default(EN)
  title           String   @db.VarChar(255)
  atsScore        Float?   @map("ats_score")
  missingSkills   String[] @map("missing_skills")
  tailoredSummary String?  @map("tailored_summary") @db.Text
  tailoredContent Json     @map("tailored_content")
  outreachMessage Json?    @map("outreach_message")
  interviewPrep   Json?    @map("interview_prep")
  pdfExportPath   String?  @map("pdf_export_path") @db.Text
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  profile      Profile       @relation(fields: [profileId], references: [id], onDelete: Cascade)
  jobPosting   JobPosting    @relation(fields: [jobPostingId], references: [id], onDelete: Cascade)
  applications Application[]

  @@index([userId, jobPostingId])
  @@index([profileId])
  @@index([missingSkills], type: Gin)
  @@map("tailored_resumes")
}

model Application {
  id               String            @id @default(cuid())
  userId           String            @map("user_id")
  jobPostingId     String            @map("job_posting_id")
  tailoredResumeId String?           @map("tailored_resume_id")
  status           ApplicationStatus @default(SAVED)
  sortOrder        Float             @default(0) @map("sort_order")
  appliedAt        DateTime?         @map("applied_at")
  notes            String?           @db.Text
  createdAt        DateTime          @default(now()) @map("created_at")
  updatedAt        DateTime          @updatedAt @map("updated_at")

  user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobPosting     JobPosting      @relation(fields: [jobPostingId], references: [id], onDelete: Restrict)
  tailoredResume TailoredResume? @relation(fields: [tailoredResumeId], references: [id], onDelete: SetNull)

  @@unique([userId, jobPostingId])
  @@index([userId, status, sortOrder])
  @@index([jobPostingId])
  @@index([tailoredResumeId])
  @@map("applications")
}
```

**State transitions**:

- Application kanban card state machine: `SAVED` -> `APPLIED` -> `INTERVIEWING` -> `OFFER` or `REJECTED`.
- Moving a card into `APPLIED` sets `appliedAt = new Date()`. Moving a card back into `SAVED` resets `appliedAt = null`.
- Card reordering calculates the midpoint between previous and next card sortOrder floats. If the difference between adjacent cards drops below 1e-6, the repository automatically renormalizes the column sort orders sequentially (1.0, 2.0, 3.0).

**API surface**:

| Repository Function          | File Path                       | Key inputs                                                                                                                                                                       | Key outputs                | Auth             | Key errors                                                |
| ---------------------------- | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ---------------- | --------------------------------------------------------- |
| upsertProviderSetting        | src/lib/db/provider-settings.ts | userId: string, provider: AiProvider, rawApiKey?: string, defaultModel: string, endpointUrl?: string                                                                             | UserProviderSetting        | Session required | 400 invalid provider, 500 encryption failure              |
| getActiveProviderSettings    | src/lib/db/provider-settings.ts | userId: string                                                                                                                                                                   | DecryptedProviderSetting[] | Session required | 404 no active provider, 500 decryption failure            |
| createProfileWithDetails     | src/lib/db/profiles.ts          | userId: string, language: Language, profileData, experiences, educations, skills, projects, isDefault?: boolean                                                                  | Profile with relations     | Session required | 400 validation error                                      |
| getProfilesByUser            | src/lib/db/profiles.ts          | userId: string, language?: Language                                                                                                                                              | Profile[]                  | Session required | 200 empty array                                           |
| getProfileById               | src/lib/db/profiles.ts          | userId: string, profileId: string                                                                                                                                                | Profile with relations     | Session required | 404 profile not found, 403 unauthorized                   |
| saveParsedResume             | src/lib/db/parsed-resumes.ts    | userId: string, data: { fileName, format, rawText, parsedPayload, profileId? }                                                                                                   | ParsedResume               | Session required | 400 schema validation error                               |
| getParsedResumeById          | src/lib/db/parsed-resumes.ts    | userId: string, parsedResumeId: string                                                                                                                                           | ParsedResume               | Session required | 404 not found, 403 unauthorized                           |
| createJobPosting             | src/lib/db/job-postings.ts      | userId: string, data: { title, companyName, rawDescription, jobUrl?, parsedSkills? }                                                                                             | JobPosting                 | Session required | 400 empty required fields                                 |
| getJobPostingsByUser         | src/lib/db/job-postings.ts      | userId: string                                                                                                                                                                   | JobPosting[]               | Session required | 200 empty array                                           |
| getJobPostingById            | src/lib/db/job-postings.ts      | userId: string, jobPostingId: string                                                                                                                                             | JobPosting                 | Session required | 404 not found, 403 unauthorized                           |
| createTailoredResumeSnapshot | src/lib/db/tailored-resumes.ts  | userId: string, profileId: string, jobPostingId: string, data: { title?, language, atsScore, missingSkills, tailoredSummary, tailoredContent, outreachMessage?, interviewPrep? } | TailoredResume             | Session required | 404 missing profile or job, 422 invalid payload           |
| getTailoredResumeById        | src/lib/db/tailored-resumes.ts  | userId: string, tailoredResumeId: string                                                                                                                                         | TailoredResume             | Session required | 404 not found, 403 unauthorized                           |
| createApplication            | src/lib/db/applications.ts      | userId: string, jobPostingId: string, tailoredResumeId?: string                                                                                                                  | Application                | Session required | 409 application already exists for job, 404 job not found |
| updateApplicationStage       | src/lib/db/applications.ts      | userId: string, applicationId: string, status: ApplicationStatus, targetSortOrder?: number                                                                                       | Application                | Session required | 404 card not found, 403 unauthorized                      |
| getKanbanBoard               | src/lib/db/applications.ts      | userId: string                                                                                                                                                                   | KanbanBoardGrouped         | Session required | 200 empty columns                                         |

**Value sourcing**:

| Action                     | Value produced or displayed | Source                                                                                      |
| -------------------------- | --------------------------- | ------------------------------------------------------------------------------------------- |
| Configure AI provider      | Ciphertext, iv, authTag     | Node.js crypto AES 256 GCM using application secret ENCRYPTION_KEY                          |
| Save local Ollama provider | endpointUrl                 | Input parameter supplied by user (rawApiKey is null)                                        |
| Ingest uploaded resume     | rawText and parsedPayload   | Pure Node.js pdf parse or mammoth extraction, verified by Zod schema                        |
| Create job posting         | parsedSkills                | Extracted via AI SDK keyword analysis or caller provided array                              |
| Create tailored snapshot   | title                       | Sourced from input title with fallback to `${jobPosting.companyName} - ${jobPosting.title}` |
| Tailor resume for ATS      | atsScore and missingSkills  | Vercel AI SDK gap analysis comparing JobPosting.rawDescription with Profile                 |
| Save tailored resume       | tailoredContent             | Frozen JSON snapshot of rewritten Google XYZ bullet points                                  |
| Generate outreach message  | outreachMessage             | AI SDK generation output with LinkedIn connection and InMail variants                       |
| Create application card    | sortOrder                   | Calculated as `(max existing sortOrder in SAVED column) + 1.0`, or 1.0 if column is empty   |
| Move card to APPLIED       | appliedAt                   | Automatically set to current timestamp `new Date()`; reset to null if moved back to SAVED   |
| Reorder kanban card        | sortOrder                   | Calculated midpoint `(prev + next) / 2`; normalized if gap < 1e-6                           |

**Key invariants**:

- Every non auth table row contains a userId column referencing users.id with foreign key constraints.
- Every repository function receives the verified session userId and includes it in Prisma where clauses.
- API keys are never stored as plaintext in PostgreSQL columns or logged to server consoles.
- A user may have only one active kanban card per job posting, enforced by `@@unique([userId, jobPostingId])`.
- A user may have only one default profile per language, enforced transactionally in `createProfileWithDetails` by unsetting other default flags.
- TailoredResume records are immutable historical snapshots; deleting an application sets tailored_resume_id to null and leaves the snapshot intact.
- Deleting a user account cascades cleanly across all user records without foreign key deadlocks.
- A user may have only one active setting record per AI provider, enforced by the unique constraint on `[userId, provider]`.

**Security model**:

- All operations require an authenticated session managed by Auth.js v5.
- User data isolation is enforced at the repository layer by injecting session userId into every query.
- User provider API keys are encrypted before database insertion using AES 256 GCM with unique random 12 byte initialization vectors and stored authentication tags.
- The encryption key is sourced exclusively from the environment variable ENCRYPTION_KEY and never committed to code.
- Decryption failures (tampered ciphertext or invalid key) produce structured 500 errors requiring the user to re-enter their provider key.

**Configuration required**:

- `DATABASE_URL`: PostgreSQL connection string (for example postgresql://postgres:postgres@localhost:5432/careercraft)
- `ENCRYPTION_KEY`: 32 byte hex or base64 secret string used for AES 256 GCM key encryption
- `AUTH_SECRET`: Random string used by Auth.js to hash tokens and secure sessions

**Critical test scenarios**:

- Happy path: User creates profile, saves encrypted OpenAI key, generates tailored resume snapshot, and moves application from SAVED to APPLIED, verifies **AC-1**, **AC-2**, **AC-3**, **AC-6**, **AC-7**
- Failure case: Concurrent attempts to save credentials for the same provider update the existing record cleanly through upsert rather than generating duplicate rows, verifies **AC-2**
- Failure case: Attempting to create a duplicate application card for the same job posting throws a 409 conflict, verifies **AC-7**
- Failure case: Deleting an application card leaves the associated JobPosting and TailoredResume records intact in the database, verifies **AC-8**
- Failure case: Deleting a user account with existing profiles, job postings, tailored resumes, and applications cascades cleanly without foreign key violations, verifies **AC-8**
- Auth and permission: User B attempts to read or mutate User A profiles or applications, query returns not found or rejects with unauthorized, verifies **AC-1**, **AC-8**

## Build plan

1. [x] Write the complete schema definition in `prisma/schema.prisma` covering all ten domain models, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**
2. [x] Generate and run the initial database migration with `npx prisma migrate dev --name init_careercraft_core`, satisfies **AC-1**, **AC-8**
3. [x] Create symmetric encryption and decryption helpers in `src/lib/crypto.ts` supporting AES 256 GCM with unit tests in `src/lib/crypto.test.ts`, satisfies **AC-2**
4. [x] Define Zod validation schemas in `src/lib/validations/` for parsed resume payloads, tailored snapshots, and provider settings, satisfies **AC-4**, **AC-6**
5. [x] Implement user scoped repository functions in `src/lib/db/` for provider settings, profiles, parsed resumes, job postings, tailored resumes, and applications, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**
6. [x] Build a seed script in `prisma/seed.ts` populating sample bilingual profiles (Arabic and English) with realistic work experience, skills, and kanban applications, satisfies **AC-3**, **AC-7**
7. [x] Implement integration tests in `src/lib/db/repository.test.ts` validating relational cascade rules, unique indexes, and isolation across users, satisfies **AC-1**, **AC-8**

## Consequences

**Positive**:

- A single coherent migration sets up the entire data layer so future feature slices (tailoring, ingestion, kanban) build on concrete tables without schema churn.
- User API keys remain confidential even in the event of database dumps or read replica exposures.
- Candidate work experience is stored relationally for fast filtering, while tailored versions remain frozen as JSON snapshots that never degrade when master profiles change.
- Native bilingual support allows users to maintain distinct English and Arabic career profiles seamlessly.
- Foreign key indexes and GIN indexes guarantee fast lookups for kanban boards and skill queries.

**Negative / tradeoffs**:

- Storing frozen JSON payloads in TailoredResume duplicates some text content across versions, increasing disk footprint over time.
- Encrypting API keys requires maintaining a persistent ENCRYPTION_KEY secret across deployments; losing this key invalidates all saved user provider credentials.

**Neutral**:

- Developers must run PostgreSQL 16 via Docker Compose or local installation to execute migrations and tests.
- Reordering kanban cards requires floating point sortOrder arithmetic in application code with normalization when card spacing drops below threshold.

## Follow-up

- [ ] Add `ENCRYPTION_KEY` to `.env.example` with clear instructions on generating a secure 32 byte secret.
- [ ] Add `src/lib/db/AGENTS.md` during implementation to document database access patterns and user scoping rules for subagents.
