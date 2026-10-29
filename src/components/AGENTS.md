# Components Context (src/components)

Foundational UI components, layout primitives, and theme controls for Bosla AI.

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
- `src/components/outreach/`: Cold outreach message cards, connection note editor with character counters, and one click copy.
- `src/components/interview-prep/`: Interview prep workbench, STAR response cards, and interviewer questions list.
- `src/components/tracker/`: Kanban board columns, cards with ATS badges, slide over details drawer, filter toolbar, and quick add modal.
- `src/components/landing/`: public landing sections, GSAP motion, bilingual copy, and sample workflow data.
- `src/components/auth/`: Sign in and sign up cards, forgot password, reset password, email verification card, and copy.
- `src/components/workspace/`: Shared header, workspace navigation, mobile drawer, and session aware account menu.
- `src/components/profile/`: Dedicated candidate profile hub, avatar crop modal, and identity, education, experience, skills, and projects cards.
- `src/components/health/`: Base resume health score card, category meters, issue cards with severity badges, undo toast notification, and AI rewrite modal.

## Rules & Constraints

- Always use logical CSS utilities (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`, `text-end`). Never write physical `ml-`, `mr-`, `pl-`, `pr-`, `left-`, or `right-`.
- Preserve keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`).
- Directional icons must use `RtlIcon` or `rtl:rotate-180`. Symmetric icons (magnifying glass, checkmark) must remain unrotated.
- Animated heading line reveals must use the `line-mask` utility (overflow clip with an extended clip margin), never a bare `overflow-hidden`, so Arabic hamza and tashkeel are not cut off.
- Unit tests are colocated beside the components they cover as `*.test.tsx` files.

## Specs

- [0003. Design System and Bilingual UI Foundation](../../docs/specs/0003-design-system-and-bilingual-ui/index.md)
- [0007. ATS resume engine and PDF export](../../docs/specs/0007-ats-resume-engine-pdf-export/index.md)
- [0008. Career outreach and interview prep](../../docs/specs/0008-career-outreach-and-interview-prep/index.md)
- [0009. Job application kanban tracker](../../docs/specs/0009-job-application-kanban-tracker/index.md)
- [0010. Public showcase and landing page](../../docs/specs/0010-public-showcase-and-landing-page/index.md)
- [0011. Account access and workspace shell](../../docs/specs/0011-account-access-and-workspace-shell/index.md)
- [0012. Palette unification and landing refinement](../../docs/specs/0012-palette-unification-and-landing-refinement/index.md)
- [0013. Candidate profile and photo management](../../docs/specs/0013-candidate-profile-and-photo-management/index.md)
- [0014. Base resume health audit and improvement](../../docs/specs/0014-base-resume-health-audit/index.md)

## Quality Assurance & Visual QA

- Multi viewport screenshots (desktop, tablet, mobile) and RTL parity are captured via `scripts/visual-qa.sh` into `scratch/qa/`.
- All landing components must avoid generic AI tropes and adhere to the award level guidelines in `design.md`.

_Drafted by /sync from the introducing change, worth a quick human pass._
