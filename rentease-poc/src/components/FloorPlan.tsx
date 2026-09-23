/**
 * Schematic 2D floor plans — the recurring visual motif (BUILD_BRIEF §6).
 * One viewBox (0 0 120 80) per unit type, so the same art scales from a 40px
 * tour thumbnail up to a full-width detail panel.
 */
import type { UnitType } from '../types';

type Tone = 'ink' | 'light' | 'honey';

interface FloorPlanProps {
  type: UnitType;
  /** `light` for use on the dark photo/hero surfaces, `ink` on white. */
  tone?: Tone;
  /** Overlay the planner's suggested furniture blocks. */
  furnished?: boolean;
  /** Hide room labels on very small renditions. */
  labels?: boolean;
  /** Outline one room, in viewBox units: x, y, w, h. */
  highlight?: [number, number, number, number];
  className?: string;
  title?: string;
}

const TONES: Record<Tone, { wall: string; thin: string; label: string }> = {
  ink: { wall: '#1E4634', thin: '#1E4634', label: '#5C6D62' },
  light: { wall: '#EAF2E7', thin: '#CBD8C6', label: '#CBD8C6' },
  honey: { wall: '#CE8A22', thin: '#CE8A22', label: '#F6E7C7' },
};

/** Interior walls + room labels per type. Outer wall is shared. */
const PLANS: Record<UnitType, { walls: string; rooms: Array<[number, number, string]> }> = {
  '1 RK': {
    walls: 'M78 4v72 M78 44h38',
    rooms: [
      [34, 44, 'Room'],
      [97, 28, 'Kit'],
      [97, 64, 'Bath'],
    ],
  },
  '1 BHK': {
    walls: 'M60 4v72 M60 40h56 M96 40v36',
    rooms: [
      [32, 42, 'Hall'],
      [88, 24, 'Bed'],
      [78, 62, 'Kit'],
      [106, 62, 'B'],
    ],
  },
  '2 BHK': {
    walls: 'M44 4v72 M44 40h72 M80 40v36 M80 4v20 M80 24h36',
    rooms: [
      [24, 42, 'Hall'],
      [62, 20, 'Bed'],
      [98, 16, 'Bed'],
      [62, 62, 'Kit'],
      [98, 60, 'Bath'],
    ],
  },
  '3 BHK': {
    walls: 'M40 4v72 M40 28h44 M84 4v72 M40 52h44',
    rooms: [
      [22, 44, 'Hall'],
      [62, 20, 'Bed'],
      [62, 44, 'Bed'],
      [62, 68, 'Kit'],
      [100, 28, 'Bed'],
      [100, 60, 'Bath'],
    ],
  },
};

/** Hardcoded "AI" layouts — beds, tables, sofas dropped into each plan (§9.7). */
const FURNITURE: Record<UnitType, Array<[number, number, number, number, number]>> = {
  // x, y, w, h, opacity
  '1 RK': [
    [10, 12, 30, 22, 0.55],
    [48, 14, 22, 12, 0.35],
    [10, 46, 24, 14, 0.3],
  ],
  '1 BHK': [
    [66, 10, 26, 20, 0.55],
    [10, 12, 34, 20, 0.35],
    [10, 44, 22, 24, 0.3],
    [66, 46, 20, 12, 0.28],
  ],
  '2 BHK': [
    [50, 8, 24, 16, 0.55],
    [86, 6, 24, 14, 0.5],
    [10, 14, 28, 20, 0.35],
    [10, 46, 22, 22, 0.28],
    [50, 46, 22, 12, 0.3],
  ],
  '3 BHK': [
    [46, 8, 30, 16, 0.55],
    [46, 32, 30, 14, 0.5],
    [88, 8, 22, 16, 0.5],
    [8, 14, 26, 20, 0.35],
    [8, 48, 24, 20, 0.28],
  ],
};

export function FloorPlan({
  type,
  tone = 'ink',
  furnished = false,
  labels = true,
  highlight,
  className,
  title,
}: FloorPlanProps) {
  const plan = PLANS[type];
  const c = TONES[tone];
  const accent = tone === 'light' ? '#CE8A22' : '#CE8A22';

  return (
    <svg
      viewBox="0 0 120 80"
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {highlight && (
        <rect
          x={highlight[0]}
          y={highlight[1]}
          width={highlight[2]}
          height={highlight[3]}
          fill="#CE8A22"
          fillOpacity="0.2"
          stroke="#CE8A22"
          strokeWidth="1.6"
        />
      )}
      {furnished &&
        FURNITURE[type].map(([x, y, w, h, o], i) => (
          <rect
            key={i}
            x={x}
            y={y}
            width={w}
            height={h}
            rx="2"
            fill={accent}
            opacity={o}
          />
        ))}
      <rect
        x="4"
        y="4"
        width="112"
        height="72"
        rx="2"
        fill="none"
        stroke={c.wall}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <path d={plan.walls} fill="none" stroke={c.thin} strokeWidth="1.4" />
      {labels &&
        plan.rooms.map(([x, y, text], i) => (
          <text
            key={`${text}-${i}`}
            x={x}
            y={y}
            textAnchor="middle"
            fill={c.label}
            fontSize="9"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
          >
            {text}
          </text>
        ))}
    </svg>
  );
}

export const UNIT_TYPES: UnitType[] = ['1 RK', '1 BHK', '2 BHK', '3 BHK'];
