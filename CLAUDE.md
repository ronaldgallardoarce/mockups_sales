# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Frontend-only prototype for a **Sales Route Management** microservice (Pre-Venta / Route
Management), for Grupo Venado in Bolivia. There is **no backend**: all data is mock, generated
in-memory from a deterministic seed. The data layer (`services` + React Query `hooks`) is
shaped exactly like a real REST API so it can be swapped for `fetch`/`axios` without touching
components. UI copy is Spanish; code, identifiers and comments are English.

> The README (Spanish) predates several modules. Trust the code: the seed is centered on
> Santa Cruz (`src/data/blocks-data.ts` / `locations.ts`), not the README's Trinidad.

## Commands

Package manager is **pnpm** (Node 18+).

```bash
pnpm dev        # Vite dev server → http://localhost:5173
pnpm build      # tsc -b (typecheck) + vite build
pnpm typecheck  # tsc -b only — use this as the fast correctness check
pnpm preview    # serve the production build
```

There is **no test runner and no linter configured**. `pnpm typecheck` is the only automated
gate. Do not assume `pnpm test`/`pnpm lint` exist. (Note: the global CLAUDE.md enables Strict
TDD Mode — this repo has no test harness, so flag that mismatch before writing tests.)

## Architecture

Feature-sliced. Everything hangs off `src/`, and `@/` aliases `src/` (configured in both
`vite.config.ts` and `tsconfig.app.json`).

### The three-layer data flow — the core pattern

Every domain (routes, markets, sellers, clients, channels, client-tasks, general-tasks,
route-macros) follows the same vertical stack. To add or change data behavior, respect it:

1. **`src/data/`** — the seed. `seed.ts` builds all entities once via a **seeded PRNG**
   (`seededRandom` in `lib/utils.ts`), so mock data is identical across reloads. `channels.ts`
   holds the 5 channels + 11 subcanales; **each channel's `color` is the single source of truth**
   for channel color-coding across list, form and map. Change a color here, it changes everywhere.
2. **`src/services/*-service.ts`** — one object per domain, each method returns a Promise wrapped
   in `delay()` to simulate latency. State lives in a **module-level mutable array** (e.g. `let
   ROUTES = [...SEED_ROUTES]`) so create/update/delete survive navigation within a session but
   reset on full reload. Services mirror the real API envelope: `listPaged` returns
   `Paginated<T>` (`{ data, pagination }`) with server-side filter/search params. **To connect a
   real backend, replace method bodies with `fetch` keeping the same signatures — nothing else
   changes.**
3. **`src/hooks/use-*.ts`** — React Query wrappers. Components **never** call services directly;
   they call these hooks. Queries use `queryKeys` from `lib/query-client.ts` (the central,
   typed key registry — add new keys there). Mutations show `sonner` toasts on success/error and
   invalidate keys; deletes are **optimistic** (`onMutate` rolls back on error). List hooks use
   `keepPreviousData` so pagination doesn't flash.

### UI layers

- **`src/components/ui/`** — shadcn/ui primitives (Radix + CVA + `cn`). Generated; match their
  conventions when editing.
- **`src/components/common/`** — cross-feature reusables (theme-toggle, confirm-dialog,
  empty-state, color-picker, channel-badge, command-palette, page-header).
- **`src/components/layout/`** — the app shell (`app-layout`, sidebar, header, breadcrumbs).
- **`src/features/<domain>/`** — `components/`, `pages/`, and often `lib/` + a Zod `*-schema.ts`.
  Forms use **react-hook-form + zod** (`@hookform/resolvers`).

### Routing & navigation

- `App.tsx` declares all routes flat under `AppLayout`. Convention per resource:
  `/x` (list), `/x/new`, `/x/:id/edit`. Unknown paths redirect to `/`.
- `src/config/nav.ts` (`NAV_ITEMS`) drives the sidebar and carries **role gating** via each
  item's optional `roles`; use `navItemsForRole(role)`.

### State (zustand, in `src/stores/`)

- `theme-store` (light/dark, persisted), `ui-store` (sidebar/drawer).
- `blocks-store` — **manzanos (map polygons) are persisted to localStorage**, so user map edits
  survive reloads independently of the seed; "Restablecer" resets to seed. Overlap detection
  lives here via `lib/geo.ts` (`polygonsOverlap`, `pointInPolygon`).
- `session-store` — **mock auth**. One user per role (`administrador` / `supervisor` /
  `vendedor`); the role is switchable from the user menu to preview permissions. Permission
  helpers (e.g. `canViewMarkets`, `canEditMarkets`) live here — reuse them, don't re-derive role
  checks inline.

### Map (Leaflet)

`features/map` + `features/markets` use react-leaflet. Polygons ("manzanos") are pure geographic
sectors with no channel — their value is the count of clients falling inside by position
(`pointInPolygon`). Drawing/editing uses **Leaflet-Geoman**; clients cluster via
`react-leaflet-cluster`; tiles are free OSM/Esri (**no API key**). Leaflet CSS is imported in
`main.tsx`; icon setup in `features/map/lib`. Leaflet/charts/vendor are split into manual chunks
in `vite.config.ts`.

## Conventions

- Domain types are centralized in `src/types/index.ts` — import from `@/types`.
- Mock ids are strings like `rt_012`; `numId()` in `lib/utils.ts` derives the numeric id a real
  API would use. Use `uid(prefix)` for new mock entities.
- When adding a new domain, replicate the full slice: type → seed → service (with `delay` +
  `Paginated`) → `queryKeys` entry → hooks → feature folder → route in `App.tsx` → nav entry.
