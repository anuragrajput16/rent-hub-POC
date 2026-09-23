import { ftin } from "../lib.js";

const WALLS = ["top", "right", "bottom", "left"];
const KINDS = [
  { v: "", label: "none" },
  { v: "door", label: "door" },
  { v: "doorway", label: "doorway" },
  { v: "window", label: "window" },
];
const WHERE = [
  { v: "start", label: "start" },
  { v: "middle", label: "middle" },
  { v: "end", label: "end" },
];
const OPENING_FT = 3;

/** Turn a wall + position into the span the engine wants. */
export function spanFor(wall, where, W, D) {
  const len = wall === "top" || wall === "bottom" ? W : D;
  const w = Math.min(OPENING_FT, Math.max(1, len - 0.5));
  if (where === "start") return [0.5, 0.5 + w];
  if (where === "end") return [len - 0.5 - w, len - 0.5];
  return [(len - w) / 2, (len + w) / 2];
}

export default function RoomEditor({ room, onChange, onRemove }) {
  if (!room) return null;
  const { width: W, depth: D } = room.room_ft;

  const openingOn = (wall) => room.openings.find((o) => o.wall === wall);

  function setOpening(wall, kind, where) {
    const rest = room.openings.filter((o) => o.wall !== wall);
    if (!kind) return onChange({ ...room, openings: rest });
    const span = spanFor(wall, where, W, D);
    const next = {
      type: kind,
      wall,
      span_ft_local: [Number(span[0].toFixed(2)), Number(span[1].toFixed(2))],
      width_ft: Number((span[1] - span[0]).toFixed(2)),
      where,
    };
    onChange({ ...room, openings: [...rest, next] });
  }

  function setSize(key, value) {
    const n = Math.max(3, Math.min(60, Number(value) || 0));
    const size = { ...room.room_ft, [key]: n };
    // keep every opening's span valid for the new wall lengths
    const openings = room.openings.map((o) => {
      const span = spanFor(o.wall, o.where || "middle", size.width, size.depth);
      return { ...o, span_ft_local: [Number(span[0].toFixed(2)), Number(span[1].toFixed(2))] };
    });
    onChange({ ...room, room_ft: size, openings });
  }

  return (
    <div className="panel pad">
      <div className="pad-title">Bedroom details</div>

      <label className="field">
        <span>Name</span>
        <input
          type="text"
          value={room.label}
          onChange={(e) => onChange({ ...room, label: e.target.value })}
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Width ft</span>
          <input
            type="number"
            step="0.25"
            min="3"
            max="60"
            value={W}
            onChange={(e) => setSize("width", e.target.value)}
          />
        </label>
        <label className="field">
          <span>Depth ft</span>
          <input
            type="number"
            step="0.25"
            min="3"
            max="60"
            value={D}
            onChange={(e) => setSize("depth", e.target.value)}
          />
        </label>
      </div>
      <p className="hint">
        {ftin(W)} × {ftin(D)} — correcting these re-runs the recommendation straight away.
      </p>

      <div className="pad-title" style={{ marginTop: 12 }}>
        Openings on each wall
      </div>
      <p className="hint" style={{ marginTop: -4, marginBottom: 8 }}>
        The headboard goes on a wall with none. A door also sweeps floor the bed
        has to clear.
      </p>

      {WALLS.map((wall) => {
        const op = openingOn(wall);
        return (
          <div className="wall-row" key={wall}>
            <span className="wall-name">{wall}</span>
            <select
              value={op?.type || ""}
              onChange={(e) => setOpening(wall, e.target.value, op?.where || "middle")}
            >
              {KINDS.map((k) => (
                <option key={k.v} value={k.v}>
                  {k.label}
                </option>
              ))}
            </select>
            <select
              value={op?.where || "middle"}
              disabled={!op}
              onChange={(e) => setOpening(wall, op.type, e.target.value)}
            >
              {WHERE.map((k) => (
                <option key={k.v} value={k.v}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
        );
      })}

      <button className="btn" style={{ width: "100%", marginTop: 10 }} onClick={onRemove}>
        Remove this bedroom
      </button>
    </div>
  );
}
