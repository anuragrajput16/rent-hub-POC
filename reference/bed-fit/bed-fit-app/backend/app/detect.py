"""Read bedrooms out of a 2D floor-plan image with Claude vision.

Returns the room list the placement engine expects: a box in image fractions,
a real size in feet, and the openings on each wall — the openings are what let
the engine pick a headboard wall instead of always assuming the top one.
"""

import base64
import json
import os

MODEL = os.environ.get("BEDFIT_MODEL", "claude-sonnet-5")
MAX_TOKENS = 3000

PROMPT = """This is a 2D floor plan. Find EVERY bedroom (labels like 'Bed Room',
'Master Bedroom', 'BR'); exclude living/hall, kitchen, bathroom, balcony, utility.

For each bedroom give:
- "label": the room's name as printed.
- "box": a rectangle of ONLY its inside floor area, bounded by its own walls —
  not wall thickness, adjacent rooms, image margins, or labels outside the walls.
  Coordinates are fractions of the FULL image (x,y top-left, w,h size, 0..1).
  Keep each box fully inside the plan.
- "room_ft": width and depth in feet. Read the printed dimensions inside the room
  if there are any; otherwise estimate from the plan's scale. "width" runs along
  the box's w, "depth" along its h.
- "openings": every door, doorway and window on that room's own walls. For each:
    "type": "door" (a hinged door, drawn with a swing arc), "doorway" (an opening
            with no door leaf) or "window".
    "wall": which of the room's four walls it sits on — "top", "right", "bottom"
            or "left", as seen in the image.
    "span_ft_local": [start, end] in FEET along that wall, measured from the
            room's top-left interior corner. Along the top and bottom walls
            measure left to right; along the left and right walls measure top to
            bottom.
    "width_ft": the opening's width in feet.
    "role": short description if clear, e.g. "entry", "to_balcony". Optional.

Openings matter: the headboard must not go on a wall carrying a door or a window,
so list them carefully. If you genuinely cannot tell, return an empty list.

Reply with only this JSON:
{"bedrooms":[{"label":"str","box":{"x":0,"y":0,"w":0,"h":0},
"room_ft":{"width":0,"depth":0},
"openings":[{"type":"door","wall":"left","span_ft_local":[0,3],"width_ft":3,"role":"entry"}]}]}"""

VALID_WALLS = {"top", "right", "bottom", "left"}
VALID_TYPES = {"door", "doorway", "window"}


class DetectionError(Exception):
    """Raised with a message meant for the person looking at the screen."""


def _clamp(v, lo, hi, default=None):
    try:
        n = float(v)
    except (TypeError, ValueError):
        if default is None:
            raise
        n = default
    return max(lo, min(hi, n))


def _extract_json(text):
    """Take the outermost JSON object, tolerating any stray prose around it."""
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end <= start:
        raise DetectionError("The model did not return JSON.")
    return json.loads(text[start:end + 1])


def _clean_openings(raw, W, D):
    out = []
    for o in raw or []:
        if not isinstance(o, dict):
            continue
        kind = str(o.get("type", "")).lower()
        wall = str(o.get("wall", "")).lower()
        if kind not in VALID_TYPES or wall not in VALID_WALLS:
            continue

        wall_len = W if wall in ("top", "bottom") else D
        span = o.get("span_ft_local") or o.get("span_ft") or []
        try:
            a, b = float(span[0]), float(span[1])
        except (TypeError, ValueError, IndexError):
            continue
        a, b = sorted((a, b))
        a, b = _clamp(a, 0, wall_len), _clamp(b, 0, wall_len)
        if b - a < 0.5:
            continue

        item = {"type": kind, "wall": wall, "span_ft_local": [round(a, 2), round(b, 2)],
                "width_ft": round(_clamp(o.get("width_ft", b - a), 0.5, wall_len, b - a), 2)}
        if o.get("role"):
            item["role"] = str(o["role"])[:40]
        out.append(item)
    return out


def normalize(payload):
    """Validate and clamp whatever came back into engine-ready rooms."""
    rooms = []
    for i, b in enumerate(payload.get("bedrooms") or []):
        if not isinstance(b, dict):
            continue
        raw_box = b.get("box") or {}
        x = _clamp(raw_box.get("x", 0), 0, 0.98, 0)
        y = _clamp(raw_box.get("y", 0), 0, 0.98, 0)
        w = _clamp(raw_box.get("w", 0.2), 0.02, 1 - x, 0.2)
        h = _clamp(raw_box.get("h", 0.2), 0.02, 1 - y, 0.2)

        size = b.get("room_ft") or {}
        W = _clamp(size.get("width", 10), 3, 60, 10)
        D = _clamp(size.get("depth", 10), 3, 60, 10)

        rooms.append({
            "id": f"bedroom_{i + 1}",
            "label": str(b.get("label") or f"Bedroom {i + 1}")[:48],
            "box": {"x": round(x, 4), "y": round(y, 4), "w": round(w, 4), "h": round(h, 4)},
            "room_ft": {"width": round(W, 2), "depth": round(D, 2)},
            "openings": _clean_openings(b.get("openings"), W, D),
        })

    if not rooms:
        raise DetectionError(
            "No bedrooms came back. Try a clearer plan, ideally one with the "
            "room sizes printed inside each room."
        )
    return rooms


def detect_bedrooms(image_bytes, media_type="image/png", api_key=None):
    """Send the plan to Claude and return cleaned rooms."""
    key = api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        raise DetectionError(
            "ANTHROPIC_API_KEY is not set on the server, so plans cannot be read "
            "automatically. Load the Unit 101 sample to try the placement engine."
        )

    try:
        from anthropic import Anthropic
    except ImportError as exc:
        raise DetectionError("The anthropic package is not installed on the server.") from exc

    client = Anthropic(api_key=key)
    b64 = base64.standard_b64encode(image_bytes).decode()

    try:
        msg = client.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image",
                     "source": {"type": "base64", "media_type": media_type, "data": b64}},
                    {"type": "text", "text": PROMPT},
                ],
            }],
        )
    except Exception as exc:
        raise DetectionError(f"The vision request failed: {exc}") from exc

    text = "".join(block.text for block in msg.content if block.type == "text")
    try:
        payload = _extract_json(text)
    except json.JSONDecodeError as exc:
        raise DetectionError("The model's reply was not valid JSON. Try again.") from exc

    return normalize(payload)
