/**
 * The Unit 101 flat drawn from its own spec — 24 × 20 ft at 10 px per foot,
 * so the viewBox IS the envelope and every room box maps straight to a
 * percentage of this drawing.
 */
const PX = 10;

function Opening({ op, ox, oy, W, D }) {
  const wall = op.wall;
  const span = op.span_ft_local || op.span_ft || [0, 3];
  const [a, b] = [Number(span[0]), Number(span[1])];

  // the gap in the wall, in global feet
  let x1, y1, x2, y2;
  if (wall === "top") [x1, y1, x2, y2] = [ox + a, oy, ox + b, oy];
  else if (wall === "bottom") [x1, y1, x2, y2] = [ox + a, oy + D, ox + b, oy + D];
  else if (wall === "left") [x1, y1, x2, y2] = [ox, oy + a, ox, oy + b];
  else [x1, y1, x2, y2] = [ox + W, oy + a, ox + W, oy + b];

  const g = { x1: x1 * PX, y1: y1 * PX, x2: x2 * PX, y2: y2 * PX };

  return (
    <g>
      {/* cut the wall open */}
      <line {...g} stroke="var(--plan-ground)" strokeWidth="5" strokeLinecap="butt" />
      {op.type === "window" && (
        <line {...g} stroke="var(--plan-wall)" strokeWidth="1.4" strokeLinecap="butt" />
      )}
      {op.type === "door" && (
        <line
          {...g}
          stroke="var(--plan-wall)"
          strokeWidth="1"
          strokeDasharray="3 2.5"
          strokeLinecap="butt"
        />
      )}
    </g>
  );
}

function RoomLabel({ x, y, name, size }) {
  return (
    <g fontFamily="IBM Plex Mono, monospace" fill="var(--plan-text)" textAnchor="middle">
      <text x={x} y={y} fontSize="7.5" fontWeight="600">
        {name.toUpperCase()}
      </text>
      {size && (
        <text x={x} y={y + 9} fontSize="6.5">
          {size}
        </text>
      )}
    </g>
  );
}

export default function UnitPlan({ unit, rooms = [], openings = [], bedrooms = [] }) {
  const W = unit?.overall_size_ft?.width ?? 24;
  const D = unit?.overall_size_ft?.depth ?? 20;

  const originOf = (id) => {
    const r = rooms.find((x) => x.id === id);
    return r ? { ox: r.bounds_ft[0], oy: r.bounds_ft[1], W: r.bounds_ft[2] - r.bounds_ft[0], D: r.bounds_ft[3] - r.bounds_ft[1] } : null;
  };

  return (
    <svg
      viewBox={`0 0 ${W * PX} ${D * PX}`}
      role="img"
      aria-label={`Floor plan of ${unit?.id ?? "the unit"}, ${W} by ${D} feet`}
    >
      <rect width={W * PX} height={D * PX} fill="var(--plan-ground)" />

      {/* room floors */}
      {rooms.map((r) => (
        <rect
          key={r.id}
          x={r.bounds_ft[0] * PX}
          y={r.bounds_ft[1] * PX}
          width={(r.bounds_ft[2] - r.bounds_ft[0]) * PX}
          height={(r.bounds_ft[3] - r.bounds_ft[1]) * PX}
          fill="var(--plan-fill)"
        />
      ))}

      {bedrooms.map((b) => (
        <rect
          key={`f-${b.id}`}
          x={b.box.x * W * PX}
          y={b.box.y * D * PX}
          width={b.box.w * W * PX}
          height={b.box.h * D * PX}
          fill="var(--plan-fill)"
        />
      ))}

      {/* partition walls */}
      <g stroke="var(--plan-wall)" fill="none" strokeWidth="2.5">
        {rooms.map((r) => (
          <rect
            key={`w-${r.id}`}
            x={r.bounds_ft[0] * PX}
            y={r.bounds_ft[1] * PX}
            width={(r.bounds_ft[2] - r.bounds_ft[0]) * PX}
            height={(r.bounds_ft[3] - r.bounds_ft[1]) * PX}
          />
        ))}
        {bedrooms.map((b) => {
          const bx = b.box;
          return (
            <rect
              key={`w-${b.id}`}
              x={bx.x * W * PX}
              y={bx.y * D * PX}
              width={bx.w * W * PX}
              height={bx.h * D * PX}
            />
          );
        })}
      </g>

      {/* outer envelope */}
      <rect
        x={1.5}
        y={1.5}
        width={W * PX - 3}
        height={D * PX - 3}
        fill="none"
        stroke="var(--plan-wall)"
        strokeWidth="4"
      />

      {/* openings */}
      {openings.map((op, i) => {
        const o = originOf(op.room);
        return o ? <Opening key={`co-${i}`} op={op} {...o} /> : null;
      })}
      {bedrooms.map((b) =>
        (b.openings || []).map((op, i) => (
          <Opening
            key={`bo-${b.id}-${i}`}
            op={op}
            ox={b.box.x * W}
            oy={b.box.y * D}
            W={b.size_ft.width}
            D={b.size_ft.depth}
          />
        ))
      )}

      {/* labels */}
      {rooms.map((r) => (
        <RoomLabel
          key={`l-${r.id}`}
          x={((r.bounds_ft[0] + r.bounds_ft[2]) / 2) * PX}
          y={((r.bounds_ft[1] + r.bounds_ft[3]) / 2) * PX}
          name={r.name}
          size={r.size}
        />
      ))}
      {bedrooms.map((b) => (
        <RoomLabel
          key={`l-${b.id}`}
          x={(b.box.x + b.box.w / 2) * W * PX}
          y={(b.box.y + b.box.h) * D * PX - 14}
          name={b.label}
          size={`${b.size_ft.width}′×${b.size_ft.depth}′`}
        />
      ))}
    </svg>
  );
}
