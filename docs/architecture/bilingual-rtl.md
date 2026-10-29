# Bilingual and Right to Left Architecture

This document details how CareerCraft AI implements first class bilingual support for English (left to right) and Arabic (right to left).

## Foundational Philosophy

In CareerCraft AI, Arabic is never treated as a superficial translation layer. Both languages receive identical architectural attention, layout balance, typographic fidelity, and document export capabilities.

The design system enforces complete bidirectional symmetry across all screens, modals, interactive cards, and generated PDF documents.

## Locale Routing and Direction Handling

Next.js App Router organizes localized pages beneath `src/app/[lang]/`:

- Valid languages are defined in `src/lib/i18n/config.ts` as `en` and `ar`.
- Root layout at `src/app/[lang]/layout.tsx` inspects the active route param.
- For Arabic (`ar`), the root layout sets `<html lang="ar" dir="rtl">`.
- For English (`en`), the root layout sets `<html lang="en" dir="ltr">`.
- Radix UI primitives receive direction context via `@radix-ui/react-direction` `DirectionProvider` with `dir={isRtl ? 'rtl' : 'ltr'}`.

### Locale Negotiation Workflow

1. A candidate visits an unlocalized URL such as `/resume`.
2. Middleware in `src/middleware.ts` intercepts the request.
3. The middleware checks for the `NEXT_LOCALE` cookie.
4. If absent, the middleware inspects the browser `Accept-Language` header, parsing RFC 9110 quality values to find the best match.
5. If neither matches, it falls back to canonical English (`en`).
6. The candidate is redirected via HTTP 307 to the localized subpath (for example `/ar/resume`).

## Typographic Pairing

To guarantee high legibility and zero layout shift, the application pairs two complementary font families:

- **Geist Sans**: Primary font for Latin characters, numbers, and technical documentation. Loaded via `@fontsource/geist-sans`.
- **IBM Plex Sans Arabic**: Primary font for Arabic typography, supporting full voweling, baseline consistency, and balanced Arabic ligature rendering. Loaded via `@fontsource/ibm-plex-sans-arabic`.

Font variables are mapped inside `src/app/globals.css` to ensure smooth inheritance across headings, body copy, and UI controls.

## CSS Logical Properties

The user interface uses CSS logical properties exclusively. Physical directional properties are strictly prohibited.

| Avoid Physical Properties | Use CSS Logical Properties | Description                       |
| ------------------------- | -------------------------- | --------------------------------- |
| `ml-4`, `mr-4`            | `ms-4`, `me-4`             | Inline margin start and end       |
| `pl-6`, `pr-6`            | `ps-6`, `pe-6`             | Inline padding start and end      |
| `left-0`, `right-0`       | `start-0`, `end-0`         | Absolute and relative positioning |
| `text-left`, `text-right` | `text-start`, `text-end`   | Inline text alignment             |
| `border-l`, `border-r`    | `border-s`, `border-e`     | Border start and end              |

Using logical properties ensures that margins, padding, and alignments automatically flip when transitioning between Arabic and English without duplicate CSS classes.

## Directional Icon Mirroring

Certain icons indicate directional movement (such as arrows, chevrons, step flows, and drawer handles). These icons must flip when rendered in an RTL context, while symmetric icons (such as magnifying glasses, checkmarks, hearts, and stars) must remain stationary.

The helper component `RtlIcon` in `src/components/ui/rtl-icon.tsx` wraps directional icons with `rtl:rotate-180`:

```tsx
import { ChevronRight } from 'lucide-react'
import { RtlIcon } from '@/components/ui/rtl-icon'

export function NextButton() {
  return (
    <button className="flex items-center gap-2">
      <span>Next Step</span>
      <RtlIcon icon={ChevronRight} className="size-4" />
    </button>
  )
}
```

## Arabic Vector PDF Generation and BiDi Shaping

Exporting Arabic PDF documents in web applications commonly suffers from two critical bugs when using standard libraries:

1. **Disconnected Letters**: Arabic letters appear isolated instead of connecting naturally in cursive script.
2. **Reversed Word Order**: Words and numbers render backward from left to right instead of flowing naturally right to left.

CareerCraft AI resolves this cleanly in `src/lib/pdf/arabic-shaping.ts` and `src/lib/pdf/render.ts`:

### Two Pass Shaping Pipeline

1. **Glyph Joining**: The text passes through `arabic-persian-reshaper`. This module analyzes surrounding character contexts and substitutes raw Unicode characters with their correct contextual presentation forms (isolated, initial, medial, or final glyphs).
2. **BiDi Reordering**: The shaped string is processed with `bidi-js` implementing Unicode Bidirectional Algorithm (UAX #9). This orders words, numbers, punctuation, and mixed English terms into the correct visual sequence required by `@react-pdf/renderer`.

```
[ Raw Arabic Unicode Text ]
            │
            ▼
[ arabic-persian-reshaper ]  --> Replaces characters with contextual glyphs
            │
            ▼
       [ bidi-js ]          --> Reorders visual BiDi segments and mixed text
            │
            ▼
[ @react-pdf/renderer Engine ] --> Embeds IBM Plex Sans Arabic vector curves
            │
            ▼
[ In Memory Crisp Vector PDF ]
```

This pipeline runs entirely in memory without writing temporary files to disk, producing pristine vector documents with selectable, copyable text.
