---
target: src/app/[lang]/profile/page.tsx
total_score: 22
max_score: 40
na_heuristics:
p0_count: 0
p1_count: 3
target_identity: 'file:/Users/abdullahmontasser/Desktop/projects/cv /src/app/[lang]/profile/page.tsx'
target_fingerprint: 'sha256:7ed6a5d0dc993ac992c994e59bedfb0e4d35f74ddc9b55f48ead01856803ee00'
target_path: /Users/abdullahmontasser/Desktop/projects/cv /src/app/[lang]/profile/page.tsx
timestamp: 2026-11-02T23-47-00Z
slug: src-app-lang-profile-page-tsx
---

# Candidate Profile Page (`/profile`)

## Design Health Score

| #         | Heuristic                       |    Score    | Key Finding                                                                                                                                                                                                                |
| --------- | ------------------------------- | :---------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1         | Visibility of System Status     |    2 / 4    | Async saves display short banners, but forms lack dirty/draft indicators; reordering gives zero feedback during API sync.                                                                                                  |
| 2         | Match System / Real World       |    3 / 4    | Sections map to resume models cleanly. However, `<input type="date">` forces exact day entry (`YYYY-MM-DD`) instead of standard Month/Year.                                                                                |
| 3         | User Control and Freedom        |    2 / 4    | Experience, Education, and Projects rely on browser-native `confirm()`; Skills deletes instantly on `X` click with zero confirmation/undo. Switching profile language silently wipes unsaved edits.                        |
| 4         | Consistency and Standards       |    2 / 4    | Divergent UX patterns across sibling cards: timeline popups in Experience/Education vs. static boxed cards in Projects vs. inline chip side-forms in Skills. Vertical reorder arrows inside wrapping horizontal flex rows. |
| 5         | Error Prevention                |    2 / 4    | Avatar cropper enforces size and format; however, date pickers allow start dates after end dates, and navigating away discards unsaved Identity changes without a dirty prompt.                                            |
| 6         | Recognition Rather Than Recall  |    2 / 4    | Section index tracks completion chips (`Ready`/`Basic`). However, Health Card flags "open issues" without in-context pointers, and Skills requires 100% manual memory recall with no autocomplete.                         |
| 7         | Flexibility and Efficiency      |    2 / 4    | No keyboard shortcuts (`Cmd+Enter`, `Esc`); item reordering requires repeated single-click API trips instead of drag-and-drop; no cross-profile mirroring or sync between EN and AR.                                       |
| 8         | Aesthetic and Minimalist Design |    2 / 4    | Elegant editorial frame and hairline layout, but Experience bullets commit the `side-tab` AI antipattern, and 15 skills create 45 cluttered micro-action buttons in a tag cloud.                                           |
| 9         | Error Recovery                  |    2 / 4    | Form errors show a top banner with unformatted API strings (`err.message`); deletion failures trigger raw `alert()`; no field-level error anchors.                                                                         |
| 10        | Help and Documentation          |    2 / 4    | Subtitles explain section roles, but lack contextual ATS implications, Google XYZ formula guides, or explanations of how EN/AR dual records export to PDFs.                                                                |
| **Total** |                                 | **22 / 40** | **Acceptable (55%)**                                                                                                                                                                                                       |

## Design Specificity Verdict

- **LLM Assessment**: The profile page demonstrates high macroscopic craft in its editorial frame (warm `#f3f1ea` gallery background, 1px hairlines, and bilingual parallel profile records). However, it lapses into category habit in its editing surfaces: experience bullet authoring is reduced to raw unguided inputs with zero Google XYZ formulas or AI assistance, skills lack ATS keyword integration, and health feedback is detached from the editing inputs.
- **Deterministic Scan**: 1 warning finding caught by `impeccable detect` (True Positive):
  - `side-tab` at [`ExperienceCard.tsx:323`](file:///Users/abdullahmontasser/Desktop/projects/cv /src/components/profile/ExperienceCard.tsx#L323): Bullet points are boxed into colored strip-tab callouts (`border-s-2 border-primary/30 bg-primary/[0.04]`) instead of clean typographic hanging-indent lists.
- **Visual Overlays**: Unavailable. Server-side session guard (`requireSession`) returns an HTTP 307 redirect to `/login` for unauthenticated headless browser sessions; no interactive CDP session is provisioned.

## Overall Impression

A visually distinguished editorial chassis housing generic form interiors. The dual-language architecture and avatar cropping workshop represent peak craft, but the actual resume authoring experience (plain bullet inputs, clunky reordering arrows, browser-native dialogs) misses CareerCraft's core promise of guided Google XYZ achievement engineering.

## What's Working

1. **Bilingual Architectural Parity (`LanguageProfileSwitch`)**: Dual independent master profiles (`EN` LTR and `AR` RTL) sharing a single candidate identity, using pure CSS logical properties and authentic Arabic typography (`font-arabic` Alexandria/Amiri).
2. **Tactile Avatar Cropping Workshop (`AvatarCropModal`)**: Canvas manipulation with circular masking, dual touch/mouse drag coordinates, smooth scaling, and automatic WebP quality clamping (<50KB).
3. **Calm Editorial Frame (`ProfileHub`)**: Restrained 2-column dossier layout (sticky 280px left rail with completion indicators + flush right content ledger) respecting `DESIGN.md`.

## Priority Issues

- **[P1] Silent Data Loss on Profile Language Switching & Navigation**: Switching between EN and AR or navigating away discards unsaved draft text without a dirty state warning.
  - _Why it matters_: Candidates spend 15–30 minutes writing achievement bullets; losing that work destroys trust.
  - _Fix_: Track form dirty state and intercept language switching and navigation with an unsaved changes confirmation modal.
  - _Suggested Command_: `$impeccable harden src/components/profile/ProfileHub.tsx`

- **[P1] Core Product Disconnect: Plain Bullet Inputs Instead of Google XYZ Scaffolding**: Experience bullets are plain text inputs lacking XYZ formula scaffolding, action-verb palettes, or inline metric validation.
  - _Why it matters_: CareerCraft's primary value proposition is transforming weak bullet points into quantified achievements.
  - _Fix_: Replace raw inputs with an expandable XYZ template (`Accomplished [X] as measured by [Y] by doing [Z]`) and inline metric highlighting.
  - _Suggested Command_: `$impeccable craft src/components/profile/ExperienceCard.tsx`

- **[P1] Jarring Browser Native Dialogs (`confirm`/`alert`) & Unprotected Skill Deletion**: Deleting experience/education calls `window.confirm()`; deleting a skill removes it immediately with zero confirmation or undo toast.
  - _Why it matters_: Native popups look broken; instant skill deletion causes frequent accidental data loss.
  - _Fix_: Replace native dialogs with Radix `AlertDialog` and add an undo toast for skill removals.
  - _Suggested Command_: `$impeccable harden src/components/profile/SkillsCard.tsx`

- **[P2] Visual Slop: Side-Tab Accent Borders on Bullet Points (`side-tab`)**: Experience bullets render as tinted mini-cards with `border-s-2 border-primary/30 bg-primary/[0.04]` (detected by `impeccable detect`).
  - _Why it matters_: This is a recognizable AI-generated UI trope that multiplies visual clutter across multi-bullet roles.
  - _Fix_: Replace tinted side-tab containers with clean typographic hanging-indent bullet lists (`•`).
  - _Suggested Command_: `$impeccable polish src/components/profile/ExperienceCard.tsx`

- **[P2] Spatial Incoherence & Clutter on Skill Pills**: 15 skills generate 45 micro-buttons with vertical `ArrowUp`/`ArrowDown` icons inside a horizontally wrapping flex container.
  - _Why it matters_: Up/down arrows in a horizontal tag cloud are spatially disorienting and visually noisy.
  - _Fix_: Remove individual pill reorder arrows; group skills semantically or provide a dedicated reorder drawer.
  - _Suggested Command_: `$impeccable layout src/components/profile/SkillsCard.tsx`

## Persona Red Flags

- **Alex (Power User)**: No keyboard accelerators (`Cmd+Enter`, `Esc`); moving an item up requires 8 individual click-and-wait API trips; no bulk import from existing resumes.
- **Jordan (First-Timer)**: Confronted with `38/100 Needs Work` in the sidebar with zero inline guidance on which edits improve it; freezes at blank summary textareas.
- **Tariq (Bilingual RTL Candidate)**: No cross-profile translation or mirroring between English and Arabic profiles; forced to manually re-type all credentials from scratch.

## Minor Observations

- Hardcoded `PROFILE / 01` through `05` tags prevent dynamic section reordering.
- `<input type="date">` forces exact day entry (`YYYY-MM-DD`) when resumes standardly require `Month, Year`.
- External project links lack `(opens in new window)` screen-reader announcements.

## Questions to Consider

1. _What if the Profile Hub was an active Google XYZ workbench that evaluated bullet metrics in real time as the candidate typed?_
2. _Why should English and Arabic profiles be completely isolated data silos instead of offering one-click intelligent draft mirroring?_
3. _Could the Health Card act as an interactive checklist that scrolls to and highlights the exact input needing attention?_
