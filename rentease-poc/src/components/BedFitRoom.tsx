/**
 * One bedroom drawn to scale with a bed placed in it — the layout planner's
 * answer to "which bed, and where". The walkway on each side and past the foot
 * is drawn as a dimension line, because that gap is the whole king-vs-queen
 * decision, so it gets shown rather than asserted.
 */
import type { SVGProps } from 'react';
import { BEDS, CLEARANCES, axes } from '../lib/bedfit';
import type { BedOption, BedroomPlan, Opening, Rect, Wall } from '../lib/bedfit';
import { ftin } from '../lib/format';

const PX = 24;
const PAD = 26;

const C = {
  floor: '#EAF1EA',
  wall: '#1E4634',
  cut: '#FFFFFF',
  label: '#5C6D62',
  bed: '#F6E7C7',
  bedLine: '#CE8A22',
  ok: '#1E4634',
  tight: '#B15A2B',
};

const X = (ft: number) => PAD + ft * PX;
const Y = (ft: number) => PAD + ft * PX;

/** The rect covering `across` s..s+len and `away` a0..a1 off `wall`, in room feet. */
function band(wall: Wall, s: number, len: number, a0: number, a1: number, W: number, D: number): Rect {
  const e = s + len;
  if (wall === 'top') return [s, a0, e, a1];
  if (wall === 'bottom') return [s, D - a1, e, D - a0];
  if (wall === 'left') return [a0, s, a1, e];
  return [W - a1, s, W - a0, e];
}

/** A point on `wall` at distance t along it, pushed `inset` ft into the room. */
function onWall(wall: Wall, t: number, inset: number, W: number, D: number): [number, number] {
  if (wall === 'top') return [t, inset];
  if (wall === 'bottom') return [t, D - inset];
  if (wall === 'left') return [inset, t];
  return [W - inset, t];
}

function Box({ at: r, ...rest }: { at: Rect } & SVGProps<SVGRectElement>) {
  return <rect x={X(r[0])} y={Y(r[1])} width={(r[2] - r[0]) * PX} height={(r[3] - r[1]) * PX} {...rest} />;
}

function OpeningMark({ op, W, D }: { op: Opening; W: number; D: number }) {
  const [a, b] = op.span;
  const [x1, y1] = onWall(op.wall, a, 0, W, D);
  const [x2, y2] = onWall(op.wall, b, 0, W, D);
  const line = { x1: X(x1), y1: Y(y1), x2: X(x2), y2: Y(y2) };

  // Label sits outside the wall, turned to run along the side walls.
  const [lx, ly] = onWall(op.wall, (a + b) / 2, -0.55, W, D);
  const side = op.wall === 'left' || op.wall === 'right';

  let swing = null;
  if (op.type === 'door') {
    const d = b - a;
    const [hx, hy] = onWall(op.wall, a, 0, W, D);
    const [tx, ty] = onWall(op.wall, a, d, W, D);
    // Arc from the open leaf back to the closed position, turning about the hinge.
    const cross = (tx - hx) * (y2 - hy) - (ty - hy) * (x2 - hx);
    const r = d * PX;
    const path = `M${X(hx)} ${Y(hy)} L${X(tx)} ${Y(ty)} A${r} ${r} 0 0 ${cross > 0 ? 1 : 0} ${X(x2)} ${Y(y2)} Z`;
    swing = <path d={path} fill={C.wall} fillOpacity="0.06" stroke={C.wall} strokeWidth="1.2" strokeDasharray="4 3" />;
  }

  return (
    <g>
      <line {...line} stroke={C.cut} strokeWidth="8" />
      {op.type === 'window' && <line {...line} stroke={C.wall} strokeWidth="1.6" />}
      {swing}
      <text
        x={X(lx)}
        y={Y(ly)}
        transform={side ? `rotate(-90 ${X(lx)} ${Y(ly)})` : undefined}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fontWeight="600"
        fill={C.label}
      >
        {op.type === 'door' ? 'Door' : op.type === 'window' ? 'Window' : 'Opening'}
      </text>
    </g>
  );
}

function Dim({ r, value, tight, W, D }: { r: Rect; value: number; tight: boolean; W: number; D: number }) {
  if (value < 0.05) return null;
  const color = tight ? C.tight : C.ok;
  const [x1, y1, x2, y2] = [X(r[0]), Y(r[1]), X(r[2]), Y(r[3])];
  // A 0′6″ gap is narrower than its own label; keep the label off the wall.
  const tx = Math.min(Math.max((x1 + x2) / 2, X(0) + 20), X(W) - 20);
  const ty = Math.min(Math.max((y1 + y2) / 2 - 5, Y(0) + 15), Y(D) - 6);
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="1.4" />
      <circle cx={x1} cy={y1} r="2.2" fill={color} />
      <circle cx={x2} cy={y2} r="2.2" fill={color} />
      <text
        x={tx}
        y={ty}
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill={color}
        stroke={C.floor}
        strokeWidth="4"
        paintOrder="stroke"
      >
        {ftin(value)}
      </text>
    </g>
  );
}

export function BedFitRoom({
  plan,
  option,
  className,
}: {
  plan: BedroomPlan;
  option: BedOption;
  className?: string;
}) {
  const { room, headboard: wall } = plan;
  const { width: W, depth: D } = room;
  const [, awayLen] = axes(wall, W, D);
  const bed = BEDS[option.bed];

  let bedArt = null;
  if (option.box) {
    const b = option.box;
    const start = wall === 'top' || wall === 'bottom' ? b[0] : b[1];
    const pillow = (bed.width - 0.9) / 2;
    const mid = band(wall, start + bed.width / 2, 0, bed.length * 0.55, bed.length * 0.55, W, D);
    const [cx, cy] = [(X(mid[0]) + X(mid[2])) / 2, (Y(mid[1]) + Y(mid[3])) / 2];
    const sideAt = bed.length * 0.72;

    bedArt = (
      <g>
        {option.nightstands.map((n, i) => (
          <Box key={i} at={n} rx="3" fill={C.cut} stroke={C.label} strokeWidth="1.2" />
        ))}
        <Box at={b} rx="5" fill={C.bed} stroke={C.bedLine} strokeWidth="2" />
        <Box at={band(wall, start, bed.width, 0, 0.35, W, D)} fill={C.bedLine} />
        <Box at={band(wall, start + 0.3, pillow, 0.55, 1.45, W, D)} rx="4" fill={C.cut} stroke={C.bedLine} strokeWidth="1.2" />
        <Box at={band(wall, start + 0.6 + pillow, pillow, 0.55, 1.45, W, D)} rx="4" fill={C.cut} stroke={C.bedLine} strokeWidth="1.2" />
        <Box at={band(wall, start, bed.width, 2.1, bed.length, W, D)} rx="4" fill={C.bedLine} fillOpacity="0.16" />
        <text x={cx} y={cy + 4} textAnchor="middle" fontSize="12.5" fontWeight="700" fill={C.wall}>
          {bed.label}
        </text>
        <text x={cx} y={cy + 19} textAnchor="middle" fontSize="10" fill={C.label}>
          {ftin(bed.width)} × {ftin(bed.length)}
        </text>

        <Dim
          r={band(wall, start - (option.sideA ?? 0), option.sideA ?? 0, sideAt, sideAt, W, D)}
          value={option.sideA ?? 0}
          tight={(option.sideA ?? 0) < CLEARANCES.minSide}
          W={W}
          D={D}
        />
        <Dim
          r={band(wall, start + bed.width, option.sideB ?? 0, sideAt, sideAt, W, D)}
          value={option.sideB ?? 0}
          tight={(option.sideB ?? 0) < CLEARANCES.minSide}
          W={W}
          D={D}
        />
        <Dim
          r={band(wall, start + bed.width * 0.78, 0, bed.length, awayLen, W, D)}
          value={option.foot}
          tight={option.foot < CLEARANCES.foot}
          W={W}
          D={D}
        />
      </g>
    );
  }

  const label = option.box
    ? `${room.label}, ${ftin(W)} by ${ftin(D)}. ${bed.label} bed with its headboard on the ${wall} wall, ${ftin(option.sideA ?? 0)} and ${ftin(option.sideB ?? 0)} to either side and ${ftin(option.foot)} past the foot.`
    : `${room.label}, ${ftin(W)} by ${ftin(D)}. A ${bed.label.toLowerCase()} bed does not fit.`;

  return (
    <svg viewBox={`0 0 ${W * PX + PAD * 2} ${D * PX + PAD * 2}`} className={className} role="img" aria-label={label}>
      <rect x={X(0)} y={Y(0)} width={W * PX} height={D * PX} fill={C.floor} />
      {bedArt}
      <rect x={X(0)} y={Y(0)} width={W * PX} height={D * PX} fill="none" stroke={C.wall} strokeWidth="6" />
      {room.openings.map((op, i) => (
        <OpeningMark key={i} op={op} W={W} D={D} />
      ))}
      {!option.box && (
        <text x={X(W / 2)} y={Y(D / 2)} textAnchor="middle" fontSize="13" fontWeight="700" fill={C.tight}>
          A {bed.label.toLowerCase()} bed does not fit
        </text>
      )}
    </svg>
  );
}
