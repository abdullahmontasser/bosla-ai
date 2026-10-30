# 0016 rationale · Dedicated career prep and STAR hub

## Context

Interview practice is the moment the whole product pays off: the resume is tailored, the application sent, and the call looms in days. Today the STAR cheat sheet lives inside a tailor studio tab, next to streaming and ATS work, so rehearsing means reentering a heavy studio, remembering which tailored version to open, and risking edits inside a busy surface. The scope row for a dedicated career prep hub (Scope 18) asks for a standalone focused page: a job selector, deep links from tailored resumes, STAR breakdowns, copy, and print.

Forces at play:

- The engine is settled. Spec 0008 already defines generation (exactly 3 categorized STAR questions plus 3 interviewer questions), anti hallucination grounding with localized bracket placeholders, BYOK usage, and autosave. Rebuilding any of it would be waste and drift bait.
- The hub is mostly a read and edit surface. The persistence story is one JSON payload already on `TailoredResume.interviewPrep`. No new tables would be justified by this feature.
- The engineer wants custom questions. That is the one genuine data change: the payload must admit user authored questions with a CUSTOM category and empty STAR skeletons, which the studio invariant (exactly 3 AI questions) does not cover today.
- Bilingual fidelity is a standing rule. Arabic right to left correctness applies to the hub, the copy sheet, and the print route alike.
- Editors multiply. Two editing entrances (studio and hub) are affordable only if they share one implementation.

Not deciding would leave the deep links from spec 0015 pointing at a nonexistent route (they already target `/career-prep?tailoredResumeId=` today), so the handoff button currently errors for users.

## Options considered

### Option 1: Reuse the engine, hub over the existing payload, extend the payload to version 2 for custom questions (chosen)

A dedicated server prefetched page reuses `generateInterviewPrepAction`, `saveInterviewPrepAction`, `regenerateInterviewQuestionAction`, and the shared cards. Custom questions are stored in the same JSON payload, which moves to version 2 with a tolerant read of version 1.

**Pros**:

- Zero drift: one engine, one payload, one component set.
- No migration; the version field exists for exactly this kind of evolution.
- Custom and AI questions ship in one sheet, print and copy included.

**Cons**:

- Versioned payload logic adds a permanent normalizer path future changes must respect.
- The payload becomes a shared contract with the studio for as long as both entrances exist.

### Option 2: Hub with its own storage (new tables for prep documents)

A first class `InterviewPrepDocument` entity owned by the hub, with the studio tab migrated later.

**Pros**:

- Clean tool independent contract; deep source fields and history become possible.

**Cons**:

- A migration and a data copy for no measured need; two persistence layers for one artifact during the transition; reconciliation with the tracker later.
- Slows the tracer bullet slice for structure the product does not need yet.

### Option 3: Read only hub, editing stays in the tailor studio

The hub renders the payload with copy and print; edits route back to the studio.

**Pros**:

- Smallest hub code and the smallest test surface.

**Cons**:

- Splits the practice flow: a wording fix between STAR parts means a redirect into the studio.
- Deep linked practice plus edits matches rehearsing the night before the call, when redirecting into a heavy studio costs the most.

### Option 4: Deep link auto generation

A deep linked hub auto starts generation for a draft payload.

**Pros**:

- The true one click arrival: land and the questions are coming.

**Cons**:

- Surprise BYOK token spend on a stray click away from user intent; the engineer chose the explicit CTA (registered in the interview).

## Rationale

The engine reuse is forced by the codebase reality: the actions, the grounding prompt, and the autosave guard exist and were verified in spec 0008; option 2 would duplicate them and option 3 halves the flow. Between persistence shapes, the payload version bump is the smallest honest change that adds custom questions without inventing tables: version 2 plus a tolerant read is exactly how the payload format already anticipated change, and no query, index, or table changes. The print route, the RTL mirror, and the localized copy sheet reuse every rule the project already established for print and Arabic shaping (specs 0003, 0007, 0008), so the hub inherits conventions instead of charting them.

Cross check evidence (independent pass): twelve confirmed gaps were applied as named resolutions. The load bearing ones: URL driven selection (router push with server prefetch), the merge on generation so custom questions survive, the stale save 409 on `saveInterviewPrepAction`, the draft bootstrap sourcing from `JobPosting` and `TailoredResume.language`, the load more read action, and the studio tab reduced to a handoff CTA. The rejected framing was keep two editors, which the rationale above covers.

The custom questions decision is the one the engineer paid for deliberately: a CUSTOM category value (not reusing the three AI categories) keeps the sheet's original labeling honest in UI badges and the print route headers, and the 10 custom cap bounds payload size and print length while still covering heavy practice. Deletion semantics stay conservative: only custom questions are deletable, since AI questions are the grounded, anti hallucination contract of spec 0008.

The entry duplication was accepted as a tradeoff until the cross check surfaced the stale edit risk of two editors sharing one payload: edits made in one entrance and debounced there can be clobbered from the other, and the "exactly one editing implementation" invariant would be fiction. The engineer therefore chose the sharp version: the tailor studio's Interview Prep tab is deleted and replaced by a single handoff button to the hub (registered during the cross check round). The editor lives only in the hub, the weak print rules move with the components, and the way back from the hub to tailor stays an explicit affordance.
