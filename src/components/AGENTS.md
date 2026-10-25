# Components Context (src/components)

Foundational UI components, layout primitives, and theme controls for CareerCraft AI.

## Architecture

- **Headless Primitives**: Built on Radix UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-slot`, `@radix-ui/react-direction`).
- **Design Tokens**: Styled via Tailwind CSS v4 mapped to semantic variables in `src/app/globals.css` and art directed in `design.md`.
- **Icons**: Lucide React icons wrapped with `RtlIcon` for directional mirroring.
- **Component Variants**: Class Variance Authority (`cva`) and `cn` utility (`clsx` + `tailwind-merge`).

## Structure

- `src/components/theme-provider.tsx`: Client side next-themes provider.
- `src/components/ui/button.tsx`: Button variants (`default`, `black`, `secondary`, `outline`, `ghost`, `destructive`, `link`) and sizes (`sm`, `default`, `lg`, `icon`).
- `src/components/ui/input.tsx` & `textarea.tsx`: Form inputs with start aligned text.
- `src/components/ui/card.tsx`: Compound card primitives (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`).
- `src/components/ui/badge.tsx`: Compact status chips with 2px radius.
- `src/components/ui/dialog.tsx`: Accessible modal dialogs with native flex gap (`sm:gap-2`).
- `src/components/ui/dropdown-menu.tsx`: Accessible dropdown menus.
- `src/components/ui/language-switcher.tsx`: Locale selector dropdown preserving search queries and hash fragments.
- `src/components/ui/theme-switcher.tsx`: Dark, light, and system theme selector with zero unstyled flash.
- `src/components/ui/rtl-icon.tsx`: SVG wrapper applying `rtl:rotate-180` to directional icons.
- `src/components/ats/`: ATS match score card, category subscores, skills gap badges, Google XYZ bullet list, and PDF export button.

## Rules & Constraints

- Always use logical CSS utilities (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, `text-end`). Never write physical `ml-`, `mr-`, `pl-`, `pr-`, `left-`, or `right-`.
- Preserve keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`).
- Directional icons must use `RtlIcon` or `rtl:rotate-180`. Symmetric icons (magnifying glass, checkmark) must remain unrotated.
- Unit tests are colocated in `src/components/ui/components.test.tsx`.

## Specs

- [0003. Design System and Bilingual UI Foundation](../../docs/specs/0003-design-system-and-bilingual-ui/index.md)
- [0007. ATS resume engine and PDF export](../../docs/specs/0007-ats-resume-engine-pdf-export/index.md)

_Drafted by /sync from the introducing change, worth a quick human pass._
