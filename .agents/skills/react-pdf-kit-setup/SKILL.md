---
name: react-pdf-kit-setup
description: Set up @react-pdf-kit/viewer in a generic React app (>=2.0.0 <3.0.0) using the canonical RPConfig, RPProvider, RPLayout, RPPages provider chain.
metadata:
  react_pdf_kit_version: ">=2.0.0 <3.0.0"
  pdfjs_dist_version: ">=5.0.0 <6.0.0"
  frameworks: [react]
  tags: [setup, pdf-viewer, getting-started]
---

# react-pdf-kit-setup

**Use this skill when**: the developer asks to add a PDF viewer using
`@react-pdf-kit/viewer` to a React project, AND the project is *not*
specifically Next.js or Vite. For those, prefer the framework-specific
skills.

`@react-pdf-kit/viewer` builds on PDF.js and renders PDFs through a
nested provider chain. Treat the chain as the canonical composition
model. Everything else (theming, layout, hooks) layers onto it.

## Gotchas

- **Install only `@react-pdf-kit/viewer`. Do NOT install `pdfjs-dist`
  separately.** In v2, `pdfjs-dist` is an auto-installed peer
  dependency pinned to a default version (`5.4.530`). You install
  `pdfjs-dist` yourself ONLY when deliberately overriding that version,
  which is covered by `react-pdf-kit-worker-config`.
- **`RPConfig` configures the PDF.js worker for you.** The worker is
  set up automatically. Do NOT set `GlobalWorkerOptions.workerSrc` or
  pass a `workerUrl`. Custom worker URLs are only needed when
  overriding `pdfjs-dist`; see `react-pdf-kit-worker-config`.
- **`RPConfig` belongs at the root and should be rendered once.** It
  also wraps theming internally, so a separate `RPTheme` is optional.
- **`licenseKey` on `RPConfig` is optional.** Without it the viewer
  runs in free/trial mode (a watermark is shown). Pass
  `<RPConfig licenseKey="...">` for licensed/commercial use.
- **CSS is auto-injected** by the library. Do NOT import a separate
  stylesheet.
- **`RPDefaultLayout` is deprecated** in v2. Use `RPLayout` for every
  new integration.

## Procedure

### 1. Install the library

```bash
pnpm add @react-pdf-kit/viewer
```

(Use `npm install`, `yarn add`, or `bun add` if not on pnpm.) Nothing
else is required; `pdfjs-dist` is pulled in automatically.

### 2. Add `RPConfig` at the app root

`RPConfig` must be rendered once at the root of your application. It
handles worker setup and theming for every viewer instance below it.

```tsx
// src/App.tsx
import { RPConfig } from '@react-pdf-kit/viewer'
import { PdfViewer } from './PdfViewer'

export function App() {
  return (
    <RPConfig>
      <main style={{ height: '100vh' }}>
        <PdfViewer src="/sample.pdf" />
      </main>
    </RPConfig>
  )
}
```

For explicit theme control, pass `customVariables` / `customDarkVariables`
to `RPConfig` (or nest an `RPTheme`).

### 3. Render the viewer with the provider chain

```tsx
// src/PdfViewer.tsx
import {
  RPProvider,
  RPLayout,
  RPPages,
} from '@react-pdf-kit/viewer'

export function PdfViewer({ src }: { src: string }) {
  return (
    <RPProvider src={src}>
      <RPLayout toolbar>
        <RPPages />
      </RPLayout>
    </RPProvider>
  )
}
```

`RPLayout`'s `toolbar` prop renders the default toolbar. The viewer
adapts to its container, so give the parent a definite height (`100vh`
or fixed) for virtual scrolling to work. You can also size it directly
via `RPLayout`'s `style` prop.

## Verify

```bash
pnpm install
pnpm build
pnpm dev
```

Open the dev server URL. The first PDF page should render with the
default toolbar visible. Scroll down. Additional pages mount as you
scroll (virtualization at work). Selecting text should produce a real
text selection, not a canvas-only image.

## References

- Library README: <https://github.com/react-pdf-kit/viewer>
- Companion skills:
  - `react-pdf-kit-nextjs-app-router` for Next.js App Router projects.
  - `react-pdf-kit-vite` for Vite projects.
  - `react-pdf-kit-worker-config` for overriding the `pdfjs-dist`
    version and configuring a custom worker URL.
