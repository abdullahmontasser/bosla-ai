# Rationale: Core Resume Tailoring Thread

## Context

CareerCraft AI requires a foundational walking skeleton that proves the complete application loop before deeper feature slices are tackled. While foundational specifications established the relational schema (spec 0002), bilingual design tokens (spec 0003), and BYOK provider settings (spec 0004), no end to end thread yet connects user authentication, active provider decryption, AI streaming inference, and persistent snapshot storage.

Without this walking skeleton, subsequent features like document parsing (Slice 2) and PDF export (Slice 3) would have to invent integration patterns on the fly. Proving this pipe early exposes integration friction between Auth.js v5 session handling, Vercel AI SDK text streams, and PostgreSQL transaction commits in Next.js App Router.

The primary forces driving this design are:

1. **Immediate feedback**: Job seekers need to see real time streaming progress rather than waiting tens of seconds for a blocking batch completion.
2. **Provider neutrality**: Inference must execute seamlessly across any active user provider (OpenAI, Anthropic, Gemini, Groq, or Ollama) using secure server side decryption.
3. **Frictionless local development**: Developers and reviewers need to authenticate and test tailoring immediately without registering external OAuth applications or setting up SMTP mail servers.
4. **Bilingual symmetry**: The studio interface and AI prompt engine must handle English and Arabic inputs with proper directional layout and typography.
5. **Data persistence**: Tailoring output must not remain ephemeral; it must be structured and saved into PostgreSQL records so future slices can attach ATS scoring and export workflows.

## Options considered

### Option 1: Unified studio route handler with Vercel AI SDK text streaming and post stream JSON persistence (Recommended)

Build a unified bilingual studio page that pairs candidate background editing and job posting input with a live streaming preview panel. A standard Next.js App Router POST route handler decrypts the active provider key in server memory, calls Vercel AI SDK `streamText`, streams tokens using a text stream response, and executes an `onFinish` handler that parses section delimiters and writes the finalized snapshot to PostgreSQL.

**Pros**:

- Uses battle tested Vercel AI SDK primitives that work reliably across all cloud providers and local Ollama endpoints.
- Provides instant visual feedback with live token rendering while guaranteeing database persistence when generation finishes.
- Keeps the entire user experience on a single focused screen, reducing page transitions and state loss.

**Cons**:

- Parsing streaming markdown delimiters (`### SUMMARY` and `### BULLETS`) requires defensive parsing logic to handle potential model formatting deviations.

### Option 2: Multi step wizard with Server Action streamable UI values

Break the studio into a sequential multi step wizard (Step 1: Profile, Step 2: Job, Step 3: Stream, Step 4: Review), using experimental Server Actions returning streamable UI promises.

**Pros**:

- Guides users through discrete steps with focused form inputs per screen.

**Cons**:

- Multi step wizards introduce extra friction for repeated tailoring iterations.
- Streamable UI values (`ai/rsc`) are deprecated in modern Vercel AI SDK patterns in favor of standard route handler streams and text hooks.
- Increases client state management complexity across step boundaries.

### Option 3: Ephemeral client side streaming with manual user save button

Stream tokens ephemerally to the browser without creating database records upfront, requiring the user to explicitly click a Save Resume button after generation completes.

**Pros**:

- Avoids saving intermediate drafts or aborted generation runs into PostgreSQL.

**Cons**:

- Disconnections or accidental tab closures result in permanent loss of generated content and consumed AI tokens.
- Shifts snapshot persistence responsibility to the browser, violating the core Tracer Bullet goal of proving server side database writes as part of the streaming lifecycle.

## Rationale

We selected Option 1 because it represents the most robust, maintainable, and user friendly architecture for CareerCraft AI.

Connecting an App Router route handler directly to Vercel AI SDK `streamText` guarantees smooth token transport without relying on fragile or deprecated streaming abstractions. Running the persistence logic inside the server side `onFinish` callback ensures that completed tailoring runs are saved to PostgreSQL even if the user navigates away right as generation finishes.

Furthermore, a unified studio workspace matches how job seekers actually iterate on job applications: modifying a couple of experience bullets, adjusting the target job requirements, and immediately watching the tailored output adapt side by side. Pairing this with a simple Credentials auth provider and seeded demo user ensures that any developer or reviewer can boot the application and verify the entire pipe in under two minutes without external setup hurdles.
