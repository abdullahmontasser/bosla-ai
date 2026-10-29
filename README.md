# CareerCraft AI (بُوصلة Bosla AI)

> Autonomous, bilingual career acceleration workbench engineered to reverse engineer job descriptions, audit resume hygiene, optimize Google XYZ achievement bullets, and manage job application pipelines with native Arabic (RTL) and English (LTR) parity.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black.svg)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38b2ac.svg)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2d3748.svg)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Vitest-5-729b1b.svg)](https://vitest.dev/)

---

## Highlights

- **Bilingual First by Design**: Native English (LTR) and Arabic (RTL) symmetry across every layout, card, modal, and generated PDF document.
- **Base Resume Health Audit**: Instant deterministic scoring from 0 to 100 across impact metrics, action verbs, ATS completeness, and content depth with interactive issue resolution, 10 second undo, and AI rewrites.
- **ATS Match Scoring Dial**: Real time keyword match analysis comparing candidate profiles against target job descriptions with missing skill badges and single click profile additions.
- **In Memory Headless Vector PDF**: Exports clean, searchable, single column vector PDFs in milliseconds using `@react-pdf/renderer` with Arabic glyph reshaping and BiDi reordering.
- **Google XYZ Metric Optimization**: Rewrites weak bullet points into high impact formulas (`Accomplished [X] as measured by [Y], by doing [Z]`) backed by zero hallucination grounding checks.
- **Bring Your Own Key (BYOK)**: Store your own API keys for Anthropic Claude, OpenAI, Google Gemini, Groq, or local Ollama with AES-256-GCM encryption at rest.
- **Application Kanban Tracker**: Drag and drop job search pipeline with stage columns, follow up staleness alerts, and ATS score badges.
- **Candidate Profile Hub**: Manage personal identity, avatar crop with interactive HTML5 canvas, work experiences, education, skills, and projects with bidirectional ordering.

---

## Technical Stack

| Layer                  | Technology                            | Description                                                                 |
| ---------------------- | ------------------------------------- | --------------------------------------------------------------------------- |
| **Framework**          | Next.js 16 (App Router)               | Server Components, streaming route handlers, partial prerendering           |
| **Runtime & Language** | Node.js 20 LTS + TypeScript 5         | Strict typing across data models, server actions, and API boundaries        |
| **Database & ORM**     | PostgreSQL 16 + Prisma ORM 6          | Relational schema with tenant isolation and cascade rules                   |
| **UI & Styling**       | Tailwind CSS v4 + Radix UI            | CSS logical properties, semantic tokens, and accessible headless primitives |
| **AI Integration**     | Vercel AI SDK 7                       | Multi provider streaming, tool calling, and structured object generation    |
| **Authentication**     | Auth.js v5 (NextAuth)                 | Credentials auth with bcrypt plus Google and GitHub OAuth adapters          |
| **PDF Rendering**      | `@react-pdf/renderer`                 | Server memory vector PDF engine with embedded font subsets                  |
| **Arabic Shaping**     | `arabic-persian-reshaper` + `bidi-js` | Contextual Arabic glyph joining and Unicode BiDi algorithm reordering       |
| **Testing**            | Vitest 5 + JSDOM                      | Unit and component test runner with 90 test modules and 690+ tests          |

---

## Quick Start

### 1. Prerequisites

Ensure you have the following installed on your machine:

- Node.js (version 20 or later)
- Docker Desktop or Docker Engine
- npm (version 10 or later)

### 2. Clone and Install

```bash
git clone https://github.com/abdullahmontasser/cv.git
cd cv
npm install
```

### 3. Configure Environment

Create your local `.env` file from the example:

```bash
cp .env.example .env
```

Verify your `.env` contains:

- `DATABASE_URL`: Connection string pointing to the local PostgreSQL database
- `AUTH_SECRET`: Secret token for Auth.js sessions
- `ENCRYPTION_KEY`: 64 character hex string for AES-256-GCM encryption

### 4. Start Database and Apply Migrations

```bash
# Start PostgreSQL 16 container in background
docker compose up -d

# Apply schema migrations and seed initial demo data
npx prisma migrate dev
npx prisma db seed
```

Default credentials populated by the seed script:

- **Email**: `demo@careercraft.ai`
- **Password**: `password123`

### 5. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) in your browser. The application automatically redirects to your browser preferred language (`/en` or `/ar`).

---

## NPM Scripts

```bash
# Start Next.js development server
npm run dev

# Run full Vitest test suite
npm run test

# Type check TypeScript files without emitting
npm run typecheck

# Check code against ESLint rules
npm run lint

# Verify code formatting against Prettier
npm run format:check

# Format all files automatically with Prettier
npm run format

# Build production bundle with Webpack
npm run build

# Start production server
npm run start
```

---

## Project Structure

```
.
├── docs/                         # Specifications, architecture, and guides
│   ├── architecture/             # Deep architectural documentation
│   │   ├── overview.md           # System topology and domain boundaries
│   │   ├── bilingual-rtl.md      # Arabic RTL, BiDi, and font shaping guide
│   │   ├── ai-engine-and-prompts.md # Multi provider AI, BYOK, and prompts
│   │   └── resume-health-and-ats.md # Health rules and ATS scoring math
│   ├── guides/                   # Developer workflows and onboarding
│   │   └── development-workflow.md
│   ├── scope/                    # Product scope and roadmap tracking
│   └── specs/                    # Numbered architectural specifications (0001 to 0014)
├── prisma/                       # Database schema, migrations, and seed script
│   ├── migrations/               # PostgreSQL migration history
│   ├── schema.prisma             # Prisma data models and indexes
│   └── seed.ts                   # Demo bilingual data population
├── src/                          # Application source code
│   ├── app/                      # Next.js App Router (pages, actions, APIs)
│   │   ├── [lang]/               # Subpath localized pages (en, ar)
│   │   ├── actions/              # Type safe Server Actions
│   │   └── api/                  # Streaming and REST route handlers
│   ├── components/               # UI components and client islands
│   │   ├── ats/                  # ATS scoring meters and skill chips
│   │   ├── auth/                 # Sign in, sign up, and password forms
│   │   ├── health/               # Resume health gauges and issue cards
│   │   ├── landing/              # Marketing homepage and showcase
│   │   ├── profile/              # Candidate profile hub and avatar crop
│   │   ├── tailor/               # Resume tailoring studio
│   │   ├── tracker/              # Job application kanban board
│   │   ├── ui/                   # Reusable Radix UI primitives
│   │   └── workspace/            # Navigation header and account menu
│   ├── dictionaries/             # Canonical translations (en.json, ar.json)
│   └── lib/                      # Core business logic and shared utilities
│       ├── ai/                   # AI provider clients and prompt builders
│       ├── ats/                  # Deterministic ATS scoring engine
│       ├── auth/                 # Auth.js helpers and session security
│       ├── db/                   # Prisma singleton and repositories
│       ├── health/               # Health audit rules and queries
│       ├── i18n/                 # Locale negotiation and dictionary loader
│       ├── parsing/              # PDF and DOCX text extraction
│       ├── pdf/                  # Vector PDF generation and Arabic shaping
│       └── text/                 # Action verbs and digit normalization
```

---

## In Depth Documentation

For advanced technical details, refer to the guides in the `docs/` directory:

- [System Architecture Overview](docs/architecture/overview.md): Runtime topology, data layers, and security boundaries.
- [Bilingual and RTL Architecture](docs/architecture/bilingual-rtl.md): Logical CSS properties, Arabic typography, and BiDi PDF rendering.
- [Multi Provider AI Engine](docs/architecture/ai-engine-and-prompts.md): AES-256-GCM encryption, Vercel AI SDK streaming, and anti hallucination prompts.
- [Resume Health and ATS Scoring](docs/architecture/resume-health-and-ats.md): 4 category health weights, issue lifecycles, and keyword match algorithms.
- [Developer Workflow Guide](docs/guides/development-workflow.md): Local environment setup, test patterns, migrations, and contribution practices.
- [Product Scope and Roadmap](docs/scope/scope.md): Completed slices and upcoming product milestones.

---

## License

Private and proprietary. All rights reserved.
