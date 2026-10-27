# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are ambitious tech professionals (software engineers, product managers, designers, engineering leads) and technical career switchers. They are applying for competitive roles, facing automated ATS screening filters, and need high-impact, quantified resume bullets and tailored recruiter pitches in minutes.

## Product Purpose

CareerCraft AI is an autonomous, bilingual career acceleration workbench. It exists to reverse-engineer job postings, eliminate weak resume bullets through proven Google XYZ formulas (`Accomplished [X] as measured by [Y], by doing [Z]`), audit ATS keyword gaps in real time, and manage job application pipelines with native Arabic (RTL) and English (LTR) symmetry. Success means higher ATS pass rates, 3x recruiter response rates, and accelerated interview callbacks.

## Positioning

Unlike generic AI resume wrappers that hallucinate experience or produce bland generic buzzwords, CareerCraft AI enforces grounded Google XYZ metric extraction derived strictly from the candidate's real experience, paired with real-time ATS match scoring, bilingual typography, and Bring-Your-Own-Key (BYOK) multi-provider AI freedom (OpenAI, Anthropic, Gemini, Groq, Ollama).

## Operating Context

- High-pressure job search cycles across regional and global tech markets.
- Strict ATS parsing systems (Workday, Greenhouse, Lever, Taleo) requiring clean typographic hierarchies and zero layout-breaking quirks.
- Cross-cultural bilingual environments where resumes and correspondence alternate between English (LTR) and Arabic (RTL).
- Privacy-conscious developer workflow with local encrypted key storage and zero vendor lock-in.

## Capabilities and Constraints

- **Resume Ingestion & Parsing**: Native vector PDF and DOCX parsing with structured JSON extraction.
- **Google XYZ Bullet Optimization**: Quantified, evidence-grounded metric re-authoring with zero hallucination guarantee.
- **ATS Keyword Matching**: Real-time scoring dial with skill gap detection and single-click profile integration.
- **Bilingual Vector PDF Generation**: Headless in-memory vector PDF generation with full Arabic font shaping.
- **Multi-Provider AI (BYOK)**: User-provided API keys for Anthropic Claude 3.5, OpenAI GPT-4o, Google Gemini, Groq, and local Ollama.
- **Kanban Application Tracker**: Optimistic drag-and-drop state updates with follow-up staleness alerts and RTL coordinate inversion.
- **Recruiter Pitch & STAR Prep**: 300-character LinkedIn InMail pitches and structured behavioral STAR interview matrix.

## Brand Commitments

- **Name**: CareerCraft AI
- **Voice**: Restrained, developer-grade, confident, evidence-based, devoid of corporate jargon or marketing hyperbole.
- **Aesthetic**: Minimalist high-density workbench, hairline 1px rules, obsidian dark mode canvas with pure white light mode, electric cobalt accent.
- **Bilingual First**: Flawless parity between Arabic and English typography, alignment, and semantic hierarchy.

## Evidence on Hand

- Standard benchmark data models and presets: `src/components/showcase/showcase-data.ts`.
- Verified Arabic font assets and shaping modules: `src/lib/pdf/arabic-shaping.ts` and `src/lib/fonts.ts`.
- Candidate fixture schemas: `src/lib/fixtures/sample-candidate.ts`.
- Comprehensive test suite covering 66 modules and 460 verification cases.

## Product Principles

1. **Evidence Over Hallucination**: Never invent metrics, employers, or credentials; draw impact exclusively from verified candidate truth.
2. **First-Class Bilingual Parity**: Arabic is never an afterthought or cosmetic translation; LTR and RTL hold identical architectural and typographic weight.
3. **High-Density Workbench Speed**: Treat career management as an instrument of precision—instant keyboard navigation, minimal latency, zero decorative fluff.
4. **Data Sovereignty & Freedom**: Candidates own their resumes, data, and API keys; no walled gardens or forced subscription lock-in.

## Accessibility & Inclusion

- Adherence to WCAG 2.1 AA standards across all workflows.
- Full keyboard operability and explicit ARIA landmark roles.
- Respect for `prefers-reduced-motion` across interactive physics and canvas elements.
- Fluid touch targets (≥ 44×44px) on all mobile responsive viewports.
