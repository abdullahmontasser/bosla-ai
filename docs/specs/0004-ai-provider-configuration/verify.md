# Verify: AI Provider Configuration (BYOK) · spec 0004

## Acceptance criteria coverage

- [x] AC-1: Settings page reachable at `/[lang]/settings/providers` renders five provider cards (OPENAI, ANTHROPIC, GEMINI, GROQ, OLLAMA) with key/endpoint input, validation trigger, model selector, active toggle, and delete action.
- [x] AC-2: Server Action `validateAndFetchModels` makes server side HTTP fetch with 8s timeout, decrypts stored key if omitted, filters to chat models, and returns structured errors without DB writes.
- [x] AC-3: Ollama endpoint validated against SSRF (blocks cloud metadata IP 169.254.169.254 and restricted internal ports like 5432). Fallback models catalog presented on fetch failures.
- [x] AC-4: `saveProviderSetting` encrypts keys via AES-256-GCM. Updates preserve existing credentials when rawKey is omitted.
- [x] AC-5: `setActiveProvider` updates single active provider via atomic Prisma transaction. Saving new provider activates it if none is currently active.
- [x] AC-6: `deleteProviderSetting` removes database record; deleting active provider leaves none active.
- [x] AC-7: `getProviderConfigurations` returns 5 ProviderCardState items, safely masks key hints to last 4 characters, and flags `isCorrupted: true` on decryption failure without crashing.
- [x] AC-8: Every Server Action verifies authentication via `auth()` and rejects unauthenticated calls with `{ error: 'Unauthorized' }`.
- [x] AC-9: `ProviderSwitcher` renders active provider and model, and invokes `setActiveProvider` on selection.
- [x] AC-10: Complete bilingual LTR (English) and RTL (Arabic) layout support with font pairing and dictionary translations.

## Observable evidence ledger

1. Production Build: `next build --webpack` exited code 0, generated static shell and partial prerendering streaming routes for `/en/settings/providers` and `/ar/settings/providers`.
2. Live HTTP GET `/en/settings/providers`: HTTP 200 OK with `dir="ltr"`, streaming 5 provider cards with English dictionary strings.
3. Live HTTP GET `/ar/settings/providers`: HTTP 200 OK with `dir="rtl"`, `font-arabic`, streaming 5 provider cards with Arabic dictionary strings.
4. Unit and component test suites: 130 tests across 16 files passing (`npm run test`).
5. Typecheck and lint: `tsc --noEmit` and `eslint` clean with 0 errors.
