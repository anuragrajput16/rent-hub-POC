"""Bed Fit API.

  POST /api/analyze   a floor-plan image  -> bedrooms found + beds placed
  POST /api/place     rooms as JSON       -> beds placed (re-run after an edit)
  GET  /api/sample    the Unit 101 flat, solved, with no API key needed
  GET  /api/catalog   bed sizes and clearance rules
  GET  /api/health    is detection wired up?
"""

import os

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .catalog import BEDS, CLEARANCES, OTHER_FURNITURE, DEFAULT_DOOR_WIDTH_FT
from .detect import DetectionError, detect_bedrooms
from .detect_local import LocalDetectError, detect_walls
from .detect_ocr import detect_bedrooms_ocr
from .placement import plan_all
from .sample_unit import sample_payload

MAX_UPLOAD_BYTES = 20 * 1024 * 1024
ALLOWED_TYPES = {"image/png", "image/jpeg", "image/webp"}

app = FastAPI(title="Bed Fit API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in
                   os.environ.get("BEDFIT_CORS", "http://localhost:5173").split(",")],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------
# schemas
# --------------------------------------------------------------------------

class Box(BaseModel):
    x: float
    y: float
    w: float
    h: float


class SizeFt(BaseModel):
    width: float = Field(gt=0, le=60)
    depth: float = Field(gt=0, le=60)


class Opening(BaseModel):
    type: str
    wall: str
    span_ft_local: list[float] | None = None
    width_ft: float | None = None
    role: str | None = None
    swing_footprint_local: list[float] | None = None


class RoomIn(BaseModel):
    id: str | None = None
    label: str = "Bedroom"
    box: Box | None = None
    room_ft: SizeFt
    openings: list[Opening] = []


class PlaceRequest(BaseModel):
    rooms: list[RoomIn]


# --------------------------------------------------------------------------
# shared upload checks
# --------------------------------------------------------------------------

def _check_upload(file: UploadFile):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            415, f"Upload a PNG, JPG or WebP. That file is {file.content_type or 'unknown'}.")


def _check_bytes(data: bytes):
    if not data:
        raise HTTPException(400, "That file is empty.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "That image is over 20 MB. Try a smaller export.")


# --------------------------------------------------------------------------
# routes
# --------------------------------------------------------------------------

@app.get("/api/health")
def health():
    return {
        "ok": True,
        "detection_available": bool(os.environ.get("ANTHROPIC_API_KEY")),
        "model": os.environ.get("BEDFIT_MODEL", "claude-sonnet-5"),
    }


@app.get("/api/catalog")
def catalog():
    return {
        "beds": BEDS,
        "clearances_ft": CLEARANCES,
        "door_swing_ft": DEFAULT_DOOR_WIDTH_FT,
        "other_furniture": OTHER_FURNITURE,
    }


@app.get("/api/sample")
def sample():
    """The Unit 101 flat, solved. Works with no API key."""
    payload = sample_payload()
    return {
        "source": "unit_101_interior_spec.json",
        "unit": payload["unit"],
        "context_rooms": payload["context_rooms"],
        "context_openings": payload["context_openings"],
        "bedrooms": plan_all(payload["bedrooms"]),
    }


@app.post("/api/place")
def place(req: PlaceRequest):
    """Re-run placement on rooms the user has edited. No model call."""
    rooms = [r.model_dump(exclude_none=True) for r in req.rooms]
    if not rooms:
        raise HTTPException(400, "Send at least one room.")
    return {"bedrooms": plan_all(rooms)}


@app.post("/api/read")
async def read_plan(
    file: UploadFile = File(...),
    plan_width_ft: float | None = Form(None),
):
    """Read a plan locally — OCR for the room names, pixels for the walls.

    No API key. Returns a bed placed in every bedroom found, and says per room
    where each number came from and whether it wants checking, so a shaky read
    shows up as a flag instead of a confident wrong answer.
    """
    _check_upload(file)
    data = await file.read()
    _check_bytes(data)
    try:
        out = detect_bedrooms_ocr(data, plan_width_ft=plan_width_ft)
    except LocalDetectError as exc:
        raise HTTPException(422, str(exc)) from exc

    return {
        "source": file.filename,
        "scale": out["scale"],
        "image_px": out["image_px"],
        "bedrooms": [
            {**solved, "read": raw["read"]}
            for solved, raw in zip(plan_all(out["bedrooms"]), out["bedrooms"])
        ],
    }


@app.post("/api/walls")
async def walls(
    file: UploadFile = File(...),
    plan_width_ft: float | None = Form(None),
    plan_depth_ft: float | None = Form(None),
):
    """Wall lines straight from the pixels — no API key, no model call.

    The UI snaps a hand-drawn box to these, which gets exact room rectangles
    out of a plan without anything reading the drawing for you.
    """
    _check_upload(file)
    data = await file.read()
    _check_bytes(data)
    try:
        return detect_walls(data, plan_width_ft=plan_width_ft, plan_depth_ft=plan_depth_ft)
    except LocalDetectError as exc:
        raise HTTPException(422, str(exc)) from exc


@app.post("/api/analyze")
async def analyze(file: UploadFile = File(...)):
    """Read a plan image, then place a bed in every bedroom found."""
    _check_upload(file)
    data = await file.read()
    _check_bytes(data)

    try:
        rooms = detect_bedrooms(data, media_type=file.content_type)
    except DetectionError as exc:
        # These messages are written to be shown to the user as-is.
        raise HTTPException(502, str(exc)) from exc

    return {"source": file.filename, "bedrooms": plan_all(rooms)}
