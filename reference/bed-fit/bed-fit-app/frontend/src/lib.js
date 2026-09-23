export const BOX_VARS = ["--box1", "--box2", "--box3", "--box4"];

/** 13.33 -> 13′4″ — the unit this whole tool thinks in. */
export function ftin(v) {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  const neg = v < 0;
  const inches = Math.round(Math.abs(v) * 12);
  const f = Math.floor(inches / 12);
  const i = inches % 12;
  return `${neg ? "-" : ""}${f}′${i}″`;
}

/** A room-local footprint in feet -> a fraction of the whole plan image. */
export function localToFraction(room, boxLocalFt) {
  if (!room?.box || !boxLocalFt) return null;
  const [x0, y0, x1, y1] = boxLocalFt;
  const { width: W, depth: D } = room.size_ft;
  const b = room.box;
  return {
    left: (b.x + (x0 / W) * b.w) * 100,
    top: (b.y + (y0 / D) * b.h) * 100,
    width: ((x1 - x0) / W) * b.w * 100,
    height: ((y1 - y0) / D) * b.h * 100,
  };
}

/** The floor a door sweeps, in room-local feet — mirrors placement.swing_rect. */
export function swingRect(op, W, D) {
  if (op.swing_footprint_local?.length === 4) return op.swing_footprint_local.map(Number);
  const span = op.span_ft_local || op.span_ft || [0, 3];
  const [a, b] = [Number(span[0]), Number(span[1])];
  const d = Number(op.width_ft || 3);
  if (op.wall === "left") return [0, a, d, b];
  if (op.wall === "right") return [W - d, a, W, b];
  if (op.wall === "top") return [a, 0, b, d];
  return [a, D - d, b, D];
}

export const STATUS_LABEL = {
  RECOMMENDED: "recommended",
  FITS_WITH_CAVEAT: "fits with caveat",
  DOES_NOT_FIT: "does not fit",
};

export function statusVar(status) {
  if (status === "RECOMMENDED") return "--ok";
  if (status === "FITS_WITH_CAVEAT") return "--warn";
  return "--bad";
}
