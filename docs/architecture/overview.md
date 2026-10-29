# System Architecture Overview

This document explains the technical architecture of CareerCraft AI (Bosla AI). It covers system boundaries, runtime layers, data pipelines, and security mechanisms.

## System Topology

CareerCraft AI runs as a modern full stack web application powered by Next.js App Router, React 19, TypeScript, PostgreSQL 16, and Prisma ORM.

The runtime consists of four primary tiers:

1. **Client Tier**: Server rendered pages hydrate interactive React 19 islands wrapped in Radix UI primitives with Tailwind CSS v4 design tokens. Client components manage local interactions such as avatar cropping, drag and drop reordering, audio and canvas elements, and streaming updates.
2. **Edge and Proxy Tier**: Next.js middleware and proxy handlers negotiate locale preferences (`en` or `ar`), parse RFC 9110 quality values, guard authenticated workspace routes, and attach security headers.
3. **Application and Server Tier**: Server Components fetch tenant scoped data directly from PostgreSQL via Prisma. Server Actions and REST route handlers execute business mutations, handle file uploads, verify credentials, coordinate transactional emails via Resend, and stream AI model responses using the Vercel AI SDK.
4. **Data and Persistence Tier**: PostgreSQL 16 stores user identities, encrypted provider credentials, candidate master profiles, tailored resume snapshots, job applications, and health audit metrics.

```
       [ Client Browser (LTR English / RTL Arabic) ]
                            │
                            ▼
          [ Next.js Middleware & Route Proxy ]
        (Locale negotiation, session gate, auth)
                            │
       ┌────────────────────┴────────────────────┐
       ▼                                         ▼
[ Server Components ]                   [ Server Actions & API ]
(Hydration & initial data)              (Mutations, uploads, AI)
       │                                         │
       └────────────────────┬────────────────────┘
                            │
                            ▼
               [ Domain Services & Engines ]
     (ATS Scoring, Resume Health, PDF Generator, AI SDK)
                            │
                            ▼
                   [ Prisma Client ]
                            │
                            ▼
                [ PostgreSQL 16 Database ]
```

## Directory Structure and Domain Boundaries

The application organizes source code by domain concern inside `src/`:

- `src/app/`: Next.js App Router page routes, route handlers, layouts, error boundaries, and server actions.
  - `src/app/[lang]/`: Localized application routes supporting English (`/en`) and Arabic (`/ar`).
  - `src/app/api/`: REST endpoints for streaming tailoring, profile mutations, vector PDF export, and telemetry.
  - `src/app/actions/`: Type safe Next.js Server Actions for authentication, resume ingestion, ATS scoring, health audits, and application tracking.
- `src/components/`: Reusable interface components and client interactive islands.
  - `src/components/ui/`: Accessible design system primitives built with Radix UI and Tailwind CSS v4.
  - `src/components/health/`: Base resume health gauges, issue cards, undo toasts, and rewrite modals.
  - `src/components/profile/`: Candidate profile hub, avatar canvas crop dialog, and section editors.
  - `src/components/tailor/`: Job description analysis, provider switches, and streaming tailor output.
  - `src/components/ats/`: ATS match scoring dials, skill gap chips, and Google XYZ rewrite cards.
  - `src/components/tracker/`: Drag and drop kanban board, stage columns, and application drawers.
  - `src/components/workspace/`: Navigation bar, mobile drawer, and session aware account menu.
  - `src/components/landing/`: Marketing homepage with interactive workflow demos and GSAP animations.
- `src/lib/`: Core backend and domain logic.
  - `src/lib/ai/`: Multi provider AI integration, prompt factories, and model routing.
  - `src/lib/ats/`: Deterministic keyword extraction and match scoring algorithms.
  - `src/lib/health/`: Resume health audit rules, category evaluators, and queries.
  - `src/lib/pdf/`: Headless vector PDF generation with Arabic BiDi glyph reshaping.
  - `src/lib/parsing/`: Buffer level PDF and DOCX text extraction with magic byte checks.
  - `src/lib/db/`: Prisma singleton and tenant scoped repository helpers.
  - `src/lib/auth/`: Session helpers, email verification, password reset, and account linking.
  - `src/lib/crypto.ts`: AES-256-GCM symmetric key encryption routines.
  - `src/lib/i18n/`: Translation loader, dictionary types, and direction utilities.
- `src/dictionaries/`: Canonical English (`en.json`) and Arabic (`ar.json`) translations.

## Core Architectural Patterns

### 1. Tenant Scoped Isolation

Every mutation and query strictly scopes data access to the authenticated user ID (`session.user.id`). Repository functions in `src/lib/db/` enforce relational foreign key checks so candidates can never inspect, alter, or delete records belonging to another account.

### 2. Server Components by Default

Interactive client components are marked explicitly with `'use client'` only when they require browser events, local state, or DOM APIs. Data fetching, template rendering, and initial state calculations execute on the server, keeping browser bundle sizes compact and preventing secret leaks.

### 3. Bring Your Own Key (BYOK) Multi Provider AI

CareerCraft AI does not lock you into a single proprietary AI model. You supply your own API keys for Anthropic Claude, OpenAI, Google Gemini, Groq, or local Ollama. Keys are encrypted at rest using AES-256-GCM in PostgreSQL and decrypted in memory only for the duration of the API call.

### 4. Zero Hallucination Guardrails

Resume optimization prompts enforce grounding rules based on verified candidate experience. AI rewrites are prohibited from inventing dates, company names, degrees, or unverified statistical achievements.

### 5. In Memory Headless Vector PDF

Rather than launching expensive headless Chromium browsers via Puppeteer, the PDF export pipeline runs in memory using `@react-pdf/renderer`. It applies custom font embedding and Arabic glyph shaping to generate crisp, searchable, ATS friendly vector PDFs in milliseconds.
