# 0001. Adopt Next.js App Router, PostgreSQL, Prisma, Auth.js, and Vercel AI SDK for Core Foundation

**Date**: 2026-10-21
**Status**: Accepted

## Summary

This decision establishes the core technology stack and architecture for CareerCraft AI as a single monolithic full stack application. We adopt Next.js 15 with the App Router and TypeScript, PostgreSQL managed with Prisma ORM, Auth.js v5 for authentication, and Vercel AI SDK for multi provider streaming. This foundation delivers native streaming for artificial intelligence responses, first class bilingual support for Arabic and English, and straightforward local setup for open source contributors.

## Decision

**Chosen option**: Option 1: Full stack Next.js 15 App Router with PostgreSQL, Prisma ORM, Auth.js v5, and Vercel AI SDK.

We will build CareerCraft AI as a unified full stack Next.js application using PostgreSQL with Prisma ORM, Auth.js v5 for session management, and Vercel AI SDK for provider agnostic streaming.

**Implementation skills**: `prisma-client-api` (`prisma/skills`, `.agents/skills/prisma-client-api/`) · `ai-sdk` (`vercel/ai`, `.agents/skills/ai-sdk/`) · `nextjs-app-router-patterns` (`wshobson/agents`, `.agents/skills/nextjs-app-router-patterns/`)

## Proposed stack

| Layer                | Choice                                                      | Reason                                                                                                                                   |
| -------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime              | Node.js 20 LTS                                              | Long term support release ensuring compatibility with Next.js 15 and native Web Crypto APIs.                                             |
| Language             | TypeScript (strict mode)                                    | End to end type safety across database schemas, API routes, and UI components.                                                           |
| Framework            | Next.js 15 (App Router, React 19)                           | Modern Server Components, Route Handlers, native response streaming, and production showcase standard.                                   |
| Primary DB           | PostgreSQL 16                                               | ACID transactions, robust relational integrity, JSONB support for parsed resumes, and wide community adoption.                           |
| ORM                  | Prisma ORM                                                  | Declarative schema definitions, automated migrations, and global singleton pattern to prevent connection pool exhaustion in development. |
| Auth                 | Auth.js v5 (NextAuth) with Prisma adapter                   | Free open source session management supporting OAuth and credentials with zero external service lock in.                                 |
| AI Integration       | Vercel AI SDK (ai core and provider adapters)               | Unified streaming abstraction supporting OpenAI, Claude, Gemini, Groq, and local Ollama.                                                 |
| Key Security         | AES 256 GCM encrypted at rest in PostgreSQL                 | Protects user API keys at rest while enabling cross device access without exposing keys to client code.                                  |
| UI & Styling         | Tailwind CSS v4, Shadcn UI, and Lucide Icons                | Accessible Radix primitives, consistent design tokens, clean dark and light themes.                                                      |
| Direction & i18n     | next intl with logical CSS properties and Cairo/Inter fonts | High performance server rendered bilingual support for Arabic and English with seamless RTL switching.                                   |
| Document Parsing     | pdf parse and mammoth                                       | Pure Node.js text extraction from PDF and Word files without heavy external binary dependencies.                                         |
| PDF Export           | React PDF (@react-pdf/renderer)                             | Deterministic server side generation of single column ATS compliant text PDFs.                                                           |
| Testing              | Vitest, React Testing Library, and Playwright               | Fast native TypeScript unit and integration testing paired with reliable browser smoke testing.                                          |
| Local Infrastructure | Docker Compose                                              | Single command local setup booting PostgreSQL and persistent volumes for new contributors.                                               |

## Consequences

**Positive**:

- Rapid feature development with unified types and shared utilities across all application slices.
- Open source contributors can clone the repository, run docker compose up, and start building immediately.
- Users experience responsive live streaming for resume tailoring and interview question generation.
- Bilingual Arabic and English support is built into the layout primitives rather than retrofitted later.

**Negative / tradeoffs**:

- Monolithic architecture means server side operations and web page rendering share the same Node.js runtime resources.
- React PDF runs its own rendering pipeline, requiring isolated component styling separate from Tailwind utility classes.
- Server side encryption of API keys requires strict management of an application secret key environment variable.

**Neutral**:

- Developers must use Docker for local PostgreSQL execution or configure a local Postgres instance manually.
- Server Actions and Route Handlers must follow strict App Router folder conventions.
- Developers must use the globalThis singleton pattern for the Prisma client instance to prevent connection leaks during Next.js local development reloads.

## Follow-up

- [x] Scaffold the base Next.js 15 project with TypeScript, ESLint, and Tailwind CSS.
- [x] Create `docker-compose.yml` for local PostgreSQL and configure Prisma initial connection.
- [ ] Capture framework and ORM conventions in root `AGENTS.md` via `/audit`.
- [ ] Note PostgreSQL MCP server (`@modelcontextprotocol/server-postgres`) as an optional connection for direct database inspection.
