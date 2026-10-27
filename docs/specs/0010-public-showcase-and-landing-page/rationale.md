# 0010. Public showcase and landing page: Rationale

## Context

CareerCraft AI has reached Slice 6, having built the full functional pipeline from resume parsing to AI tailoring, deterministic ATS scoring, PDF export, outreach generation, interview preparation, and kanban application tracking. The existing landing page at `/[lang]` was a preliminary placeholder built with generic artificial intelligence patterns: a centered badge with text hero, three uniform feature cards, and simple navigation links. It lacked visual hierarchy, tactile depth, interactive demonstration, and brand distinction.

To present an award level public showcase, the landing page must demonstrate the application's capabilities directly. Visitors and recruiters should experience the product's value proposition without needing an account or API key, while technical evaluators can inspect the open source architecture, developer quickstart, and telemetry pipeline.

## Visual Reference Analysis

We analyzed four benchmark design systems from Refero:

1. **Notion** (`2bf4c61f-de10-4614-ba1b-20c0453bd2a9`):
   - Warm paper canvas (`#f6f5f4`) in light mode paired with crisp white card containers (`#ffffff`) and hairline borders (`rgba(0,0,0,0.08)`).
   - High contrast black typography (`#000000`) creating hierarchy through opacity levels (100%, 95%, 60%, 40%).
   - Saturated Electric Blue accent (`#0075de`) for primary actions.
   - Inline keyword pills highlighting key concepts directly within sentences.
   - Direct product UI mockups with subtle elevation shadows (`0px 4px 12px rgba(0,0,0,0.08)`).

2. **Slite** (`607c2098-bbbb-40bb-b23e-adf2b72c63dd`):
   - Warm parchment cream canvas (`#fdf9f4`) and sand card surfaces (`#f9efe4`).
   - Deep slate typography (`#2d2f34`) with tight heading tracking.
   - Restrained warm terracotta accents (`#f67748`).
   - Clean nested documentation layout and visual quietness around content.

3. **Voicenotes** (`cafcbe97-58eb-4331-9a0a-c5e6969e8a04`):
   - Refined tactile canvas (`#faf9f5`), pure white surfaces, deep near black text (`#0d0d0d`).
   - Vibrant emerald indicators (`#34c759`) for status signals.
   - Clear contrast between modern geometric sans and selective editorial accents.

4. **Aboard** (`fabacd2a-acb6-46c4-939c-4a464df15440`):
   - Crisp modern canvas (`#fafafa` and `#ffffff`) with dark graphite typography (`#262626`).
   - Electric sky blue actions (`#008ae8`) with soft pastel tag accents.
   - Structured card containers with dense data chips and clean pill buttons.

## Generic Pattern Audit of the Existing Page

Our audit of `src/app/[lang]/page.tsx` revealed four generic patterns:

1. **The Centered Badge and Headline Hero**: An icon inside a pill badge followed by a generic headline and a short paragraph. It describes the product rather than demonstrating it.
2. **The Repetitive Three Column Grid**: Three uniform cards with an icon box, title, description, and subtext. This is the most common artificial intelligence generated UI pattern, creating visual fatigue.
3. **Absence of Real Interface Evidence**: Visitors cannot see or test the ATS scoring engine, the bilingual resume output, or the kanban tracker without signing in.
4. **Lack of Motion and Depth**: The page is completely static with flat 1px borders and no spatial hierarchy.

## Options Considered

### Option 1: Static Marketing Page with Marketing Illustrations

- Build a traditional marketing page using vector illustrations, feature lists, testimonials, and static call to action buttons.
- _Tradeoffs_: Fast to build, but fails to showcase the actual engineering depth of the open source product. Does not give recruiters immediate proof of capability.

### Option 2: Full Interactive Product Showcase with Live Previews (Recommended)

- Build an award caliber showcase featuring an interactive ATS match benchmark tool with sample job postings and candidate profiles, an interactive architecture blueprint, a bilingual interactive component preview, developer quickstart commands, and privacy preserving telemetry.
- _Tradeoffs_: Requires client component islands for interactive benchmarks, but directly demonstrates value and engineering quality while preserving server component architecture.

### Option 3: Heavy 3D WebGL Canvas Hero

- Integrate Three.js and React Three Fiber to render a rotating 3D resume or neural network mesh.
- _Tradeoffs_: Significant bundle weight (over 150kb gzipped), high mobile battery usage, and potential frame drops on low power devices. Conflicts with the clean, developer grade workbench aesthetic established in `design.md`.

## Decision and Rationale

We selected **Option 2**. It directly solves the generic design problem by replacing abstract cards with real, interactive product instruments:

- An interactive ATS benchmark workbench allowing visitors to compare candidate resumes against real job postings in English and Arabic.
- A technical architecture card illustrating the autonomous agent pipeline (PostgreSQL, Prisma, Vercel AI SDK, React PDF vector rendering, and Auth.js).
- Tactile paper surfaces, high contrast typography, and inline keyword pills inspired by Notion and Slite.
- Zero extra heavy dependencies: pure CSS transitions and keyframes, with headless Chrome driving automated visual QA across three viewports and both language directions.

## References

- Notion Design System: https://styles.refero.design/style/2bf4c61f-de10-4614-ba1b-20c0453bd2a9
- Slite Design System: https://styles.refero.design/style/607c2098-bbbb-40bb-b23e-adf2b72c63dd
- Voicenotes Design System: https://styles.refero.design/style/cafcbe97-58eb-4331-9a0a-c5e6969e8a04
- Aboard Design System: https://styles.refero.design/style/fabacd2a-acb6-46c4-939c-4a464df15440
