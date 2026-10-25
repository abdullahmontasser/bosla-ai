---
name: react-pdf-kit-vite
description: Integrate @react-pdf-kit/viewer (>=2.0.0 <3.0.0) into a Vite 5 React project. Vite needs no special configuration; the viewer works out of the box.
metadata:
  react_pdf_kit_version: ">=2.0.0 <3.0.0"
  pdfjs_dist_version: ">=5.0.0 <6.0.0"
  frameworks: [vite, react]
  tags: [vite, pdf-viewer, esm]
---

# react-pdf-kit-vite

**Use this skill when**: the developer asks to add a PDF viewer using
`@react-pdf-kit/viewer` to a **Vite-based React project**. For Next.js
use the framework-specific skills.

Vite handles `pdfjs-dist`'s ESM-only build out of the box, and `RPConfig`
sets up the PDF.js worker automatically. There is no Vite-specific
setup: the generic provider chain is all you need.

## Gotchas

- **Install only `@react-pdf-kit/viewer`. Do NOT install `pdfjs-dist`
  separately.** It is an auto-installed peer dependency. You install
  `pdfjs-dist` yourself only when overriding its version (see
  `react-pdf-kit-worker-config`, which includes the Vite `?url` worker
  recipe).
- **No worker configuration is required.** `RPConfig` sets up the
  PDF.js worker for you. Do NOT set `GlobalWorkerOptions.workerSrc` or
  pass a `workerUrl` for the default case.
- **CSS is auto-injected** by the library. Do NOT import a separate
  stylesheet.
- **`RPDefaultLayout` is deprecated** in v2. Use `RPLayout` for every
  new integration.

## Procedure

### 1. Install the library

```bash
pnpm add @react-pdf-kit/viewer
```

### 2. Render the viewer

```tsx
// src/PdfViewer.tsx
import {
  RPConfig,
  RPProvider,
  RPLayout,
  RPPages,
} from '@react-pdf-kit/viewer'

export function PdfViewer({ src }: { src: string }) {
  return (
    <RPConfig>
      <RPProvider src={src}>
        <RPLayout toolbar>
          <RPPages />
        </RPLayout>
      </RPProvider>
    </RPConfig>
  )
}
```

### 3. Mount it inside a definite-height container

```tsx
// src/App.tsx
import { PdfViewer } from './PdfViewer'

export function App() {
  return (
    <main style={{ height: '100vh' }}>
      <PdfViewer src="/sample.pdf" />
    </main>
  )
}
```

The viewer adapts to its container, so give the parent a definite
height (`100vh` or fixed), or size it via `RPLayout`'s `style` prop.

To load a bundled PDF, import it (`import pdf from './doc.pdf'`) and
pass it as `src`; Vite resolves the asset URL.

## Verify

```bash
pnpm install
pnpm build
pnpm dev
```

Open the dev server URL. The first PDF page should render with the
default toolbar. Scroll to confirm pages mount as they enter the
viewport (virtualization), and select text on a rendered page to
confirm the text layer mounted.

## References

- Vite asset handling: <https://vitejs.dev/guide/assets.html>
- Companion skills:
  - `react-pdf-kit-setup`: generic React fundamentals.
  - `react-pdf-kit-worker-config`: for overriding the `pdfjs-dist`
    version and configuring a custom worker URL (Vite `?url` recipe).
