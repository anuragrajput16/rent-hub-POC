# Architecture rules

## The one-way data path

```
component  ──read──▶  src/api/hooks.ts  ──▶  useDb(select)  ──▶  store snapshot
component  ──write─▶  src/api/index.ts  ──▶  mutate(draft)  ──▶  persist + notify
```

- `src/api/store.ts` owns persistence (`localStorage`, key `rentease.db.v1`), `mutate`,
  `snapshot`, `uid` and `delay`. Only `src/api/index.ts` and `src/api/hooks.ts` import it.
- `src/api/index.ts` is the whole backend surface: `auth`, `listings`, `requests`, `bookings`,
  `wallet`, `rewards`, `shop`, `cart`, `services`, `support`. Every method returns a Promise and
  goes through `delay()` so swapping in a real backend touches this file alone.
- Validation belongs in the API method (throw an `Error` with a sentence the user can read), not
  in the component. Components catch it and surface it via `ErrorNote` or a toast.
- Reads that a screen must re-render on go in `hooks.ts` as a `useDb` selector. The `*.forUser()`
  promise variants exist for parity with a real backend — prefer the hook in a component.

## Adding a feature slice

1. `src/types.ts` — the entity interface, then the array on the `DB` interface.
2. `src/data/seed.ts` — an entry in `buildSeed()`, even if it is just `[]`. `load()` spreads a
   fresh seed under the persisted DB, so a missing key crashes users who already have saved state.
3. `src/api/index.ts` — a named module under a `/* --- section --- */` banner comment.
4. `src/api/hooks.ts` — the reactive read.
5. `src/pages/<area>/<Page>.tsx` — default-exported component.
6. `src/App.tsx` — the route, inside the `AppShell` block, gated with `RequireRole` when it is
   role-specific.
7. `src/components/Sidebar.tsx` — the nav entry for each role that should see it.

## Routing and roles

- Roles are `owner | renter | guest`. `RequireRole` with no `allow` means "any signed-in user";
  `allow={['owner']}` gates a screen and bounces everyone else to their own home.
- Route paths follow the owner of the data: `/owner/*`, `/renter/*`, and un-prefixed shared routes
  (`/rewards`, `/furniture`, `/services`, `/help`, `/about`).
- Guests hitting a renter/owner action are routed to `/upgrade`, not shown an error.

## Folder conventions

- `src/lib/` holds pure logic — no React, no store access. `rewards.ts` is the rewards rule book,
  `planner.ts` the layout bundles, `decoration.ts` the festival ideas, `photos.ts` the image
  pipeline, `format.ts` the shared formatters and label maps.
- `src/components/` holds shared components; `src/components/ui/` holds the primitives.
- Page-local constants (option lists, copy, FAQ arrays) stay at the top of the page file — that is
  the existing pattern in `Services.tsx` and `Upgrade.tsx`. Promote to `lib/` only on second use.
