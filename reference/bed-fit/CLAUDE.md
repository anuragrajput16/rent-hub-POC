# Bed Fit

Upload a 2D floor plan → every bedroom gets a queen-or-king recommendation and a bed
placed against a specific wall, with the walkway it leaves on each side.

Runs entirely locally. No API key required.

## Run it

Two terminals. Backend on 8000, frontend on 5173 (Vite proxies `/api` to it).

```bash
brew install tesseract                      # required, OCR engine
cd bed-fit-app/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

cd bed-fit-app/frontend && npm install && npm run dev
```

Verify the engine before trusting any change to it:

```bash
cd bed-fit-app/backend && .venv/bin/python test_unit101.py
```

## Layout

```
bed-fit-app/backend/app/
  catalog.py      bed sizes + clearance rules   ← ALL tunable numbers live here
  placement.py    the engine (pure geometry, deterministic, no model)
  detect_ocr.py   local reader: OCR names + pixel walls   ← the default path
  detect_local.py wall-line detection + scale (shared by detect_ocr)
  detect.py       optional Claude-vision path, needs ANTHROPIC_API_KEY
  sample_unit.py  the Unit 101 flat, used as a no-upload demo + test fixture
  main.py         FastAPI routes
bed-fit-app/frontend/src/
  App.jsx         orchestrator; modes are "sample" | "read"
  lib.js          ftin(), room-local → image-fraction conversion
  components/     PlanCanvas · UnitPlan · BedroomCard · ClearanceStrip · RoomEditor
bed-fit-app/docs/how-it-works.html   engineering explainer (published artifact)
samples/_ (1).jpeg                   the real 25×40 test plan
web/bed_fit.html                     standalone HTML artifact (separate, self-contained)
```

Routes, all under `/api`: `health` `catalog` `sample` `place` `read` `walls` `analyze`.
`place` re-runs the engine with no model call — use it after any hand correction.

## The decision everything follows from

**Nothing in the pixels separates a 10×12 bedroom from a 10×12 kitchen.** Same rectangle,
same walls, same scale. Only the printed word says which. So the work is split between two
readers, and neither is trusted with the other's job:

| Job | Done by |
| --- | --- |
| Which room is a bedroom | OCR (the only thing that can) |
| Room size in feet | Printed dimension if it parses, else measured |
| Walls, scale, openings | Pixel profiles (exact, typography-independent) |

Corollary that governs the UX: **a confident wrong answer is worse than a visible gap.**
Every field records its provenance; anything uncertain arrives flagged for correction rather
than presented as fact. Do not "improve" this by silently filling gaps.

## Gotchas that cost real time

Do not re-litigate these — each was measured, not guessed.

- **OCR reads a leading `1` as `|`.** Tesseract split `13'4"X10'0"` into `|` + `3'4"X` +
  `10'0"`. Parsing words individually gives `3'4"` — a 13ft room reported as 3ft, silently.
  Fix: merge words into printed lines *before* parsing, then map `| l I → 1`, `O o → 0`.
- **Erase OCR'd text from the ink mask before finding walls.** Printed labels are long dark
  runs too; left in, they invent wall lines and a room seeded on its own label traces to a
  sliver *between its own letters* (52×10px instead of 191×142px).
- **Wall faces ≠ centrelines.** A room stops at inside faces; a printed overall dimension
  spans outer faces. Conflating them is a ~3% scale error. Corrected, rooms land within
  0.3–0.4% of printed sizes.
- **Scale is a median vote, not the first answer.** One room whose rectangle leaked voted for
  a scale 2.3× wrong. Now every room with a printed size votes, incoherent and
  implausible-building votes are discarded, and <2 agreeing votes means return *no* scale
  and ask.
- **Use `--psm 11` (sparse text).** Default page modes find one bedroom label and miss the
  other. Upscaling the whole image makes OCR *worse*, not better.
- **Structural limits, not tuning problems.** Furniture drawn inside a room is geometrically
  identical to a wall (same length, darkness, continuity), and text overlapped by a drawing is
  unrecoverable. Threshold sweeps, longest-run detection and targeted re-OCR were all tried;
  re-OCR *corrupted a room it had already read correctly*. These cases get flagged, not fixed.
- **Flood-fill segmentation does not work here.** White floor space leaks through every
  doorway; the whole plan comes back as one blob.

## Conventions

- **All user-facing measurements are feet-inches** (`13′4″`), never decimals. `ftin()` in
  `lib.js`; the backend stores decimal feet.
- **`catalog.py` is the single source of truth.** Nothing else hardcodes a size or clearance.
  `min_side` (1′6″) is the permissiveness dial — raise toward `walk_side` (2′0″) for stricter
  calls.
- **Two conflicting rule sets exist.** `unit_101_interior_spec.json` (the brand guide, in use:
  queen 5′×6′8″, king 6′4″×6′8″, clearance-based) vs the older `bed_fit_reference.md` (queen
  5′×6′6″, king 6′×6′6″, threshold-based `W≥12.5 AND D≥9`). **The brand guide wins.** Its
  1′6″ minimum is permissive enough that kings get RECOMMENDED where the old rules said queen
  — that is the guide's position, not a bug.
- **Design language** (app + docs + artifacts): Archivo for UI, IBM Plex Mono for every
  number, teal/vellum drafting palette, full light+dark token sets on bare `:root` with
  `prefers-color-scheme` and `[data-theme]` overrides.
- The engine is deterministic and free to re-run. Re-solve on every edit; never cache it.

## Source documents

`unit_101_interior_spec.json` and `bed_fit_reference.md` are the authority for the rules but
were supplied in conversation and are **not in the repo** — do not go looking for them. What
matters from them is already encoded:

- sizes, clearances, door swing, pin gap → `catalog.py`
- the expected Unit 101 placement → `test_unit101.py` (asserts the engine reproduces the
  spec's hand-authored `bed_placement` block exactly)

If either document resurfaces, drop it in `bed-fit-app/docs/` so the next session has it.

## Environment notes (this machine)

- **Homebrew Python 3.12 is broken** — `pyexpat` fails on an expat symbol mismatch, which also
  breaks `ensurepip`, so `python3 -m venv` fails. Use `/opt/homebrew/bin/python3.13`.
- **The git root is `/Users/swap`**, not this folder, and this project has never been
  committed. Deletions here are *not* recoverable via git — confirm before removing anything.
- Playwright + system Chrome is available for driving the app:
  `chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" })`

## Portable lessons for other projects

Generalisable beyond this codebase:

1. **Split a task by what each tool is actually reliable at**, then never let one do the
   other's job. Here: OCR for text, pixels for geometry.
2. **Provenance beats confidence.** Where a pipeline is partly unreliable, return *where each
   value came from* and flag the shaky ones. Silent failure is the expensive kind.
3. **Reproduce a hand-authored spec as the test.** `test_unit101.py` asserts the engine
   matches a result a person wrote before the engine existed — that is what proves the rule is
   right, not eyeballing output.
4. **Derive rules from the source document's own reasoning.** The bed's asymmetric "pinned"
   position came from the guide's sentence *"a comfortable path on one side only"*, and then
   landed on the spec's exact coordinates. That agreement is the evidence.
5. **Measure before tuning.** Every threshold here was chosen from a sweep against a real
   artefact, and two candidate approaches were abandoned on evidence rather than intuition.
