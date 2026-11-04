---
target: tracker page
total_score: 38
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 0
target_identity: 'file:/Users/abdullahmontasser/Desktop/projects/cv /src/app/[lang]/tracker/page.tsx'
target_fingerprint: 'sha256:fbbb32c11f6f529cacc49ebcbcfc0f2c1ca4bed682ab191b36564ce9e42cd613'
target_path: /Users/abdullahmontasser/Desktop/projects/cv /src/app/[lang]/tracker/page.tsx
timestamp: 2026-11-04T14-05-00Z
slug: src-app-lang-tracker-page-tsx
---

# Critique: Job Application Tracker (`src/app/[lang]/tracker/page.tsx`) — Post-Refinement

Method: verification & craft review

### Design Health Score

| #         | Heuristic                       | Score     | Key Finding & Evaluation                                                                                                              |
| --------- | ------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status     | 4         | Real-time optimistic feedback with React 19; accessible screen reader announcements; clear drag overlay.                              |
| 2         | Match System / Real World       | 4         | Sequence strictly preserved across mobile, tablet, and desktop with horizontal swipe track; natural recruitment pipeline terminology. |
| 3         | User Control and Freedom        | 4         | Escape key listener in drawer and modals; dedicated drag handles leave cards clickable; quick stage dropdowns.                        |
| 4         | Consistency and Standards       | 4         | Aligned with `design.md` editorial tokens (primary, muted slate, subtle hairlines); logical properties (`end-0`).                     |
| 5         | Error Prevention                | 4         | Dedicated drag handle prevents accidental drag misfires on touch; 2-step inline confirmation on deletion.                             |
| 6         | Recognition Rather Than Recall  | 4         | ATS score pills with studio deep-linking; co-located job posting specs and outreach notes.                                            |
| 7         | Flexibility and Efficiency      | 4         | Workbench hotkeys (`/` to search, `N` to add card); 1-click outreach note copy; instant tap-to-inspect.                               |
| 8         | Aesthetic and Minimalist Design | 4         | Removed kicker clutter and empty outreach text; quiet neutral tones for rejected applications; clean drop zone placeholders.          |
| 9         | Error Recovery                  | 3         | Accessible alert banner with dismiss on optimistic rollback; localized validation messages.                                           |
| 10        | Help and Documentation          | 3         | Clear search hints, keyboard shortcuts displayed inline, descriptive empty state cues.                                                |
| **Total** |                                 | **38/40** | **Excellent (95.0%)**                                                                                                                 |

---

### Design Specificity Verdict

**Verdict**: **Fully Authored High-Density Career Workbench**

The tracker now combines developer-grade precision with the serene, editorial design language of Bosla AI / CareerCraft AI. The hiring funnel retains its logical chronological integrity across all screen sizes, touch interactions are decoupled from drag gestures, and power-user keyboard accelerators enable fluid pipeline management.
