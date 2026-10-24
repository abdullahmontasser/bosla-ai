# 0003. Rationale: Design System and Bilingual UI Foundation

## Context

CareerCraft AI is an open source career assistant built for both Arabic and English speaking job seekers. A core value proposition is bilingual equality: Arabic users must experience the same level of typographic polish, natural right to left layout mirroring, and responsive interactions as English users, rather than feeling like an afterthought translation.

Several technical forces shape this decision. First, Next.js 16 App Router uses React Server Components by default. Navigation, localization, and document metadata should leverage server rendering without heavy client side state machines or hydration mismatches. Second, Tailwind CSS v4 introduces CSS first `@theme` configuration and native logical property utilities, replacing legacy JavaScript configuration files. Third, accessible user interfaces require robust keyboard navigation, screen reader ARIA labels, and bidirectional focus trapping for dialogs and menus. Finally, dark mode switching must be instantaneous and flicker free to provide a comfortable reading environment for technical resumes.

Failing to establish these foundations early results in fragmented component styling, broken right to left layouts that require painful retrofitting, and inconsistent typography between Arabic and English sections.

## Options considered

### Option 1: Tailwind CSS v4 tokens with Radix UI primitives, next-themes, and Next.js subpath routing (Chosen)

This option implements a custom design system using Tailwind CSS v4 CSS variables for design tokens, Radix UI headless components for accessible dialogs and menus, next-themes for flicker free dark mode, and dynamic `/[lang]` subpath routing with lightweight typed dictionaries.

**Pros**:

- Radix UI primitives provide proven accessible keyboard navigation and focus management with native right to left direction support.
- Tailwind CSS v4 semantic tokens enable fast styling with pure logical properties (`ms-`, `me-`, `ps-`, `pe-`).
- Subpath routing (`/[lang]`) produces distinct URLs for Arabic and English, allowing search engine indexing and simple server caching.
- Zero external translation platform lock in: typed JSON dictionaries provide full compile time safety with minimal runtime overhead.

**Cons**:

- Requires developers to maintain dictionary keys in two files manually.
- Translating long paragraphs requires structured keys rather than inline strings.

### Option 2: Full next-intl framework integration with message compiler and navigation wrappers

This option installs the comprehensive `next-intl` package, using its routing proxy middleware, React Server Component message loaders, and localized navigation wrappers.

**Pros**:

- Rich feature set including ICU message formatting, pluralization rules, and date or number formatting out of the box.
- Widely adopted library with mature documentation and automated tooling.

**Cons**:

- Heavy dependency with tight coupling to its proprietary navigation abstractions (`Link`, `useRouter`, `usePathname`).
- More complex configuration that can collide with standard App Router Server Component patterns in Next.js 16.
- Overkill for an application with lightweight UI labels and domain specific resume structures.

### Option 3: Single route tree with header and cookie detection and custom HTML components

This option avoids subpath routing by keeping all URLs unlocalized (e.g. `/dashboard`), detecting the language preference strictly via cookies or request headers, and building UI components using raw HTML elements with custom ARIA attributes.

**Pros**:

- Shorter and simpler URL paths without dynamic route folders.
- No external headless component dependencies to install or maintain.

**Cons**:

- Breaks search engine indexing and social sharing for specific language versions.
- High risk of accessibility defects and keyboard navigation bugs in dialogs and popovers.
- Caching on edge networks becomes complex because identical URLs serve different content depending on cookies.

## Rationale

We select Option 1 because it strikes the ideal balance between architectural simplicity, accessibility compliance, and developer speed.

Radix UI headless primitives eliminate the massive effort and testing burden of building accessible modals, dropdowns, and direction aware focus containers from scratch. When paired with Tailwind CSS v4 logical utilities, components naturally adapt to Arabic right to left and English left to right flows with zero custom CSS overrides.

Subpath localization via `/[lang]` provides clean and transparent routing that works harmoniously with Next.js App Router Server Components. It ensures that language is an explicit part of the application state, making server rendering and localized document tags effortless. Lightweight typed dictionaries give us compile time safety without the weight or abstraction layers of large third party internationalization frameworks.
