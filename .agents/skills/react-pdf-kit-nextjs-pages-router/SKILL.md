---
name: react-pdf-kit-nextjs-pages-router
description: Integrate @react-pdf-kit/viewer (>=2.0.0 <3.0.0) into a Next.js Pages Router project (pages/) with an SSR-safe dynamic import via next/dynamic and ssr:false.
metadata:
  react_pdf_kit_version: ">=2.0.0 <3.0.0"
  pdfjs_dist_version: ">=5.0.0 <6.0.0"
  frameworks: [next.js, react]
  tags: [next.js, pages-router, pdf-viewer]
---

# react-pdf-kit-nextjs-pages-router

**Use this skill when**: the developer asks to add a PDF viewer using
`@react-pdf-kit/viewer` to a **Next.js Pages Router** project (`pages/`
directory) on **Next.js 15+**. For App Router use
`react-pdf-kit-nextjs-app-router`. **Next.js 14 is not supported by
v2** — see `react-pdf-kit-nextjs14-pdfjs-override`.

The Pages Router runs every page through SSR by default. The viewer is
client-only (it relies on browser APIs), so it must be mounted with
`next/dynamic` and `ssr: false`.

## Gotchas

- **The viewer cannot render on the server.** A direct import crashes
  during SSR with `TypeError: Promise.withResolve is not a function`
  (or a `window is not defined` style error). Always import the viewer
  via `next/dynamic` with `ssr: false`, and put `'use client'` on the
  viewer component.
- **Install only `@react-pdf-kit/viewer`. Do NOT install `pdfjs-dist`
  separately.** It is an auto-installed peer dependency. No worker
  configuration is required — `RPConfig` handles it. Version overrides
  and custom worker URLs live in `react-pdf-kit-worker-config`.
- **`_app.tsx` is the wrong place to mount the viewer.** `_app.tsx`
  runs on the server too. Keep the viewer in its own
  dynamically-imported, `ssr: false` component.
- **Use Next.js 15+.** Next.js 14 + webpack is unsupported by v2.
- **`RPDefaultLayout` is deprecated** in v2. Use `RPLayout`.

## Procedure

### 1. Install the library

```bash
pnpm add @react-pdf-kit/viewer
```

### 2. Create the viewer as a client-only component

```tsx
// components/PdfViewer.tsx
'use client'
import {
  RPConfig,
  RPProvider,
  RPLayout,
  RPPages,
} from '@react-pdf-kit/viewer'

export default function PdfViewer({ src }: { src: string }) {
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

Note the `default` export: `next/dynamic` works most ergonomically
with default exports. `RPConfig` handles the worker and theming;
`licenseKey` is an optional prop (without it, the viewer is in trial
mode with a watermark).

### 3. Mount via `next/dynamic` with `ssr: false`

```tsx
// pages/document/[id].tsx
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'

const PdfViewer = dynamic(() => import('../../components/PdfViewer'), {
  ssr: false,
  loading: () => <div>Loading viewer...</div>,
})

export default function DocumentPage() {
  const router = useRouter()
  const id = router.query.id as string | undefined

  return (
    <main style={{ height: '100vh' }}>
      {id ? <PdfViewer src={`/api/documents/${id}.pdf`} /> : null}
    </main>
  )
}
```

The `id` guard avoids mounting the viewer with `undefined` on the
first client render (before the router has hydrated).

## Verify

```bash
pnpm install
pnpm build       # must succeed under SSR + production build
pnpm dev         # visit /document/<id>
```

SSR should produce HTML containing the loading state, then the viewer
mounts client-side after hydration. The first PDF page should render
with the default toolbar, text selection should work, and there should
be no `Promise.withResolve is not a function` error in the console.

## References

- `next/dynamic` API: <https://nextjs.org/docs/pages/api-reference/components/dynamic>
- Companion skills:
  - `react-pdf-kit-nextjs14-pdfjs-override`: read this if the project
    is on Next.js 14 (v2 is unsupported there).
  - `react-pdf-kit-nextjs-app-router`: for App Router projects.
  - `react-pdf-kit-worker-config`: for `pdfjs-dist` version overrides
    and custom worker URLs.
