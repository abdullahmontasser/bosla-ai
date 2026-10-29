# Developer Workflow and Contribution Guide

This guide provides practical instructions for setting up, developing, testing, and contributing to CareerCraft AI (Bosla AI).

## Prerequisites

Before starting, verify your workstation has the following tools installed:

- **Node.js**: Version 20 LTS or higher
- **npm**: Version 10 or higher
- **Docker and Docker Compose**: For running the local PostgreSQL 16 container
- **Git**: For version control

## Initial Setup

Follow these steps to configure your local development environment:

### 1. Clone the Repository and Install Dependencies

```bash
git clone https://github.com/abdullahmontasser/cv.git
cd cv
npm install
```

### 2. Configure Environment Variables

Copy the example environment configuration:

```bash
cp .env.example .env
```

Review `.env` and configure your settings:

- `DATABASE_URL`: Preconfigured for the local Docker Compose PostgreSQL service.
- `AUTH_SECRET`: Secret token used by Auth.js to sign session cookies.
- `ENCRYPTION_KEY`: A 64 character hex string (32 bytes) used for AES-256-GCM encryption.

### 3. Start Local PostgreSQL Database

Launch PostgreSQL 16 in the background using Docker Compose:

```bash
docker compose up -d
```

### 4. Run Prisma Migrations and Seed Database

Execute schema migrations against your local database and populate demo records:

```bash
npx prisma migrate dev
npx prisma db seed
```

The seed script creates initial English and Arabic sample profiles with credentials:

- **Email**: `demo@careercraft.ai`
- **Password**: `password123`

### 5. Launch Development Server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app automatically redirects to your preferred language (for example `/en` or `/ar`).

## Available Scripts

| Command                | Purpose                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| `npm run dev`          | Starts local Next.js development server with hot module replacement  |
| `npm run build`        | Compiles production assets and generates static routes using Webpack |
| `npm run start`        | Boots production server from compiled `.next` output                 |
| `npm run test`         | Executes the complete Vitest test suite across all 90 test modules   |
| `npm run lint`         | Runs ESLint 9 checks to verify code quality and React 19 compliance  |
| `npm run format:check` | Verifies code formatting across all files against Prettier rules     |
| `npm run format`       | Automatically formats all files using Prettier                       |
| `npm run typecheck`    | Validates TypeScript types across the entire project                 |

## Testing Philosophy and Conventions

CareerCraft AI enforces rigorous automated testing. Tests are colocated beside the files they verify with the `.test.ts` or `.test.tsx` suffix.

### Testing Stack

- **Runner**: Vitest with JSDOM environment
- **DOM Utilities**: `@testing-library/react` and `@testing-library/dom`
- **Mocks**: In memory mocks for `next/navigation`, `@auth/prisma-adapter`, and AI SDK streaming providers

### Writing Component Tests

When creating tests for interactive components:

1. Always verify both English (LTR) and Arabic (RTL) rendering where directional layouts differ.
2. Use accessible queries (`getByRole`, `getByLabelText`, `getByText`) rather than querying CSS classes.
3. Test realistic user interactions using `fireEvent` or `userEvent`.
4. Keep server actions and API mocks clean and explicit.

Example test pattern:

```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { HealthSuggestionCard } from './HealthSuggestionCard'

describe('HealthSuggestionCard', () => {
  it('triggers onAccept callback when accept button is clicked', () => {
    const handleAccept = vi.fn()
    render(<HealthSuggestionCard issue={mockIssue} onAccept={handleAccept} onDismiss={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /accept suggestion/i }))
    expect(handleAccept).toHaveBeenCalledWith(mockIssue.id)
  })
})
```

## Database Migrations

When altering the database schema:

1. Edit `prisma/schema.prisma`.
2. Generate a new migration:
   ```bash
   npx prisma migrate dev --name describe_your_change
   ```
3. Update repository functions in `src/lib/db/` and validation schemas in `src/lib/validations/`.
4. Run `npm run test` to verify relational cascade and tenant scoping tests pass.

## Git and Branching Conventions

- Active work takes place on dedicated feature branches created from `main`.
- Follow Conventional Commits format for commit messages (for example `feat(profile): ...`, `fix(auth): ...`, `docs(readme): ...`).
- Verify the following four gates pass cleanly before pushing or creating a pull request:
  1. `npm run typecheck`
  2. `npm run lint`
  3. `npm run format:check`
  4. `npm run test`
