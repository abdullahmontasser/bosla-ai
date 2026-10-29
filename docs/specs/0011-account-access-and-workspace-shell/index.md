# 0011. Account access and workspace shell

**Date**: 2026-10-27
**Status**: Accepted

## Summary

Bosla had no way to sign out, no signup, no OAuth, and no shared navigation. Each workspace page carried its own header, and a signed out visitor only discovered the problem after opening a tool and finding an inline sign in card.

This specification separates authentication from the workspace and gives every signed in surface one shell. A visitor creates an account with email and password, signs in with GitHub, Google, or LinkedIn when those providers are configured, returns to the page they meant to open, and signs out from an account menu that is visible everywhere.

## Requirements

**User stories**:

- As a new visitor, I want to create an account with my name, email, and password so I can use the workspace with my own data.
- As a returning visitor, I want a dedicated sign in page that tells me what I get, and sends me back to the page I was trying to open.
- As a visitor with a GitHub, Google, or LinkedIn account, I want to sign in with one click when the server has that provider configured.
- As a signed in user, I want one header with Tailor, Resumes, Tracker, and Providers, plus a menu where I can see who I am and sign out.
- As a user whose session expired mid action, I want a clear way back to sign in instead of a silent failure.

**Acceptance criteria**:

- **AC-1**: Serve `/[lang]/login` and `/[lang]/signup` for `en` and `ar` with a two column desktop layout and a single column mobile layout, using the shared palette and fonts.
- **AC-2**: Support email and password signup with a name, a normalized unique email, a minimum eight character password, and a bcrypt hash. Reject duplicate emails with a clear message.
- **AC-3**: Add GitHub, Google, and LinkedIn OAuth. A provider button only renders when both of its environment credentials exist, so a partially configured server never shows a broken button.
- **AC-4**: Sanitize every `callbackUrl` before use. Accept only same origin paths, reject absolute, protocol relative, and auth page targets, and fall back to the workspace home.
- **AC-5**: After sign in or signup, send the user to the sanitized callback target. A signed in visitor who opens login or signup is redirected to their target instead of seeing the form again.
- **AC-6**: Protect `/[lang]/tailor`, `/[lang]/tracker`, `/[lang]/resume`, and `/[lang]/settings/providers` at the page level. A signed out visitor is redirected to login with the requested path as the callback.
- **AC-7**: Provide one shared workspace header with the brand, Tailor, Resumes, Tracker, Providers, an active state, the language switcher, the theme switcher, and an account menu. The account menu shows the name, email, a link to provider settings, and a working sign out that returns to the landing page in the current locale.
- **AC-8**: Expose sign in from the public landing navigation on desktop and mobile. The primary landing action sends a signed out visitor to signup and a signed in visitor to the workspace.
- **AC-9**: Keep the shared header usable at `375px`: the mobile menu carries the workspace links and sign out, and no control overflows the viewport in either direction.
- **AC-10**: Cover callback sanitization, the credentials action, the auth configuration, and the sign up path with Vitest tests, and verify typecheck, lint, format, tests, and a production build.

## Decision

**Chosen option**: Auth.js credentials plus optional OAuth, page level guards, and a shared server rendered header.

The app already uses Auth.js v5 with a Prisma adapter and JWT sessions, and every server action already reads `auth()`. Reusing that foundation keeps one session model. Page level `requireSession` guards are preferred over middleware because each page knows its own callback path and the middleware stays a pure locale router.

OAuth providers are enabled from environment pairs rather than a hardcoded list. This keeps local development working with no external app registration while letting a deployment turn on a provider without a code change.

## Build plan

1. **Auth foundation**
   - [x] Add `sanitizeCallbackUrl` with unit tests.
   - [x] Add conditional GitHub, Google, and LinkedIn providers and a same origin redirect callback to `src/auth.ts`.
   - [x] Add the `/api/auth/[...nextauth]` route handler for OAuth callbacks.
   - [x] Add `signUpWithCredentials`, `signInWithOAuth`, and `signOutAction` to the auth actions.
2. **Auth surfaces**
   - [x] Build the shared `AuthScreen` and `AuthForm` with bilingual copy, password visibility, inline errors, a demo shortcut, and provider buttons.
   - [x] Add `/[lang]/login` and `/[lang]/signup` with session aware redirects and callback sanitization.
3. **Workspace shell**
   - [x] Add `requireSession` and apply it to the four workspace pages.
   - [x] Add `WorkspaceHeader`, `WorkspaceNav`, `WorkspaceMobileMenu`, and `AccountMenu` with sign out.
   - [x] Replace the per page headers with the shared header.
4. **Landing integration**
   - [x] Make the landing navigation session aware behind a Suspense boundary.
   - [x] Add sign in, signup, and workspace destinations that respect the visitor state.
5. **Verification**
   - [x] Add or update tests for the callback sanitizer, auth actions, and auth configuration.
   - [x] Walk the full flow in a browser: sign out, protected redirect, demo sign in, signup, and sign out again.
   - [x] Run typecheck, lint, format check, tests, and the production build.

## Consequences

- **Positive**:
  - Every workspace page now has the same navigation, so a user can find any tool from anywhere.
  - Sign out is discoverable and works.
  - A new user can create an account without an operator seeding one.
  - OAuth is optional and safe to leave unconfigured.
- **Negative / Tradeoffs**:
  - Passwords have no reset flow yet. The login page says so instead of pretending the link works.
  - Signup has no email verification, which is acceptable for a single server local deployment but must be revisited before public registration.
  - Auth pages set `instant = false` so a request time session read can block the route while Cache Components are enabled.

## Follow-up and Best Practice Hardening Plan

1. **Rate Limiting on Authentication Endpoints** [Implemented]
   - Wired sliding window rate limiting into `signInCredentials` and `signUpWithCredentials`.
   - Max 5 failed login attempts per IP/account per 15 minutes before temporary lockout (`isRateLimited` / `recordFailedAttempt`), auto cleared on successful credentials authentication.
   - Max 3 signup attempts per IP per hour to prevent account creation spam.

2. **Sensitive Credential Protection in Server Action Logging** [Implemented]
   - Masked and sanitized credentials, utilizing FormData and typed payloads so plaintext passwords stay out of function traces and logs.

3. **Zod Password & Email Hardening with Interactive UI Feedback** [Implemented]
   - Strict Zod schemas for email (disallow disposable email domains, require valid domain TLD, reject spaces) and password (minimum 8 characters, lowercase, uppercase, numbers, special characters, reject common weak dictionary/sequential passwords).
   - Real-time client-side password strength meter with animated 4-segment visual bar (weak/fair/good/strong) and criteria checklist (length, case, numbers, symbols) with bilingual English and Arabic support adhering to `design.md`.
   - Snappy client-side validation prevention on submit to avoid unnecessary network roundtrips.

4. **Defense in Depth: Middleware Boundary alongside Page Guards** [Implemented]
   - Added edge proxy/middleware session verification for `/tailor`, `/tracker`, `/resume`, `/profile`, `/settings` routes to immediately redirect unauthenticated visits with HTTP 307 to `/[lang]/login?callbackUrl=...`, retaining `requireSession` in server components as cryptographic defense in depth.

5. **Password Reset Flow** [Planned / Future]
   - Introduce `PasswordResetToken` table in Prisma schema (`tokenHash`, `userId`, `expiresAt`, `usedAt`).
   - Transactional email dispatch (via Resend or provider adapter) generating a secure signed reset link.
   - Dedicated `/[lang]/reset-password` and `/[lang]/forgot-password` pages with token validation.

6. **Email Verification** [Planned / Future]
   - Add `emailVerified` lifecycle on `User` model with `VerificationToken`.
   - Send verification link upon signup; allow resending with exponential backoff.
   - Gate workspace AI capabilities behind verified status.

7. **OAuth and Credentials Account Linking** [Planned / Future]
   - Support `allowDangerousEmailAccountLinking` or an explicit account linking confirmation screen when an OAuth email matches an existing credentials account.
   - Provider settings screen account link/unlink management.
