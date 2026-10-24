# 0004. AI Provider Configuration (BYOK) — Rationale

## Context

CareerCraft AI is a BYOK (Bring Your Own Key) application: users supply their own AI provider credentials rather than sharing a platform key. This model keeps provider costs with the user, avoids exposing a platform level secret, and is the only viable approach for an open source self hosted tool. The platform must therefore provide a settings surface where users enter, validate, and manage those credentials securely.

The data layer to store credentials was already designed and implemented (spec 0002, `UserProviderSetting` table). What remains is the interaction layer: how users get credentials from their keyboard into the database safely, how they choose which model to use, and how the rest of the app discovers the active provider.

Several forces dominate the design. First, security: a user's provider key must never travel through a client rendered path or appear in a log or response body. Second, UX: a bad key should be caught immediately rather than surfaced as a cryptic AI failure mid session. Third, resilience: external provider delays, hanging local daemons, or rotated encryption secrets must never break the user experience or brick the settings page. Fourth, consistency: the active provider and model selection must be accessible to every AI feature without each feature reinventing its own resolution logic.

## Options considered

### Option 1: Client side form calling Route Handlers

Build the settings page as a full Client Component. The browser posts the raw key to a Route Handler, which validates, encrypts, and writes it.

**Pros**:

- Familiar React pattern; easy to manage live feedback state with `useState`.

**Cons**:

- The raw API key passes through browser fetch requests, making it visible in browser network inspectors and vulnerable to malicious extensions.
- Requires separate Route Handler files alongside the page, adding boilerplate for no architectural benefit.

### Option 2: Server Actions with RSC shell and Client Component island (chosen)

The page is a React Server Component that loads existing configurations server side. A minimal Client Component island handles the interactive form (key input, model selector, active toggle). All mutations are Next.js Server Actions, keeping the raw key inside the Node.js process from input to encryption to storage.

**Pros**:

- Raw key exists only in server memory during the Server Action call; it never appears in client bundles, response bodies, or client logs.
- The Server Component shell reads existing configurations and passes masked key hints to the client without a client initiated fetch.
- Aligns with the project App Router conventions (AGENTS.md: prefer Server Components, use `'use client'` only when browser interaction is needed).
- Enables clean server side SSRF checks on Ollama endpoint URLs and strict 8 second request timeouts on outbound provider fetches.

**Cons**:

- Server Actions add a layer of abstraction; debugging requires awareness of the Next.js request context.
- Progressive enhancement (form submitting without JavaScript) is limited because the model selector depends on an interactive validation step.

### Option 3: Client side direct calls to provider APIs

Validate keys in the browser by calling provider APIs directly, then post only a success token to the server for storage.

**Pros**:

- Zero server round trip for validation feedback.

**Cons**:

- The raw key is exposed in the browser, in browser memory, and to any client script. This is an unacceptable security regression. Rejected outright.

## Rationale

Option 2 is the right choice. The security argument alone is decisive: a raw AI provider key has real financial consequences if leaked. Keeping it inside a Server Action means it never crosses the network boundary in a readable form after the initial HTTPS POST. Option 1 is acceptable but weaker; Option 3 is a security failure.

The cross check surfaced important edge cases that we incorporated into Option 2:

1. **Model Discovery**: Vercel AI SDK provider factories do not expose model listing methods. We use direct server side `fetch()` calls to provider endpoints (for example `GET /v1/models`) with strict chat model filtering (omitting embeddings, audio, and moderation models) and an 8 second timeout (`AbortSignal.timeout(8000)`).
2. **Key Preservation**: When returning users update their default model, they should not be forced to retype their secret key. The Server Action allows `rawKey` to be optional on existing records, preserving existing ciphertext and auth tags.
3. **SSRF Guard**: Local Ollama endpoints are validated on the server before dispatch, blocking cloud metadata addresses (`169.254.169.254`) and internal service ports.
4. **Resilient Decryption**: Deriving masked key hints on the RSC shell is wrapped in a per card try catch. If an encryption secret is rotated, the card flags `isCorrupted = true`, allowing the user to reset the key rather than crashing the page with an unhandled 500 error.
5. **Single Active Provider Invariant**: Activating a provider runs in a single Prisma transaction that deactivates all other rows for that user. Saving a new provider automatically activates it if and only if no other provider is currently active.
