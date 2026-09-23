# Bed fit rules

The layout planner (`/planner`) suggests which bed to use in each bedroom and where to put it. The
logic is ported from the Bed Fit project (`~/Desktop/bed-fit 2`). A copy of it lives in
`reference/bed-fit/`, together with its own `CLAUDE.md`, taken verbatim. Read that file before
changing the engine. It explains why the rules are what they are.

## The reference copy is read-only

- Do not edit, run or build anything in `reference/bed-fit/`. It is not part of the RentEase
  build. Its `CLAUDE.md` has run steps and machine notes for the original project; those apply
  only in `~/Desktop/bed-fit 2`, not here.
- The copy leaves out `.venv/`, `node_modules/` and `__pycache__/`. If the original changes,
  re-sync with `rsync -a --exclude .venv --exclude node_modules --exclude __pycache__` rather
  than editing the copy by hand.

## What was ported, and where it lives now

`rentease-poc/src/lib/bedfit.ts` is the source of truth on the RentEase side.

| Bed Fit (Python / JSX)                       | RentEase port                                          |
|----------------------------------------------|--------------------------------------------------------|
| `backend/app/catalog.py`                     | `BEDS`, `BED_ORDER`, `CLEARANCES`, `TIGHT_SIDE_GAP` in `lib/bedfit.ts` |
| `backend/app/placement.py`                   | `planBedroom()` and its helpers in `lib/bedfit.ts`     |
| `backend/app/sample_unit.py` (Unit 101)      | `BEDROOMS`: one set of rooms per `UnitType`            |
| `frontend/src/components/ClearanceStrip.jsx` | the dimension lines in `components/BedFitRoom.tsx`     |
| `frontend/src/components/BedroomCard.jsx`    | section 3 of `pages/shop/Planner.tsx`                  |
| `frontend/src/lib.js` `ftin()`               | `ftin()` in `lib/format.ts`                            |

Not ported: the plan reader (OCR, wall detection, the Claude vision path) and the FastAPI routes.
RentEase has no backend, so it uses fixed, hand-drawn plans, one per unit type.

## Rules carried over from Bed Fit's CLAUDE.md

- **The brand guide's sizes win.** Queen is 5′0″ × 6′8″ and king is 6′4″ × 6′8″. The older
  `bed_fit_reference.md` sizes (6′6″ long) are not used. The 1′6″ `minSide` is permissive
  enough that a king earns RECOMMENDED where the old rules said queen. That is the guide's
  position, not a bug. To be stricter, raise `minSide` towards 2′0″.
- **One place for numbers.** Bed sizes and clearances live only in the catalog block at the top
  of `bedfit.ts`.
- **Feet-inches on screen** (`13′4″` via `ftin()`), decimal feet in code.
- **Re-solve on every render.** The engine is deterministic and cheap, so never cache or
  persist its output in the store.
- **Do not present a guess as fact.** In Bed Fit, uncertain rooms are flagged. Here, room sizes
  are typical for the plan type, not measured from a real flat, and the planner says so on
  screen. Keep that line.
- **Parity is the test.** The Unit 101 bedroom (11 × 12 ft, door left `[0.9, 3.9]`, window
  right, doorway bottom) must still give queen `[4.5, 0, 9.5, 6.67]` RECOMMENDED and king
  `[4.17, 0, 10.5, 6.67]` FITS_WITH_CAVEAT. That matches `test_unit101.py` in the reference.
  There is no test setup in RentEase, so check it with a throwaway script, not a new test file.

What does **not** carry over: Bed Fit's design language (Archivo, IBM Plex Mono, teal/vellum).
The planner uses RentEase tokens and the colours of the existing SVG artwork.

## Conventions for this feature

- `lib/bedfit.ts` is pure logic: no React and no store.
- Room-local coordinates are in feet. The origin is the room's top-left interior corner, x runs
  right (0..width) and y runs down (0..depth). An opening's `span` is measured along its own wall
  from the top or left end, and a door's swing is a square of its own width.
- Every bedroom's `box` is in the `FloorPlan` viewBox (0 0 120 80) and must match that type's
  walls in `components/FloorPlan.tsx`, so the locator highlights the right room.
- The shop only has a queen bed (`f1`). When the engine suggests a king, the page says the
  queen also fits. Adding a king product needs the seed and API steps in `architecture.md`.
