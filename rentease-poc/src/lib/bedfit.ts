/**
 * Bed fit — which bed suits each bedroom, and where it goes. Ported from the
 * Bed Fit project (reference/bed-fit, placement.py + catalog.py) so the layout
 * planner can reason about a room instead of dropping a block in it.
 *
 * The plans are fixed 2D rooms, one set per unit type, with sizes typical of
 * that type rather than measured from a real flat. There is no model and no
 * plan reader, only the rule book below.
 *
 * Room-local coordinates: origin at the room's top-left interior corner,
 * x runs right (0..width), y runs down (0..depth). All feet.
 */
import type { UnitType } from '../types';
import { ftin } from './format';

/* --- catalog: the single place to retune sizes and clearances --- */

export type BedId = 'king' | 'queen';

export const BEDS: Record<BedId, { label: string; width: number; length: number }> = {
  king: { label: 'King', width: 6.33, length: 6.67 },
  queen: { label: 'Queen', width: 5.0, length: 6.67 },
};

/** Largest first, so the biggest bed that still earns RECOMMENDED wins. */
export const BED_ORDER: BedId[] = ['king', 'queen'];

export const CLEARANCES = {
  /** Below this, a side stops being a walkway. */
  minSide: 1.5,
  /** Space past the foot to walk by and make the bed. */
  foot: 2.0,
};

/** When both sides are tight, pin the bed this far off the far wall. */
const TIGHT_SIDE_GAP = 0.5;

const NIGHTSTAND = 1.5;

/* --- plans --- */

export type Wall = 'top' | 'right' | 'bottom' | 'left';
export type Rect = [number, number, number, number];

export interface Opening {
  type: 'door' | 'doorway' | 'window';
  wall: Wall;
  /** Along the wall, from its top or left end. */
  span: [number, number];
  role?: string;
}

export interface BedroomSpec {
  id: string;
  label: string;
  width: number;
  depth: number;
  /** Where the room sits in the FloorPlan viewBox (0 0 120 80): x, y, w, h. */
  box: [number, number, number, number];
  openings: Opening[];
}

export const BEDROOMS: Record<UnitType, BedroomSpec[]> = {
  '1 RK': [
    {
      id: 'room',
      label: 'Main room',
      width: 12,
      depth: 12,
      box: [4, 4, 74, 72],
      openings: [
        { type: 'door', wall: 'left', span: [8, 11], role: 'Main door' },
        { type: 'window', wall: 'top', span: [4, 8] },
        { type: 'doorway', wall: 'right', span: [2, 5], role: 'To the kitchen' },
      ],
    },
  ],
  '1 BHK': [
    {
      id: 'bed',
      label: 'Bedroom',
      width: 11,
      depth: 11,
      box: [60, 4, 56, 36],
      openings: [
        { type: 'door', wall: 'left', span: [7.5, 10.5], role: 'From the hall' },
        { type: 'window', wall: 'top', span: [3.5, 7.5] },
        { type: 'window', wall: 'right', span: [4, 7] },
      ],
    },
  ],
  '2 BHK': [
    {
      id: 'master',
      label: 'Master bedroom',
      width: 13,
      depth: 12,
      box: [44, 4, 36, 36],
      openings: [
        { type: 'door', wall: 'right', span: [8, 11], role: 'From the passage' },
        { type: 'window', wall: 'top', span: [4, 8] },
      ],
    },
    {
      id: 'second',
      label: 'Second bedroom',
      width: 10,
      depth: 11,
      box: [80, 4, 36, 20],
      openings: [
        { type: 'door', wall: 'bottom', span: [0.5, 3.5], role: 'From the passage' },
        { type: 'window', wall: 'top', span: [3.5, 6.5] },
        { type: 'window', wall: 'right', span: [3, 6.5] },
      ],
    },
  ],
  '3 BHK': [
    {
      id: 'master',
      label: 'Master bedroom',
      width: 12,
      depth: 13,
      box: [84, 4, 32, 40],
      openings: [
        { type: 'door', wall: 'bottom', span: [0.5, 3.5], role: 'From the passage' },
        { type: 'window', wall: 'top', span: [4, 8] },
        { type: 'window', wall: 'right', span: [4, 8] },
      ],
    },
    {
      id: 'second',
      label: 'Second bedroom',
      width: 11,
      depth: 10.5,
      box: [40, 4, 44, 24],
      openings: [
        { type: 'door', wall: 'left', span: [7, 10], role: 'From the hall' },
        { type: 'window', wall: 'top', span: [3.5, 7.5] },
      ],
    },
    {
      id: 'third',
      label: 'Third bedroom',
      width: 11,
      depth: 10,
      box: [40, 28, 44, 24],
      openings: [{ type: 'door', wall: 'left', span: [6, 9], role: 'From the hall' }],
    },
  ],
};

/* --- geometry --- */

const WALLS: Wall[] = ['top', 'right', 'bottom', 'left'];

/** How bad it is to put a headboard against a wall carrying each opening. */
const WALL_PENALTY: Record<Opening['type'], number> = { door: 100, doorway: 60, window: 40 };

const isHorizontal = (wall: Wall) => wall === 'top' || wall === 'bottom';

/** [along the headboard wall, into the room] for a headboard on `wall`. */
export const axes = (wall: Wall, W: number, D: number): [number, number] =>
  isHorizontal(wall) ? [W, D] : [D, W];

/** The floor a door sweeps: a square of its own width just inside its wall. */
export function swingRect(op: Opening, W: number, D: number): Rect {
  const [a, b] = op.span;
  const d = b - a;
  if (op.wall === 'left') return [0, a, d, b];
  if (op.wall === 'right') return [W - d, a, W, b];
  if (op.wall === 'top') return [a, 0, b, d];
  return [a, D - d, b, D];
}

const acrossOf = ([x0, y0, x1, y1]: Rect, wall: Wall): [number, number] =>
  isHorizontal(wall) ? [x0, x1] : [y0, y1];

function awayOf([x0, y0, x1, y1]: Rect, wall: Wall, W: number, D: number): [number, number] {
  if (wall === 'top') return [y0, y1];
  if (wall === 'bottom') return [D - y1, D - y0];
  if (wall === 'left') return [x0, x1];
  return [W - x1, W - x0];
}

/** An (across, away) footprint against `wall` back in room coordinates. */
export function toRoom(wall: Wall, start: number, across: number, away: number, W: number, D: number): Rect {
  const s = start;
  const e = start + across;
  if (wall === 'top') return [s, 0, e, away];
  if (wall === 'bottom') return [s, D - away, e, D];
  if (wall === 'left') return [0, s, away, e];
  return [W - away, s, W, e];
}

const round = (v: number) => Math.round(v * 100) / 100;

/* --- headboard wall --- */

function chooseHeadboardWall(room: BedroomSpec): { wall: Wall; why: string } {
  const scored = WALLS.map((wall, i) => {
    const here = room.openings.filter((o) => o.wall === wall);
    const penalty = here.reduce((s, o) => s + WALL_PENALTY[o.type], 0);
    return { wall, i, here, penalty, len: axes(wall, room.width, room.depth)[0] };
  }).sort((a, b) => a.penalty - b.penalty || b.len - a.len || a.i - b.i);

  const best = scored[0];
  const clear = scored.filter((s) => s.penalty === 0);

  if (best.penalty > 0) {
    const kinds = [...new Set(best.here.map((o) => o.type))].join(' and ');
    return {
      wall: best.wall,
      why: `Every wall here has an opening, so the headboard goes on the ${best.wall} wall, which only has a ${kinds}. Worth checking by eye.`,
    };
  }
  if (clear.length === 1) {
    return {
      wall: best.wall,
      why: `The ${best.wall} wall is the only one with no door or window. The headboard goes there so the window and the way in both stay clear.`,
    };
  }
  return {
    wall: best.wall,
    why: `The ${best.wall} wall has no door or window and is the longest clear wall, so it leaves the most room on each side of the bed.`,
  };
}

/* --- the free run of the headboard wall --- */

/** Runs along the headboard wall a bed of `bedLength` can use, after door swings. */
function freeRuns(wall: Wall, room: BedroomSpec, bedLength: number): Array<[number, number]> {
  const { width: W, depth: D } = room;
  const [acrossLen] = axes(wall, W, D);
  const blocked: Array<[number, number]> = [];

  for (const op of room.openings) {
    if (op.type !== 'door') continue;
    const rect = swingRect(op, W, D);
    const [a0, a1] = awayOf(rect, wall, W, D);
    // A swing past the foot of the bed does not block it.
    if (Math.min(a1, bedLength) - Math.max(a0, 0) <= 0) continue;
    const [c0, c1] = acrossOf(rect, wall);
    blocked.push([Math.max(0, c0), Math.min(acrossLen, c1)]);
  }

  blocked.sort((p, q) => p[0] - q[0]);
  const runs: Array<[number, number]> = [];
  let cursor = 0;
  for (const [b0, b1] of blocked) {
    if (b0 > cursor) runs.push([cursor, b0]);
    cursor = Math.max(cursor, b1);
  }
  if (cursor < acrossLen) runs.push([cursor, acrossLen]);
  return runs.length ? runs : [[0, acrossLen]];
}

/* --- one bed option --- */

export type FitStatus = 'RECOMMENDED' | 'FITS_WITH_CAVEAT' | 'DOES_NOT_FIT';

export interface BedOption {
  bed: BedId;
  label: string;
  status: FitStatus;
  /** The mattress in room feet, or null when it does not fit. */
  box: Rect | null;
  /** Walkway on the low and high side along the headboard wall, and past the foot. */
  sideA: number | null;
  sideB: number | null;
  foot: number;
  /** What each side runs to: a wall or the door swing. */
  sideLabels: { a: string; b: string };
  nightstands: Rect[];
  notes: string;
}

function sideLabel(byDoor: boolean, wall: Wall, side: 'a' | 'b') {
  if (byDoor) return 'to the door swing';
  if (isHorizontal(wall)) return side === 'a' ? 'to the left wall' : 'to the right wall';
  return side === 'a' ? 'to the top wall' : 'to the bottom wall';
}

function placeBed(bed: BedId, wall: Wall, room: BedroomSpec): BedOption {
  const { width: bw, length: bl, label } = BEDS[bed];
  const { width: W, depth: D } = room;
  const [acrossLen, awayLen] = axes(wall, W, D);

  const [start, end] = freeRuns(wall, room, bl).reduce((p, q) => (q[1] - q[0] > p[1] - p[0] ? q : p));
  const span = end - start;
  const foot = round(awayLen - bl);

  if (span < bw || awayLen < bl) {
    return {
      bed,
      label,
      status: 'DOES_NOT_FIT',
      box: null,
      sideA: null,
      sideB: null,
      foot,
      sideLabels: { a: '', b: '' },
      nightstands: [],
      notes: `A ${label.toLowerCase()} bed needs ${ftin(bw)} along the wall and ${ftin(bl)} into the room. This wall leaves ${ftin(span)} clear, and the room is ${ftin(awayLen)} deep.`,
    };
  }

  let pos = start + (span - bw) / 2;
  let pinned = false;

  // Both sides unusable? Give up on symmetry and keep one real walkway.
  if (Math.min(pos - start, end - pos - bw) < CLEARANCES.minSide && span - bw > TIGHT_SIDE_GAP) {
    const lowIsDoor = start > 1e-6;
    const highIsDoor = end < acrossLen - 1e-6;
    if (lowIsDoor && !highIsDoor) {
      pos = end - TIGHT_SIDE_GAP - bw;
      pinned = true;
    } else if (highIsDoor && !lowIsDoor) {
      pos = start + TIGHT_SIDE_GAP;
      pinned = true;
    }
  }

  const sideA = round(pos - start);
  const sideB = round(end - pos - bw);
  const box = toRoom(wall, pos, bw, bl, W, D).map(round) as Rect;
  const status: FitStatus =
    Math.min(sideA, sideB) >= CLEARANCES.minSide && foot >= CLEARANCES.foot ? 'RECOMMENDED' : 'FITS_WITH_CAVEAT';
  const sideLabels = {
    a: sideLabel(start > 1e-6, wall, 'a'),
    b: sideLabel(end < acrossLen - 1e-6, wall, 'b'),
  };

  const nightstands: Rect[] = [];
  if (sideA >= NIGHTSTAND) nightstands.push(toRoom(wall, pos - NIGHTSTAND, NIGHTSTAND, NIGHTSTAND, W, D));
  if (sideB >= NIGHTSTAND) nightstands.push(toRoom(wall, pos + bw, NIGHTSTAND, NIGHTSTAND, W, D));

  return {
    bed,
    label,
    status,
    box,
    sideA,
    sideB,
    foot,
    sideLabels,
    nightstands,
    notes: notesFor(label, status, sideA, sideB, sideLabels, foot, pinned, nightstands.length),
  };
}

function notesFor(
  label: string,
  status: FitStatus,
  sideA: number,
  sideB: number,
  labels: { a: string; b: string },
  foot: number,
  pinned: boolean,
  stands: number,
) {
  const name = `${label.toLowerCase()} bed`;
  const tight = Math.min(sideA, sideB);
  const wide = Math.max(sideA, sideB);

  if (status === 'RECOMMENDED') {
    let s = `Room to walk round both sides: ${ftin(sideA)} ${labels.a} and ${ftin(sideB)} ${labels.b}, with ${ftin(foot)} past the foot.`;
    if (stands === 2) s += ' There is space for a side table on each side.';
    else if (stands === 1) s += ' One side has space for a side table.';
    return s;
  }
  if (pinned) {
    return `A ${name} fits, but not with a walkway on both sides. It is pushed towards the far wall so one side keeps ${ftin(wide)} to walk down. The other side is ${ftin(tight)}, which is a squeeze, not a path.`;
  }
  const bits: string[] = [];
  if (tight < CLEARANCES.minSide) {
    bits.push(`the tightest side is ${ftin(tight)}, under the ${ftin(CLEARANCES.minSide)} a walkway needs`);
  }
  if (foot < CLEARANCES.foot) {
    bits.push(`there is only ${ftin(foot)} past the foot, under the ${ftin(CLEARANCES.foot)} needed to walk by`);
  }
  return `A ${name} fits, but ${bits.join(' and ')}.`;
}

/* --- a whole bedroom --- */

export interface BedroomPlan {
  room: BedroomSpec;
  headboard: Wall;
  reasoning: string;
  recommended: BedId;
  options: BedOption[];
}

export function planBedroom(room: BedroomSpec): BedroomPlan {
  const { wall, why } = chooseHeadboardWall(room);
  const options = BED_ORDER.map((id) => placeBed(id, wall, room));

  // The largest bed that earns RECOMMENDED, else whichever leaves the best tight side.
  const tightest = (o: BedOption) => Math.min(o.sideA ?? -1, o.sideB ?? -1);
  const best =
    options.find((o) => o.status === 'RECOMMENDED') ??
    options.filter((o) => o.status !== 'DOES_NOT_FIT').sort((p, q) => tightest(q) - tightest(p))[0] ??
    options[options.length - 1];

  return { room, headboard: wall, reasoning: why, recommended: best.bed, options };
}

export const planBedrooms = (type: UnitType) => BEDROOMS[type].map(planBedroom);
