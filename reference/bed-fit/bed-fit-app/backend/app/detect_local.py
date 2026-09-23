"""Find a plan's wall lines from the pixels — no API key, no model.

Fully segmenting a raster plan into rooms is unreliable: furniture and text
leave lines that look like walls, and a doorway makes a real wall look absent.
Finding the wall LINES, though, is solid, because a drawn wall is a long dark
run in the row or column profile.

So that is all this does. The UI snaps a hand-drawn box to these lines, which
gets exact room rectangles out of a plan with no model in the loop.
"""

import io

import numpy as np
from PIL import Image, ImageOps

MAX_SIDE = 1800
DARK_LEVEL = 120
CANDIDATE_FRACTION = 0.16   # a snap target: dark across this much of the plan
STRONG_FRACTION = 0.45      # a structural wall, used to find the plan's extent
MERGE_PX = 4                # lines this close are the two faces of one wall


class LocalDetectError(Exception):
    """Carries a message meant to be shown to the user."""


def _load(image_bytes):
    try:
        im = Image.open(io.BytesIO(image_bytes))
        im = ImageOps.exif_transpose(im).convert("L")
    except Exception as exc:
        raise LocalDetectError("That image could not be opened.") from exc

    scale = 1.0
    if max(im.size) > MAX_SIDE:
        scale = MAX_SIDE / max(im.size)
        im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))))
    return im, scale


def _runs(mask):
    out, start = [], None
    for i, v in enumerate(mask):
        if v and start is None:
            start = i
        elif not v and start is not None:
            out.append((start, i))
            start = None
    if start is not None:
        out.append((start, len(mask)))
    return out


def _faces(profile, threshold, merge_px):
    """Both faces of every wall — what a room rectangle is actually bounded by.

    A room stops at the inside face of its walls, not their centrelines, so
    snapping a drawn box to centres is out by half a wall on each edge.
    """
    out = []
    for c, a, b in _lines(profile, threshold, merge_px):
        out.extend([float(a), float(b)] if b - a > 1 else [c])
    return sorted(set(out))


def _lines(profile, threshold, merge_px):
    """(centre, run start, run end) for each line clearing the threshold.

    The run bounds matter: a printed overall dimension is measured outer face to
    outer face, so the plan's extent has to come from the outer edges of the
    outermost walls, not their centrelines — a whole wall thickness of error.
    """
    hits = profile >= threshold
    out = []
    for a, b in _runs(hits):
        c = (a + b - 1) / 2.0
        if out and c - out[-1][0] < merge_px:
            pa, sa, ea = out[-1]
            out[-1] = ((pa + c) / 2.0, min(sa, a), max(ea, b))
        else:
            out.append((c, a, b))
    return out


def detect_walls(image_bytes, plan_width_ft=None, plan_depth_ft=None):
    """Wall lines as fractions of the image, plus the scale if one is given."""
    im, _ = _load(image_bytes)
    arr = np.asarray(im)
    dark = arr < DARK_LEVEL
    h, w = dark.shape

    if dark.mean() > 0.55:              # an inverted scan
        dark = ~dark

    col = dark.sum(axis=0).astype(float)
    row = dark.sum(axis=1).astype(float)

    xs = _faces(col, h * CANDIDATE_FRACTION, MERGE_PX)
    ys = _faces(row, w * CANDIDATE_FRACTION, MERGE_PX)
    sx = _lines(col, h * STRONG_FRACTION, MERGE_PX)
    sy = _lines(row, w * STRONG_FRACTION, MERGE_PX)
    strong_x = [c for c, _, _ in sx]
    strong_y = [c for c, _, _ in sy]

    if len(xs) < 2 or len(ys) < 2:
        raise LocalDetectError(
            "No walls were found. This reads a clean plan drawing best — a "
            "photo of a printed page, or a very low-contrast export, may not work. "
            "You can still draw the bedrooms by hand."
        )

    # The plan's own extent: the OUTER faces of the outermost structural walls,
    # which is what a printed overall dimension measures between.
    if sx and sy:
        extent = {"x0": float(sx[0][1]), "y0": float(sy[0][1]),
                  "x1": float(sx[-1][2]), "y1": float(sy[-1][2])}
    else:
        ex, ey = xs, ys
        extent = {"x0": min(ex), "y0": min(ey), "x1": max(ex), "y1": max(ey)}
    span_x = max(1.0, extent["x1"] - extent["x0"])
    span_y = max(1.0, extent["y1"] - extent["y0"])

    # Scale from whichever overall dimension the user supplied.
    ft_per_px = None
    if plan_width_ft:
        ft_per_px = float(plan_width_ft) / span_x
    elif plan_depth_ft:
        ft_per_px = float(plan_depth_ft) / span_y

    return {
        "image_px": {"w": w, "h": h},
        "walls": {
            "x": [round(v / w, 5) for v in xs],
            "y": [round(v / h, 5) for v in ys],
        },
        "structural": {
            "x": [round(v / w, 5) for v in strong_x],
            "y": [round(v / h, 5) for v in strong_y],
        },
        "extent": {k: round(v / (w if k[0] == "x" else h), 5) for k, v in extent.items()},
        "extent_px": {k: round(v, 1) for k, v in extent.items()},
        "ft_per_px": round(ft_per_px, 6) if ft_per_px else None,
        # what the plan measures across, so the UI can show the scale it derived
        "derived_size_ft": (
            {"width": round(span_x * ft_per_px, 2), "depth": round(span_y * ft_per_px, 2)}
            if ft_per_px else None
        ),
    }
