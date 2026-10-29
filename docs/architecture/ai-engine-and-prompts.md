# Multi Provider AI Engine and Prompt Architecture

This document explains how CareerCraft AI orchestrates multi provider artificial intelligence models, secures API credentials, streams candidate tailoring, and enforces strict anti hallucination rules.

## Bring Your Own Key (BYOK) Philosophy

CareerCraft AI operates on a Bring Your Own Key model. Candidates supply their own API keys for top tier language model providers rather than relying on a rate limited or monetized proxy.

Benefits include:

- **Cost Transparency**: You pay providers directly at standard inference prices without platform markup.
- **Privacy and Sovereignty**: Requests travel directly from server memory to the provider of your choice.
- **Provider Choice**: You pick the model that best fits your requirements for speed, cost, or reasoning depth.

## Supported Providers and Model Selection

The provider registry in `src/lib/ai/provider-models.ts` and client factory in `src/lib/ai/provider-client.ts` support five major AI providers:

1. **Anthropic**: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
2. **OpenAI**: GPT-4o, GPT-4o mini, o1, o3-mini
3. **Google Gemini**: Gemini 2.0 Flash, Gemini 1.5 Pro, Gemini 1.5 Flash
4. **Groq**: Llama 3.3 70B Versatile, Mixtral 8x7B, DeepSeek R1 Distill
5. **Ollama**: Local models running on `localhost:11434` for zero cloud inference

Each provider registers recommended defaults and fallback capabilities so the workbench continues functioning even during provider degradation.

## Symmetric Credential Encryption (AES-256-GCM)

User API keys are never stored as plain text. The application encrypts credentials before persisting them to PostgreSQL.

The cryptographic module in `src/lib/crypto.ts` uses authenticated AES-256-GCM:

```
[ Plaintext User API Key ]
            │
            ▼
[ Generate Random 12-byte IV ]
            │
            ▼
[ AES-256-GCM Encryption with ENCRYPTION_KEY ]
            │
            ▼
[ Payload: IV + Encrypted Data + 16-byte Auth Tag ]
            │
            ▼
[ Base64 Stored in PostgreSQL ProviderSettings ]
```

When an AI operation executes:

1. The server action fetches the encrypted record matching `session.user.id`.
2. The server decrypts the key in volatile memory using the secret `ENCRYPTION_KEY`.
3. The decrypted key is passed to the Vercel AI SDK provider instance.
4. The key is scrubbed from memory as soon as execution completes.

If a key cannot decrypt because the environment encryption key changed, the system gracefully recovers by flagging the record and allowing the candidate to enter a fresh key without crashing.

## Real Time Streaming with Vercel AI SDK

Resume tailoring uses the Vercel AI SDK `ai` package and streaming route handlers at `src/app/api/tailor/route.ts`:

- The client submits candidate experience, profile data, and target job postings.
- The server validates inputs using Zod schemas in `src/lib/validations/tailor.ts`.
- The server executes `streamText()` using the candidate active AI provider.
- Output streams across an HTTP connection as server sent events.
- On the client, `LiveTailorStream` renders the arriving markdown incrementally with smooth auto scroll.
- When the stream closes, the server action automatically creates a tailored resume snapshot record in PostgreSQL with status `COMPLETED`.

## Anti Hallucination Guardrails and Google XYZ Formulas

A common failure mode of generic AI resume generators is fabricating unearned metrics, false credentials, or exaggerated accomplishments.

CareerCraft AI enforces strict grounding rules:

### 1. Grounded Bullet Optimization

Resume bullet point rewrites follow Google XYZ structure:
`Accomplished [X] as measured by [Y], by doing [Z]`

Prompts instruct the model:

- Draw facts exclusively from the candidate submitted profile.
- You may rephrase, clarify, and emphasize existing achievements.
- You must never invent unverified metrics, percentages, dollar amounts, company names, or job titles.
- If a quantitative figure is absent in the source bullet, describe the operational outcome clearly without inventing arbitrary numbers.

### 2. Validation Guard on Server Action

When a candidate requests an AI rewrite for a resume health issue via `rewriteBulletWithAiAction()` in `src/app/actions/resume-health.ts`:

- The output undergoes a grounding check comparing original numbers against rewritten numbers.
- If the model introduced invented numerals not present in the original bullet, the rewrite is flagged or stripped before presenting the result to the candidate.

## Rate Limiting and Telemetry

To protect both candidates and external model quotas from abuse or runaway loops, AI routes implement token bucket rate limiting in `src/lib/telemetry/rate-limiter.ts`:

- Requests are tracked per authenticated user ID.
- Tailoring endpoints enforce limits per minute and per hour.
- Exceeded thresholds return localized HTTP 429 errors explaining when the candidate may retry.
