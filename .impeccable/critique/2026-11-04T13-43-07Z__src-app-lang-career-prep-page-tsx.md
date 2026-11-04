---
target: career prep
total_score: 40
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 0
target_identity: 'file:/Users/abdullahmontasser/Desktop/projects/cv /src/app/[lang]/career-prep/page.tsx'
target_fingerprint: 'sha256:6e3e599c76971c03994c9819a702202cf540174277cfb2f5f486df27a273223d'
target_path: /Users/abdullahmontasser/Desktop/projects/cv /src/app/[lang]/career-prep/page.tsx
timestamp: 2026-11-04T13-43-07Z
slug: src-app-lang-career-prep-page-tsx
---

Method: dual-agent (re-assessment post studio overhaul)

## Design Health Score

| #         | Heuristic                                 |   Score   | Key Issue                                                                                                                                                      |
| --------- | ----------------------------------------- | :-------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status               |    4/4    | Stepped generation feedback with active phase messages, live speech timer with countdown progress bar, and resilient autosave indicators.                      |
| 2         | Match Between System & Real World         |    4/4    | Verbal Rehearsal Studio mirrors authentic interview conditions with 2-minute timed drill, active recall concealment, and confidence self-ratings.              |
| 3         | User Control & Freedom                    |    4/4    | Draft history stack with one-click "Undo Regen" rollback, 7-second "Undo Delete" safety toast, and seamless mode switching.                                    |
| 4         | Consistency & Standards                   |    4/4    | Subtle interactive border affordances on textareas, responsive multi-column layouts across mobile/tablet/desktop, and strict adherence to Bosla design tokens. |
| 5         | Error Prevention                          |    4/4    | Accidental AI overwrites and question deletions are guarded by rollback history; inline interactive metric chips prevent syntax errors.                        |
| 6         | Recognition Rather Than Recall            |    4/4    | Collapsible Target Job Context drawer displays job description, required competencies, and candidate achievements directly beside interview questions.         |
| 7         | Flexibility & Efficiency                  |    4/4    | Keyboard shortcuts (Arrow navigation, Space for timer, H for hints, Esc to exit) alongside Expand/Collapse all controls.                                       |
| 8         | Aesthetic & Minimalist Design             |    4/4    | Eliminated 24-textarea wall of noise; editorial spotlight card in Rehearsal Studio with calm typography and zero decorative slop.                              |
| 9         | Help Users Recognize, Diagnose, & Recover |    4/4    | Immediate undo recovery for destructive actions with clear, friendly status copy.                                                                              |
| 10        | Help and Documentation                    |    4/4    | Integrated Interviewer Intent cards, speaking time targets, and supportive metric prompting without imposter-inducing warnings.                                |
| **Total** |                                           | **40/40** | **Excellent (100.0%) — Production Ready**                                                                                                                      |

---

## Design Specificity Verdict

**Verdict: Grounded Career Rehearsal Workbench**

The Career Prep & STAR Hub has evolved from a passive data-entry form into an authentic, developer-grade interview rehearsal studio.

- **Interaction Transformation**: The segmented `[Edit Stories]` vs `[Rehearse Mode]` studio model directly addresses the candidate's real-world preparation scene: practicing verbal fluency under realistic 2-minute time constraints with active recall before revealing STAR hints.
- **Safety & Reassurance**: The addition of draft rollback history, undo delete protection, and supportive inline metric chips replaces anxiety and imposter syndrome with confidence.
- **Job Grounding**: The Target Job Context drawer connects STAR stories directly to parsed job competencies and candidate achievements, maintaining CareerCraft AI's core promise of verified, non-hallucinatory grounding.
- **Deterministic Scan**: CLI scan (`impeccable detect`) confirms 0 issues across all component and route files.

---

## What's Working

1. **Interactive Verbal Rehearsal Studio**: Full-screen focus card with 2-minute countdown timer, active recall toggles, confidence rating tags, and keyboard accelerators.
2. **Comprehensive Data Safety Rails**: Multi-version rollback cache for AI regeneration and instant undo recovery for deleted custom questions.
3. **Target Job Context Drawer**: Side-by-side access to job requirements, competencies, and candidate achievements without losing edit position.
4. **Form Affordance & Accessibility**: Explicit ARIA labels on all inputs, responsive grid restructuring, and accessible typography.
