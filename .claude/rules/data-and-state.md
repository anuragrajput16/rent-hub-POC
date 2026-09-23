# Data and state rules

## The mock DB

- One object, persisted whole, under `rentease.db.v1`. Reset by clearing site data or calling
  `reset()` from `src/api`.
- `mutate(fn)` hands you a mutable draft, then replaces the reference and notifies subscribers.
  Mutate the draft directly (`user.walletBalance -= amount`) or return a new DB — both work.
- Ids come from `uid('prefix')`. Keep prefixes short and consistent with the existing ones:
  `user`, `u`, `req`, `bk`, `txn`, `card`, `rw`, `cl`, `ord`, `svc`, `tkt`.
- Dates are `YYYY-MM-DD` strings via `todayISO()`. Never store a `Date`.

## Money

- Rupees as plain integers. No floats, no paise, no currency codes.
- A payment that cannot complete throws instead of part-paying — see `bookings.payRent`, which
  refuses when the wallet is short rather than leaving a half-settled month.
- Money moving between two users writes a `WalletTxn` on **both** sides with a matching note, so
  the ledgers reconcile. Rent and checkout also run `earnOn` so the rewards card keeps pace.
- Rewards arithmetic lives in `src/lib/rewards.ts`. Change the rule book there, never inline in a
  component or a page.

## Storage budget

- `localStorage` gives roughly 5 MB for the entire DB, and listing photos are data URLs inside it.
  `src/lib/photos.ts` enforces the caps (8 photos, 3 MB per listing, longest edge 1280 px, JPEG
  q0.72). Do not raise a cap without re-checking the total budget.
- Anything large and new (attachments, exports) does not belong in the DB.

## Auth

- `AuthContext` wraps `api.auth` and exposes `user`, `role`, `login`, `register`, `logout`,
  `switchRole`, `upgrade`. Components use `useAuth()`, never `api.auth` directly.
- The top-bar role pill is a demo affordance that hops between the three seeded accounts. Keep the
  three seeded users working — the README documents them and they are how the app is demoed.
