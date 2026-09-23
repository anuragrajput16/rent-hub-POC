/**
 * Schematic decoration scenes — the same drafting language as FloorPlan and
 * ProductArt, so the Decoration tab sits in the app's visual world instead of
 * borrowing stock photography. Each scene draws a wall or a doorway and the
 * arrangement on it; `accent` is the festival's colour.
 */
import type { ReactNode } from 'react';

const INK = '#1E4634';
const line = { stroke: INK, fill: 'none', strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };

/** Room shell for wall scenes: back wall, floor band, skirting. */
function WallShell({ children, accent }: { children: ReactNode; accent: string }) {
  return (
    <>
      <rect x="14" y="12" width="292" height="150" rx="3" fill="#FFFFFF" />
      <rect x="14" y="12" width="292" height="150" rx="3" {...line} strokeWidth={2} />
      <rect x="14" y="150" width="292" height="12" fill={accent} opacity={0.12} />
      <path d="M14 150h292" {...line} strokeWidth={1.6} />
      <path d="M14 162h292" {...line} strokeWidth={2} />
      {children}
    </>
  );
}

/** Doorway shell: architrave, leaf, handle, threshold. */
function DoorShell({ children, accent }: { children: ReactNode; accent: string }) {
  return (
    <>
      <rect x="86" y="20" width="148" height="142" rx="2" fill={accent} opacity={0.08} />
      <rect x="86" y="20" width="148" height="142" rx="2" {...line} strokeWidth={2} />
      <rect x="98" y="30" width="124" height="132" rx="1.5" fill="#FFFFFF" />
      <rect x="98" y="30" width="124" height="132" rx="1.5" {...line} strokeWidth={1.8} />
      <rect x="110" y="44" width="100" height="46" rx="1.5" {...line} strokeWidth={1.1} opacity={0.45} />
      <rect x="110" y="102" width="100" height="46" rx="1.5" {...line} strokeWidth={1.1} opacity={0.45} />
      <circle cx="208" cy="96" r="3.4" fill={INK} />
      <path d="M20 162h280" {...line} strokeWidth={2} />
      {children}
    </>
  );
}

/** A row of lit diyas along a baseline. */
function Diyas({ y, xs, accent }: { y: number; xs: number[]; accent: string }) {
  return (
    <g>
      {xs.map((x) => (
        <g key={x}>
          <path d={`M${x - 9} ${y}c0 6 4 9 9 9s9-3 9-9Z`} fill={accent} opacity={0.35} />
          <path d={`M${x - 9} ${y}c0 6 4 9 9 9s9-3 9-9`} {...line} strokeWidth={1.5} />
          <path d={`M${x - 11} ${y}h22`} {...line} strokeWidth={1.5} />
          <path d={`M${x} ${y - 3}c0-4-4-5-2-9 3 2 6 4 6 7a4 4 0 0 1-4 4 3 3 0 0 1-3-3c0-1.5 1.5-2 3 1Z`} fill="#CE8A22" />
        </g>
      ))}
    </g>
  );
}

/** Hanging string with beads, drawn as swags between two x positions. */
function Toran({ y, accent, leaf }: { y: number; accent: string; leaf?: boolean }) {
  const xs = [104, 128, 152, 176, 200, 216];
  return (
    <g>
      <path d={`M96 ${y}h128`} {...line} strokeWidth={1.6} />
      {xs.map((x, i) => {
        const drop = 14 + (i % 2 === 0 ? 8 : 0);
        return leaf ? (
          <path
            key={x}
            d={`M${x} ${y}c-5 ${drop / 2} -5 ${drop} 0 ${drop}c5 0 5 ${-drop / 2} 0 ${-drop}Z`}
            fill={accent}
            opacity={0.4}
            stroke={INK}
            strokeWidth={1.1}
          />
        ) : (
          <g key={x}>
            <path d={`M${x} ${y}v${drop - 6}`} {...line} strokeWidth={1.1} />
            <circle cx={x} cy={y + drop - 2} r={5} fill="#CE8A22" opacity={0.75} />
            <circle cx={x} cy={y + drop - 2} r={5} {...line} strokeWidth={1} />
          </g>
        );
      })}
    </g>
  );
}

/** Rangoli on the floor, drawn in perspective as an ellipse. */
function Rangoli({ cx, cy, accent }: { cx: number; cy: number; accent: string }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx="52" ry="14" fill={accent} opacity={0.18} />
      <ellipse cx={cx} cy={cy} rx="52" ry="14" {...line} strokeWidth={1.4} />
      <ellipse cx={cx} cy={cy} rx="30" ry="8" {...line} strokeWidth={1.1} opacity={0.7} />
      <ellipse cx={cx} cy={cy} rx="12" ry="3.4" fill="#CE8A22" opacity={0.6} />
      <path d={`M${cx - 52} ${cy}h104M${cx} ${cy - 14}v28`} {...line} strokeWidth={0.9} opacity={0.45} />
    </g>
  );
}

/** Fairy-light string with bulbs, following a shallow swag. */
function Lights({ d, at, accent }: { d: string; at: [number, number][]; accent: string }) {
  return (
    <g>
      <path d={d} {...line} strokeWidth={1.2} opacity={0.65} />
      {at.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle cx={x} cy={y} r="6" fill={accent} opacity={0.22} />
          <circle cx={x} cy={y} r="3" fill="#CE8A22" />
        </g>
      ))}
    </g>
  );
}

const SCENES: Record<string, (accent: string) => ReactNode> = {
  /* ------------------------------- walls ------------------------------- */
  'diya-wall': (a) => (
    <WallShell accent={a}>
      <Lights
        d="M40 42c40 22 80 22 120 0s80-22 120 0"
        at={[[40, 42], [90, 52], [140, 52], [190, 42], [240, 42], [280, 42]]}
        accent={a}
      />
      <rect x="70" y="96" width="180" height="7" rx="2" fill={a} opacity={0.25} />
      <rect x="70" y="96" width="180" height="7" rx="2" {...line} strokeWidth={1.6} />
      <path d="M86 103v8M234 103v8" {...line} strokeWidth={1.3} />
      <Diyas y={88} xs={[100, 130, 160, 190, 220]} accent={a} />
      <Rangoli cx={160} cy={140} accent={a} />
    </WallShell>
  ),
  'mirror-wall': (a) => (
    <WallShell accent={a}>
      <path d="M52 26h216" {...line} strokeWidth={2} />
      <rect x="70" y="26" width="180" height="124" fill={a} opacity={0.15} />
      <rect x="70" y="26" width="180" height="124" {...line} strokeWidth={1.6} />
      <path d="M100 26c6 40-6 82 0 124M160 26c-6 40 6 82 0 124M220 26c6 40-6 82 0 124" {...line} strokeWidth={1} opacity={0.5} />
      <g>
        {[[130, 62], [160, 50], [190, 62], [130, 106], [190, 106], [160, 118]].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <circle cx={x} cy={y} r="11" fill="#CE8A22" opacity={0.3} />
            <circle cx={x} cy={y} r="11" {...line} strokeWidth={1.3} />
            <circle cx={x} cy={y} r="5" {...line} strokeWidth={1} opacity={0.7} />
          </g>
        ))}
        <circle cx="160" cy="84" r="17" fill="#CE8A22" opacity={0.35} />
        <circle cx="160" cy="84" r="17" {...line} strokeWidth={1.5} />
      </g>
    </WallShell>
  ),
  'idol-corner': (a) => (
    <WallShell accent={a}>
      <rect x="92" y="24" width="136" height="98" fill={a} opacity={0.15} />
      <rect x="92" y="24" width="136" height="98" {...line} strokeWidth={1.6} />
      <path d="M118 24c5 32-5 66 0 98M160 24c-5 32 5 66 0 98M202 24c5 32-5 66 0 98" {...line} strokeWidth={1} opacity={0.45} />
      <path d="M132 96c0-16 12-28 28-28s28 12 28 28Z" fill="#CE8A22" opacity={0.4} />
      <path d="M132 96c0-16 12-28 28-28s28 12 28 28" {...line} strokeWidth={1.6} />
      <rect x="112" y="122" width="96" height="20" rx="2" fill={a} opacity={0.22} />
      <rect x="112" y="122" width="96" height="20" rx="2" {...line} strokeWidth={1.6} />
      <path d="M112 142v8M208 142v8" {...line} strokeWidth={1.3} />
      <Lights d="M92 24h136" at={[[104, 34], [132, 38], [160, 34], [188, 38], [216, 34]]} accent={a} />
      <Diyas y={118} xs={[132, 188]} accent={a} />
    </WallShell>
  ),
  'colour-wall': (a) => (
    <WallShell accent={a}>
      <rect x="34" y="26" width="252" height="120" fill="#5C6D62" opacity={0.1} />
      <rect x="34" y="26" width="252" height="120" {...line} strokeWidth={1.3} strokeDasharray="6 5" />
      <path d="M34 48c42 22 84 22 126 0s84-22 126 0" {...line} strokeWidth={1.4} />
      <path d="M34 84c42 22 84 22 126 0s84-22 126 0" {...line} strokeWidth={1.4} />
      {[[60, 60], [96, 68], [132, 68], [168, 60], [204, 56], [240, 60], [78, 96], [114, 104], [150, 104], [186, 96], [222, 92], [258, 96]].map(
        ([x, y], i) => (
          <path
            key={`${x}-${y}`}
            d={`M${x} ${y}l9 20l9 -20z`}
            fill={[a, '#CE8A22', '#C2402A', '#2E7D6B'][i % 4]}
            opacity={0.55}
            stroke={INK}
            strokeWidth={1.1}
          />
        ),
      )}
    </WallShell>
  ),
  'lantern-wall': (a) => (
    <WallShell accent={a}>
      <path d="M96 42a34 34 0 1 0 30 46 27 27 0 0 1-30-46Z" fill="#CE8A22" opacity={0.3} />
      <path d="M96 42a34 34 0 1 0 30 46 27 27 0 0 1-30-46Z" {...line} strokeWidth={1.6} />
      {[[150, 8], [190, 20], [222, 4]].map(([x, y]) => (
        <path key={x} d={`M${x} ${34 + y}l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z`} fill="#CE8A22" opacity={0.75} />
      ))}
      {[[176, 48, 42], [212, 40, 54], [248, 56, 34]].map(([x, y, h]) => (
        <g key={x}>
          <path d={`M${x} 20v${y - 20}`} {...line} strokeWidth={1.1} />
          <path d={`M${x - 13} ${y}h26l-4 ${h}h-18Z`} fill={a} opacity={0.28} />
          <path d={`M${x - 13} ${y}h26l-4 ${h}h-18Z`} {...line} strokeWidth={1.5} />
          <path d={`M${x - 9} ${y - 6}h18v6h-18Z`} {...line} strokeWidth={1.3} />
          <rect x={x - 5} y={y + 8} width="10" height={h - 16} rx="2" fill="#CE8A22" opacity={0.55} />
        </g>
      ))}
    </WallShell>
  ),
  'lights-wall': (a) => (
    <WallShell accent={a}>
      <path d="M160 26 96 146M160 26l64 120" {...line} strokeWidth={1.3} opacity={0.5} />
      {[46, 66, 86, 106, 126, 146].map((y, row) => {
        const half = ((y - 26) / 120) * 62;
        const bulbs = row + 2;
        return (
          <g key={y}>
            <path d={`M${160 - half} ${y}h${half * 2}`} {...line} strokeWidth={1} opacity={0.55} />
            {Array.from({ length: bulbs }).map((_, i) => {
              const x = 160 - half + (half * 2 * i) / Math.max(1, bulbs - 1);
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="5.5" fill={a} opacity={0.2} />
                  <circle cx={x} cy={y} r="2.8" fill="#CE8A22" />
                </g>
              );
            })}
          </g>
        );
      })}
      <path d="M160 18l4 9 9 1-6.5 6.5 1.5 9-8-4.5-8 4.5 1.5-9L147 28l9-1z" fill="#CE8A22" />
      <rect x="132" y="132" width="24" height="18" rx="2" fill={a} opacity={0.3} />
      <rect x="132" y="132" width="24" height="18" rx="2" {...line} strokeWidth={1.4} />
      <rect x="162" y="138" width="20" height="12" rx="2" fill="#CE8A22" opacity={0.35} />
      <rect x="162" y="138" width="20" height="12" rx="2" {...line} strokeWidth={1.4} />
    </WallShell>
  ),
  'decal-wall': (a) => (
    <WallShell accent={a}>
      {[[70, 46], [122, 38], [174, 50], [226, 40], [96, 92], [148, 84], [200, 96], [252, 86], [70, 128], [122, 122]].map(
        ([x, y], i) =>
          i % 3 === 0 ? (
            <g key={`${x}-${y}`}>
              <circle cx={x} cy={y} r="13" fill={a} opacity={0.25} />
              <circle cx={x} cy={y} r="13" {...line} strokeWidth={1.4} />
            </g>
          ) : i % 3 === 1 ? (
            <g key={`${x}-${y}`}>
              <rect x={x - 11} y={y - 11} width="22" height="22" rx="3" fill="#CE8A22" opacity={0.28} />
              <rect x={x - 11} y={y - 11} width="22" height="22" rx="3" {...line} strokeWidth={1.4} />
            </g>
          ) : (
            <path
              key={`${x}-${y}`}
              d={`M${x} ${y - 13}l13 13-13 13-13-13z`}
              fill={a}
              opacity={0.2}
              stroke={INK}
              strokeWidth={1.4}
            />
          ),
      )}
    </WallShell>
  ),

  /* ------------------------------- doors ------------------------------- */
  'toran-door': (a) => (
    <DoorShell accent={a}>
      <Toran y={34} accent={a} />
      <Rangoli cx={160} cy={172} accent={a} />
      <Diyas y={166} xs={[62, 258]} accent={a} />
    </DoorShell>
  ),
  'leaf-door': (a) => (
    <DoorShell accent={a}>
      <Toran y={34} accent={a} leaf />
      <Rangoli cx={160} cy={172} accent={a} />
    </DoorShell>
  ),
  'drape-door': (a) => (
    <DoorShell accent={a}>
      <path d="M92 26h136v112H92Z" fill={a} opacity={0.2} />
      <path d="M92 26h136v112H92Z" {...line} strokeWidth={1.5} />
      <path d="M116 26c6 34-6 72 0 112M160 26c-6 34 6 72 0 112M204 26c6 34-6 72 0 112" {...line} strokeWidth={1.1} opacity={0.55} />
      <rect x="92" y="48" width="136" height="20" fill="#CE8A22" opacity={0.32} />
      <rect x="92" y="48" width="136" height="20" {...line} strokeWidth={1.4} />
      {[110, 134, 158, 182, 206].map((x) => (
        <circle key={x} cx={x} cy="58" r="5" {...line} strokeWidth={1.2} fill="#CE8A22" fillOpacity={0.5} />
      ))}
    </DoorShell>
  ),
  'screen-door': (a) => (
    <DoorShell accent={a}>
      <rect x="98" y="30" width="124" height="132" fill="#FFFFFF" />
      <rect x="98" y="30" width="124" height="132" {...line} strokeWidth={1.3} strokeDasharray="6 5" />
      <path d="M98 30h124" {...line} strokeWidth={3} />
      {[[112, 58], [142, 96], [178, 62], [200, 118], [124, 130]].map(([x, y], i) => (
        <circle key={x} cx={x} cy={y} r={11 - i} fill={['#7C5AA6', '#C2402A', '#2E7D6B', '#CE8A22', a][i]} opacity={0.4} />
      ))}
      <path d="M74 22c40 16 132 16 172 0" {...line} strokeWidth={1.4} />
      {[[96, 30], [128, 36], [160, 38], [192, 36], [224, 30]].map(([x, y], i) => (
        <path
          key={x}
          d={`M${x} ${y}l8 18l8 -18z`}
          fill={['#7C5AA6', '#CE8A22', '#C2402A', '#2E7D6B', a][i]}
          opacity={0.55}
          stroke={INK}
          strokeWidth={1.1}
        />
      ))}
    </DoorShell>
  ),
  'lantern-door': (a) => (
    <DoorShell accent={a}>
      <Lights
        d="M92 26v136"
        at={[[92, 44], [92, 68], [92, 92], [92, 116], [92, 140]]}
        accent={a}
      />
      <g>
        <path d="M262 92h30l-5 52h-20Z" fill={a} opacity={0.28} />
        <path d="M262 92h30l-5 52h-20Z" {...line} strokeWidth={1.6} />
        <path d="M266 84h22v8h-22Z" {...line} strokeWidth={1.4} />
        <rect x="271" y="104" width="12" height="28" rx="2" fill="#CE8A22" opacity={0.6} />
        <path d="M277 84V72" {...line} strokeWidth={1.2} />
      </g>
      <path d="M52 46a26 26 0 1 0 23 35 20 20 0 0 1-23-35Z" fill="#CE8A22" opacity={0.35} />
      <path d="M52 46a26 26 0 1 0 23 35 20 20 0 0 1-23-35Z" {...line} strokeWidth={1.5} />
    </DoorShell>
  ),
  'wreath-door': (a) => (
    <DoorShell accent={a}>
      <circle cx="160" cy="82" r="34" stroke={a} strokeWidth="11" fill="none" opacity={0.35} />
      <circle cx="160" cy="82" r="34" {...line} strokeWidth={1.8} />
      <circle cx="160" cy="82" r="25" {...line} strokeWidth={1.1} opacity={0.5} />
      {[[160, 48], [188, 96], [136, 108], [190, 62]].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="#C2402A" opacity={0.8} />
      ))}
      <path d="M148 42c6 8 18 8 24 0" {...line} strokeWidth={1.6} />
      <Lights
        d="M228 26v136"
        at={[[228, 46], [228, 72], [228, 98], [228, 124], [228, 148]]}
        accent={a}
      />
    </DoorShell>
  ),
  'nameplate-door': (a) => (
    <DoorShell accent={a}>
      <Toran y={34} accent={a} leaf />
      <g>
        <rect x="242" y="66" width="58" height="30" rx="4" fill="#CE8A22" opacity={0.35} />
        <rect x="242" y="66" width="58" height="30" rx="4" {...line} strokeWidth={1.6} />
        <path d="M252 78h32M252 87h20" {...line} strokeWidth={1.4} />
      </g>
      <Rangoli cx={160} cy={172} accent={a} />
      <Diyas y={166} xs={[64, 256]} accent={a} />
    </DoorShell>
  ),
};

export function DecorScene({
  scene,
  accent = '#CE8A22',
  className,
}: {
  scene: string;
  accent?: string;
  className?: string;
}) {
  const draw = SCENES[scene] ?? SCENES['diya-wall'];
  return (
    <svg viewBox="0 0 320 180" className={className} aria-hidden preserveAspectRatio="xMidYMid meet">
      {draw(accent)}
    </svg>
  );
}
