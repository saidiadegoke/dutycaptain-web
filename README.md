# dutycaptain-web

Frontend for **DutyCaptain** — the autonomous task-execution platform. Next.js
App Router, one route per page.

Migrated from the Vite + React Router prototype (`magic-patterns-vite-template`).

## Running

```bash
npm install
npm run dev        # http://localhost:3200
```

| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server on :3200 |
| `npm run build` | Production build (`output: 'standalone'`) |
| `npm start` | Serve the build on :3200 |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `next lint` |

The API it will talk to is `../dutycaptain-api` (port 2995). Nothing is wired up
yet — every view renders from `src/data/`.

## Routes

Every page is its own route under `src/app/`. Route files are thin: they export
metadata and render a view from `src/components/views/`.

### Marketing site

| Route | View |
|-------|------|
| `/` | `marketing/Home` |
| `/platform` | `marketing/Platform` |
| `/use-cases` | `marketing/UseCases` |
| `/developers` | `marketing/Developers` |
| `/security` | `marketing/Security` |
| `/deployment` | `marketing/Deployment` |
| `/pricing` | `marketing/Pricing` |
| `/company` | `marketing/Company` |

### Console

| Route | View |
|-------|------|
| `/app` | `Dashboard` |
| `/app/jobs` | `Jobs` |
| `/app/jobs/new` | `NewJob` |
| `/app/jobs/[jobId]` | `JobDetail` |
| `/app/approvals` | `Approvals` |
| `/app/artifacts` | `Artifacts` |
| `/app/models` | `Models` |
| `/app/audit` | `AuditTrail` |

Unknown paths render `src/app/not-found.tsx`. The old router redirected them to
`/` (marketing) or `/app` (console); a real 404 is better, and it is one file
rather than two catch-all `<Navigate>` routes.

### Layout structure

```
src/app/
  layout.tsx            root — fonts, metadata, globals.css
  not-found.tsx
  (marketing)/
    layout.tsx          MarketingShell
    page.tsx            "/"
    <route>/page.tsx    one per marketing page
  app/
    layout.tsx          AppShell (sidebar, top bar)
    page.tsx            "/app"
    <route>/page.tsx    one per console page
```

`(marketing)` is a **route group** — parentheses mean it adds no path segment,
so those pages sit at `/`, `/platform`, … while sharing one shell. `app/` is an
ordinary directory because `/app` *is* a real segment.

Both shells live in layouts, so the sidebar, top bar and nav state persist
across navigations instead of remounting on every page.

## Structure

```
src/
  app/          routes only
  components/
    views/      one per route — the page bodies (was src/pages/)
    shell/      AppShell — console sidebar + top bar
    marketing/  MarketingShell, CTABand, ConsoleMock, Section
    <shared>/   Panel, ProgressBar, StatusBadge, LiveBrowser,
                WorkerFleet, WorkflowGraph
  data/         seed data
  types/        domain types
  utils/        formatting
```

Imports use the `@/*` alias for anything outside the current directory.

## Notes from the migration

**Routing.** `react-router-dom` is gone. `<Link to>` became `next/link`
`<Link href>` (69 call sites). `useLocation()` became `usePathname()`, and
`useParams()` now comes from `next/navigation`.

**Active nav links.** `NavLink` gave a `className={({ isActive }) => …}`
callback that `next/link` has no equivalent for, so the comparison is explicit
in `AppShell` and `MarketingShell`. `AppShell` keeps an `isActive` helper that
reproduces NavLink's `end` prop: without it `/app` would highlight on every
nested route. Active links also carry `aria-current="page"`, which the original
did not.

**Client components.** Everything defaulted to server components; `'use client'`
was added only where needed — hooks or handlers, or an import of `recharts` /
`framer-motion`, both of which touch the DOM at module scope. Thirteen
components are client, the rest render on the server.

**Styling.** Tailwind v3 → v4, so `tailwind.config.js` is gone and the tokens
live in `@theme` in `src/app/globals.css`. Every token name was carried over
unchanged (`canvas`, `panel`, `ink`, `line`, `brand`, `ok`, `warn`, `danger`,
`shell`), which is what let the migration happen **without editing a single
class string** in the components.

**Fonts.** Inter and JetBrains Mono now come from `next/font/google` instead of
a Google Fonts `@import`, so they are self-hosted and do not block first paint.

**React 18 → 19, Next 16.** With the automatic JSX runtime the bare
`import React from 'react'` is unused, and `noUnusedLocals` rejects it — dropped
from 20 files.
