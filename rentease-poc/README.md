# RentEase — POC

A working, clickable proof of concept of **RentEase**: an India-focused room/apartment rental
platform that grew into a one-stop "set up your home" product. Two main roles — **Owner** and
**Renter** — plus a lightweight **Guest/Shopper**. Everything is mocked (payments, KYC, AI) but
behaves like the real thing, seeded with the 9-unit *Sunrise Residency* building.

Built from `files/RentEase_BUILD_BRIEF.md`, `files/RentEase_Project_Document.docx` and the
approved visual reference `files/RentEase_Design_TwoRoles.html`.

## Run it

```bash
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`). Seeded data is visible on first load.

Other scripts: `npm run build` (typecheck + production build), `npm run lint`, `npm run preview`.

## Deploy

`.github/workflows/deploy.yml` (at the repo root) lints, builds and publishes this app to GitHub
Pages on every push to `main`. It sets `BASE_PATH=/<repo>/` so Vite and the router serve from the
repo's sub-path, and copies `index.html` to `404.html` so deep links load. Locally the base stays
`/`. One-time setup: repo **Settings → Pages → Source: GitHub Actions**.

## Demo accounts

The login page has one-tap demo accounts (any password works):

| Role   | Name            | Email                  | Notes                                   |
|--------|-----------------|------------------------|-----------------------------------------|
| Owner  | Ramesh Kulkarni | `ramesh@rentease.test` | 9 units, ₹48,500 wallet, 3 pending requests · **Gold** rewards |
| Renter | Priya Sharma    | `priya@rentease.test`  | Active rental in Unit 103, rent due · **Silver** rewards |
| Guest  | Aditya Rao      | `aditya@rentease.test` | Marketplace only, prompted to upgrade · **Bronze** rewards |

The **Owner / Renter / Guest** pill in the top bar hops between these accounts instantly.

## What's clickable end-to-end

1. **Owner lists a unit** — `/owner/listings/new`, with a live renter-side preview. Photos upload
   for real: drop or browse multiple files, pick the cover, remove or reorder. Each one is scaled
   and re-encoded in the browser before it is stored (see *Photos* below).
2. **Renter finds & tours** — search/filter → listing detail → *Book a tour* → lands in the
   owner's request queue.
3. **Owner responds** — Accept/Decline; accepting a **booking** marks the unit rented and starts
   a rent schedule.
4. **Pay rent (mock)** — debits the renter's wallet, credits the owner's, logs receipts on both
   sides, advances the due date.
5. **Marketplace** — furniture (rent/buy), festival décor, cart with quantities, mock checkout,
   order history.
6. **Home services** — pick a plumber/electrician/construction pro, book a slot, track status.
7. **AI layout planner (stub)** — pick a floor-plan type → pre-computed furnished layout +
   priced bundle → *Add bundle to cart*. No real ML.
   Below the bundle, **Where the bed goes** draws each bedroom of that plan to scale and picks
   the bed: the headboard goes on a wall with no door or window, the bed is centred in whatever
   the door swing leaves, and the largest bed that keeps 1′6″ down both sides and 2′0″ past the
   foot is suggested. King and queen can be compared, with the walkways drawn as dimensions. The
   rules are ported from the Bed Fit project (`reference/bed-fit/`) into `src/lib/bedfit.ts`.
8. **Guest upgrade** — guests hitting renter/owner actions are routed to `/upgrade`.
9. **Decoration** — `/decoration`, an auto-advancing carousel of design ideas plus wall and door
   suggestions that change with the festival (it opens on whichever one is next on the calendar).
   Each idea carries a palette, a budget, a step-by-step, and an *Add the kit* button that drops
   the pieces it needs straight into the cart. Ideas are flagged **renter-safe** when they go up
   and come down with no nails and no repainting.
10. **Rewards** — `/rewards`, one card per user holding RentPoints, cashback and tenure coins.
   Paying rent or checking out earns points + tier cashback on both sides of the lease; 3/6/12-month
   tenure milestones pay loyalty coins to renter *and* owner; coins buy perks; points convert to
   cashback and cashback moves into the rent wallet. Lifetime points set a Bronze → Platinum tier
   that discounts the marketplace — no subscription fee, so it is earned rather than bought.

11. **Your home replaces discover** — the moment a renter has an active lease, `/renter` stops
   being *Find your next home*. Search and filters move to `/renter/search` (still in the sidebar,
   which relabels the entry to **Your home**) and the screen becomes the home they already have:
   the unit with its floor plan, rent and next due date, deposit held, **electricity, water and
   society bills** payable from the wallet, and one-tap links into services, furniture on rent,
   decoration, the planner, receipts and rewards.
12. **Help & About** — `/help` is a searchable FAQ with a ticket desk (each request gets a
   reference, a desk and a first reply, tracked to *resolved*); `/about` explains the product,
   with live counts read from the store.

13. **Top bar** — a notification bell with a red dot for anything unread, opening `/notifications`
   (requests land on the owner's bell; decisions, bills, rent, orders and desk replies on the
   renter's or shopper's — filter by unread, tap one to mark it read and jump to the screen it
   happened on), and an account dropdown with the pages for your role, the shared ones,
   `/account` for your profile, and a sign-out that asks first.

State persists in `localStorage` (`rentease.db.v1`). Clear it (or use a private window) to
reset to the seed data.

### Photos

There is no upload endpoint, so listing photos are stored as data URLs inside that same
`localStorage` DB — a budget of roughly 5 MB for *everything*. `src/lib/photos.ts` therefore
decodes each file (via `createImageBitmap` so EXIF orientation from phone cameras is respected),
scales the longest edge to 1280 px, re-encodes as JPEG at q0.72, and enforces caps of 8 photos and
3 MB per listing. In practice a 19 MB / 3000×2250 source lands at ~340 KB. Listings with no photos
fall back to the floor-plan schematic everywhere — card, tile, row and detail gallery.

Swapping in a real backend means changing `photos.ts` to POST the (still usefully compressed) blob
and store URLs instead; nothing else reads the field directly.

## Stack

- React 19 + Vite + TypeScript
- Tailwind CSS v4 — the design tokens from the brief (§6) live in `src/index.css` under `@theme`
- React Router v7
- No backend: a typed, promise-based mock API in `src/api/` over a `localStorage`-persisted
  store, so a real backend can replace that folder without touching components

## Where things live

```
src/
  api/          data access — store.ts (persistence), index.ts (promise API), hooks.ts (reactive reads)
  components/   FloorPlan (the 2D schematic motif), TopBar, Sidebar, UnitCard, ListingCard,
                RequestRow, WalletCard, RewardsCard, PhotoUploader, ProductArt,
                DesignCarousel + DecorScene (the Decoration tab's artwork), ui/ primitives
  context/      AuthContext (role-gated routing helpers), ToastContext
  data/seed.ts  the 9-unit building, users, catalogue, pros (brief §8)
  lib/          formatting, search filter, planner bundles, cart resolution,
                bedfit.ts (bed sizes, clearances, the placement engine, bedroom plans per type),
                rewards.ts (tiers, earn rates, milestones, coin perks — the whole rule book),
                photos.ts (decode → scale → JPEG pipeline and the storage caps),
                decoration.ts (festivals, wall/door design ideas, the coming-up-next pick)
  pages/        auth/, owner/, renter/ (discover, search, tours, bookings, MyHome),
                rewards/, shop/ (marketplace, decoration, planner, upgrade), info/ (about, help)
  types.ts      domain model (brief §7)
```

## Deliberately mocked

- Payments → "Payment successful" modal, wallet numbers only
- KYC / ownership verification → `verified` flags on seed data
- AI layouts → hardcoded per floor-plan type in `src/lib/planner.ts`
- Bed placement → real rule-based arithmetic in `src/lib/bedfit.ts`, but over fixed rooms per plan
  type (typical sizes, not a measured flat) and with no plan upload or reader
- Rewards → real arithmetic over the mock store, but no card issuer, no ledger and no expiry
- Utility bills → raised against the lease and paid from the wallet for real, but no DISCOM, no
  water board and no society ledger; a first electricity bill is metered off the unit's size when
  a booking is accepted
- Support tickets → routed to a desk per topic with a canned first reply; nobody is on the other
  end and no email is sent
- Decoration designs → hand-authored in `src/lib/decoration.ts`, drawn as SVG scenes rather than
  photographed; no recommender and no real festival calendar (dates are approximate windows)
- Photos → uploaded and displayed for real, but there is no file server (see below)
