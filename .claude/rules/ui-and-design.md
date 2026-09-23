# UI and design rules

The approved visual reference is `files/RentEase_Design_TwoRoles.html`. When a new screen has to
look like something, look there first.

## Tokens

Defined in `src/index.css` under `@theme` (Tailwind v4). Use the token classes, not hex:

| Purpose            | Class                                      |
|--------------------|--------------------------------------------|
| Page ground        | `bg-canvas` (set on `body`)                |
| Surface            | `bg-panel`, or the `.card` component class |
| Brand green        | `text-green`, `bg-green`, `bg-green-deep`  |
| Soft green wash    | `bg-green-soft`, `border-green-line`       |
| Accent             | `text-honey`, `bg-honey`, `bg-honey-soft`  |
| Text               | `text-ink`, `text-muted`                   |
| Hairline           | `border-line`, `divide-line`               |
| Let / occupied     | `text-rented`, `bg-rented-soft`            |

- `.card` = panel + hairline + `--radius-card` + `--shadow-card`. Use it instead of restating
  those three.
- `.display` switches to Bricolage Grotesque with tight tracking. Headings and numerals only —
  body copy stays in Inter.
- Raw hex is acceptable only inside SVG artwork, the dark-panel gradients, and on-dark text where
  a token would be wrong (`text-[#EAF2E7]` on green) — the existing pages show the pattern.

## Primitives — reach for these before writing markup

`src/components/ui/Bits.tsx` — `PageHead`, `SectionTitle`, `StatCard`, `EmptyState`, `Field`,
`inputClass`, `ErrorNote`
`src/components/ui/Button.tsx` — `Button` (`primary | honey | ghost | onDark`, `md | sm`),
`LinkButton` for anything that navigates
`src/components/ui/Chip.tsx` — `Chip`, `StatusPill` (`ok | wait | rented | muted`),
`VerifiedBadge`, `Avatar`
`src/components/ui/Modal.tsx` — `Modal`, `SuccessModal` (carries the "no real money moved" line)

Shared, non-primitive: `FloorPlan` (the recurring 2D schematic — every unit type has one),
`ProductArt`, `DecorScene`, `PhotoUploader`, `ListingCard`, `UnitCard`, `RequestRow`,
`WalletCard`, `RewardsCard`, `SearchBar`.

## Page shape

```tsx
<PageHead title="…" subtitle="…" action={<LinkButton …/>} />
{/* filters as pill buttons */}
<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">…</div>
<SectionTitle title="…" />
{list.length === 0 ? <EmptyState … /> : <div className="card overflow-hidden">…</div>}
```

- Empty is a state, not a blank area. Every list gets an `EmptyState` with a next action.
- Async buttons show their working label (`Booking…`, `Sending…`) and set `disabled` while busy.
- Confirmations use `SuccessModal`; incidental feedback uses `useToast()`; form errors use
  `ErrorNote` inline.
- Responsive: mobile first, `sm:` / `lg:` / `xl:` breakpoints, grids over fixed widths. The sidebar
  collapses into the `AppShell` drawer under `lg`.

## Copy

- Indian English, plain and specific. "Rent due on the 5th", not "Payment obligations".
- Sentence case for headings, no exclamation marks, no marketing superlatives.
- Prices as `₹48,500` via `inr()`. Areas in sqft. Cities and localities match the seed data.
- Say what is mocked where the user would otherwise assume it is real.

## Accessibility

- Every icon-only control needs `aria-label`; decorative SVGs already carry `aria-hidden`.
- Accordions set `aria-expanded`; dialogs are handled by `Modal` (focus, Escape, scroll lock).
- Do not remove the `:focus-visible` outline defined in `index.css`.
- Motion sits behind `prefers-reduced-motion` in `index.css` — keep new animation in CSS so it
  inherits that.
