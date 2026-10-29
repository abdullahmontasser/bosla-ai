# Bosla AI: Design System Reference

A warm, editorial interface for bilingual resume tailoring, job tracking, and interview preparation.

**Tokens**: `src/app/globals.css` (Tailwind CSS v4 `@theme inline`)
**Primitives**: Radix UI headless primitives and Lucide icons
**Art direction**: `PRODUCT.md` and this file

---

## 1. Visual Language and Aesthetic

Bosla AI uses one palette across the public landing page and the signed in workspace. The product should feel like a calm desk, not a control panel.

- **Warm Gallery Paper**: Light mode uses warm paper (`#f3f1ea`) with `#fbfaf5` card surfaces and `#fffdf8` popovers. Never pure white as the page canvas.
- **Noir and Mint**: Dark mode uses deep noir (`#070908`) with `#0b0f0d` card surfaces. Mint (`#45d99a`) is the primary signal.
- **Deep Green Accent**: Forest green (`#0a6b4b`) is the light mode primary. It is reserved for primary actions, active indicators, focus rings, links, and selection.
- **Hairline Separation**: Structural grouping uses 1px warm hairlines (`rgba(12, 19, 15, 0.12)` light, `rgba(235, 245, 238, 0.09)` dark) instead of heavy shadows.
- **Precise Radii**: 8px for buttons and inputs, 10px for cards and panels, 12px for product mockups that need to read as objects.
- **Editorial Display Type**: Headlines pair Geist Sans with Newsreader italic accents in English, and Alexandria with Amiri accents in Arabic.

The palette is defined once at `:root`, not scoped to a page. The `landing-*` tokens (`--landing-paper`, `--landing-panel`, and friends) are global too, so any surface can borrow the paper and panel scale without forking the theme.

---

## 2. Semantic Color Scale

All colors map to CSS custom variables in `src/app/globals.css`:

| Semantic Token           | Light Mode Value         | Dark Mode Value             | Role                                      |
| ------------------------ | ------------------------ | --------------------------- | ----------------------------------------- |
| `--background`           | `#f3f1ea`                | `#070908`                   | Root page canvas                          |
| `--foreground`           | `#0c130f`                | `#f3f5f1`                   | Primary body copy and headings            |
| `--card`                 | `#fbfaf5`                | `#0b0f0d`                   | Resume sections, action cards, panels     |
| `--card-foreground`      | `#0c130f`                | `#f3f5f1`                   | Card content text                         |
| `--popover`              | `#fffdf8`                | `#0d1210`                   | Dropdown menus, tooltips, dialogs         |
| `--popover-foreground`   | `#0c130f`                | `#f3f5f1`                   | Popover text                              |
| `--primary`              | `#0a6b4b`                | `#45d99a`                   | Primary buttons, links, active indicators |
| `--primary-foreground`   | `#f7fbf8`                | `#05110b`                   | Text on primary fills                     |
| `--secondary`            | `#e9e6dd`                | `#111713`                   | Secondary fills, filter pills             |
| `--secondary-foreground` | `#0c130f`                | `#e7eee9`                   | Secondary labels                          |
| `--muted`                | `#eae7de`                | `#0f1411`                   | Quiet containers and code blocks          |
| `--muted-foreground`     | `#4c5851`                | `#98a39c`                   | Subtitles, timestamps, metadata           |
| `--accent`               | `#e4ebe5`                | `#151d18`                   | Hover states in menus and navigation      |
| `--destructive`          | `#b42318`                | `#f87171`                   | Deletion, validation failures             |
| `--success`              | `#0a6b4b`                | `#45d99a`                   | Matched ATS keywords, completed states    |
| `--border`               | `rgba(12, 19, 15, 0.12)` | `rgba(235, 245, 238, 0.09)` | Hairline dividers and component borders   |
| `--input`                | `rgba(12, 19, 15, 0.16)` | `rgba(235, 245, 238, 0.14)` | Form input outlines                       |
| `--ring`                 | `#0a6b4b`                | `#45d99a`                   | Focus rings for accessible navigation     |

---

## 3. Typography and Bilingual Directionality

- **Latin UI**: Geist Sans via `next/font/google` (`font-sans`).
- **Latin Display**: Newsreader serif (`font-serif`) for pull quotes, welcome headings, and italic emphasis inside headlines.
- **Arabic UI**: Alexandria (`font-arabic leading-relaxed`), with IBM Plex Sans Arabic as a fallback.
- **Arabic Display**: Amiri (`font-arabic-serif`) for editorial accents. Keep line height generous (`1.9` to `2`) so tashkeel has room.
- **Code and Metrics**: System Monospace (`font-mono`).
- **Logical Properties**: Always write `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, and `text-end`. Never use physical `ml-`, `mr-`, `pl-`, `pr-`, `left-`, or `right-`.
- **Directional Icon Mirroring**: Use the `RtlIcon` helper for directional chevrons and back arrows so they mirror automatically with `rtl:rotate-180`. Do not mirror symmetric icons such as search magnifying glasses or checkmarks.

---

## 4. Base Component Conventions

- **Buttons**: `sm` (32px, `rounded-[6px]`), `default` (36px, `rounded-[8px]`), `lg` (44px, `rounded-[8px]`), and `icon` (36x36px). Primary buttons use the green fill; secondary actions use a hairline border on paper.
- **Inputs and Textareas**: 1px border using `--border`, `bg-card` fill, and a green focus ring in `--ring`. Labels sit above the field and align to logical start.
- **Cards**: Compound pattern (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) with 10px radius and hairline borders.
- **Badges**: 2px radius (`rounded-xs`), uppercase tracking for metrics and status chips.
- **Account and workspace header**: One shared header for every signed in page. Brand on the logical start, workspace links beside it, language, theme, and the account menu on the logical end. Sign out lives in the account menu.
- **Auth pages**: A split layout on desktop. A deep forest panel carries the thesis and proof points; the form sits on warm paper. On mobile the panel collapses and the form owns the screen.

---

## 5. Art Direction and Reference Principles

To keep a distinctive, award caliber experience and avoid generic AI design tropes (decorative purple gradients, meaningless icon grids, stock dashboard screenshots), public and workspace surfaces follow these rules:

1. **Thesis Driven Hero**:
   - The hero states the product thesis and shows the instrument: the role card, the tailored draft, and the requirement coverage signal.
   - Tight display tracking (`-0.02em` to `-0.04em`) with one editorial serif accent, not four competing type styles.

2. **Paper and Object Depth**:
   - Product mockups sit on warm paper panels with a single soft shadow. Everything else is separated by hairlines.
   - No glow effects behind text. No gradient text.

3. **Authentic Product Previews Over Abstract Icons**:
   - Show real ATS coverage, real bullet rewrites, real kanban status. When a screen has no real preview, use a compact text block instead of a decorative icon card.

4. **Bilingual Symmetry**:
   - Every surface must mirror between English (LTR) and Arabic (RTL) using logical properties. Arabic display lines need the `.line-mask` clip margin so hamza and tashkeel are never cut.

5. **Calm Density**:
   - One idea per section. A section earns its height with evidence, not with paragraphs. Prefer a compact card grid over alternating full width mockups.
   - Collapse long walkthroughs into a native `<details>` accordion when motion is reduced or the viewport is small.

---

## 6. Motion Architecture and Micro Interactions

- **GSAP and ScrollTrigger**: Used for the pinned role walkthrough and entrance reveals. Keep one motion system per surface.
- **CSS Transitions First**: Use CSS transitions for hover lifts, border changes, and color shifts.
- **Reduced Motion**: Every animated surface must provide a static or accordion fallback under `prefers-reduced-motion: reduce`. The pinned story already falls back to a compact accordion.
- **Never hide content behind motion without a fallback**: entrance animations start from opacity 0, so a failed script must not leave the page blank.

---

## 7. Visual QA and Screenshot Testing

- **Viewports**: All primary surfaces must be inspected across three standard viewports:
  1. Desktop: `1440x900`
  2. Tablet: `768x1024`
  3. Mobile: `375x812`
- **Directionality**: Verify both `/en` (LTR) and `/ar` (RTL) for alignment, icon orientation, and text clipping.
- **Auth surfaces**: Check `/en/login`, `/ar/login`, `/en/signup`, and `/ar/signup` in both themes, plus the signed in workspace header at mobile width.
- **Runner**: Automated capture is driven by `scripts/visual-qa.sh` using headless Google Chrome, saving evidence to `scratch/qa/`.

---

## 8. Redesign Execution Modes

- **Full Redesign**: End to end overhaul of a surface or page. Runs discovery, visual reference extraction, token definition, Server Component architecture, and responsive screenshot QA.
- **Targeted Improvement**: Focused polish on a specific section, responsive defect, micro interaction, or theme inconsistency without restructuring unaffected code.
