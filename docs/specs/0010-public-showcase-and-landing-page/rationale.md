# 0010. Public showcase and landing page: Rationale

## Context

Bosla AI had reached Slice 6 with a working pipeline from resume parsing to tailoring, ATS scoring, PDF export, outreach, interview preparation, and kanban tracking. The existing landing page at `/[lang]` was a placeholder built from generic patterns: a centered badge with a text hero, three uniform feature cards, and simple navigation links. It described the product without showing it.

The first pass at this spec built an interactive benchmark studio under `src/components/showcase/`, including score dials, an architecture card, and a developer quickstart. The page read as a dashboard tour. Each instrument competed for attention, and a visitor still had to assemble the product story alone. The studio was removed and the page was rebuilt around one sample role.

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

## Generic Pattern Audit of the Original Page

Our audit of `src/app/[lang]/page.tsx` revealed four generic patterns:

1. **The Centered Badge and Headline Hero**: An icon inside a pill badge followed by a generic headline and a short paragraph. It describes the product rather than demonstrating it.
2. **The Repetitive Three Column Grid**: Three uniform cards with an icon box, title, description, and subtext. This is the most common artificial intelligence generated UI pattern, creating visual fatigue.
3. **Absence of Real Interface Evidence**: Visitors cannot see the tailoring flow, the ATS review, the bilingual output, or the tracker without signing in.
4. **Lack of Motion and Depth**: The page is completely static with flat 1px borders and no spatial hierarchy.

## Options Considered

### Option 1: Static Marketing Page with Marketing Illustrations

- Build a traditional marketing page using vector illustrations, feature lists, testimonials, and static call to action buttons.
- _Tradeoffs_: Fast to build, but fails to showcase the actual engineering depth of the open source product. Does not give recruiters immediate proof of capability.

### Option 2: Interactive Product Benchmark Studio

- Build an award caliber studio with an interactive ATS match benchmark, an architecture blueprint, a developer quickstart, and a bilingual component preview.
- _Tradeoffs_: Demonstrates individual features, but asks visitors to operate several instruments before they understand the product. The first implementation of this option shipped in the branch and was then removed for that reason.

### Option 3: Heavy 3D WebGL Canvas Hero

- Integrate Three.js and React Three Fiber to render a rotating 3D resume or neural network mesh.
- _Tradeoffs_: Significant bundle weight (over 150kb gzipped), high mobile battery usage, and potential frame drops on low power devices. Conflicts with the clean, developer grade workbench aesthetic established in `design.md`.

### Option 4: One Role Walkthrough (Selected)

- Follow a single sample role from job description to tailored resume, ATS coverage, achievement rewrite, interview preparation, and next step. Keep the page shell server rendered and isolate scroll motion in client islands.
- _Tradeoffs_: The story is illustrative rather than live, and the pinned desktop sequence needs a stacked fallback for small screens and reduced motion. In exchange, the page communicates the whole product in one reading path.

## Decision and Rationale

We selected **Option 4**. It solves the generic design problem by replacing abstract cards with a concrete sequence a visitor already understands: a job, a resume, a gap review, a stronger bullet, an interview, and a next action.

- The story is one role, not a feature menu, so each section answers the question the previous section raises.
- Tactile paper surfaces, high contrast typography, editorial serif display type, and inline keyword pills come from Notion, Slite, and Voicenotes.
- GSAP and ScrollTrigger drive the pinned desktop story; reduced motion and small screens get a stacked reading layout.
- The telemetry endpoint and `AnalyticsEvent` model already existed before this slice. The page does not dispatch activation events yet, so the spec records that as follow up rather than delivered scope.

## References

- Notion Design System: https://styles.refero.design/style/2bf4c61f-de10-4614-ba1b-20c0453bd2a9
- Slite Design System: https://styles.refero.design/style/607c2098-bbbb-40bb-b23e-adf2b72c63dd
- Voicenotes Design System: https://styles.refero.design/style/cafcbe97-58eb-4331-9a0a-c5e6969e8a04
- Aboard Design System: https://styles.refero.design/style/fabacd2a-acb6-46c4-939c-4a464df15440
