# 0003. Design System and Bilingual UI Foundation for CareerCraft AI

**Date**: 2026-10-22
**Status**: Accepted

## Summary

This specification establishes the design system and bilingual user interface foundation for CareerCraft AI. We adopt Tailwind CSS v4 semantic design tokens, Radix UI headless primitives, next-themes dark mode management, and Next.js App Router subpath localization (`/[lang]`) supporting Arabic and English. This foundation delivers fluid right to left and left to right layout mirroring, synchronized Google typography, flicker free theme switching, and accessible base components so every subsequent feature builds on a unified visual standard.

## Requirements

**User stories**:

- As a job seeker, I want to use CareerCraft AI in Arabic or English with natural typography and smooth layout direction so that my resume tailoring feels intuitive in my preferred language.
- As a job seeker, I want a polished dark and light theme that persists across visits with zero visual flicker so that I can read and edit resumes comfortably in any lighting condition.
- As an open source contributor, I want consistent accessible base components and logical styling rules so that new application slices look coherent and work seamlessly across both languages.

**Acceptance criteria**:

- **AC-1**: Subpath routing with dynamic `/[lang]` segments (`en` and `ar`) is handled by Next.js App Router, while middleware negotiates locale via cookies (`NEXT_LOCALE`) and headers, issuing HTTP 307 redirects for unlocalized paths and returning not found for unsupported locales.
- **AC-2**: Root layout in `src/app/[lang]/layout.tsx` replaces root `layout.tsx`, applies dynamic `lang` and `dir` (`rtl` for Arabic, `ltr` for English) attributes on the root HTML element, exports `generateStaticParams`, and wraps children with Radix UI `DirectionProvider`.
- **AC-3**: Typography loads Geist Sans for Latin characters and IBM Plex Sans Arabic for Arabic text via `next/font/google`, declaring semantic CSS variables and font families without layout shift or circular CSS variable references.
- **AC-4**: Theme management via `next-themes` with class attribute supports light, dark, and system modes, mapped to Tailwind CSS v4 CSS variables and a custom dark variant with zero theme flash on initial page load.
- **AC-5**: Layout primitives adhere strictly to logical CSS utilities (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, `text-end`, `border-s-`, `border-e-`), eliminating physical left and right margins or padding across all component surfaces.
- **AC-6**: Bidirectional icon helper `RtlIcon` automatically mirrors directional Lucide icons (such as chevrons and navigation arrows) in right to left mode using `rtl:rotate-180` while leaving symmetric icons and logos unmirrored.
- **AC-7**: Core foundation component inventory (`Button`, `Input`, `Textarea`, compound `Card`, `Badge`, `Dialog` modal, compound `DropdownMenu`, `LanguageSwitcher`, `ThemeSwitcher`) renders with full keyboard accessibility, focus rings, and proper ARIA states in both language directions.
- **AC-8**: Typed translation dictionary loader `getDictionary(lang)` provides compile time autocompletion for UI strings via an asynchronous Promise, using a recursive deep merge fallback to English when keys are absent in Arabic.
- **AC-9**: Internal visual showcase page at `/[lang]/design-system` displays all tokens, base components, and interactive variants for smoke testing and manual verification.
- **AC-10**: Vitest unit test suite with React Testing Library and jsdom verifies dictionary loading, directional class application, language switching, and base component accessibility and rendering.

## Decision

**Chosen option**: Option 1: Tailwind CSS v4 design tokens, Radix UI headless primitives, subpath bilingual routing with typed dictionaries, and next-themes dark mode.

We will build the CareerCraft AI design system using Tailwind CSS v4 semantic tokens, Radix UI headless components, next-themes for dark mode, Google Fonts pairing (Geist Sans and IBM Plex Sans Arabic), and Next.js App Router subpath routing with lightweight typed dictionaries.

**Implementation skills**: `tailwind-4-docs` (`lombiq/tailwind-agent-skills`, `.agents/skills/tailwind-4-docs/`) · `nextjs-app-router-patterns` (`wshobson/agents`, `.agents/skills/nextjs-app-router-patterns/`) · `vitest` (`antfu/skills`, `.agents/skills/vitest/`)

## Rationale

Reasoning and options: see [rationale.md](rationale.md).

## Feature design

### Design tokens and semantic color scale

Tokens live in `src/app/globals.css` using Tailwind CSS v4 `@theme inline` mapping to CSS custom properties. A custom variant directive ensures class based dark mode responds immediately to `next-themes`.

```css
@import 'tailwindcss';

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: #ffffff;
  --foreground: #0f172a; /* Slate 900 */
  --card: #ffffff;
  --card-foreground: #0f172a;
  --popover: #ffffff;
  --popover-foreground: #0f172a;
  --primary: #2563eb; /* Blue 600 */
  --primary-foreground: #ffffff;
  --secondary: #f1f5f9; /* Slate 100 */
  --secondary-foreground: #1e293b; /* Slate 800 */
  --muted: #f8fafc; /* Slate 50 */
  --muted-foreground: #64748b; /* Slate 500 */
  --accent: #f1f5f9;
  --accent-foreground: #0f172a;
  --destructive: #ef4444; /* Red 500 */
  --destructive-foreground: #ffffff;
  --success: #16a34a; /* Green 600 */
  --success-foreground: #ffffff;
  --border: #e2e8f0; /* Slate 200 */
  --input: #e2e8f0;
  --ring: #2563eb;
  --radius: 0.5rem;
}

.dark {
  --background: #090d16; /* Deep dark slate */
  --foreground: #f8fafc;
  --card: #0f172a; /* Slate 900 */
  --card-foreground: #f8fafc;
  --popover: #0f172a;
  --popover-foreground: #f8fafc;
  --primary: #3b82f6; /* Blue 500 */
  --primary-foreground: #ffffff;
  --secondary: #1e293b; /* Slate 800 */
  --secondary-foreground: #f8fafc;
  --muted: #1e293b;
  --muted-foreground: #94a3b8; /* Slate 400 */
  --accent: #1e293b;
  --accent-foreground: #f8fafc;
  --destructive: #ef4444; /* High contrast red */
  --destructive-foreground: #ffffff;
  --success: #22c55e; /* Green 500 */
  --success-foreground: #090d16;
  --border: #1e293b;
  --input: #1e293b;
  --ring: #3b82f6;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
  --font-arabic: var(--font-ibm-plex-arabic), var(--font-geist-sans), sans-serif;
}
```

### Typography and Google Fonts configuration

Font definitions in `src/lib/fonts.ts`:

```typescript
import { Geist, IBM_Plex_Sans_Arabic } from 'next/font/google'

export const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
})

export const ibmPlexArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-arabic',
  display: 'swap',
})
```

When rendering Arabic, elements use `font-arabic` and a line height of `leading-normal` or `leading-relaxed` to prevent glyph clipping on tall ascenders and diacritics.

### Locale routing and middleware

- Supported locales: `en` (default, LTR) and `ar` (RTL).
- Middleware in `src/middleware.ts` runs on all paths except `api`, `_next/static`, `_next/image`, `favicon.ico`, and public static images.
- Unlocalized paths (such as `/` or `/design-system`) issue an HTTP 307 temporary redirect to `/${locale}/${path}` based on `NEXT_LOCALE` cookie or the request `accept-language` header.
- Accessing an unsupported locale segment (such as `/fr/dashboard`) triggers `notFound()` in the localized layout.

### Layout hierarchy and Radix DirectionProvider

Existing `src/app/layout.tsx` is deleted and migrated to `src/app/[lang]/layout.tsx`. Existing `src/app/page.tsx` is relocated to `src/app/[lang]/page.tsx`.

In `src/app/[lang]/layout.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { DirectionProvider } from '@radix-ui/react-direction'
import { ThemeProvider } from '@/components/theme-provider'
import { geistSans, ibmPlexArabic } from '@/lib/fonts'
import { isSupportedLocale, getDirection, supportedLocales } from '@/lib/i18n/config'

export function generateStaticParams() {
  return supportedLocales.map((lang) => ({ lang }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ lang: string }>
}) {
  const { lang } = await params
  if (!isSupportedLocale(lang)) {
    notFound()
  }

  const dir = getDirection(lang)

  return (
    <html
      lang={lang}
      dir={dir}
      className={`${geistSans.variable} ${ibmPlexArabic.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className={`min-h-full flex flex-col ${lang === 'ar' ? 'font-arabic leading-relaxed' : 'font-sans'}`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <DirectionProvider dir={dir}>{children}</DirectionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Translation dictionary contract

Dictionary files live in `src/dictionaries/en.json` and `src/dictionaries/ar.json`.
The loader in `src/lib/i18n/get-dictionary.ts`:

```typescript
import type { Dictionary } from '@/lib/i18n/types'

const dictionaries: Record<string, () => Promise<Dictionary>> = {
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  ar: () => import('@/dictionaries/ar.json').then((module) => module.default),
}

function deepMergeFallback(
  canonical: Record<string, any>,
  target: Record<string, any>,
): Record<string, any> {
  const result = { ...canonical }
  for (const key of Object.keys(target || {})) {
    if (
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key]) &&
      canonical[key] &&
      typeof canonical[key] === 'object'
    ) {
      result[key] = deepMergeFallback(canonical[key], target[key])
    } else if (target[key] !== undefined) {
      result[key] = target[key]
    }
  }
  return result
}

export async function getDictionary(lang: string): Promise<Dictionary> {
  const enDict = await dictionaries.en()
  if (lang === 'en') return enDict
  const loader = dictionaries[lang]
  if (!loader) return enDict
  const targetDict = await loader()
  return deepMergeFallback(enDict, targetDict) as Dictionary
}
```

### Bidirectional icon mirroring helper

```tsx
// src/components/ui/rtl-icon.tsx
import { ComponentType, SVGProps } from 'react'
import { cn } from '@/lib/utils'

interface RtlIconProps extends SVGProps<SVGSVGElement> {
  icon: ComponentType<
    SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }
  >
  className?: string
  size?: number | string
  strokeWidth?: number | string
}

export function RtlIcon({ icon: Icon, className, ...props }: RtlIconProps) {
  return <Icon className={cn('rtl:rotate-180 transition-transform', className)} {...props} />
}
```

### Component inventory

All base components use accessible primitives and modular compound patterns.

| Component          | Architecture / Primitive          | Subcomponents                                                                             | RTL Behavior                                            |
| ------------------ | --------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `Button`           | `@radix-ui/react-slot` with CVA   | Single element with `asChild`                                                             | Inline icons use `ms-` / `me-` spacing                  |
| `Input`            | HTML `input` with CVA             | Single element                                                                            | Text aligns to start (`text-start`), icon on start edge |
| `Textarea`         | HTML `textarea` with CVA          | Single element                                                                            | Text aligns to start (`text-start`), logical padding    |
| `Card`             | Compound semantic containers      | `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`         | Logical header and action button alignment              |
| `Badge`            | HTML `span` with CVA              | Single element (`default`, `secondary`, `outline`, `success`, `destructive`)              | Symmetric padding, logical icon margins                 |
| `Dialog`           | `@radix-ui/react-dialog`          | `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter` | Close button pinned to end corner (`start-auto end-4`)  |
| `DropdownMenu`     | `@radix-ui/react-dropdown-menu`   | `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`          | Drops aligned with logical `align="start"`              |
| `LanguageSwitcher` | Client component with cookie sync | Single interactive control                                                                | Replaces `/[lang]` in current pathname                  |
| `ThemeSwitcher`    | Client component (`useTheme`)     | Guarded by mounted state                                                                  | Toggles light, dark, and system without layout shift    |
| `RtlIcon`          | SVG Wrapper component             | Single element                                                                            | Automatically applies `rtl:rotate-180`                  |

### Value sourcing

| Action                  | Value produced / displayed                      | Source                                                         |
| ----------------------- | ----------------------------------------------- | -------------------------------------------------------------- |
| Page render             | Active locale (`en` or `ar`)                    | Route parameter `params.lang` validated by `isSupportedLocale` |
| Document setup          | Document direction (`rtl` or `ltr`)             | Derived from locale via `getDirection(lang)`                   |
| Document setup          | Root font class (`font-arabic` or `font-sans`)  | Derived from locale in `LocaleLayout`                          |
| Theme toggle            | Active visual theme (`light`, `dark`, `system`) | `next-themes` client hook and localStorage/cookie state        |
| String display          | UI copy and labels                              | `getDictionary(lang)` reading `src/dictionaries/{lang}.json`   |
| Language switch         | Target URL path                                 | Derived by replacing `/[lang]` segment on the current pathname |
| Directional icon render | Mirrored SVG rotation                           | Derived from CSS selector `.rtl:rotate-180`                    |

### Key invariants

- Every UI layout component must use logical CSS properties instead of physical left and right margins, paddings, or coordinates.
- The HTML document root must synchronize `lang` and `dir` attributes with the active locale segment.
- English is the canonical reference dictionary; missing translation keys in Arabic must safely fall back to the English string.
- Directional icons must mirror in right to left mode, but symmetric icons (such as checkmarks, search magnifying glasses, and spinners) must never mirror.
- Theme switching must not produce layout shift or unstyled flash during server hydration.
- Arabic body typography must maintain generous line height (`leading-relaxed`) to prevent glyph clipping.

### Security model

- All UI foundation components, styles, and showcase pages operate purely in public presentation layers.
- Locale cookies (`NEXT_LOCALE`) and theme preferences store non sensitive presentation settings with `SameSite=Lax`.
- No user credentials, session tokens, or API keys are handled by this foundation slice.

### Configuration required

- No new environment variables or secret keys required. All fonts load through `next/font/google` at build time.

### Critical test scenarios

- Happy path: User visits `/`, is redirected to `/[lang]`, toggles between Arabic and English, and observes document direction and typography switch cleanly, verifies **AC-1**, **AC-2**, **AC-3**.
- Theme switching: User selects dark or light mode, and styles update instantly with preference preserved across page reloads without flicker, verifies **AC-4**.
- Layout and icon mirroring: Directional icons flip automatically and logical spacing mirrors correctly when switching to Arabic, verifies **AC-5**, **AC-6**.
- Base component accessibility: Dialog and dropdown primitives open with keyboard controls and trap focus properly in both right to left and left to right modes, verifies **AC-7**.
- Translation fallback: Accessing a dictionary key that exists in English but is missing in Arabic returns the English fallback string, verifies **AC-8**.
- Showcase verification: Navigating to `/[lang]/design-system` renders the component catalog with interactive theme and direction controls, verifies **AC-9**.

## Build plan

- [x] 1. Install foundation runtime and test harness dependencies (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-direction`, `@radix-ui/react-slot`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`, `next-themes`, and devDependencies `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`), satisfies **AC-2**, **AC-4**, **AC-7**, **AC-10**
- [x] 2. Configure design tokens, semantic color scale, custom dark variant, and theme variables in `src/app/globals.css` with Tailwind CSS v4 `@theme inline`, satisfies **AC-4**, **AC-5**
- [x] 3. Set up Google Fonts integration for Geist Sans and IBM Plex Sans Arabic in `src/lib/fonts.ts` and apply font variables to the root layout, satisfies **AC-3**
- [x] 4. Create internationalization configuration, route middleware, and HTTP 307 locale redirection in `src/middleware.ts` and `src/lib/i18n/config.ts`, satisfies **AC-1**
- [x] 5. Implement typed translation dictionary loader with recursive deep merge fallback in `src/dictionaries/` and `src/lib/i18n/get-dictionary.ts`, satisfies **AC-8**
- [x] 6. Migrate `src/app/layout.tsx` and `src/app/page.tsx` into `src/app/[lang]/layout.tsx` and `src/app/[lang]/page.tsx` with dynamic `lang`, `dir`, `ThemeProvider`, `DirectionProvider`, and `generateStaticParams`, satisfies **AC-1**, **AC-2**, **AC-4**
- [x] 7. Build directional icon helper component `RtlIcon` supporting bidirectional mirroring in `src/components/ui/rtl-icon.tsx`, satisfies **AC-6**
- [x] 8. Build accessible core foundation UI components (`Button`, `Input`, `Textarea`, compound `Card`, `Badge`, `Dialog`, compound `DropdownMenu`, `LanguageSwitcher`, `ThemeSwitcher`) in `src/components/ui/`, satisfies **AC-7**
- [x] 9. Create the visual component showcase gallery page at `src/app/[lang]/design-system/page.tsx`, satisfies **AC-9**
- [x] 10. Write Vitest unit tests in `src/lib/i18n/get-dictionary.test.ts` and `src/components/ui/components.test.tsx` verifying dictionary loading, directionality, and component rendering, satisfies **AC-10**

## Consequences

**Positive**:

- Layout mirroring works automatically across the entire application using native logical CSS properties.
- Arabic text renders with professional typography using IBM Plex Sans Arabic rather than system fallbacks.
- Accessible Radix UI primitives eliminate custom keyboard handling and focus management risks.
- Type safe dictionaries with deep merge fallback prevent runtime crashes while allowing progressive localization.
- A visual showcase page enables instant smoke testing of components in both languages and themes.

**Negative / tradeoffs**:

- All routes move inside the `/[lang]` folder structure in App Router, requiring folder reorganizations for existing pages.
- Developers must train themselves to write `ms-` and `me-` rather than standard `ml-` and `mr-`.
- Two Google fonts are loaded at build time, adding a slight font asset footprint to the client bundle.

**Neutral**:

- The language cookie `NEXT_LOCALE` must be respected by future server actions and API handlers.
- Directional icons must use the `RtlIcon` wrapper or `rtl:rotate-180` class explicitly.

## Follow-up

- [ ] Add `tailwind-4-docs` and `vitest` conventions to root `AGENTS.md` as recommended skills for frontend development.
- [ ] Configure ESLint rule or custom lint check to warn against physical CSS classes (`ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`) across UI components.
