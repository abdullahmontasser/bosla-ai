# 0013. Candidate profile and photo management: Rationale

## Context

Bosla AI began with an inline candidate profile editor embedded inside the tailoring studio at `/[lang]/tailor`. While this served early prototypes, embedding master profile editing within a job specific tailoring workbench introduced friction. Candidates wanting to update contact details, upload a profile photo, or add a newly acquired skill had to navigate into tailoring, cluttering the studio with global profile forms.

Furthermore, candidate avatars were not supported in the database or UI. Candidates targeting international and regional markets need professional headshots on their profiles and generated resumes. Photo handling in web applications frequently creates operational overhead: configuring cloud storage buckets, managing signed upload URLs, and coordinating asynchronous webhooks. For a self hosted open source product, adding third party bucket infrastructure raises the barrier to deployment.

Finally, Bosla is a bilingual first product serving Arabic and English speaking candidates. Job seekers often tailor Arabic resumes for regional positions in the Middle East and North Africa while maintaining English profiles for international remote roles. The architecture must enable candidates to maintain localized professional summaries and work histories without duplicating accounts or avatars.

## Options considered

### Option 1: Dedicated master profile hub with native HTML5 Canvas crop and REST endpoints (Chosen)

Build a dedicated route at `/[lang]/profile` that handles both personal identity and structured resume sections. Photos are cropped client side in an interactive modal using HTML5 Canvas, exported as compressed WebP bitmaps under 50 KB, and saved directly to `User.image` via a lightweight REST endpoint. Localized profiles are maintained per language (English and Arabic) under the same user account.

**Pros**:

- Zero external infrastructure required; no S3 buckets, access keys, or image proxies to configure.
- Interactive cropping gives candidates full control over zoom, position, and circular framing before any data leaves the browser.
- REST endpoints under `/api/profile/*` provide clean JSON request and response contracts with straightforward error handling.
- Keeps master profile management completely separate from job tailoring workflows.

**Cons**:

- Storing base64 encoded images directly in the PostgreSQL `users` table slightly increases database row size, though bounded by strict 50 KB limits.

### Option 2: Monolithic single form with external npm image cropping library

Add heavy client dependencies such as `react-image-crop` or `cropperjs` to handle photo manipulation, coupled with a monolithic form that submits all personal details, experiences, and education records in one massive mutation payload.

**Pros**:

- Ready made touch gesture handlers from the cropping library.
- Single save button at the bottom of the page saves everything at once.

**Cons**:

- Increases JavaScript client bundle size by 30 to 50 KB for rarely used cropping dependencies.
- A single validation failure in one work experience bullet blocks saving phone or email updates.
- Poor user experience on mobile screens where editing long multi section forms in one continuous scroll leads to accidental data loss.

### Option 3: Lightweight identity only card without resume sections

Limit `/profile` strictly to photo upload, name, headline, and contact links, leaving work experiences, education, and skills solely inside the resume parsing and tailoring screens.

**Pros**:

- Quick to build with minimal API surface.
- Avoids building section level CRUD cards for work experiences and education.

**Cons**:

- Leaves the tailoring studio cluttered with inline resume editing.
- Forces candidates to perform mock resume imports just to edit a single job title or bullet point.
- Does not solve the fundamental problem of providing a single master source of truth for candidate career data.

## Rationale

Option 1 is selected because it satisfies the core product goals with minimal operational friction.

By utilizing native browser HTML5 Canvas for image cropping and pan controls, we achieve an interactive user experience without adding external npm package dependencies. Canvas rendering also provides a security benefit: drawing the user image to an in memory canvas element and exporting it to WebP strips out any EXIF metadata, camera location tags, and malicious payloads before the bytes reach the server.

Storing the cropped 256 by 256 WebP image directly in `User.image` as a compact data URI allows instant loading during server side rendering of the workspace header and profile views. At under 50 KB per user, PostgreSQL handles this data volume with zero degradation.

Adopting granular REST endpoints under `/api/profile/*` gives each section independent save cycles. A candidate editing a single work experience does not risk overwriting their contact details, and validation errors are surfaced in place. This modular structure aligns with the Tracer Bullet build strategy, proving the end to end pipe with core identity first, then expanding to structured resume sections.
