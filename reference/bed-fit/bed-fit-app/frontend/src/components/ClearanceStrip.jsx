import { ftin } from "../lib.js";

/**
 * A drafting dimension string across the headboard wall: what the door swing
 * takes, then the walkway, the bed, and the walkway on the far side. This gap
 * is the whole queen-vs-king decision, so it gets drawn rather than asserted.
 */
const VB_W = 720;
const VB_H = 80;
const PADX = 8;
const BAR_Y = 32;
const BAR_H = 22;
const DIM_Y = 72;

export default function ClearanceStrip({ room, option, clearances }) {
  if (!room || !option) return null;

  const wall = room.headboard_wall;
  const acrossLen = wall === "top" || wall === "bottom" ? room.size_ft.width : room.size_ft.depth;
  const awayLen = wall === "top" || wall === "bottom" ? room.size_ft.depth : room.size_ft.width;

  const minSide = clearances?.min_side ?? 1.5;
  const c = option.clearances_achieved_ft;

  if (!option.box_local_ft) {
    return (
      <div className="dim">
        <div className="dim-head">
          <span className="dim-title">Clearance along the {wall} wall</span>
          <span className="dim-room">{room.label}</span>
        </div>
        <p className="why" style={{ marginTop: 6 }}>{option.notes}</p>
      </div>
    );
  }

  const box = option.box_local_ft;
  const [bedStart, bedEnd] =
    wall === "top" || wall === "bottom" ? [box[0], box[2]] : [box[1], box[3]];
  const bedLen = wall === "top" || wall === "bottom" ? box[3] - box[1] : box[2] - box[0];

  const leadBlocked = Math.max(0, bedStart - (c.side_a ?? 0));
  const tailBlocked = Math.max(0, acrossLen - (bedEnd + (c.side_b ?? 0)));

  const segs = [
    { ft: leadBlocked, kind: "blocked", label: "door swing" },
    { ft: c.side_a ?? 0, kind: (c.side_a ?? 0) >= minSide ? "ok" : "tight", label: option.side_labels?.a },
    { ft: bedEnd - bedStart, kind: "bed", label: option.label },
    { ft: c.side_b ?? 0, kind: (c.side_b ?? 0) >= minSide ? "ok" : "tight", label: option.side_labels?.b },
    { ft: tailBlocked, kind: "blocked", label: "blocked" },
  ].filter((s) => s.ft > 0.01);

  const usable = VB_W - PADX * 2;
  const fill = {
    blocked: "var(--ink-3)",
    ok: "var(--ok)",
    tight: "var(--bad)",
    bed: option.status === "RECOMMENDED" ? "var(--ok)" : "var(--warn)",
  };

  let cursor = PADX;
  const parts = segs.map((s, i) => {
    const w = (s.ft / acrossLen) * usable;
    const x = cursor;
    cursor += w;
    return { ...s, x, w, key: i };
  });

  return (
    <div className="dim">
      <div className="dim-head">
        <span className="dim-title">Clearance along the {wall} wall</span>
        <span className="dim-room">{room.label}</span>
      </div>

      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        role="img"
        aria-label={parts.map((p) => `${p.label}: ${ftin(p.ft)}`).join(", ")}
      >
        {/* overall width dimension line */}
        <path
          d={`M${PADX} 16H${PADX + usable}M${PADX} 11v10M${PADX + usable} 11v10`}
          stroke="var(--ink-3)"
          strokeWidth="1"
          fill="none"
        />
        <rect x={PADX + usable / 2 - 105} y={8} width={210} height={15} fill="var(--surface-2)" />
        <text
          x={PADX + usable / 2}
          y={20}
          fontSize="11"
          fontWeight="600"
          fill="var(--ink-2)"
          textAnchor="middle"
          fontFamily="IBM Plex Mono, monospace"
        >
          {ftin(acrossLen)} along the {wall} wall
        </text>

        {parts.map((p) => (
          <g key={p.key}>
            {p.kind === "bed" ? (
              <>
                <rect
                  x={p.x}
                  y={BAR_Y}
                  width={p.w}
                  height={BAR_H}
                  rx="3"
                  fill={fill.bed}
                  fillOpacity="0.26"
                  stroke={fill.bed}
                  strokeWidth="1.5"
                />
                <rect x={p.x} y={BAR_Y} width={p.w} height="5" fill={fill.bed} />
                {p.w > 56 && (
                  <text
                    x={p.x + p.w / 2}
                    y={BAR_Y + 17}
                    fontSize="11"
                    fontWeight="600"
                    fill="var(--ink)"
                    textAnchor="middle"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {p.label.replace(" bed", "")}
                  </text>
                )}
              </>
            ) : (
              <rect
                x={p.x}
                y={BAR_Y + 7}
                width={p.w}
                height={BAR_H - 14}
                fill={fill[p.kind]}
                fillOpacity={p.kind === "blocked" ? 0.22 : 0.15}
              />
            )}

            {/* extension line + dimension callout */}
            <path
              d={`M${p.x} ${BAR_Y - 6}V${DIM_Y - 14}`}
              stroke="var(--rule-2)"
              strokeWidth="1"
              fill="none"
            />
            {p.w > 30 && (
              <>
                <path
                  d={`M${p.x} ${DIM_Y - 18}H${p.x + p.w}`}
                  stroke="var(--ink-3)"
                  strokeWidth="1"
                  fill="none"
                />
                <text
                  x={p.x + p.w / 2}
                  y={DIM_Y - 4}
                  fontSize="11"
                  fontWeight="600"
                  fill={p.kind === "tight" ? "var(--bad)" : "var(--ink)"}
                  textAnchor="middle"
                  fontFamily="IBM Plex Mono, monospace"
                >
                  {ftin(p.ft)}
                </text>
                {p.w > 76 && p.label && p.kind !== "bed" && (
                  <text
                    x={p.x + p.w / 2}
                    y={DIM_Y + 7}
                    fontSize="9"
                    fill="var(--ink-3)"
                    textAnchor="middle"
                    fontFamily="IBM Plex Mono, monospace"
                  >
                    {p.label}
                  </text>
                )}
              </>
            )}
          </g>
        ))}
        <path
          d={`M${cursor} ${BAR_Y - 6}V${DIM_Y - 14}`}
          stroke="var(--rule-2)"
          strokeWidth="1"
          fill="none"
        />
      </svg>

      <div className="dim-foot">
        <div>
          Room depth<b>{ftin(awayLen)}</b>
        </div>
        <div>
          Bed<b>{`${ftin(bedEnd - bedStart)} × ${ftin(bedLen)}`}</b>
        </div>
        <div>
          Past the foot<b>{ftin(c.foot)}</b>
        </div>
        <div>
          Tightest side
          <b style={{ color: Math.min(c.side_a, c.side_b) < minSide ? "var(--bad)" : undefined }}>
            {ftin(Math.min(c.side_a, c.side_b))}
          </b>
        </div>
      </div>
    </div>
  );
}
