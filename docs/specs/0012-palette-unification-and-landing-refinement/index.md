# 0012. Palette unification and landing refinement

**Date**: 2026-10-27
**Status**: Accepted

## Summary

The public landing page used a warm paper and deep green palette scoped under `.landing-shell`, while the workspace used a neutral black and white scale. The two halves of the product read as different applications. The landing page had also grown busy: three alternating full width capability rows with large mockups, a conversation block, a foundation grid, and oversized display headings.

This specification promotes the landing palette to the root tokens and simplifies the landing composition so the same identity carries from the first visit into the workspace.

## Requirements

**User stories**:

- As a visitor, I want one visual identity from the landing page into the workspace, so the product feels like one place.
- As a reader, I want the landing page to explain one idea per section without wading through paragraphs and mockups.
- As a reduced motion or small screen user, I want the role walkthrough to stay readable as a compact accordion instead of a very long stack.

**Acceptance criteria**:

- **AC-1**: Define the warm paper, deep green, noir, and mint values once at `:root` and `.dark`. Remove the `.landing-shell` palette override so every surface shares the same semantic tokens.
- **AC-2**: Keep `--landing-paper`, `--landing-panel`, `--landing-line`, and the related scale global, so product mockups can still sit on paper in either theme.
- **AC-3**: Update `design.md` to describe Bosla, the warm paper and deep green light palette, the noir and mint dark palette, the display type pairing, and the auth and workspace surfaces.
- **AC-4**: Replace the three alternating capability rows, the conversation block, and the foundation grid with one compact capability card grid, one short conversation band, and a single line of foundation links.
- **AC-5**: Keep the six stage role walkthrough, but render the reduced motion and small screen path as a native `<details>` accordion with one open stage, instead of stacking all six full panels.
- **AC-6**: Reduce section rhythm and display sizes on the orientation, comparison, closing action, and trust sections so the page reads calmly at `1440x900`.
- **AC-7**: Keep Arabic line masks, logical properties, and the existing focus rings intact through the redesign.
- **AC-8**: Verify the landing and workspace in both locales and both themes at desktop, tablet, and mobile widths, then run typecheck, lint, format check, tests, and the production build.

## Decision

**Chosen option**: Promote the landing palette to root tokens and simplify the landing to one capability grid.

The landing palette is the more distinctive identity, and the user asked for the whole app to match it. Scoping it to the landing was the reason the two halves diverged. Moving it to root keeps one source of truth and removes the per page override.

For density, the product story already carries the detailed walkthrough. The capability section does not need a second, larger tour with mockups, so it becomes a compact grid that points into the product.

## Build plan

1. **Tokens**
   - [x] Move the light and dark palette to `:root` and `.dark`.
   - [x] Move the landing scale to root and remove the `.landing-shell` overrides.
2. **Landing density**
   - [x] Rewrite `Features` as a three card capability grid with a short conversation band and one line of foundation links.
   - [x] Convert the static and reduced motion `ProductStory` into a native accordion with one open stage.
   - [x] Tighten section padding and display sizes in `HowItWorks`, `Comparison`, `FinalCta`, and `TrustStrip`.
   - [x] Shorten the pinned walkthrough travel so the page loses roughly a viewport of scroll.
3. **Auth surfaces**
   - [x] Apply the promoted palette to the login and signup split layout with a deep forest panel.
4. **Verification**
   - [x] Update `design.md`.
   - [ ] Capture the landing and auth pages in both locales and inspect density, contrast, and overflow.
   - [ ] Run typecheck, lint, format check, tests, and the production build.

## Consequences

- **Positive**:
  - One palette means the workspace and landing finally look like the same product.
  - The capability section drops from roughly six screenfuls of alternating content to one compact grid.
  - Reduced motion users get a short accordion instead of a 5,000px stack.
- **Negative / Tradeoffs**:
  - The workspace adopts a warm background and green primary, which changes the look of every existing admin style surface at once. Hardcoded slate and neutral utilities in older components may need a follow up pass.
  - The landing loses some product detail from the capability mocks. The walkthrough still carries the detail, but readers who skip it see less.
  - `design.md` is now the source of truth for a palette that also affects non landing pages, so future component work must read it before choosing colors.

## Follow-up

- Audit older workspace components for hardcoded `slate`, `neutral`, and `emerald` utilities that should use semantic tokens.
- Revisit the `/design-system` page, which still documents the retired cobalt palette.
