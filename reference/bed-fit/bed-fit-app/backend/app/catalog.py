"""Furniture catalog and clearance rules.

Every number here comes from unit_101_interior_spec.json -> furniture_catalog.
This is the single place to retune the brand guide; nothing else hardcodes a size.

Note: these bed sizes differ from the older bed_fit_reference.md
(queen 5.0x6.5, king 6.0x6.5). The Unit 101 spec is the brand guide, so it wins.
"""

BEDS = {
    "bed_queen": {
        "id": "bed_queen",
        "label": "Queen bed",
        "mattress": {"width": 5.0, "length": 6.67},
        "with_frame": {"width": 5.5, "length": 7.0},
    },
    "bed_king": {
        "id": "bed_king",
        "label": "King bed",
        "mattress": {"width": 6.33, "length": 6.67},
        "with_frame": {"width": 6.83, "length": 7.0},
    },
}

# Largest first — the engine prefers the biggest bed that still earns RECOMMENDED.
BED_ORDER = ["bed_king", "bed_queen"]

CLEARANCES = {
    "walk_side": 2.0,   # what we aim for on a side you walk down
    "min_side": 1.5,    # below this a side stops being a real walkway
    "foot": 2.0,        # space past the foot of the bed
}

# A door sweeps roughly a square of its own width just inside the room.
DEFAULT_DOOR_WIDTH_FT = 3.0

# When a bed cannot clear min_side on both sides, it gets pinned this far off
# the far wall so the entry side keeps one usable walkway instead of two bad ones.
TIGHT_SIDE_GAP = 0.5

OTHER_FURNITURE = {
    "nightstand": {"label": "Nightstand", "width": 1.5, "depth": 1.5},
    "wardrobe": {"label": "Wardrobe (3-door)", "width": 4.5, "depth": 2.0},
    "dresser": {"label": "Dresser", "width": 3.5, "depth": 1.5},
}

WALLS = ("top", "right", "bottom", "left")
