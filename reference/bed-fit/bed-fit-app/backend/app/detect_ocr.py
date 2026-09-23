"""Find bedrooms in a floor plan locally — OCR for the labels, pixels for the walls.

No API key and no model. The split of labour matters:

  * OCR reads the room NAMES. Nothing geometric can tell a 10x12 bedroom from a
    10x12 kitchen, so the text is the only way to know which room is which.
    Tesseract is reliable at the names and flaky at the dimension strings.
  * The WALLS come from the pixels, which is exact. A room's rectangle is found
    by growing out from its label until a real wall stops it.
  * The SCALE is self-calibrating: take whichever printed dimension parsed
    cleanly, compare it to that room's measured rectangle, and every other room
    can then be measured instead of read.

So a garbled dimension string costs nothing as long as one room in the plan
reads cleanly.
"""

import re

import numpy as np
import pytesseract
from PIL import Image

from .detect_local import DARK_LEVEL, LocalDetectError, _faces, _lines, _load

BEDROOM_WORDS = ("BEDROOM", "BED ROOM", "BEDRM", "MASTER BEDROOM", "M BEDROOM")
OTHER_ROOM_WORDS = (
    "KITCHEN", "HALL", "LIVING", "DINING", "TOILET", "BATH", "BATHROOM", "WC",
    "PORCH", "BALCONY", "UTILITY", "STAIR", "LOBBY", "STORE", "PUJA", "WASH",
    "GARAGE", "PARKING", "OTS", "O.T.S", "TERRACE", "PASSAGE", "FOYER", "STUDY",
)
MIN_CONF = 45              # to trust a word as a room NAME
MIN_DIM_CONF = 8           # a dimension string OCRs badly; the regex validates it
TEXT_PAD = 2               # px of margin when erasing text from the wall mask
WALL_COVERAGE = 0.55       # a boundary this covered in ink stops a room growing
MAX_ROOM_FRACTION = 0.42   # a single room should not swallow the whole plan
MIN_GAP_FT = 1.6           # a gap in a wall at least this wide is an opening
EXTERIOR_TOL = 0.02        # a wall this close to the plan edge is an outside wall

DIM_RE = re.compile(r"(\d{1,2})\s*['’]\s*(\d{1,2})?\s*[\"”]?")


# --------------------------------------------------------------------------
# OCR
# --------------------------------------------------------------------------

def _ocr(im):
    """Words with boxes. PSM 11 (sparse text) is the mode for scattered labels."""
    try:
        data = pytesseract.image_to_data(
            im, config="--psm 11", output_type=pytesseract.Output.DICT)
    except pytesseract.TesseractNotFoundError as exc:
        raise LocalDetectError(
            "Tesseract is not installed on the server, so plans cannot be read. "
            "Install it with: brew install tesseract"
        ) from exc

    words = []
    for i, raw in enumerate(data["text"]):
        text = raw.strip()
        if not text:
            continue
        try:
            conf = float(data["conf"][i])
        except (TypeError, ValueError):
            conf = -1.0
        if conf < MIN_DIM_CONF:
            continue
        words.append({
            "text": text,
            "upper": re.sub(r"[^A-Z0-9'\".]", "", text.upper()),
            "conf": conf,
            "x": data["left"][i], "y": data["top"][i],
            "w": data["width"][i], "h": data["height"][i],
            "cx": data["left"][i] + data["width"][i] / 2,
            "cy": data["top"][i] + data["height"][i] / 2,
        })
    return words


# Tesseract's usual confusions in a dimension string. A leading 1 very often
# comes back as a pipe or an l, which silently turns 13'4" into 3'4".
_FIX = str.maketrans({"|": "1", "l": "1", "I": "1", "i": "1",
                      "O": "0", "o": "0", "’": "'", "‘": "'",
                      "”": '"', "“": '"', "″": '"', "′": "'"})


def _merge_lines(words):
    """Join words that sit on one printed line.

    A dimension string is regularly split across several OCR words, so parsing
    them one at a time loses the value entirely.
    """
    # Phase 1: group into rows by vertical overlap alone, so the result does not
    # depend on the order words happen to arrive in.
    rows = []
    for wd in sorted(words, key=lambda w: w["cy"]):
        for r in rows:
            overlap = min(r["y1"], wd["y"] + wd["h"]) - max(r["y0"], wd["y"])
            if overlap > 0.45 * min(r["y1"] - r["y0"], wd["h"]):
                r["parts"].append(wd)
                r["y0"] = min(r["y0"], wd["y"])
                r["y1"] = max(r["y1"], wd["y"] + wd["h"])
                break
        else:
            rows.append({"parts": [wd], "y0": wd["y"], "y1": wd["y"] + wd["h"]})

    # Phase 2: read each row left to right, breaking only on a wide gap, which
    # is what separates two different rooms' text sharing one line.
    out = []
    for r in rows:
        parts = sorted(r["parts"], key=lambda w: w["x"])
        row_h = max(p["h"] for p in parts)
        run = [parts[0]]
        for prev, wd in zip(parts, parts[1:]):
            gap = wd["x"] - (prev["x"] + prev["w"])
            if gap > max(35, 2.2 * row_h):
                out.append(_as_line(run))
                run = [wd]
            else:
                run.append(wd)
        out.append(_as_line(run))
    return out


def _as_line(parts):
    x0 = min(p["x"] for p in parts)
    x1 = max(p["x"] + p["w"] for p in parts)
    y0 = min(p["y"] for p in parts)
    y1 = max(p["y"] + p["h"] for p in parts)
    return {
        "text": "".join(p["text"] for p in parts),
        "conf": max(p["conf"] for p in parts),
        "cx": (x0 + x1) / 2, "cy": (y0 + y1) / 2,
        "x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0,
    }


def _parse_dims(text):
    """'13'4"X10'0"' -> (13.33, 10.0). Tolerates the missing X some plans print."""
    text = text.translate(_FIX)
    found = DIM_RE.findall(text)
    vals = []
    for ft, inch in found:
        try:
            vals.append(int(ft) + (int(inch) if inch else 0) / 12.0)
        except ValueError:
            continue
    if len(vals) >= 2 and all(2 <= v <= 60 for v in vals[:2]):
        return round(vals[0], 3), round(vals[1], 3)
    return None


def _erase_text(dark, words):
    """Blank every word out of the ink mask before looking for walls.

    Printed labels are long dark runs too, so left in they invent wall lines —
    and a room seeded on its own label lands in a sliver between them.
    """
    clean = dark.copy()
    h, w = clean.shape
    for wd in words:
        x0 = max(0, wd["x"] - TEXT_PAD)
        y0 = max(0, wd["y"] - TEXT_PAD)
        x1 = min(w, wd["x"] + wd["w"] + TEXT_PAD)
        y1 = min(h, wd["y"] + wd["h"] + TEXT_PAD)
        clean[y0:y1, x0:x1] = False
    return clean


def _label_kind(upper):
    for w in BEDROOM_WORDS:
        if w.replace(" ", "") in upper:
            return "bedroom"
    for w in OTHER_ROOM_WORDS:
        if w.replace(" ", "").replace(".", "") in upper:
            return "other"
    return None


def _find_labels(words):
    """Room-name labels, each paired with the dimension line printed under it."""
    lines = _merge_lines(words)
    labels = []
    for wd in words:
        if wd["conf"] < MIN_CONF:
            continue
        kind = _label_kind(wd["upper"])
        if not kind:
            continue
        # the dimension line usually sits directly beneath the name
        dims, best = None, 1e9
        for ln in lines:
            dy = ln["cy"] - wd["cy"]
            dx = abs(ln["cx"] - wd["cx"])
            if dy < 0 or dy > max(wd["h"] * 4.5, 46) or dx > max(80, wd["w"]):
                continue
            got = _parse_dims(ln["text"])
            if got and dy < best:
                dims, best = got, dy
        labels.append({
            "kind": kind, "text": wd["text"], "conf": wd["conf"],
            "cx": wd["cx"], "cy": wd["cy"], "dims": dims,
        })
    return labels


# --------------------------------------------------------------------------
# room rectangle: grow out from the label until real walls stop it
# --------------------------------------------------------------------------

def _covered(dark, pos, lo, hi, axis):
    """Fraction of a boundary that is actually ink — i.e. is it a real wall?"""
    lo, hi = int(max(0, lo)), int(hi)
    if hi - lo < 2:
        return 1.0
    p = int(pos)
    if axis == "v":
        band = dark[lo:hi, max(0, p - 1):p + 2]
        if band.size == 0:
            return 1.0
        return float(band.any(axis=1).mean())
    band = dark[max(0, p - 1):p + 2, lo:hi]
    if band.size == 0:
        return 1.0
    return float(band.any(axis=0).mean())


def _room_rect(dark, xs, ys, cx, cy):
    """The cell containing (cx, cy), grown across every boundary that is open."""
    h, w = dark.shape
    ci = np.searchsorted(xs, cx) - 1
    ri = np.searchsorted(ys, cy) - 1
    if ci < 0 or ri < 0 or ci >= len(xs) - 1 or ri >= len(ys) - 1:
        return None

    c0 = c1 = int(ci)
    r0 = r1 = int(ri)
    area_cap = w * h * MAX_ROOM_FRACTION

    for _ in range(60):
        grew = False
        # each side in turn: if the boundary is not a wall, absorb the next slice
        if c0 > 0 and _covered(dark, xs[c0], ys[r0], ys[r1 + 1], "v") < WALL_COVERAGE:
            if (xs[c1 + 1] - xs[c0 - 1]) * (ys[r1 + 1] - ys[r0]) < area_cap:
                c0 -= 1
                grew = True
        if c1 < len(xs) - 2 and _covered(dark, xs[c1 + 1], ys[r0], ys[r1 + 1], "v") < WALL_COVERAGE:
            if (xs[c1 + 2] - xs[c0]) * (ys[r1 + 1] - ys[r0]) < area_cap:
                c1 += 1
                grew = True
        if r0 > 0 and _covered(dark, ys[r0], xs[c0], xs[c1 + 1], "h") < WALL_COVERAGE:
            if (xs[c1 + 1] - xs[c0]) * (ys[r1 + 1] - ys[r0 - 1]) < area_cap:
                r0 -= 1
                grew = True
        if r1 < len(ys) - 2 and _covered(dark, ys[r1 + 1], xs[c0], xs[c1 + 1], "h") < WALL_COVERAGE:
            if (xs[c1 + 1] - xs[c0]) * (ys[r1 + 2] - ys[r0]) < area_cap:
                r1 += 1
                grew = True
        if not grew:
            break

    return [float(xs[c0]), float(ys[r0]), float(xs[c1 + 1]), float(ys[r1 + 1])]


# --------------------------------------------------------------------------
# openings: gaps in the room's own walls
# --------------------------------------------------------------------------

def _wall_gaps(dark, rect, wall, ft_per_px, extent):
    """Runs along one wall of the room with no ink — doors, doorways, windows."""
    x0, y0, x1, y1 = rect
    h, w = dark.shape

    if wall in ("top", "bottom"):
        pos = y0 if wall == "top" else y1
        lo, hi = int(x0), int(x1)
        band = dark[max(0, int(pos) - 2):int(pos) + 3, lo:hi]
        if band.size == 0:
            return []
        solid = band.any(axis=0)
        outer = abs(pos - extent["y0"]) < h * EXTERIOR_TOL or abs(pos - extent["y1"]) < h * EXTERIOR_TOL
    else:
        pos = x0 if wall == "left" else x1
        lo, hi = int(y0), int(y1)
        band = dark[lo:hi, max(0, int(pos) - 2):int(pos) + 3]
        if band.size == 0:
            return []
        solid = band.any(axis=1)
        outer = abs(pos - extent["x0"]) < w * EXTERIOR_TOL or abs(pos - extent["x1"]) < w * EXTERIOR_TOL

    gaps, start = [], None
    for i, s in enumerate(solid):
        if not s and start is None:
            start = i
        elif s and start is not None:
            gaps.append((start, i))
            start = None
    if start is not None:
        gaps.append((start, len(solid)))

    out = []
    min_px = MIN_GAP_FT / ft_per_px
    for a, b in gaps:
        if b - a < min_px:
            continue
        # An outside wall's gap is a window; an inside wall's gap is a door.
        # Either way it rules the wall out for a headboard, which is what counts.
        kind = "window" if outer else "door"
        out.append({
            "type": kind,
            "wall": wall,
            "span_ft_local": [round(a * ft_per_px, 2), round(b * ft_per_px, 2)],
            "width_ft": round((b - a) * ft_per_px, 2),
        })
    return out


# --------------------------------------------------------------------------

def detect_bedrooms_ocr(image_bytes, plan_width_ft=None):
    """Read a plan and return engine-ready bedrooms, with provenance.

    Never fails on a partial read. Every field says where it came from, and a
    room the reader is unsure about is flagged for review rather than presented
    as fact — a wrong size that looks confident is worse than an obvious gap.
    """
    im, _ = _load(image_bytes)
    arr = np.asarray(im)
    dark = arr < DARK_LEVEL
    h, w = dark.shape
    if dark.mean() > 0.55:
        dark = ~dark

    words = _ocr(im)
    dark = _erase_text(dark, words)      # walls only, no lettering

    col = dark.sum(axis=0).astype(float)
    row = dark.sum(axis=1).astype(float)
    xs = _faces(col, h * 0.16, 4)
    ys = _faces(row, w * 0.16, 4)
    sx = _lines(col, h * 0.45, 4)
    sy = _lines(row, w * 0.45, 4)
    if not sx or not sy or len(xs) < 2 or len(ys) < 2:
        raise LocalDetectError("No walls were found in that image.")

    extent = {"x0": float(sx[0][1]), "y0": float(sy[0][1]),
              "x1": float(sx[-1][2]), "y1": float(sy[-1][2])}

    labels = _find_labels(words)
    beds = [l for l in labels if l["kind"] == "bedroom"]
    if not beds:
        raise LocalDetectError(
            "No room labelled as a bedroom was found. The text needs to be legible — "
            "a crisp plan export reads far better than a photo of a printed page."
        )

    # measure every labelled room, so any of them can calibrate the scale
    for lab in labels:
        lab["rect"] = _room_rect(dark, xs, ys, lab["cx"], lab["cy"])

    # Scale, best source first: a width the user gave us, else the clearest
    # printed dimension checked against that room's measured rectangle.
    ft_per_px, source = None, None
    if plan_width_ft:
        ft_per_px = float(plan_width_ft) / max(1.0, extent["x1"] - extent["x0"])
        source = f"plan width you entered ({plan_width_ft:g} ft)"
    else:
        # Every room that printed a size votes on the scale. A room whose walls
        # were traced badly votes wrong, so take the consensus rather than the
        # first answer, and sanity-check it against the plan's overall size.
        votes = []
        for lab in labels:
            if not lab["dims"] or not lab["rect"]:
                continue
            rx = lab["rect"][2] - lab["rect"][0]
            ry = lab["rect"][3] - lab["rect"][1]
            if rx < 8 or ry < 8:
                continue
            a, b = lab["dims"]
            pair = min([(a / rx, b / ry), (b / rx, a / ry)],
                       key=lambda p: abs(p[0] - p[1]) / max(p[0], p[1]))
            if abs(pair[0] - pair[1]) / max(pair[0], pair[1]) > 0.12:
                continue                       # the two sides disagree: bad trace
            s = (pair[0] + pair[1]) / 2
            plan_w = (extent["x1"] - extent["x0"]) * s
            plan_d = (extent["y1"] - extent["y0"]) * s
            if not (8 <= plan_w <= 200 and 8 <= plan_d <= 200):
                continue                       # implies an absurd building
            votes.append((s, lab))

        if votes:
            votes.sort(key=lambda v: v[0])
            ft_per_px, lab = votes[len(votes) // 2]      # median vote
            agree = [v for v in votes if abs(v[0] - ft_per_px) / ft_per_px < 0.15]
            source = f"the printed size of {lab['text'].strip(':').title()}"
            if len(votes) > 1 and len(agree) < 2:
                # rooms disagree about the scale and there is no way to tell
                # which is right — better to ask than to pick one
                ft_per_px, source = None, None

    rooms = []
    for i, lab in enumerate(beds):
        review = []
        rect = lab["rect"]
        if not rect or rect[2] - rect[0] < 8 or rect[3] - rect[1] < 8:
            review.append("its walls could not be traced")
            rect = _fallback_rect(lab, w, h)
        px_w, px_h = rect[2] - rect[0], rect[3] - rect[1]

        if lab["dims"]:
            a, b = lab["dims"]
            W, D = (a, b) if (px_w >= px_h) == (a >= b) else (b, a)
            size_from = "the size printed on the plan"
            # a traced rectangle that disagrees with the printed size means one
            # of the two is wrong, and we cannot tell which
            if ft_per_px:
                mw, md = px_w * ft_per_px, px_h * ft_per_px
                if max(abs(mw - W) / W, abs(md - D) / D) > 0.15:
                    review.append(
                        f"the printed size ({W:g}×{D:g} ft) does not match the walls "
                        f"traced around it ({mw:.1f}×{md:.1f} ft)")
        elif ft_per_px:
            W, D = px_w * ft_per_px, px_h * ft_per_px
            size_from = "measured off the plan"
            review.append("no printed size could be read, so this is measured from the drawing")
        else:
            W, D = 10.0, 10.0
            size_from = "a placeholder"
            review.append("no size could be read and there is no scale — enter it")

        openings = []
        if ft_per_px:
            for wall in ("top", "right", "bottom", "left"):
                openings.extend(_wall_gaps(dark, rect, wall, ft_per_px, extent))
        if not openings:
            review.append("no doors or windows were found, so the headboard wall is a guess")

        rooms.append({
            "id": f"bedroom_{i + 1}",
            "label": lab["text"].strip(":").title().strip() or f"Bedroom {i + 1}",
            "box": {"x": round(rect[0] / w, 4), "y": round(rect[1] / h, 4),
                    "w": round(px_w / w, 4), "h": round(px_h / h, 4)},
            "room_ft": {"width": round(W, 2), "depth": round(D, 2)},
            "openings": openings,
            "read": {
                "size_from": size_from,
                "label_confidence": round(lab["conf"]),
                "needs_review": bool(review),
                "review": review,
            },
        })

    return {
        "bedrooms": rooms,
        "scale": {
            "ft_per_px": round(ft_per_px, 6) if ft_per_px else None,
            "calibrated_from": source,
        },
        "image_px": {"w": w, "h": h},
    }


def _fallback_rect(lab, w, h):
    """A box centred on the label, for when the walls could not be traced.

    Deliberately rough — the room is flagged for review, and the point is to
    give the reviewer something to drag rather than a blank plan.
    """
    half_w, half_h = w * 0.11, h * 0.09
    x0 = max(0.0, min(w - 2 * half_w, lab["cx"] - half_w))
    y0 = max(0.0, min(h - 2 * half_h, lab["cy"] - half_h))
    return [x0, y0, x0 + 2 * half_w, y0 + 2 * half_h]
