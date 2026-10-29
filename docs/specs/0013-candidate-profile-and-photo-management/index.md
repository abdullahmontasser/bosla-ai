# 0013. Candidate profile and photo management

**Date**: 2026-10-28
**Status**: Accepted

## Summary

This specification introduces a dedicated candidate profile hub at `/[lang]/profile` that decouples candidate identity and master resume data from the tailoring studio. You can edit your personal details, crop and save a circular avatar directly to your user account, manage bilingual profile copy in English and Arabic, and maintain structured work experiences, education, skills, and projects. Other workspace surfaces such as the tailoring studio, resume view, and application tracker read from this single source of truth automatically.

## Requirements

**User stories**:

- As a candidate, I want a dedicated profile hub at `/[lang]/profile` so I can manage my professional identity without navigating away to the tailoring studio.
- As a candidate, I want to upload, zoom, and crop my avatar image in a modal dialog so that my photo renders cleanly across the workspace.
- As a candidate working in a bilingual market, I want to switch between English and Arabic master profiles while sharing my core photo and contact identity.
- As a candidate, I want to manage my work experiences, education, skills, and projects with explicit ordering so that downstream resume tailoring starts from accurate, structured records.
- As a candidate, I want changes made in my master profile to immediately reflect in my tailored resumes and workspace header without stale caching.

**Acceptance criteria**:

- **AC-1**: Serve `/[lang]/profile` for English and Arabic under page level session protection, with a two column responsive layout on desktop and a single column layout on mobile screens down to 375px.
- **AC-2**: Support avatar photo upload through an accessible modal dialog featuring an interactive HTML5 Canvas crop tool with circle mask, pan, zoom slider, and client side WebP compression capped at 256 by 256 pixels and 50 KB, persisted to `User.image` through `PATCH /api/profile/avatar`.
- **AC-3**: Render an elegant monogram fallback avatar with user initials on a brand gradient background whenever no avatar image is uploaded.
- **AC-4**: Provide a core identity card allowing editing of full name, professional headline, summary, email, phone, location, personal website, LinkedIn URL, and GitHub URL, saving via `PUT /api/profile/identity` with Zod validation.
- **AC-5**: Provide structured management cards for Work Experiences, Education, Skills, and Projects with sortOrder integer tracking, accessible up down reordering buttons, add, edit, and delete operations.
- **AC-6**: Provide a bilingual profile toggle allowing candidates to maintain distinct localized resume copy (headline, summary, experiences, education, skills, projects) for English and Arabic, with automatic initial profile seeding on first visit from user credentials.
- **AC-7**: Trigger target path revalidation inside API handlers for `/profile`, `/[lang]/tailor`, and `/[lang]/resume` so that downstream surfaces immediately reflect updated master profile data.
- **AC-8**: Cover profile API route handlers, avatar sanitization, and profile view components with Vitest tests, verifying typecheck, lint, and formatting.

## Decision

**Chosen option**: Option 1: Dedicated master profile hub with native HTML5 Canvas crop modal, REST API routes under `/api/profile/*`, and bilingual profile records.

We build a dedicated hub at `/[lang]/profile` backed by lightweight REST endpoints in `src/app/api/profile/`. Candidate photos are cropped and compressed client side with native HTML5 Canvas into compact WebP data URIs stored directly in `User.image`, eliminating external file storage dependencies. Master profiles reuse the existing relational schema in PostgreSQL through Prisma, maintaining one profile per language with explicit sortOrder controls.

**Implementation skills**: `nextjs-app-router-patterns` (`wshobson/agents`, `.agents/skills/nextjs-app-router-patterns/`) · `arabic-rtl-best-practices` (`almubarmij/arabic-ai-skills`, `.agents/skills/arabic-rtl-best-practices/`) · `prisma-client-api` (`prisma/skills`, `.agents/skills/prisma-client-api/`) · `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `ux-writing-arabic` (`almubarmij/arabic-ai-skills`, `.agents/skills/ux-writing-arabic/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch**:

The feature reuses the existing Prisma relational models without breaking migrations:

- `User`:
  - `id`: String (cuid primary key)
  - `name`: String?
  - `email`: String (unique)
  - `image`: String? (Stores cropped base64 WebP data URI, max 50 KB)
  - `updatedAt`: DateTime
- `Profile`:
  - `id`: String (cuid primary key)
  - `userId`: String (foreign key referencing `User.id` with cascade delete)
  - `language`: Language enum (`EN`, `AR`)
  - `fullName`: String (VarChar 255)
  - `headline`: String? (VarChar 255)
  - `summary`: String? (Text)
  - `email`: String? (VarChar 255)
  - `phone`: String? (VarChar 50)
  - `location`: String? (VarChar 255)
  - `websiteUrl`: String? (Text)
  - `linkedinUrl`: String? (Text)
  - `githubUrl`: String? (Text)
  - `isDefault`: Boolean (default false)
  - Invariant: Maximum of one profile per language per user
- `WorkExperience`:
  - `id`: String (cuid primary key)
  - `profileId`: String (foreign key referencing `Profile.id` with cascade delete)
  - `companyName`: String (VarChar 255)
  - `jobTitle`: String (VarChar 255)
  - `location`: String? (VarChar 255)
  - `startDate`: DateTime
  - `endDate`: DateTime?
  - `isCurrent`: Boolean (default false)
  - `bullets`: String array
  - `sortOrder`: Int (default 0)
- `Education`:
  - `id`: String (cuid primary key)
  - `profileId`: String (foreign key referencing `Profile.id` with cascade delete)
  - `institution`: String (VarChar 255)
  - `degree`: String (VarChar 255)
  - `fieldOfStudy`: String? (VarChar 255)
  - `startDate`: DateTime?
  - `endDate`: DateTime?
  - `grade`: String? (VarChar 50)
  - `sortOrder`: Int (default 0)
- `Skill`:
  - `id`: String (cuid primary key)
  - `profileId`: String (foreign key referencing `Profile.id` with cascade delete)
  - `name`: String (VarChar 128)
  - `category`: String? (VarChar 64)
  - `proficiency`: String? (VarChar 32)
  - `sortOrder`: Int (default 0)
- `Project`:
  - `id`: String (cuid primary key)
  - `profileId`: String (foreign key referencing `Profile.id` with cascade delete)
  - `name`: String (VarChar 255)
  - `description`: String (Text)
  - `role`: String? (VarChar 128)
  - `technologies`: String array
  - `url`: String? (Text)
  - `sortOrder`: Int (default 0)

**State transitions**:

Avatar state:
`Empty (monogram fallback)` -> `File Selected` -> `Modal Crop & Zoom` -> `Saving` -> `Persisted (data URI in User.image)` -> `Removed (back to monogram)`

Profile language state:
`No Profile` -> `Auto Seeded Default (EN or AR based on locale)` -> `Active Profile Loaded` -> `Language Switched` -> `Alternate Profile Initialized or Loaded`

**API surface**:

| Endpoint                        | Method | Key inputs                                                                                                                                                                                   | Key outputs                                                    | Auth             | Key errors                                                    |
| ------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | ---------------- | ------------------------------------------------------------- |
| `/api/profile`                  | GET    | `language?: Language`                                                                                                                                                                        | `{ user, profile, experiences, educations, skills, projects }` | Session required | 401 Unauthorized, 500 Server Error                            |
| `/api/profile/avatar`           | PATCH  | `image: string \| null` (base64 WebP data URI or null to clear)                                                                                                                              | `{ success: true, image: string \| null }`                     | Session required | 400 Payload too large / invalid format, 401 Unauthorized      |
| `/api/profile/identity`         | PUT    | `profileId: string, fullName: string, headline?: string, summary?: string, email?: string, phone?: string, location?: string, websiteUrl?: string, linkedinUrl?: string, githubUrl?: string` | `{ success: true, profile: Profile }`                          | Session required | 400 Validation error, 401 Unauthorized, 404 Profile not found |
| `/api/profile/experiences`      | POST   | `profileId: string, companyName: string, jobTitle: string, location?: string, startDate: string, endDate?: string, isCurrent: boolean, bullets: string[], sortOrder?: number`                | `{ success: true, experience: WorkExperience }`                | Session required | 400 Validation error, 401 Unauthorized                        |
| `/api/profile/experiences/[id]` | PUT    | `companyName: string, jobTitle: string, location?: string, startDate: string, endDate?: string, isCurrent: boolean, bullets: string[], sortOrder?: number`                                   | `{ success: true, experience: WorkExperience }`                | Session required | 400 Validation error, 401 Unauthorized, 404 Not found         |
| `/api/profile/experiences/[id]` | DELETE | None                                                                                                                                                                                         | `{ success: true }`                                            | Session required | 401 Unauthorized, 404 Not found                               |
| `/api/profile/educations`       | POST   | `profileId: string, institution: string, degree: string, fieldOfStudy?: string, startDate?: string, endDate?: string, grade?: string, sortOrder?: number`                                    | `{ success: true, education: Education }`                      | Session required | 400 Validation error, 401 Unauthorized                        |
| `/api/profile/educations/[id]`  | PUT    | `institution: string, degree: string, fieldOfStudy?: string, startDate?: string, endDate?: string, grade?: string, sortOrder?: number`                                                       | `{ success: true, education: Education }`                      | Session required | 400 Validation error, 401 Unauthorized, 404 Not found         |
| `/api/profile/educations/[id]`  | DELETE | None                                                                                                                                                                                         | `{ success: true }`                                            | Session required | 401 Unauthorized, 404 Not found                               |
| `/api/profile/skills`           | POST   | `profileId: string, name: string, category?: string, proficiency?: string, sortOrder?: number`                                                                                               | `{ success: true, skill: Skill }`                              | Session required | 400 Validation error, 401 Unauthorized                        |
| `/api/profile/skills/[id]`      | DELETE | None                                                                                                                                                                                         | `{ success: true }`                                            | Session required | 401 Unauthorized, 404 Not found                               |
| `/api/profile/projects`         | POST   | `profileId: string, name: string, description: string, role?: string, technologies: string[], url?: string, sortOrder?: number`                                                              | `{ success: true, project: Project }`                          | Session required | 400 Validation error, 401 Unauthorized                        |
| `/api/profile/projects/[id]`    | PUT    | `name: string, description: string, role?: string, technologies: string[], url?: string, sortOrder?: number`                                                                                 | `{ success: true, project: Project }`                          | Session required | 400 Validation error, 401 Unauthorized, 404 Not found         |
| `/api/profile/projects/[id]`    | DELETE | None                                                                                                                                                                                         | `{ success: true }`                                            | Session required | 401 Unauthorized, 404 Not found                               |
| `/api/profile/reorder`          | POST   | `section: 'experiences' \| 'educations' \| 'skills' \| 'projects', itemIds: string[]`                                                                                                        | `{ success: true }`                                            | Session required | 400 Invalid section or items, 401 Unauthorized                |

**Value sourcing**:

| Action              | Value produced / displayed                    | Source                                                                        |
| ------------------- | --------------------------------------------- | ----------------------------------------------------------------------------- |
| Load profile hub    | User avatar image                             | `User.image` in database                                                      |
| Load profile hub    | Fallback monogram letters                     | Derived from `User.name` or `Profile.fullName` uppercase initial letters      |
| Load profile hub    | Active language profile data                  | `Profile` record matching `userId = session.user.id` and requested `language` |
| Save avatar         | Base64 WebP image string                      | Client HTML5 Canvas cropped output                                            |
| Update identity     | Full name, headline, summary, contact links   | Form inputs in Identity card                                                  |
| Save resume items   | Experience, education, skill, project details | Form inputs in section dialogs or edit rows                                   |
| Reorder items       | Integer `sortOrder` values                    | Array index order from client reorder action                                  |
| First visit seeding | Initial default profile                       | `User.name` and `User.email` from active session                              |

**Key invariants**:

- Every profile query and mutation must filter strictly by `userId = session.user.id`.
- The cropped avatar string must be a valid WebP data URI whose decoded size does not exceed 50 KB.
- Users can have at most one Profile record per Language (`EN` and `AR`).
- Reordering items updates `sortOrder` monotonically in one atomic database transaction.
- When an avatar is updated, `revalidatePath` runs for `/profile`, `/[lang]/tailor`, and `/[lang]/resume`.

**Security model**:

- Authentication: Page level protection via `requireSession`, redirecting unauthenticated visitors to login.
- Ownership: Every database query and mutation requires `userId = session.user.id`. Users cannot view or modify profiles belonging to other accounts.
- Sanitization: Avatar files undergo client canvas rendering which strips all EXIF metadata and produces a pure WebP bitmap. Inputs are validated with strict Zod schemas against script injection and cross site scripting.

**Configuration required**:

None. The feature runs entirely on existing database models and native browser APIs without external API keys or storage buckets.

**Critical test scenarios**:

- Happy path: User uploads an image, crops it with circle mask and zoom, saves it, and sees the new avatar across `/profile` and header navigation, verifying **AC-2** and **AC-3**.
- Happy path: User edits their headline, adds a work experience, and switches between English and Arabic profiles to verify data localization, verifying **AC-4**, **AC-5**, and **AC-6**.
- Failure case: User uploads a corrupted image or file exceeding 5 MB; client validation rejects the upload with an informative toast and leaves current avatar intact, verifying **AC-2**.
- Failure case: User submits an invalid URL format in contact links; Zod validation returns descriptive inline errors without mutating the database, verifying **AC-4**.
- Auth and permission: An unauthenticated request to `/api/profile/*` receives 401 Unauthorized, and unauthorized modification of another candidate's experience item receives 404 Not Found, verifying **AC-1** and **AC-8**.

## Build plan

The build plan follows a Tracer Bullet approach, standing up a vertical slice through every layer first, then adding features incrementally:

1. [x] **Tracer bullet foundation slice**: Create the profile page route at `src/app/[lang]/profile/page.tsx` with `requireSession`, seed default profile on first visit, implement `GET /api/profile` and `PUT /api/profile/identity`, and verify end to end identity editing, satisfies **AC-1**, **AC-4**, **AC-6**.
2. [x] **Avatar crop and management slice**: Build the accessible avatar upload modal with native HTML5 Canvas cropping, zoom slider, circle mask, WebP compression, and `PATCH /api/profile/avatar`, satisfies **AC-2**, **AC-3**.
3. [x] **Structured experience and education slice**: Build CRUD cards and modal forms for Work Experiences and Education with up down reordering and API routes, satisfies **AC-5**.
4. [x] **Skills and projects slice**: Build skills tagging and project cards with add, edit, delete, and reorder controls, satisfies **AC-5**.
5. [x] **Bilingual switching and downstream sync**: Add the English and Arabic profile toggle, language scoped record fetching, and path revalidation for `/profile`, `/[lang]/tailor`, and `/[lang]/resume`, satisfies **AC-6**, **AC-7**.
6. [x] **Workspace integration and test suite**: Add the Profile link into `WorkspaceHeader` and `AccountMenu`, verify responsive layout down to 375px, and write Vitest unit tests for avatar processing and API handlers, satisfies **AC-1**, **AC-8**.

## Consequences

**Positive**:

- Candidate identity and master resume data are cleanly decoupled from the tailoring studio, providing a dedicated space for profile maintenance.
- Zero external image hosting costs or third party bucket configuration, keeping self hosting simple and reliable.
- Downstream tools like resume tailoring and application tracking read from a consolidated master profile without duplication.
- Arabic and English profiles can be maintained side by side, supporting bilingual job seekers natively.

**Negative / tradeoffs**:

- Storing base64 avatar images in the database increases row size for the `users` table, mitigated by strict 50 KB WebP compression caps.
- Manual up down reordering requires extra clicks compared to drag and drop, but guarantees flawless mobile touch and keyboard accessibility.

**Neutral**:

- Existing users without profile records will receive an automatic default profile initialized from their user account on first visit.

## Follow-up

- [ ] Add the Profile navigation item into `WorkspaceHeader` and mobile drawer after `/profile` route implementation.
- [ ] Ensure downstream tailoring and ATS scoring components read the candidate photo and contact links directly from master profile data.
