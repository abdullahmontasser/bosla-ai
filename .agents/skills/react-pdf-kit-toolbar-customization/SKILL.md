---
name: react-pdf-kit-toolbar-customization
description: Customize the @react-pdf-kit/viewer (>=2.0.0 <3.0.0) toolbar using the RPLayout toolbar prop with RPHorizontalBar / RPVerticalBar, or compose individual tool exports for a fully custom bar. Preserves Radix-based accessibility.
metadata:
  react_pdf_kit_version: ">=2.0.0 <3.0.0"
  pdfjs_dist_version: ">=5.0.0 <6.0.0"
  frameworks: [react, next.js, vite]
  tags: [pdf-viewer, toolbar, customization, accessibility]
---

# react-pdf-kit-toolbar-customization

**Use this skill when**: the developer asks to customize the viewer's
toolbar. Examples: hide one or more built-in tools, add a custom
button, replace an existing tool with a custom component, or split
the layout into a custom top bar and left sidebar. For replacing the
entire layout chrome (full headless), use
`react-pdf-kit-custom-layout` instead.

The recommended path is `RPLayout`'s `toolbar` prop with the
`RPHorizontalBar` (top bar) and `RPVerticalBar` (left sidebar)
components. Each bar accepts a `slots` prop that toggles individual
tools on or off or replaces them with your own component. For
projects that need a completely different visual shell, individual
tool exports (`ZoomInTool`, `PrintTool`, etc.) can be composed in
your own container.

## Gotchas

- **`RPDefaultLayout` is deprecated** in v2. Use `RPLayout` with the
  structured `toolbar` prop. Older examples that pass `slots` and
  `icons` directly to `RPDefaultLayout` should migrate.
- **The recommended customization API is `RPHorizontalBar` /
  `RPVerticalBar`**, not bypassing `RPLayout` entirely. Bypassing
  `RPLayout` is reserved for fully custom shells (see step 4).
- **Each tool is independently exportable**. Examples: `ZoomInTool`,
  `ZoomOutTool`, `PrintTool`, `DownloadTool`, `RotateClockwiseTool`,
  `SwitchViewModeTool`, `ToggleSidebarTool`. Use these only if you
  are building a fully custom bar (step 4). Do NOT replicate their
  behavior by hand, or you'll lose the accessibility wiring.
- **Preserve Radix primitives**. Built-in tools wrap Radix tooltips
  and buttons. Custom tools should also use Radix or at minimum
  preserve `aria-label`, focusable buttons, and visible focus rings.
- **Keyboard navigation must keep working**. Tools are reachable via
  `Tab` order. Don't insert non-focusable wrappers (`div onClick`)
  where a Radix `Button` belongs.
- **Use the documented hooks** rather than reaching into context
  directly. The viewer exposes `useZoomContext`,
  `useDocumentContext`, `usePaginationContext`, `usePrintContext`,
  `useFileDownload`, etc. for custom tools to call.

## Procedure

### 1. Default toolbar (no customization)

Drop in `RPLayout`. The default top bar (zoom, navigation, search,
download, etc.) and left sidebar (thumbnails) render automatically.

```tsx
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

`<RPLayout toolbar>` (the boolean form) renders the default top bar and
left sidebar. The structured `toolbar={{ ... }}` form below customizes
them.

### 2. Partial customization (hide / show individual tools)

Pass `RPHorizontalBar` (top bar) and `RPVerticalBar` (left sidebar)
to `RPLayout.toolbar`. Each bar's `slots` prop toggles tools by name.

```tsx
import {
  RPConfig,
  RPProvider,
  RPLayout,
  RPPages,
  RPHorizontalBar,
  RPVerticalBar,
} from '@react-pdf-kit/viewer'

export function PdfViewer({ src }: { src: string }) {
  return (
    <RPConfig>
      <RPProvider src={src}>
        <RPLayout
          toolbar={{
            topbar: {
              component: (
                <RPHorizontalBar
                  slots={{
                    // Hide these tools on the top bar:
                    searchTool: false,
                    openFileTool: false,
                    fullscreenTool: false,
                    // Everything else stays at its default.
                  }}
                />
              ),
            },
            leftSidebar: { component: <RPVerticalBar /> },
          }}
        >
          <RPPages />
        </RPLayout>
      </RPProvider>
    </RPConfig>
  )
}
```

Set a slot to `false` to hide it. Set it to a React component to
replace it with your own implementation (see step 3).

To hide the left sidebar entirely, pass an empty fragment:

```tsx
leftSidebar: { component: <></> }
```

To use only the top bar with no left sidebar, omit the `leftSidebar`
key from `toolbar`.

### 3. Replace a built-in tool with a custom component

Pass a component to the slot instead of `false`. The skill below
adds a confirmation prompt before download:

```tsx
<RPLayout
  toolbar={{
    topbar: {
      component: (
        <RPHorizontalBar
          slots={{
            downloadTool: ({ download }) => (
              <button
                type="button"
                aria-label="Download with confirmation"
                onClick={() => {
                  if (confirm('Download this file?')) download()
                }}
              >
                Save
              </button>
            ),
          }}
        />
      ),
    },
  }}
>
  <RPPages />
</RPLayout>
```

The slot callback receives the same context the default tool would
have used (here, `download`). Other slots expose similar props
(see the [RPHorizontalBar component docs](https://www.react-pdf-kit.dev/docs/components/rp-horizontal-bar.html)
for the full slot table).

### 4. Fully custom bar (compose individual tool exports)

When the visual shell needs to differ substantially from the default,
skip `RPLayout.toolbar` and build your own bar from the individual
`*Tool` exports. Render this bar yourself, with `RPLayout`
configured to not render its own toolbar:

```tsx
import {
  RPConfig,
  RPProvider,
  RPLayout,
  RPPages,
  ZoomInTool,
  ZoomOutTool,
  PrintTool,
  DownloadTool,
} from '@react-pdf-kit/viewer'

function CustomTopBar() {
  return (
    <div
      role="toolbar"
      aria-label="PDF viewer toolbar"
      style={{
        display: 'flex',
        gap: 8,
        padding: '8px 16px',
        borderBottom: '1px solid var(--rp-border, #e5e7eb)',
      }}
    >
      <ZoomOutTool />
      <ZoomInTool />
      <span style={{ flex: 1 }} />
      <PrintTool />
      <DownloadTool />
    </div>
  )
}

export function PdfViewer({ src }: { src: string }) {
  return (
    <RPConfig>
      <RPProvider src={src}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <CustomTopBar />
          <div style={{ flex: 1, minHeight: 0 }}>
            <RPLayout toolbar={false}>
              <RPPages />
            </RPLayout>
          </div>
        </div>
      </RPProvider>
    </RPConfig>
  )
}
```

The wrapper around `RPLayout` MUST set `flex: 1; min-height: 0;` so
the virtualizer has a concrete viewport to measure. `toolbar={false}`
tells `RPLayout` not to render its own bar (your custom one is
already mounted above it).

If you also need to drop the sidebar, prefer
`react-pdf-kit-custom-layout` instead, which gives you a clean
headless surface for fully bespoke layouts.

### 5. Add a custom button using a documented hook

For a one-off custom tool (not replacing an existing slot), import
the hook the tool needs and render a Radix-wrapped button:

```tsx
import { useDocumentContext } from '@react-pdf-kit/viewer'
import * as Tooltip from '@radix-ui/react-tooltip'

export function CopyLinkTool() {
  const { src } = useDocumentContext()

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button
            type="button"
            aria-label="Copy document link"
            onClick={() => navigator.clipboard.writeText(String(src))}
          >
            Copy link
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content sideOffset={6}>Copy link</Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
```

Drop `<CopyLinkTool />` into either an `RPHorizontalBar` slot
override or your fully custom bar from step 4.

## Verify

```bash
pnpm install
pnpm build
pnpm dev
```

Open the page. Tab through the toolbar with the keyboard. Every
button should receive focus, show a visible focus ring, and respond
to `Enter`. Use a screen reader (VoiceOver, NVDA) to confirm each
button has an accessible name. Open a PDF, scroll, select text. The
viewer should still virtualize and the text layer should still be
selectable.

## References

- [`RPLayout`](https://www.react-pdf-kit.dev/docs/components/rp-layout.html) component reference.
- [`RPHorizontalBar`](https://www.react-pdf-kit.dev/docs/components/rp-horizontal-bar.html) and [`RPVerticalBar`](https://www.react-pdf-kit.dev/docs/components/rp-vertical-bar.html) component references.
- [Customize Toolbar guide](https://www.react-pdf-kit.dev/docs/customization/customize-toolbar-new.html) for the full partial / full customization story.
- Radix Tooltip: <https://www.radix-ui.com/primitives/docs/components/tooltip>.
- Companion skills:
  - `react-pdf-kit-setup`: first-time setup.
  - `react-pdf-kit-custom-layout`: for full headless replacement of
    the default layout (preferred for substantial UI redesigns).
