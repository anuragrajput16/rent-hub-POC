# Bed Fit

Upload a 2D floor plan and it reads itself — room names from the printed text,
walls from the pixels — then places a bed in every bedroom against the wall the
brand guide allows and reports the walkway it leaves on each side.

Runs entirely on your machine. No API key, no per-plan cost.

**Uploading is the whole interaction.** Where the reader is confident you get an
answer; where it isn't, the room is flagged for a correction rather than
presented as fact. That distinction is the point: on a real plan, a bedroom
label sitting under a furniture drawing is genuinely unreadable, and a confident
wrong size is worse than an obvious gap.

```
bed-fit-app/
├── backend/                  FastAPI + the placement engine
│   ├── app/
│   │   ├── catalog.py        bed sizes and clearance rules  ← retune here
│   │   ├── placement.py      the engine
│   │   ├── detect_ocr.py     local reader: OCR names + pixel walls  ← the default
│   │   ├── detect_local.py   wall-line detection and scale
│   │   ├── detect.py         optional Claude vision path (needs a key)
│   │   ├── sample_unit.py    the Unit 101 flat
│   │   └── main.py           the API
│   ├── test_unit101.py       checks the engine against the spec
│   └── requirements.txt
└── frontend/                 React + Vite
    └── src/
        ├── App.jsx
        ├── lib.js            feet-inches, room-local → image fractions
        └── components/       PlanCanvas · UnitPlan · BedroomCard · ClearanceStrip
```

## Run it

Two terminals.

**Backend** (port 8000):

```bash
brew install tesseract        # the OCR engine, required
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend** (port 5173, proxies `/api` to the backend):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173.

## How a plan is read

The split of labour is the whole design, because each half is reliable at
something the other cannot do:

| Job | Done by | Why |
| --- | --- | --- |
| Which room is a bedroom | OCR | No geometric rule separates a 10×12 bedroom from a 10×12 kitchen. Only the printed name says. |
| Room size in feet | OCR, then measurement | The printed dimension when it parses; otherwise measured off the walls. |
| Walls and the scale | Pixels | A wall is a long dark run — exact, and unaffected by typography. |
| Doors and windows | Pixels | Gaps in the room's own walls. |

Three details do most of the work:

* **Text is erased from the ink mask before walls are found.** Printed labels
  are long dark runs too, so left in they invent wall lines — and a room seeded
  on its own label lands in a sliver between them.
* **OCR words are merged into lines before parsing.** Tesseract split one
  dimension into `|` + `3'4"X` + `10'0"`, reading the leading **1 as a pipe**.
  Parsing words one at a time silently turns 13′4″ into 3′4″.
* **The scale is a consensus.** Every room that printed a size votes; the median
  wins, and a vote implying an absurd building is thrown out. One badly traced
  room can no longer set the scale for the whole plan.

### What it cannot do

Where a room's label is overlapped by a furniture drawing, the pixels for that
text are not recoverable, and furniture lines are geometrically identical to
walls. Those rooms come back **flagged**, with the size fields ready to correct.
Fixing one clears the flag and re-runs the recommendation immediately.

Setting `ANTHROPIC_API_KEY` in `backend/.env` enables `POST /api/analyze`, a
vision-model path that handles those cases — optional, and nothing else needs it.

## The rules it follows

From `unit_101_bed_placement_guide.md` and the `furniture_catalog` in
`unit_101_interior_spec.json`:

1. **Headboard wall.** The wall with no opening in it. A door is worse than a
   doorway is worse than a window; among equally clear walls the longer one
   wins, because it leaves more room on each side. When no wall is clear the
   engine says so instead of pretending.
2. **Centered in the free run.** A door sweeps a square of its own width just
   inside the room. The bed is centered in whatever run of the headboard wall
   that leaves.
3. **One good side beats two bad ones.** If a bed cannot clear `min_side`
   (1′6″) on both sides, it is pinned `TIGHT_SIDE_GAP` (0′6″) off the far wall
   so the entry side keeps a real walkway.
4. **Status.** `RECOMMENDED` when both sides clear `min_side` and there is
   `foot` (2′0″) past the foot; otherwise `FITS_WITH_CAVEAT`; `DOES_NOT_FIT`
   when the bed will not go in at all.
5. **Nightstands** appear only on a side with 1′6″ to spare.

The largest bed that earns `RECOMMENDED` is the one recommended.

### Checking it against the spec

`test_unit101.py` asserts the engine reproduces `bed_placement` from the spec:

```bash
cd backend && .venv/bin/python test_unit101.py
```

Queen lands on `[4.5, 0, 9.5, 6.67]` with 1′6″ each side and two nightstands;
king on `[4.17, 0, 10.5, 6.67]` with 1′2″ and 0′6″. Both statuses match.

## Heads up: two conflicting rule sets

The bed sizes here come from the Unit 101 spec and **differ from the older
`bed_fit_reference.md`**:

|       | Unit 101 spec (used) | bed_fit_reference.md |
| ----- | -------------------- | -------------------- |
| Queen | 5′0″ × 6′8″          | 5′0″ × 6′6″          |
| King  | 6′4″ × 6′8″          | 6′0″ × 6′6″          |

The logic differs more than the sizes do. The old file recommended a king only
in a room 12′6″ wide and 9′ deep; this engine asks whether the clearances are
met, and a 1′6″ minimum side is permissive enough that a king earns
`RECOMMENDED` in rooms the old rules gave to a queen. If you want the stricter
behaviour, raise `min_side` toward `walk_side` (2′0″) in `catalog.py`.

## API

| Route          | Does                                                       |
| -------------- | ---------------------------------------------------------- |
| `GET /health`  | is a key configured, and which model                        |
| `GET /catalog` | bed sizes and clearance rules                               |
| `GET /sample`  | the Unit 101 flat, solved — no key needed                   |
| `POST /place`  | rooms as JSON → placements, no model call                   |
| `POST /analyze`| a plan image → bedrooms found and solved                    |

All under `/api`. `POST /place` is what to call after editing a room by hand —
it re-runs the engine without spending a model request.

## Tuning

Everything adjustable is in `backend/app/catalog.py`: bed sizes, the three
clearances, the door-swing square, `TIGHT_SIDE_GAP`, and the nightstand
footprint. `placement.py` reads all of them; nothing else hardcodes a number.
