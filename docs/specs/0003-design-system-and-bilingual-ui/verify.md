# Verify: Design System and Bilingual UI Foundation · spec 0003 · updated 2026-10-22

Steps derived from spec 0003 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones.

## UI / manual

- [x] Run `npm run dev` and navigate to `http://localhost:3000/` → Root route redirects cleanly to `http://localhost:3000/en` (or `http://localhost:3000/ar` if Arabic preferred) → AC-1
- [x] Inspect the HTML element in browser developer tools on `/en` and `/ar` → Tag displays `lang="en" dir="ltr"` on English and `lang="ar" dir="rtl"` on Arabic → AC-2
- [x] Navigate to `http://localhost:3000/en/design-system` and `http://localhost:3000/ar/design-system` → Showcase page renders all components, cards, buttons, badges, and inputs with correct font styles (Geist Sans for English, IBM Plex Sans Arabic for Arabic) → AC-3, AC-9
- [x] Toggle dark mode using the ThemeSwitcher control on the showcase page → Page theme switches instantly between light and dark modes without layout shift or page refresh → AC-4
- [x] Toggle between Arabic and English on the showcase page → Layout elements mirror smoothly (margins, paddings, dialog alignment) using logical CSS properties → AC-5
- [x] Inspect directional icons (such as navigation arrows and chevrons) on the Arabic showcase page → Directional icons rotate 180 degrees via `rtl:rotate-180` while symmetric icons remain normal → AC-6
- [x] Open the Dialog modal and DropdownMenu on both language routes → Modals open smoothly, trap focus, align to logical edges, and close on escape key or outside click → AC-7

## Commands

- [x] `npm run typecheck` → TypeScript compiler runs with zero errors across all components, dictionary types, and layouts → AC-1, AC-7, AC-8
- [x] `npm run lint` → ESLint executes cleanly with zero syntax or rule warnings → AC-1, AC-5
- [x] `npm run test` → Vitest unit tests execute and pass for dictionary loading, directional classes, and component rendering → AC-8, AC-10
- [x] `npm run build` → Production Next.js build finishes successfully with dynamic subpath routes generated → AC-1, AC-9

## Acceptance-criteria coverage

- AC-1 (Subpath routing and middleware locale redirection) covered by root redirect check and `npm run build`
- AC-2 (Dynamic `lang` and `dir` attributes with Radix DirectionProvider) covered by browser DOM inspection
- AC-3 (Geist Sans and IBM Plex Sans Arabic typography) covered by visual showcase inspection
- AC-4 (Flicker free dark mode via next-themes) covered by manual theme toggle and reload test
- AC-5 (Logical CSS layout primitives without physical coordinates) covered by visual layout mirroring and `npm run lint`
- AC-6 (Bidirectional icon mirroring with RtlIcon) covered by visual icon inspection on Arabic route
- AC-7 (Accessible core UI components with keyboard focus) covered by interactive modal and dropdown verification
- AC-8 (Typed dictionary loader with fallback) covered by Vitest test in `get-dictionary.test.ts`
- AC-9 (Showcase gallery at `/[lang]/design-system`) covered by navigating to `/en/design-system` and `/ar/design-system`
- AC-10 (Automated Vitest test suite) covered by `npm run test`

## Value sourcing verification

- [x] Active locale: navigate to unsupported locale `/fr/design-system` → verify Next.js triggers not found (`notFound()`)
- [x] Document direction: inspect root element in `/ar` → verify `dir="rtl"`, and in `/en` → verify `dir="ltr"`
- [x] Root typography class: inspect body element in `/ar` → verify `font-arabic leading-relaxed` is applied, and in `/en` → `font-sans`
- [x] Theme toggle: select dark theme, refresh browser → verify preference persists in localStorage with zero unstyled flash
- [x] Translation strings: request nonexistent key in Arabic dictionary → verify deep merge fallback returns canonical English string
- [x] Language switch URL: click language switcher from `/en/design-system` → verify URL updates to `/ar/design-system` preserving pathname
- [x] Directional icon rotation: inspect `RtlIcon` computed CSS under `.rtl` → verify `transform: rotate(180deg)` applies while symmetric icons remain unrotated
