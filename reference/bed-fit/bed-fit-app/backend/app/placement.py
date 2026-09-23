"""Bed placement engine.

Implements the rules in unit_101_bed_placement_guide.md:

  1. The headboard goes against the wall with no opening in it. A door blocks
     entry, a window must not sit behind the headboard, a doorway is a path.
  2. The bed is centered in whatever run of that wall the door swing leaves free.
  3. A side under `min_side` is not a walkway. When a bed cannot clear min_side
     on both sides it gets pinned `TIGHT_SIDE_GAP` off the far wall, so the entry
     side keeps one real path instead of both sides being unusable.

Room-local coordinates: origin at the room's top-left interior corner,
x increases right (0..width), y increases down (0..depth). All feet.
"""

from .catalog import (
    BEDS, BED_ORDER, CLEARANCES, DEFAULT_DOOR_WIDTH_FT,
    TIGHT_SIDE_GAP, OTHER_FURNITURE, WALLS,
)

BLOCKING_TYPES = {"door"}          # only a door sweeps floor
PATH_TYPES = {"doorway", "door"}   # things you walk through

# How bad it is to put a headboard against a wall carrying each opening type.
WALL_PENALTY = {"door": 100, "doorway": 60, "window": 40}


# --------------------------------------------------------------------------
# geometry helpers
# --------------------------------------------------------------------------

def _overlap(a0, a1, b0, b1):
    """Length of the overlap between two 1-D intervals."""
    return max(0.0, min(a1, b1) - max(a0, b0))


def swing_rect(op, W, D):
    """The floor a door sweeps as it opens, as [x0, y0, x1, y1] in room feet.

    Uses an explicit swing_footprint when the spec carries one, otherwise
    derives a square of the door's own width just inside its wall.
    """
    explicit = op.get("swing_footprint_local") or op.get("swing_footprint")
    if explicit and len(explicit) == 4:
        return [float(v) for v in explicit]

    span = op.get("span_ft_local") or op.get("span_ft") or [0.0, DEFAULT_DOOR_WIDTH_FT]
    a, b = float(span[0]), float(span[1])
    d = float(op.get("width_ft") or DEFAULT_DOOR_WIDTH_FT)
    wall = op.get("wall")

    if wall == "left":
        return [0.0, a, d, b]
    if wall == "right":
        return [W - d, a, W, b]
    if wall == "top":
        return [a, 0.0, b, d]
    return [a, D - d, b, D]  # bottom


def axes(wall, W, D):
    """(across_len, away_len) for a bed whose headboard is on `wall`.

    `across` runs along the headboard wall (the bed's width).
    `away` runs into the room (the bed's length).
    """
    return (W, D) if wall in ("top", "bottom") else (D, W)


def rect_across(rect, wall):
    """Project a room rect onto the across axis of `wall`."""
    x0, y0, x1, y1 = rect
    return (x0, x1) if wall in ("top", "bottom") else (y0, y1)


def rect_away(rect, wall, W, D):
    """Project a room rect onto the away axis, measured from `wall` inward."""
    x0, y0, x1, y1 = rect
    if wall == "top":
        return (y0, y1)
    if wall == "bottom":
        return (D - y1, D - y0)
    if wall == "left":
        return (x0, x1)
    return (W - x1, W - x0)  # right


def to_room_rect(wall, across_start, across_len_item, away_len_item, W, D):
    """Turn an (across, away) footprint against `wall` back into room coords."""
    s, e = across_start, across_start + across_len_item
    if wall == "top":
        return [s, 0.0, e, away_len_item]
    if wall == "bottom":
        return [s, D - away_len_item, e, D]
    if wall == "left":
        return [0.0, s, away_len_item, e]
    return [W - away_len_item, s, W, e]  # right


# --------------------------------------------------------------------------
# headboard wall
# --------------------------------------------------------------------------

def choose_headboard_wall(openings, W, D):
    """Pick the wall the headboard goes against, and say why.

    Prefers a wall with no opening at all. Falls back to the least-bad wall,
    where a door is worse than a doorway is worse than a window.
    """
    scored = []
    for wall in WALLS:
        here = [o for o in openings if o.get("wall") == wall]
        penalty = sum(WALL_PENALTY.get(o.get("type"), 20) for o in here)
        across_len, _ = axes(wall, W, D)
        # lower penalty wins; then the longer wall, which leaves more side room
        scored.append((penalty, -across_len, WALLS.index(wall), wall, here))

    scored.sort()
    penalty, _, _, wall, here = scored[0]

    if penalty == 0:
        others = []
        for p, _, _, w, ops in scored[1:]:
            if ops:
                kinds = ", ".join(sorted({o.get("type", "opening") for o in ops}))
                others.append(f"the {w} wall carries the {kinds}")
        tail = ("; " + ", ".join(others)) if others else ""
        why = (f"The {wall} wall is the only full-length wall free of an opening"
               f"{tail}. The headboard sits against it so the window and the "
               f"path through the room both stay clear.")
    else:
        kinds = ", ".join(sorted({o.get("type", "opening") for o in here}))
        why = (f"No wall in this room is free of an opening, so the headboard "
               f"goes against the {wall} wall as the least disruptive choice "
               f"(it carries the {kinds}). Check this one by eye.")

    return wall, why


# --------------------------------------------------------------------------
# the free run of the headboard wall
# --------------------------------------------------------------------------

def free_intervals(wall, openings, bed_length, W, D):
    """Runs along the headboard wall that a bed of `bed_length` can occupy.

    A door swing only blocks the bed if it reaches into the depth the bed
    actually takes up.
    """
    across_len, _ = axes(wall, W, D)
    blocked = []

    for op in openings:
        if op.get("type") not in BLOCKING_TYPES:
            continue
        rect = swing_rect(op, W, D)
        a0, a1 = rect_away(rect, wall, W, D)
        if _overlap(a0, a1, 0.0, bed_length) <= 0:
            continue  # swing is past the foot of the bed — does not block it
        c0, c1 = rect_across(rect, wall)
        blocked.append((max(0.0, c0), min(across_len, c1)))

    blocked.sort()
    runs, cursor = [], 0.0
    for b0, b1 in blocked:
        if b0 > cursor:
            runs.append((cursor, b0))
        cursor = max(cursor, b1)
    if cursor < across_len:
        runs.append((cursor, across_len))
    return runs or [(0.0, across_len)]


def _side_label(bounded_by_obstacle, wall, side):
    if bounded_by_obstacle:
        return "to the door swing"
    if wall in ("top", "bottom"):
        return "to the left wall" if side == "a" else "to the right wall"
    return "to the top wall" if side == "a" else "to the bottom wall"


# --------------------------------------------------------------------------
# one bed option
# --------------------------------------------------------------------------

def place_bed(bed_id, wall, openings, W, D):
    """Work out where one bed type goes, and how good that is."""
    bed = BEDS[bed_id]
    bw = bed["mattress"]["width"]
    bl = bed["mattress"]["length"]
    across_len, away_len = axes(wall, W, D)

    runs = free_intervals(wall, openings, bl, W, D)
    run = max(runs, key=lambda r: r[1] - r[0])
    start, end = run
    span = end - start

    foot = round(away_len - bl, 2)

    if span < bw or away_len < bl:
        return {
            "bed": bed_id,
            "label": bed["label"],
            "status": "DOES_NOT_FIT",
            "box_local_ft": None,
            "clearances_achieved_ft": {"side_a": None, "side_b": None, "foot": foot},
            "side_labels": {"a": "", "b": ""},
            "nightstands": [],
            "notes": (f"A {bed['label'].lower()} needs "
                      f"{bw:g} ft across and {bl:g} ft deep; this wall leaves "
                      f"{span:.2f} ft across and the room is {away_len:g} ft deep."),
        }

    # start centered in the free run
    pos = start + (span - bw) / 2.0
    side_a, side_b = pos - start, (end - pos - bw)
    min_side = CLEARANCES["min_side"]
    pinned = False

    # Both sides unusable? Give up on symmetry and buy one real walkway.
    if min(side_a, side_b) < min_side and span - bw > TIGHT_SIDE_GAP:
        low_is_obstacle = start > 1e-6
        high_is_obstacle = end < across_len - 1e-6
        if low_is_obstacle and not high_is_obstacle:
            pos = end - TIGHT_SIDE_GAP - bw   # push to the far wall, away from the door
            pinned = True
        elif high_is_obstacle and not low_is_obstacle:
            pos = start + TIGHT_SIDE_GAP
            pinned = True
        side_a, side_b = pos - start, (end - pos - bw)

    side_a, side_b = round(side_a, 2), round(side_b, 2)
    box = [round(v, 2) for v in to_room_rect(wall, pos, bw, bl, W, D)]

    ok_sides = min(side_a, side_b) >= min_side
    ok_foot = foot >= CLEARANCES["foot"]
    status = "RECOMMENDED" if (ok_sides and ok_foot) else "FITS_WITH_CAVEAT"

    labels = {
        "a": _side_label(start > 1e-6, wall, "a"),
        "b": _side_label(end < across_len - 1e-6, wall, "b"),
    }

    # nightstands only where a side has room for one
    ns = OTHER_FURNITURE["nightstand"]
    nightstands = []
    if side_a >= ns["width"]:
        nightstands.append([round(v, 2) for v in
                            to_room_rect(wall, pos - ns["width"], ns["width"], ns["depth"], W, D)])
    if side_b >= ns["width"]:
        nightstands.append([round(v, 2) for v in
                            to_room_rect(wall, pos + bw, ns["width"], ns["depth"], W, D)])

    notes = _notes(bed, status, side_a, side_b, labels, foot, pinned, len(nightstands))

    return {
        "bed": bed_id,
        "label": bed["label"],
        "status": status,
        "box_local_ft": box,
        "orientation": f"headboard on {wall} wall, length runs into the room",
        "clearances_achieved_ft": {"side_a": side_a, "side_b": side_b, "foot": foot},
        "side_labels": labels,
        "nightstands": nightstands,
        "notes": notes,
    }


def _notes(bed, status, side_a, side_b, labels, foot, pinned, n_stands):
    name = bed["label"].lower()
    tight, wide = (side_a, side_b) if side_a <= side_b else (side_b, side_a)

    if status == "RECOMMENDED":
        s = (f"Balanced walk-around: {side_a:g} ft {labels['a']} and "
             f"{side_b:g} ft {labels['b']}, with {foot:g} ft past the foot.")
        if n_stands == 2:
            s += " There is room for a nightstand on each side of the headboard."
        elif n_stands == 1:
            s += " One side has room for a nightstand."
        return s

    if pinned:
        return (f"A {name} fits, but not with a walkway on both sides. It is pushed "
                f"to the far wall so one side keeps {wide:g} ft to walk down; the other "
                f"is {tight:g} ft, which is a squeeze rather than a path. "
                f"Choose it only if bed size matters more than getting around both sides.")

    bits = []
    if tight < CLEARANCES["min_side"]:
        bits.append(f"the tightest side is {tight:g} ft, under the {CLEARANCES['min_side']:g} ft "
                    f"a side needs to stay walkable")
    if foot < CLEARANCES["foot"]:
        bits.append(f"only {foot:g} ft past the foot, under the {CLEARANCES['foot']:g} ft "
                    f"needed to pass and make the bed")
    return f"A {name} fits, but " + " and ".join(bits) + "."


# --------------------------------------------------------------------------
# a whole bedroom
# --------------------------------------------------------------------------

def plan_bedroom(room):
    """Solve one bedroom. `room` carries label, box, room_ft and openings."""
    W = float(room["room_ft"]["width"])
    D = float(room["room_ft"]["depth"])
    openings = room.get("openings") or []

    wall, why = choose_headboard_wall(openings, W, D)
    options = [place_bed(bid, wall, openings, W, D) for bid in BED_ORDER]

    # the largest bed that earns RECOMMENDED, else the one with the best tight side
    best = next((o for o in options if o["status"] == "RECOMMENDED"), None)
    if best is None:
        fits = [o for o in options if o["status"] != "DOES_NOT_FIT"]
        best = max(
            fits,
            key=lambda o: min(o["clearances_achieved_ft"]["side_a"],
                              o["clearances_achieved_ft"]["side_b"]),
        ) if fits else options[-1]

    return {
        "id": room.get("id") or room.get("label", "bedroom"),
        "label": room.get("label", "Bedroom"),
        "box": room.get("box"),
        "size_ft": {"width": W, "depth": D},
        "openings": openings,
        "headboard_wall": wall,
        "headboard_reasoning": why,
        "recommended": best["bed"],
        "options": options,
    }


def plan_all(rooms):
    return [plan_bedroom(r) for r in rooms]
