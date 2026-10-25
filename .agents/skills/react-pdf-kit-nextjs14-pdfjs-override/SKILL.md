---
name: react-pdf-kit-nextjs14-pdfjs-override
description: Explains that @react-pdf-kit/viewer (>=2.0.0 <3.0.0) does not support Next.js 14, and the two supported paths forward — upgrade to Next.js 15 (Turbopack) or stay on the legacy @pdf-viewer/react package.
metadata:
  react_pdf_kit_version: ">=2.0.0 <3.0.0"
  pdfjs_dist_version: ">=5.0.0 <6.0.0"
  frameworks: [next.js, webpack]
  tags: [next.js, pdfjs, esm, compatibility, troubleshooting]
---

# react-pdf-kit-nextjs14-pdfjs-override

**Use this skill when**: a project is on **Next.js 14** and either wants
to use `@react-pdf-kit/viewer` v2 or is hitting a `pdfjs-dist`
module-load error such as

```
TypeError: Object.defineProperty called on non-object
```

during a Next.js 14 build or runtime.

## The key fact: v2 does not support Next.js 14

`@react-pdf-kit/viewer@^2.0.0` does **not** work on Next.js 14. Next.js
14's webpack build has an ESM interop bug that breaks `pdfjs-dist@5`'s
module-load path, and v2 has no supported workaround for it. Pinning
`pdfjs-dist` to v4 is **not** a reliable fix for v2 on Next.js 14 — do
not rely on it. Support for Next.js 14 is being worked on upstream but
is not available today.

Pick one of the two supported paths below.

## Option A (recommended): upgrade to Next.js 15 + Turbopack

Next.js 15 with Turbopack runs `@react-pdf-kit/viewer` v2 with
`pdfjs-dist@5` out of the box — no override needed.

1. Upgrade the project to Next.js 15.
2. Run the dev server with Turbopack:

   ```jsonc
   // package.json
   {
     "scripts": {
       "dev": "next dev --turbopack",
       "build": "next build",
       "start": "next start"
     }
   }
   ```

3. Set up the viewer with `react-pdf-kit-nextjs-app-router` (App
   Router) or `react-pdf-kit-nextjs-pages-router` (Pages Router). No
   `pdfjs-dist` install or `workerUrl` is required for the default
   case.

This is the path to prefer for any project that can move off Next.js
14.

## Option B: stay on Next.js 14 with the legacy package

If upgrading is not an option yet, do **not** use
`@react-pdf-kit/viewer@2` on Next.js 14. Use the legacy
[`@pdf-viewer/react`](https://www.npmjs.com/package/@pdf-viewer/react)
package instead, which supports the Next.js 14 + webpack toolchain.

```bash
pnpm remove @react-pdf-kit/viewer
pnpm add @pdf-viewer/react
```

Follow that package's own documentation for the provider chain and
`pdfjs-dist` configuration. Plan to migrate to `@react-pdf-kit/viewer`
v2 once the project is on Next.js 15.

## Verify

- **Option A**: after upgrading, `next build` and `next dev --turbopack`
  both succeed, and a page renders the first PDF page with no
  `Object.defineProperty` or `Promise.withResolve` errors.
- **Option B**: `@react-pdf-kit/viewer` is no longer a dependency, the
  Next.js 14 build succeeds with `@pdf-viewer/react`, and a PDF renders.

## References

- Upstream ESM bug context: <https://github.com/wojtekmaj/react-pdf/issues/1699>
- Legacy package: <https://www.npmjs.com/package/@pdf-viewer/react>
- Companion skills:
  - `react-pdf-kit-nextjs-app-router` and
    `react-pdf-kit-nextjs-pages-router`: apply after upgrading to
    Next.js 15.
