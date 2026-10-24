# 0001 Rationale: Adopt Next.js App Router, PostgreSQL, Prisma, Auth.js, and Vercel AI SDK for Core Foundation

## Context

CareerCraft AI is an open source career agent and portfolio showcase designed to help job seekers tailor resumes, generate outreach messages, and prepare for interviews. The platform operates on a Bring Your Own Key (BYOK) model where users supply their own credentials for providers such as OpenAI, Anthropic, Gemini, Groq, or local Ollama instances.

Building this platform introduces several load bearing technical forces:
First, artificial intelligence response latency must feel instantaneous, requiring streaming text generation with time to first token under two seconds.
Second, the system requires complete bilingual fidelity in Arabic and English, demanding bidirectional text layouts (right to left and left to right), Arabic typography, and locale based routing.
Third, document ingestion and resume generation require reliable text extraction from uploaded PDF and Word documents, paired with deterministic generation of clean single column ATS compliant PDF documents.
Fourth, because this repository serves as a public GitHub showcase and community project, architecture choices must balance production grade engineering patterns with low friction local reproduction. Contributors must be able to boot the complete environment with standard tools like Docker Compose without complex orchestration.

Leaving the foundation undecided risks architectural fragmentation across future slices, inconsistent data validation, brittle streaming implementations, and poor onboarding for open source collaborators.

## Options considered

### Option 1: Full stack Next.js 15 App Router with PostgreSQL, Prisma ORM, Auth.js v5, and Vercel AI SDK

A unified TypeScript monolithic web application using the latest React Server Components, Route Handlers, Prisma schema migrations, and standard streaming primitives.

**Pros**:

- Single codebase and deployable unit sharing TypeScript types across frontend and backend.
- Native React 19 streaming hooks and unified multi provider adapters through Vercel AI SDK.
- Excellent ecosystem support for bidirectional layout switching and localized routing through next intl.
- Predictable database migrations and type safe queries via Prisma ORM.

**Cons**:

- Serverless runtime quirks require careful connection pooling configuration for PostgreSQL.
- Tight coupling between presentation and server layers compared to independent services.

### Option 2: Split React Vite frontend with Fastify Node.js API backend and Drizzle ORM

A decoupled client application communicating over REST and Server Sent Events with an independent Fastify HTTP service.

**Pros**:

- Explicit separation of concerns between client interface and server logic.
- Fastify delivers high throughput and minimal HTTP overhead.
- Drizzle ORM provides lightweight SQL queries with minimal bundle overhead.

**Cons**:

- Requires maintaining two separate development servers, deployment pipelines, and shared type packages.
- Higher friction for open source contributors who must configure multiple services locally.
- Custom Server Sent Events streaming code must be maintained by hand for each AI provider.

### Option 3: Remix or React Router v7 with SQLite and custom JWT sessions

A web standards focused framework leveraging local SQLite database storage and bespoke cookie authentication.

**Pros**:

- Single file SQLite database requires zero external database containers for local testing.
- Robust form handling and nested route layouts.

**Cons**:

- SQLite complicates concurrency and horizontal scaling for hosted web deployments.
- Hand rolled authentication introduces security risks around token rotation, revocation, and CSRF protection.
- Smaller community ecosystem for Arabic and English bilingual tooling compared to Next.js.

### Option 4: Full stack Nuxt 3 with Nitro server and Supabase managed backend

A Vue 3 based full stack framework using Supabase hosted PostgreSQL, storage, and authentication.

**Pros**:

- Intuitive reactivity and clean single file components in Vue 3.
- Supabase provides ready to use authentication and database management out of the box.

**Cons**:

- Relies on third party cloud infrastructure which impedes fully offline local development.
- React ecosystem maintains significantly wider adoption and richer libraries for ATS PDF rendering and AI streaming.

## Rationale

Option 1 provides the strongest balance of developer velocity, showcase quality, and operational simplicity. By choosing Next.js 15 App Router with React 19 Server Components, we eliminate network hops between presentation logic and backend services while sharing TypeScript interfaces end to end.

The Vercel AI SDK abstraction directly answers the Bring Your Own Key requirement by providing uniform streaming hooks for OpenAI, Anthropic, Gemini, Groq, and Ollama without vendor lock in. PostgreSQL paired with Prisma ORM provides relational schema guarantees, typed migrations, and intuitive data modeling for users, resumes, job postings, and kanban cards.

For internationalization, next intl integrated into App Router allows server rendered Arabic and English layouts with zero layout shift. Pairing Tailwind CSS with logical CSS properties enables seamless flipping between right to left and left to right presentations. Local contributors can boot the entire database infrastructure with a single Docker Compose invocation.
