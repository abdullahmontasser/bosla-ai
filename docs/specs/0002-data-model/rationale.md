# Rationale: Core Relational and Structured JSON Schema for CareerCraft AI

## Context

CareerCraft AI requires a robust data model to support its entire application lifecycle across all planned slices. The platform acts as an autonomous career agent that ingests candidate resumes, extracts structured experience, tailors bullet points against specific job descriptions using user configured AI provider keys, exports ATS compliant single column PDFs, and tracks applications across kanban columns.

Several architectural forces shape this data model. First, candidate resumes contain both structured relational data (such as dates, company names, job titles, institutions, and degrees) and unstructured or semi structured text (such as raw uploaded PDF text, bullet points, and AI generated advice). Second, users bring their own AI provider keys (BYOK), demanding secure storage at rest without placing secrets in plain text database columns. Third, the platform is bilingual first, requiring clean separation and representation of English and Arabic career profiles and tailored outputs without data corruption or awkward encoding. Fourth, tailored resumes and application tracker stages require historical immutability; modifying a master profile must not alter past resume versions that were already submitted to employers.

Without a deliberated foundational schema, each subsequent feature slice would introduce fragmented, conflicting database migrations. This would lead to broken foreign keys, leaky user isolation, and difficult schema refactoring once production data accumulates.

## Options considered

### Option 1: Hybrid relational tables with structured JSON columns in PostgreSQL via Prisma ORM

This approach uses dedicated relational tables for primary business entities (User, Profile, WorkExperience, Education, Skill, JobPosting, Application) and stores variable payloads (raw parser extractions, tailored resume snapshots, generated outreach messages) inside PostgreSQL JSONB columns validated by application level Zod schemas.

**Pros**:

- Combines relational integrity and foreign key constraints with document flexibility where schemas evolve.
- Frozen JSON snapshots keep tailored resumes immutable without requiring complex multi table version trees.
- Fast indexed lookups for user profiles, active applications, and kanban stages.
- Supported directly by Prisma ORM and PostgreSQL 16.

**Cons**:

- Requires discipline in application code to validate JSON payloads using Zod before writes and after reads.
- Duplicates some resume text across historical snapshots, slightly increasing storage volume.

### Option 2: Pure fully normalized relational schema

This option decomposes every entity into relational tables down to individual bullet points, skill tags, outreach paragraphs, and interview questions with foreign key relationships.

**Pros**:

- Enforces strict database level validation and relational consistency on every individual text fragment.
- Eliminates text duplication across resume revisions.

**Cons**:

- Requires complex multi table joins and deeply nested Prisma queries to reconstruct a single tailored resume.
- Makes versioning tailored resumes cumbersome, needing revision tables and junction tables for frozen states.
- High migration complexity whenever AI tailoring prompts add new structured metadata fields.

### Option 3: Document model with single JSONB column per domain entity

This option stores the entire candidate profile and all tailored resumes as broad JSONB documents attached directly to the User record.

**Pros**:

- Maximum flexibility with almost zero migration overhead during early development.
- Simple reads that return the complete document in a single query.

**Cons**:

- Sacrifices database foreign keys, cascade delete safety, and relational indexing.
- Concurrent updates to different parts of a profile or kanban card risk overwriting the entire document.
- Querying and filtering applications across statuses or job titles requires complex JSON path queries in PostgreSQL.

## Rationale

We selected Option 1 because it directly addresses the dual nature of CareerCraft AI: strict relational tracking for user accounts, applications, and work history, alongside frozen document snapshots for AI generated tailoring.

A career platform cannot afford loose data integrity for its core business pipeline. Users must own their data securely, applications must tie cleanly to target companies, and kanban cards need fast indexed status updates. Relational tables provide these guarantees with native foreign keys, cascading deletions on user removal, and strict unique constraints.

At the same time, resume tailoring is an generative process producing rich, evolving artifacts including matched keywords, missing skills, Google XYZ bullet points, and custom outreach notes. Modeling every generated sentence into normalized relational tables creates unnecessary database friction and complex joins without practical benefit. Storing the tailored result as a validated JSON snapshot inside TailoredResume guarantees historical immutability: when a candidate updates their master profile next month, previously submitted resumes remain preserved exactly as they were delivered to employers.

For sensitive AI provider keys, Option 1 pairs dedicated relational records in UserProviderSetting with application layer AES 256 GCM encryption. Storing ciphertext, initialization vector, and authentication tag across distinct columns ensures that database backups or read replicas never expose raw credentials.
