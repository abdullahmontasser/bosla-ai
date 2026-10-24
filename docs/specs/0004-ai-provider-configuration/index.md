# 0004. AI Provider Configuration (BYOK)

**Date**: 2026-10-24
**Status**: Accepted

## Summary

This spec covers how users configure their own AI provider API keys (a pattern called BYOK, meaning Bring Your Own Key) so that CareerCraft AI never stores provider credentials under a shared account. Users can save keys for any of five providers (OpenAI, Anthropic, Gemini, Groq, and local Ollama), have each key validated live on save, pick from a fetched model list, and switch one provider active at a time. The data layer already exists; this feature adds the settings UI, the Server Actions that call providers, and the inline switcher used across the AI features.

## Requirements

**User stories**:

- As a job seeker, I want to enter and save my own AI provider API key so that the platform calls AI on my behalf without sharing a centrally stored key.
- As a job seeker, I want my key validated the moment I save it so that I get immediate feedback rather than discovering a bad key mid session.
- As a job seeker, I want to pick from a live list of models after my key is validated so that I always use a current model and am not locked into a hardcoded name.
- As a job seeker, I want to configure Ollama with only a local server URL (no API key) so that I can run private local inference without cloud provider costs.
- As a job seeker, I want to mark one provider active and switch it at any time so that the rest of the app uses whichever provider I choose.
- As a job seeker, I want to see my saved key masked (for example sk-...XXXX) when I return to settings so that I know a key is stored without the plain text being exposed.
- As a job seeker, I want to update my default model without retyping my secret key every time.
- As a job seeker, I want to delete a configured provider so that I can remove a key I no longer want stored.

**Acceptance criteria** (the contract, each independently checkable):

- **AC-1**: A settings page reachable at `/[lang]/settings/providers` renders all five provider cards (OPENAI, ANTHROPIC, GEMINI, GROQ, OLLAMA). Each card shows the provider name, a key input (masked, type password, replaced by endpoint URL input for Ollama), a validate and fetch models button, a model selector (populated after validation), a set active toggle, and a delete action.
- **AC-2**: The `validateAndFetchModels` Server Action makes a direct server side HTTP fetch to the provider REST models endpoint using an explicit 8 second timeout (`AbortSignal.timeout(8000)`). If `rawKey` is omitted for an already configured provider, it decrypts the stored key to refresh the model list. It filters returned IDs to chat and text generation models only (excluding embeddings, audio, moderation, and image models). On success it returns `{ models: string[] }`. On failure (invalid key, rate limit, timeout, network error) it returns a structured error object and does NOT write to the database.
- **AC-3**: For Ollama, both `validateAndFetchModels` and `saveProviderSetting` validate `endpointUrl` against SSRF risks (blocking cloud metadata IPs such as 169.254.169.254 and blocked internal database ports) before dispatch or storage. On model list fetch failure across any provider, the UI shows a retry button and falls back to a short hardcoded list of known good models for that provider so the user is not blocked.
- **AC-4**: The `saveProviderSetting` Server Action encrypts the raw API key server side using `src/lib/crypto.ts` (`encryptSecret`) and upserts a `UserProviderSetting` row. If a record already exists and `rawKey` is omitted or empty, existing encrypted credentials remain intact while updating the default model or endpoint URL. Raw keys never touch the database in plain text, the client bundle, or response payloads.
- **AC-5**: The `setActiveProvider` Server Action takes a provider and an optional model parameter. It executes a single Prisma transaction that sets `isActive = false` across all providers for that user, sets `isActive = true` on the chosen provider, and optionally updates `defaultModel`. Saving a new provider automatically activates it if the user has no currently active provider, but keeps it inactive if an active provider already exists.
- **AC-6**: The `deleteProviderSetting` Server Action removes the `UserProviderSetting` row for the given provider. If the deleted provider was active, no provider is left active until the user designates another.
- **AC-7**: The `getProviderConfigurations` action returns an array of exactly five `ProviderCardState` items (one per `AiProvider` enum value). For configured providers, it decrypts the key within a safe try block to derive a masked hint (last four characters visible, remainder masked). If decryption fails due to a rotated secret or corruption, the card flags `isCorrupted = true`, preventing a page crash and enabling the user to overwrite or reset the key.
- **AC-8**: Every Server Action reads the session via `auth()` from Auth.js v5 and injects the `userId` into every Prisma query. An unauthenticated call returns a structured unauthorized error without touching the database.
- **AC-9**: An inline provider and model switcher component (`ProviderSwitcher.tsx`) is exported for use in AI feature pages. It renders the active provider and its available models (sourced from the fallback map in `provider-models.ts` or cached configuration to prevent runtime network overhead), invoking `setActiveProvider(provider, model)` to switch providers or default models on the fly.
- **AC-10**: The settings page and inline switcher render correctly in both left to right (English) and right to left (Arabic) layouts using the existing `DirectionProvider` and logical CSS properties from the design system (spec 0003).

## Decision

**Chosen option**: Server Actions with RSC shell and a Client Component form island.

We will build the provider settings as a React Server Component page that loads existing provider configurations on the server, and pass the data to a Client Component island for the interactive form (key input, model selector, active toggle). All mutations (validate, save, set active, delete) run as Next.js Server Actions. Keys never appear in client state beyond the text input during entry; they are encrypted inside the Server Action before any database write.

**Implementation skills**: `ai-sdk` (`vercel/ai`, `.agents/skills/ai-sdk/`) · `nextjs-app-router-patterns` (`wshobson/agents`, `.agents/skills/nextjs-app-router-patterns/`) · `prisma-client-api` (`prisma/skills`, `.agents/skills/prisma-client-api/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

**Data model sketch**:

No schema migration needed. `UserProviderSetting` already exists with all required columns (`encryptedKey`, `iv`, `authTag`, `defaultModel`, `endpointUrl`, `isActive`). The existing `upsertProviderSetting`, `getActiveProviderSettings`, `getProviderSetting`, and `deleteProviderSetting` repository functions in `src/lib/db/provider-settings.ts` are reused and extended to support optional key updates.

```
UserProviderSetting (existing, no migration needed)
  id            String (cuid PK)
  userId        String (FK -> User, cascade delete)
  provider      AiProvider enum (OPENAI | ANTHROPIC | GEMINI | GROQ | OLLAMA)
  encryptedKey  String? (AES-256-GCM ciphertext, base64)
  iv            String? (hex, 96-bit nonce)
  authTag       String? (hex, 128-bit GCM tag)
  defaultModel  String  (selected model ID)
  endpointUrl   String? (Ollama base URL only)
  isActive      Boolean (default false; exactly one true per user)
  @@unique([userId, provider])
```

**State transitions**:

A provider configuration moves through these states:

```
unconfigured -> validated (key tested, model list returned) -> saved -> active
                                                              saved -> deleted -> unconfigured
                                                              active -> inactive (another provider set active)
```

The `isActive` flag enforces the active state. A deletion of the active provider leaves all providers inactive until the user sets a new one.

**Card state type definition**:

```typescript
export interface ProviderCardState {
  provider: AiProvider
  isConfigured: boolean
  maskedKey: string | null
  defaultModel: string | null
  endpointUrl: string | null
  isActive: boolean
  isCorrupted?: boolean
}
```

**API surface** (all Server Actions, no HTTP route handlers):

| Action                                                                 | Inputs                                                                             | Outputs                                       | Auth             | Key errors                                              |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------- | ---------------- | ------------------------------------------------------- |
| `validateAndFetchModels(provider, rawKey?, endpointUrl?)`              | provider: AiProvider, rawKey?: string, endpointUrl?: string                        | `{ models: string[] }` or `{ error: string }` | session required | invalid key, quota exceeded, timeout (8s), SSRF blocked |
| `saveProviderSetting(provider, rawKey?, selectedModel?, endpointUrl?)` | provider: AiProvider, rawKey?: string, selectedModel: string, endpointUrl?: string | `{ success: true }` or `{ error: string }`    | session required | validation fail, encryption fail                        |
| `setActiveProvider(provider, model?)`                                  | provider: AiProvider, model?: string                                               | `{ success: true }` or `{ error: string }`    | session required | provider not configured, transaction fail               |
| `deleteProviderSetting(provider)`                                      | provider: AiProvider                                                               | `{ success: true }` or `{ error: string }`    | session required | record not found                                        |
| `getProviderConfigurations()`                                          | (none)                                                                             | `ProviderCardState[]` (5 items)               | session required | unauthorized                                            |

**Value sourcing**:

| Action                              | Value produced / displayed                  | Source                                                                                                   |
| ----------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `validateAndFetchModels`            | Model list for OpenAI / Groq                | `GET /v1/models` filtered to chat models, authorized via bearer header with `rawKey`                     |
| `validateAndFetchModels`            | Model list for Anthropic                    | `GET https://api.anthropic.com/v1/models` with `x-api-key` header, or curated Claude models              |
| `validateAndFetchModels`            | Model list for Gemini                       | `GET https://generativelanguage.googleapis.com/v1beta/models?key={rawKey}` filtered to `generateContent` |
| `validateAndFetchModels`            | Model list for Ollama                       | `GET {endpointUrl}/api/tags` using validated `endpointUrl` (default `http://localhost:11434`)            |
| `validateAndFetchModels` (fallback) | Hardcoded model list                        | Constant map in `src/lib/ai/provider-models.ts` keyed by `AiProvider`                                    |
| `saveProviderSetting`               | Encrypted key stored                        | `encryptSecret(rawKey)` if provided; existing DB values preserved if `rawKey` omitted on existing record |
| `setActiveProvider`                 | `isActive = true` and optional model update | Atomic Prisma transaction: `updateMany` (set `isActive: false`), then `update` target provider row       |
| `getProviderConfigurations`         | Masked key hint (e.g. `sk-...XXXX`)         | Last 4 characters of decrypted key; wrapped in safe try block, null if unconfigured or Ollama            |
| `getProviderConfigurations`         | Five provider card list                     | Derived from `AiProvider` enum, merged with user database records                                        |
| Inline switcher                     | Active provider and model                   | `getActiveProviderSettings` result or `getProviderConfigurations` active item                            |

**Key invariants**:

- At most one `UserProviderSetting` row per `(userId, provider)` pair (enforced by unique index; upsert is the only write path).
- At most one `isActive = true` row per user at any time (enforced by the transaction in `setActiveProvider` and `saveProviderSetting`).
- Raw API keys never appear in a response payload, a server log, or client state beyond the controlled text input during entry.
- Ollama rows always have `encryptedKey = null`, `iv = null`, `authTag = null`; validation skips the key field for `OLLAMA` provider.
- `saveProviderSetting` preserves stored credentials if `rawKey` is omitted during model or endpoint updates.
- Decryption failures never trigger uncaught server exceptions; they produce `isCorrupted = true` on the card state to permit key reset.
- Outbound validation requests always abort after 8 seconds.

**Security model**:

- Every Server Action calls `auth()` first. A missing or expired session returns `{ error: 'Unauthorized' }` without a database query.
- All Prisma queries include `userId` derived from the server session, never from client input. A user cannot read or mutate another user's provider settings.
- Raw API keys are encrypted with AES-256-GCM inside the Server Action before any Prisma call. The encrypted ciphertext, 96-bit IV, and 128-bit auth tag are stored separately. Decryption requires `ENCRYPTION_KEY`.
- SSRF guard: Ollama `endpointUrl` is validated before network dispatch. Hostnames resolving to cloud metadata addresses (such as 169.254.169.254) and database ports are rejected.
- Masked key hints expose only the last four characters of the decrypted key; all prior characters are replaced by bullet characters server side.

**Configuration required**:

- `ENCRYPTION_KEY`: 32-byte hex string used for AES-256-GCM symmetric encryption.
- `AUTH_SECRET`: Random secret used by Auth.js v5 to hash tokens and sign session cookies.

**Critical test scenarios**:

- Happy path: authenticated user enters a valid OpenAI key, validates (chat models filtered), selects model, saves, and sees masked key on revisit, verifies **AC-1**, **AC-2**, **AC-4**, **AC-7**
- Happy path: user updates `defaultModel` on an existing provider without retyping the API key; stored ciphertext remains unchanged, verifies **AC-4**
- Happy path: user sets Anthropic as active; the transaction updates the previously active row to `isActive = false` and the Anthropic row to `isActive = true` in a single atomic transaction, verifies **AC-5**
- Happy path: Ollama configured with base URL only, verified against SSRF filter, model list fetched from `/api/tags`, saved successfully, verifies **AC-1**, **AC-3**, **AC-4**
- Failure case: invalid API key supplied; `validateAndFetchModels` returns a structured error within 8 seconds, no database write occurs, UI shows error inline, verifies **AC-2**
- Failure case: model list endpoint hangs; fetch aborts at 8 seconds, UI renders fallback hardcoded model list and retry button; user can still save, verifies **AC-2**, **AC-3**
- Failure case: Ollama endpoint targeting cloud metadata IP `169.254.169.254` or internal port `5432`; action rejects with invalid endpoint error, verifies **AC-3**
- Failure case: corrupted ciphertext or changed `ENCRYPTION_KEY`; `getProviderConfigurations` catches error, sets `isCorrupted = true`, settings page renders cleanly without crashing, verifies **AC-7**
- Auth/permission: unauthenticated call to any Server Action returns `{ error: 'Unauthorized' }` without database access, verifies **AC-8**
- Bilingual: settings page renders cleanly in RTL under `/ar/settings/providers` and in LTR under `/en/settings/providers`, verifies **AC-10**

## Build plan

Ordered by Tracer Bullet approach: wire foundational dependencies, Server Actions, data mapping, and UI slices.

- [x] 1. Install required dependencies (`next-auth@beta`, `@auth/prisma-adapter`, `ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`, `@ai-sdk/groq`, `ollama-ai-provider`), configure `src/auth.ts`, and add `AUTH_SECRET` to `.env.example`, satisfies **AC-8**
- [x] 2. Create `src/lib/ai/provider-models.ts` with known good model fallbacks, model filtering helpers for provider REST responses, and SSRF endpoint validator for Ollama, satisfies **AC-2**, **AC-3**
- [x] 3. Update `src/lib/validations/provider-settings.ts` and `src/lib/db/provider-settings.ts` to allow optional `rawApiKey` on updates when credentials already exist, satisfies **AC-4**
- [x] 4. Write four core Server Actions in `src/app/actions/provider-settings.ts`: `validateAndFetchModels` (with 8s timeout and model filters), `saveProviderSetting`, `setActiveProvider` (atomic transaction with optional model update), and `deleteProviderSetting`, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-8**
- [x] 5. Implement `getProviderConfigurations` in `src/app/actions/provider-settings.ts`, returning typed `ProviderCardState[]` for all 5 providers with safe try catch decryption and `isCorrupted` fallback, satisfies **AC-1**, **AC-7**, **AC-8**
- [x] 6. Build the Client Component form island `src/components/provider-settings/ProviderCard.tsx` covering key input, endpoint URL input for Ollama, live validation state, model selector, active toggle, corruption alert, and delete action, satisfies **AC-1**, **AC-3**, **AC-7**, **AC-10**
- [x] 7. Build the RSC settings page `src/app/[lang]/settings/providers/page.tsx` that loads all five provider configurations server side via `getProviderConfigurations` and renders five `ProviderCard` instances, satisfies **AC-1**, **AC-10**
- [x] 8. Build the inline switcher component `src/components/provider-settings/ProviderSwitcher.tsx` (exported for AI feature pages) that displays the active provider and model and invokes `setActiveProvider`, satisfies **AC-9**, **AC-10**
- [x] 9. Write unit tests for Server Actions and validation helpers (`src/app/actions/provider-settings.test.ts`): verify authentication guards, validation failure handling, SSRF rejection, transaction atomicity, and safe decryption error handling, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-7**, **AC-8**
- [x] 10. Write component tests for `ProviderCard` (`src/components/provider-settings/ProviderCard.test.tsx`): test masked key display, corruption reset UI, fallback model list rendering, and error feedback, satisfies **AC-1**, **AC-3**, **AC-7**

## Consequences

**Positive**:

- Users control their own AI costs; the platform never accumulates provider spend on their behalf.
- All five Vercel AI SDK providers are wired in one spec, so every later AI slice picks up the active provider without additional configuration work.
- Key validation before save means the database never accumulates broken credentials that silently fail on first AI call.
- Safe decryption handling guarantees that key corruption or secret rotation does not lock users out of their settings page.
- SSRF protections on Ollama endpoints prevent server side probing of internal infrastructure.
- Users can change models without having to find and re-enter their secret API key.

**Negative / tradeoffs**:

- Live model list fetching adds an HTTP round trip on validation. The 8 second timeout and hardcoded fallback map mitigate stalls but cannot eliminate external network latency.
- The single active provider model means users cannot send different tasks to different providers simultaneously without toggling the switcher.

**Neutral**:

- No new database migration; all columns already exist in `UserProviderSetting`.
- Ollama requires a running local server daemon. The UI card description must state this prerequisite clearly.
- The fallback model map constant (`provider-models.ts`) will require occasional updates as providers release new model families.

## Follow-up

- [x] Add bilingual dictionary keys for provider settings UI (card labels, status text, error notifications, SSRF warnings) to English and Arabic dictionaries before building components.
- [ ] Decide whether the settings route (`/[lang]/settings/providers`) needs a shared settings layout with navigation tabs for upcoming preferences slices.
- [ ] Ensure feature 6 (core resume tailoring thread) imports and embeds `ProviderSwitcher.tsx` directly in its tailoring interface.
