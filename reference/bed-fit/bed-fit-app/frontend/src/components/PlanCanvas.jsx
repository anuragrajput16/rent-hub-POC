import { useRef, useState } from "react";
import UnitPlan from "./UnitPlan.jsx";
import { BOX_VARS, localToFraction, statusVar, swingRect } from "../lib.js";

const SNAP = 0.018; // snap an edge to a wall face within this fraction of the image

/** The headboard bar sits on whichever wall the engine chose, not always the top. */
function headStyle(wall) {
  const thick = "13%";
  if (wall === "bottom") return { top: "auto", bottom: 0, left: 0, right: 0, height: thick };
  if (wall === "left") return { top: 0, bottom: 0, left: 0, right: "auto", width: thick, height: "auto" };
  if (wall === "right") return { top: 0, bottom: 0, right: 0, left: "auto", width: thick, height: "auto" };
  return { top: 0, left: 0, right: 0, height: thick };
}

function snap(value, lines) {
  if (!lines?.length) return value;
  let best = value;
  let bestGap = SNAP;
  for (const l of lines) {
    const gap = Math.abs(l - value);
    if (gap < bestGap) {
      bestGap = gap;
      best = l;
    }
  }
  return best;
}

/**
 * The plan with everything the engine decided drawn on top of it: each bedroom's
 * box, the door swing it had to work around, the bed, and the nightstands that
 * only appear where a side actually has room for one.
 */
export default function PlanCanvas({
  imageURL,
  sample,
  bedrooms,
  chosen,
  selected,
  onSelect,
  busy,
  walls,
  drawMode,
  onDrawn,
}) {
  const stageRef = useRef(null);
  const [draft, setDraft] = useState(null);

  function pointAt(e) {
    const r = stageRef.current.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)),
      y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)),
    };
  }

  function onDown(e) {
    if (!drawMode) return;
    e.preventDefault();
    stageRef.current.setPointerCapture(e.pointerId);
    const p = pointAt(e);
    setDraft({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  }

  function onMove(e) {
    if (!draft) return;
    const p = pointAt(e);
    setDraft((d) => ({ ...d, x1: p.x, y1: p.y }));
  }

  function onUp() {
    if (!draft) return;
    // snap each edge to the nearest detected wall, then hand it up
    const x0 = snap(Math.min(draft.x0, draft.x1), walls?.x);
    const x1 = snap(Math.max(draft.x0, draft.x1), walls?.x);
    const y0 = snap(Math.min(draft.y0, draft.y1), walls?.y);
    const y1 = snap(Math.max(draft.y0, draft.y1), walls?.y);
    setDraft(null);
    if (x1 - x0 > 0.02 && y1 - y0 > 0.02) {
      onDrawn({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });
    }
  }

  return (
    <div
      className="stage"
      ref={stageRef}
      data-draw={drawMode ? "1" : "0"}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {imageURL ? (
        <img src={imageURL} alt="Uploaded floor plan" />
      ) : (
        <UnitPlan
          unit={sample?.unit}
          rooms={sample?.context_rooms || []}
          openings={sample?.context_openings || []}
          bedrooms={bedrooms}
        />
      )}

      {bedrooms.map((room, i) => {
        const color = `var(${BOX_VARS[i % BOX_VARS.length]})`;
        const active = i === selected;
        const opt = room.options.find((o) => o.bed === (chosen[room.id] || room.recommended));
        const W = room.size_ft.width;
        const D = room.size_ft.depth;

        const bedRect = opt?.box_local_ft ? localToFraction(room, opt.box_local_ft) : null;
        const sc = `var(${statusVar(opt?.status)})`;

        return (
          <div key={room.id}>
            <div
              className="room-box"
              data-active={active ? "1" : "0"}
              style={{
                "--bc": color,
                left: `${room.box.x * 100}%`,
                top: `${room.box.y * 100}%`,
                width: `${room.box.w * 100}%`,
                height: `${room.box.h * 100}%`,
              }}
              onClick={() => onSelect(i)}
              title={`${room.label} — ${W}′ × ${D}′`}
            >
              <span className="room-tag">{i + 1}</span>
            </div>

            {/* door swings the bed had to clear */}
            {active &&
              (room.openings || [])
                .filter((op) => op.type === "door")
                .map((op, k) => {
                  const r = localToFraction(room, swingRect(op, W, D));
                  return r ? (
                    <div
                      key={`sw-${k}`}
                      className="swing"
                      style={{
                        left: `${r.left}%`,
                        top: `${r.top}%`,
                        width: `${r.width}%`,
                        height: `${r.height}%`,
                      }}
                    />
                  ) : null;
                })}

            {/* nightstands */}
            {bedRect &&
              (opt.nightstands || []).map((ns, k) => {
                const r = localToFraction(room, ns);
                return (
                  <div
                    key={`ns-${k}`}
                    className="stand"
                    style={{
                      left: `${r.left}%`,
                      top: `${r.top}%`,
                      width: `${r.width}%`,
                      height: `${r.height}%`,
                    }}
                  />
                );
              })}

            {/* the bed */}
            {bedRect && (
              <div
                className="bed"
                style={{
                  "--sc": sc,
                  left: `${bedRect.left}%`,
                  top: `${bedRect.top}%`,
                  width: `${bedRect.width}%`,
                  height: `${bedRect.height}%`,
                  opacity: active ? 1 : 0.62,
                }}
              >
                <div className="bed-head" style={headStyle(room.headboard_wall)} />
                <span className="bed-label">{opt.label.replace(" bed", "")}</span>
              </div>
            )}
          </div>
        );
      })}

      {/* wall lines found in the image — the things a drawn box snaps to */}
      {drawMode &&
        walls?.x?.map((x, i) => (
          <div key={`gx-${i}`} className="guide guide-v" style={{ left: `${x * 100}%` }} />
        ))}
      {drawMode &&
        walls?.y?.map((y, i) => (
          <div key={`gy-${i}`} className="guide guide-h" style={{ top: `${y * 100}%` }} />
        ))}

      {draft && (
        <div
          className="draft"
          style={{
            left: `${Math.min(draft.x0, draft.x1) * 100}%`,
            top: `${Math.min(draft.y0, draft.y1) * 100}%`,
            width: `${Math.abs(draft.x1 - draft.x0) * 100}%`,
            height: `${Math.abs(draft.y1 - draft.y0) * 100}%`,
          }}
        />
      )}

      {busy && (
        <div className="veil">
          <div className="spinner" />
          <span>Reading the plan…</span>
        </div>
      )}
    </div>
  );
}
