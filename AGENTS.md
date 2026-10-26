<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Build approach

Tracer Bullet (vertical slices through every layer, proving the whole pipe early).

## Stack

Next.js App Router, TypeScript, PostgreSQL 16, Prisma ORM, Auth.js v5, Vercel AI SDK, Tailwind CSS v4, and Vitest.

## Commands

```bash
# Install dependencies
npm install

# Dev server
npm run dev

# Build
npm run build

# Test
npm run test

# Lint and format
npm run lint
npm run format:check

# Local database (PostgreSQL 16)
docker compose up -d
```

## Specs

Stored in `docs/specs/`. Format: `docs/specs/NNNN-title/index.md`.

## Rules

- Always import and use the Prisma client singleton from `src/lib/prisma`, never create a direct instance with `new PrismaClient()`
- Next.js App Router: prefer Server Components by default, use `'use client'` only when browser interaction or state is needed
- Bilingual first: design layout primitives with support for right to left Arabic and left to right English
- Design system: build all UI to `design.md` (art direction and the maximalist product bar); token values live in CSS.
- Tests: write unit tests using Vitest, placed beside implementation files with `.test.ts` extension

## Agent skills

- [ai-sdk](.agents/skills/ai-sdk/): `vercel/ai`, multi provider streaming and agent workflows
- [arabic-rtl-best-practices](.agents/skills/arabic-rtl-best-practices/): `almubarmij/arabic-ai-skills`, right to left layouts and Arabic typography
- [react-pdf-kit-nextjs-app-router](.agents/skills/react-pdf-kit-nextjs-app-router/): `react-pdf-kit/agent-skills`, React PDF export and Next.js App Router integration
- [nextjs-app-router-patterns](.agents/skills/nextjs-app-router-patterns/): `wshobson/agents`, Next.js App Router and Server Components
- [prisma-client-api](.agents/skills/prisma-client-api/): `prisma/skills`, Prisma Client queries and data patterns
- [vitest](.agents/skills/vitest/): `antfu/skills`, Vitest unit testing conventions
- [tailwind-4-docs](.agents/skills/tailwind-4-docs/): `lombiq/tailwind-agent-skills`, Tailwind CSS v4 documentation and patterns
- [ux-writing-arabic](.agents/skills/ux-writing-arabic/): `almubarmij/arabic-ai-skills`, Arabic UX writing, microcopy, and tone guidelines
  MCP servers: @modelcontextprotocol/server-postgres (recommended)

## Context files

- [src/components/AGENTS.md](src/components/AGENTS.md): UI component library, bilingual primitives, and accessibility conventions

_Drafted by /audit from the repo, worth a quick human pass. Edit freely: once a line stops matching this draft, later runs treat it as curated and will flag rather than overwrite it._
