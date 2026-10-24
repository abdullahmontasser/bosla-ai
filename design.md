# CareerCraft AI: Design System Reference

A clean, developer grade interface designed for bilingual resume tailoring, job tracking, and interview preparation.

**Tokens**: `src/app/globals.css` (Tailwind CSS v4 `@theme inline`)  
**Primitives**: Radix UI headless primitives and Lucide icons

---

## 1. Visual Language and Aesthetic

CareerCraft AI uses a restrained, high density workbench aesthetic:

- **Clean Canvas**: Light mode uses a pure white canvas (`#ffffff`) with subtle `#fafafa` card containers. Dark mode uses a deep obsidian canvas (`#111111`) with `#1a1a1a` card surfaces.
- **Hairline Separation**: Structural grouping relies on 1px hairline borders (`rgba(33, 39, 46, 0.12)` in light mode, `#292929` in dark mode) instead of heavy drop shadows.
- **Electric Cobalt Accent**: Saturated Electric Cobalt (`#3e7ff0`) is reserved for primary actions, active indicators, focus rings, and selection highlights.
- **Precise Radii**: Standard 8px radius for cards, dialogs, buttons, and inputs; 2px radius for compact status badges and keyword chips.
- **High Contrast Typography**: High contrast text hierarchy ensures clear legibility across dense resumes, ATS audit tables, and bilingual prompts.

---

## 2. Semantic Color Scale

All colors map to CSS custom variables in `src/app/globals.css`:

| Semantic Token           | Light Mode Value         | Dark Mode Value | Role in CareerCraft AI                                    |
| ------------------------ | ------------------------ | --------------- | --------------------------------------------------------- |
| `--background`           | `#ffffff`                | `#111111`       | Root page canvas                                          |
| `--foreground`           | `#000000`                | `#ffffff`       | Primary body copy and headings                            |
| `--card`                 | `#fafafa`                | `#1a1a1a`       | Resume sections, action cards, panels                     |
| `--card-foreground`      | `#000000`                | `#ffffff`       | Card content text                                         |
| `--popover`              | `#ffffff`                | `#161616`       | Dropdown menus, tooltips, dialogs                         |
| `--popover-foreground`   | `#000000`                | `#ffffff`       | Popover text                                              |
| `--primary`              | `#3e7ff0`                | `#3e7ff0`       | Electric Cobalt for primary buttons and active indicators |
| `--primary-foreground`   | `#ffffff`                | `#ffffff`       | Text on primary buttons                                   |
| `--secondary`            | `#f1f2f3`                | `#222222`       | Secondary button fills, filter pills                      |
| `--secondary-foreground` | `#000000`                | `#ffffff`       | Secondary button labels                                   |
| `--muted`                | `#f5f5f7`                | `#1a1a1a`       | Code blocks, subtle container backgrounds                 |
| `--muted-foreground`     | `#7e868c`                | `#909090`       | Subtitles, timestamps, metadata labels                    |
| `--accent`               | `#f1f2f3`                | `#242424`       | Item hover states in dropdowns and navigation             |
| `--destructive`          | `#ef4444`                | `#ef4444`       | Deletion actions, missing ATS keyword warnings            |
| `--success`              | `#15803d`                | `#22c55e`       | Matched ATS keywords, active status badges                |
| `--border`               | `rgba(33, 39, 46, 0.12)` | `#292929`       | Hairline dividers and component borders                   |
| `--input`                | `rgba(33, 39, 46, 0.12)` | `#292929`       | Form input outlines                                       |
| `--ring`                 | `#3e7ff0`                | `#3e7ff0`       | Focus rings for accessible navigation                     |

---

## 3. Typography and Bilingual Directionality

- **Latin UI**: Geist Sans via `next/font/google` (`font-sans`)
- **Arabic UI**: IBM Plex Sans Arabic (`font-arabic leading-relaxed`)
- **Code and Metrics**: System Monospace (`font-mono`)
- **Logical Properties**: Always write `ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, and `text-end`. Never use physical `ml-`, `mr-`, `pl-`, `pr-`, `left-`, or `right-`.
- **Directional Icon Mirroring**: Use the `RtlIcon` helper for directional chevrons and back arrows so they mirror automatically with `rtl:rotate-180`. Do not mirror symmetric icons such as search magnifying glasses or checkmarks.

---

## 4. Base Component Conventions

- **Buttons**: Height variants include `sm` (32px, `rounded-[6px]`), `default` (36px, `rounded-[8px]`), `lg` (44px, `rounded-[8px]`), and `icon` (36x36px).
- **Inputs & Textareas**: 1px border using `--border`, subtle focus ring in `--ring`, with labels aligned to logical start.
- **Cards**: Compound pattern (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) with 8px radius and hairline borders.
- **Badges**: 2px radius (`rounded-xs`), uppercase tracking for metrics and status chips.
