---
name: react-pdf-kit-custom-layout
description: Build a fully headless / custom layout for @react-pdf-kit/viewer (>=2.0.0 <3.0.0) using only documented hooks (useDocumentContext, useZoomContext, usePaginationContext, etc.), replacing RPLayout entirely.
metadata:
  react_pdf_kit_version: ">=2.0.0 <3.0.0"
  pdfjs_dist_version: ">=5.0.0 <6.0.0"
  frameworks: [react, next.js, vite]
  tags: [pdf-viewer, headless, custom-layout, hooks]
---

# react-pdf-kit-custom-layout

**Use this skill when**: the developer asks to replace the default
viewer layout entirely with their own. Examples: embedded inline
preview, a sidebar-only minimal reader, an enterprise UI with a
custom toolbar on the side instead of the top. For small toolbar
tweaks while keeping the default layout, use
`react-pdf-kit-toolbar-customization`.

The viewer is composable. `RPProvider` and `RPPages` are the minimum
required. Everything else (`RPLayout`, `RPTheme`, individual toolbar
tools) can be swapped or omitted. State and actions are exposed via
documented hooks.

## Gotchas

- **`RPProvider` and `RPPages` are required.** `RPProvider` mounts
  the document and makes the contexts available. `RPPages` renders
  the virtualized page list. Removing either breaks the viewer.
- **Use only documented hooks.** Reaching into internal contexts via
  `React.useContext(InternalContext)` is unsupported and will break
  on minor releases. Documented hooks: `useDocumentContext`,
  `useZoomContext`, `usePaginationContext`, `useSearchContext`,
  `useHighlightContext`, `useRotationContext`, `useViewModeContext`,
  `useDarkModeContext`, plus feature hooks under `utils/hooks/`
  re-exported from the public entry.
- **Do not break virtualization.** Wrapping `RPPages` in any
  ancestor that doesn't have a measurable height (no `flex: 1` /
  `min-height: 0`, no fixed height) makes the virtualizer mount with
  0 rows. Always give it a real viewport.
- **Provider order matters.** `RPConfig` must be outermost, then
  `RPProvider`, then `RPTheme` (optional but harmless) inside that.
  Anywhere inside `RPProvider` you can call the hooks.
- **`RPTheme` is still recommended** even in custom layouts. It
  provides CSS custom properties that built-in components (page
  layers, text selection highlight) read. Skipping it works visually
  but loses dark-mode and theming.
- **Note on `RPLayout` vs `RPDefaultLayout`**: this skill *replaces*
  the default layout component, so neither appears in the final
  composition. Older code that imports `RPDefaultLayout` should
  migrate to `RPLayout` first (`RPDefaultLayout` is deprecated in v2)
  before headless migration, so the two refactors don't get tangled.

## Procedure

### 1. Compose the minimum chain

```tsx
// src/HeadlessPdfViewer.tsx
import {
  RPConfig,
  RPProvider,
  RPTheme,
  RPPages,
} from '@react-pdf-kit/viewer'
import { CustomShell } from './CustomShell'

export function HeadlessPdfViewer({ src }: { src: string }) {
  return (
    <RPConfig>
      <RPProvider src={src}>
        <RPTheme>
          <CustomShell />
        </RPTheme>
      </RPProvider>
    </RPConfig>
  )
}
```

`CustomShell` (next step) is where YOU place `RPPages` next to your
own toolbar, sidebar, or status bar.

### 2. Build the shell using documented hooks

```tsx
// src/CustomShell.tsx
import {
  RPPages,
  useDocumentContext,
  useZoomContext,
  usePaginationContext,
  useDarkModeContext,
} from '@react-pdf-kit/viewer'

export function CustomShell() {
  const { numPages, isLoading } = useDocumentContext()
  const { zoom, setZoom } = useZoomContext()
  const { currentPage, goToPage } = usePaginationContext()
  const { isDarkMode, toggleDarkMode } = useDarkModeContext()

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '240px 1fr',
        gridTemplateRows: '48px 1fr',
        height: '100%',
      }}
    >
      <header
        style={{
          gridColumn: '1 / -1',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '0 16px',
          borderBottom: '1px solid var(--rp-border, #e5e7eb)',
        }}
      >
        <span>{isLoading ? 'Loading...' : `${numPages} pages`}</span>
        <button
          type="button"
          onClick={() => setZoom(zoom + 0.1)}
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => setZoom(zoom - 0.1)}
          aria-label="Zoom out"
        >
          -
        </button>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          onClick={toggleDarkMode}
          aria-pressed={isDarkMode}
        >
          {isDarkMode ? 'Light' : 'Dark'}
        </button>
      </header>

      <aside
        style={{
          overflow: 'auto',
          borderRight: '1px solid var(--rp-border, #e5e7eb)',
          padding: 8,
        }}
      >
        {Array.from({ length: numPages }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            type="button"
            onClick={() => goToPage(p)}
            aria-current={p === currentPage ? 'page' : undefined}
            style={{ display: 'block', width: '100%', textAlign: 'left' }}
          >
            Page {p}
          </button>
        ))}
      </aside>

      <main style={{ overflow: 'hidden', minHeight: 0 }}>
        <RPPages />
      </main>
    </div>
  )
}
```

The `<main>` ancestor of `RPPages` MUST have `min-height: 0`
(combined with the parent grid's `1fr` row) so the virtualizer's
parent has a measurable height.

### 3. Memoize where it matters

If you compute derived state to pass into `RPProvider` (for example,
a file-loading callback or options object), memoize it. The provider
re-renders all children on identity changes, so a new object every
render disables virtualization gains.

```tsx
const options = useMemo(() => ({ withCredentials: true }), [])
return <RPProvider src={src} options={options}>...</RPProvider>
```

### 4. (Optional) Add search, rotation, view modes

Same pattern: import the hook, call it, render UI bound to its state
and actions. `useSearchContext`, `useHighlightContext`,
`useRotationContext`, `useViewModeContext` are all documented.

## Verify

```bash
pnpm install
pnpm build
pnpm dev
```

Open the page. Confirm:

- The PDF renders inside your custom shell.
- The page-jump sidebar updates `currentPage` (verify the
  `aria-current` indicator).
- Zoom buttons resize pages without remounting the viewer.
- Dark-mode toggle flips the theme.
- Scrolling still virtualizes. Only mounted pages should be in the
  DOM (DevTools, Elements panel: `RPPages` should render a windowed
  subset, not all pages at once).

## References

- Companion skills:
  - `react-pdf-kit-setup`: first-time setup.
  - `react-pdf-kit-toolbar-customization`: for keeping the default
    layout but tweaking toolbar contents.
