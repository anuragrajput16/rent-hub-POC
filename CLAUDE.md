# RentEase — project rules

India-focused rental platform POC. Owner / Renter / Guest roles, a mocked backend, and a
marketplace bolted onto the rental flow. The app lives in `rentease-poc/`; the source brief and
approved visual reference live in `files/`. `reference/bed-fit/` is a read-only copy of the Bed Fit
project that the layout planner's bed placement is ported from.

**Always run commands from `rentease-poc/`, not from this directory.**

```bash
npm run dev      # vite dev server
npm run build    # tsc -b && vite build — this is the typecheck, run it before saying done
npm run lint     # oxlint
```

## The ten rules that matter most

1. Read `rentease-poc/README.md` before a first change in an unfamiliar area — it documents what
   is real, what is mocked, and where each concern lives.
2. Never write to `localStorage` or import from `src/api/store.ts` in a component. Components
   **read** through `src/api/hooks.ts` and **write** through `src/api/index.ts`.
3. Every new persisted field needs three edits: the type in `src/types.ts`, a default in
   `src/data/seed.ts`, and the API that mutates it. Skipping the seed breaks users with a saved DB.
4. Use the design tokens in `src/index.css` (`bg-panel`, `text-muted`, `border-line`, `text-green`,
   `bg-honey-soft`, …). Do not introduce raw hex outside SVG artwork and the existing gradients.
5. Compose pages from `src/components/ui/` primitives — `PageHead`, `SectionTitle`, `EmptyState`,
   `Field` + `inputClass`, `Button`/`LinkButton`, `StatusPill`, `Modal`/`SuccessModal`. Do not
   hand-roll a button, a card header or a dialog.
6. Money is rupees, formatted with `inr()` / `inrCompact()` from `src/lib/format.ts`. Dates go
   through `prettyDate()` / `dueDate()`. Locale is `en-IN`.
7. Anything mocked must say so on screen — the POC never implies a real payment, a real KYC check
   or real AI. `SuccessModal` already carries that line; keep it.
8. New icons are inline SVG in `src/components/icons.tsx`: 24×24 viewBox, `currentColor`,
   `strokeWidth` 1.7–1.9. No icon libraries.
9. No new dependencies without asking. The stack is React 19, Vite, TypeScript, Tailwind v4 and
   React Router v7 — that is the whole list.
10. Never edit `rentease-poc/dist/`, the files in `files/`, or anything in `reference/`. `dist/` is build output; `files/` is
    the client's source material.

## Detailed rules

@.claude/rules/architecture.md
@.claude/rules/data-and-state.md
@.claude/rules/ui-and-design.md
@.claude/rules/workflow.md
@.claude/rules/bed-fit.md
