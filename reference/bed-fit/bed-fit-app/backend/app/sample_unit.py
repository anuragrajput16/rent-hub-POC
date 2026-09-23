"""The Unit 101 flat, straight from unit_101_interior_spec.json.

Lets the whole app be driven — engine, drawing, every readout — with no API key
and no upload, and doubles as the fixture the engine is checked against.
"""

UNIT = {
    "id": "UNIT-101",
    "type": "1BHK",
    "overall_size_ft": {"width": 24, "depth": 20},
}

# Boxes are fractions of the plan drawing, which is laid out to the flat's
# 24 x 20 ft envelope, so a room's box is just its bounds over that envelope.
def _box(x0, y0, x1, y1):
    W, D = UNIT["overall_size_ft"]["width"], UNIT["overall_size_ft"]["depth"]
    return {"x": round(x0 / W, 4), "y": round(y0 / D, 4),
            "w": round((x1 - x0) / W, 4), "h": round((y1 - y0) / D, 4)}


BEDROOMS = [
    {
        "id": "bedroom",
        "label": "Bedroom",
        "box": _box(13, 0, 24, 12),
        "room_ft": {"width": 11, "depth": 12},
        "openings": [
            {"type": "door", "role": "entry", "wall": "left",
             "span_ft_local": [0.9, 3.9], "width_ft": 3.0,
             "swing_footprint_local": [0, 0, 3.0, 3.0]},
            {"type": "window", "wall": "right", "span_ft_local": [3.7, 6.8], "width_ft": 3.0},
            {"type": "doorway", "role": "to_balcony", "wall": "bottom",
             "span_ft_local": [4.5, 7.6], "width_ft": 3.1},
        ],
    },
]

# Everything else in the flat — drawn as context so the bedroom sits in a plan,
# not in a void. Not fed to the placement engine.
CONTEXT_ROOMS = [
    {"id": "living_room", "name": "Living room", "bounds_ft": [0, 0, 13, 12], "size": "13′×12′"},
    {"id": "kitchen", "name": "Kitchen", "bounds_ft": [0, 12, 9, 20], "size": "9′×8′"},
    {"id": "bathroom", "name": "Bathroom", "bounds_ft": [9, 12, 15, 20], "size": "6′×8′"},
    {"id": "balcony", "name": "Balcony", "bounds_ft": [15, 12, 24, 20], "size": "9′×8′"},
]

CONTEXT_OPENINGS = [
    {"room": "living_room", "type": "door", "wall": "left", "span_ft": [8.0, 11.0]},
    {"room": "living_room", "type": "window", "wall": "top", "span_ft": [5.0, 8.0]},
    {"room": "living_room", "type": "doorway", "wall": "bottom", "span_ft": [2.3, 5.3]},
    {"room": "living_room", "type": "doorway", "wall": "right", "span_ft": [0.9, 3.9]},
    {"room": "kitchen", "type": "window", "wall": "bottom", "span_ft": [3.0, 6.0]},
    {"room": "bathroom", "type": "door", "wall": "top", "span_ft": [0.8, 3.3]},
]


def sample_payload():
    return {
        "unit": UNIT,
        "context_rooms": CONTEXT_ROOMS,
        "context_openings": CONTEXT_OPENINGS,
        "bedrooms": [dict(b) for b in BEDROOMS],
    }
