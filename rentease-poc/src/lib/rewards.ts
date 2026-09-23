/**
 * RentEase Rewards — the whole rule book in one file.
 *
 * One card per user holds three balances that are earned, never bought:
 *   • RentPoints — every rupee of rent or marketplace spend earns them, and
 *     they convert back to cash at `POINT_VALUE`.
 *   • Cashback — rupees, credited at the card's tier rate, withdrawable to the
 *     rent wallet.
 *   • Coins — one-off tenure tokens for staying 3, 6 or 12 months in a home;
 *     both sides of the lease get them, and they buy the perks below.
 *
 * Lifetime points set the tier, and the tier sets the cashback rate and the
 * marketplace discount — the Prime-style membership, except you earn into it.
 */
import type { Booking, RewardCard, RewardTier } from '../types';

/* ------------------------------- tiers ------------------------------- */

export interface TierSpec {
  id: RewardTier;
  name: string;
  /** Lifetime points needed to sit in this tier. */
  from: number;
  /** Share of every payment returned as cashback. */
  cashbackRate: number;
  /** Share off every marketplace order. */
  shopDiscount: number;
  freeDelivery: boolean;
  perks: string[];
}

/** Ordered low → high; `tierOf` walks it backwards. */
export const TIERS: TierSpec[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    from: 0,
    cashbackRate: 0.01,
    shopDiscount: 0,
    freeDelivery: false,
    perks: ['1% cashback on rent and orders', 'Earn RentPoints on every payment'],
  },
  {
    id: 'silver',
    name: 'Silver',
    from: 2500,
    cashbackRate: 0.02,
    shopDiscount: 0.05,
    freeDelivery: false,
    perks: ['2% cashback on rent and orders', '5% off the marketplace', 'Priority tour slots'],
  },
  {
    id: 'gold',
    name: 'Gold',
    from: 7500,
    cashbackRate: 0.03,
    shopDiscount: 0.08,
    freeDelivery: true,
    perks: [
      '3% cashback on rent and orders',
      '8% off the marketplace',
      'Free delivery & assembly',
      'Same-day service visits',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    from: 20000,
    cashbackRate: 0.05,
    shopDiscount: 0.12,
    freeDelivery: true,
    perks: [
      '5% cashback on rent and orders',
      '12% off the marketplace',
      'Free delivery & assembly',
      'Zero brokerage on your next home',
      'Dedicated relationship manager',
    ],
  },
];

export const TIER_STYLE: Record<RewardTier, { ring: string; text: string; chip: string }> = {
  bronze: { ring: '#B87333', text: '#F0DCC6', chip: 'bg-[#F1E3D5] text-[#8A5324] border-[#DFC4A8]' },
  silver: { ring: '#AFBCC4', text: '#E8EEF1', chip: 'bg-[#EAEEF0] text-[#5A6A73] border-[#CFD8DD]' },
  gold: { ring: '#CE8A22', text: '#F6E7C7', chip: 'bg-honey-soft text-honey border-[#EBCF9C]' },
  platinum: { ring: '#7FB6A0', text: '#E4F1EB', chip: 'bg-green-soft text-green border-green-line' },
};

export function tierOf(lifetimePoints: number): TierSpec {
  return [...TIERS].reverse().find((t) => lifetimePoints >= t.from) ?? TIERS[0];
}

export function nextTier(current: TierSpec): TierSpec | null {
  return TIERS[TIERS.indexOf(current) + 1] ?? null;
}

/** How far along the current tier the card is, for the progress bar. */
export function tierProgress(lifetimePoints: number) {
  const tier = tierOf(lifetimePoints);
  const next = nextTier(tier);
  if (!next) return { tier, next, pct: 100, remaining: 0 };
  const span = next.from - tier.from;
  const done = lifetimePoints - tier.from;
  return {
    tier,
    next,
    pct: Math.max(4, Math.min(100, Math.round((done / span) * 100))),
    remaining: next.from - lifetimePoints,
  };
}

/* ------------------------------ earning ------------------------------ */

/** One point is worth 10 paise, so 100 points = ₹10. */
export const POINT_VALUE = 0.1;

/** Points per ₹100 spent, by what the money was for. */
export const EARN_RATE = {
  /** Renter paying rent. */
  rent: 2,
  /** Owner receiving rent. */
  rentReceived: 1,
  /** Furniture, décor and services. */
  shop: 1,
  /** Electricity, water and society dues paid through the app. */
  bill: 1,
} as const;

export type EarnKind = keyof typeof EARN_RATE;

export const pointsFor = (amount: number, kind: EarnKind) =>
  Math.floor((amount / 100) * EARN_RATE[kind]);

export const cashbackFor = (amount: number, lifetimePoints: number) =>
  Math.round(amount * tierOf(lifetimePoints).cashbackRate);

export const cashValueOf = (points: number) => Math.floor(points * POINT_VALUE);

/** Points must clear a round ₹100 before they convert, like a real programme. */
export const MIN_REDEEM_POINTS = 1000;

/* ----------------------------- milestones ---------------------------- */

export interface Milestone {
  months: number;
  coins: number;
  points: number;
  label: string;
  blurb: string;
}

/** Stay put and both sides of the lease get paid — brief's tenure ladder. */
export const MILESTONES: Milestone[] = [
  { months: 3, coins: 1, points: 500, label: 'Settled in', blurb: 'Three months in the same home' },
  { months: 6, coins: 2, points: 1200, label: 'Half year', blurb: 'Six months without a move' },
  { months: 12, coins: 4, points: 3000, label: 'Full year', blurb: 'A full year, lease renewed' },
];

/** Whole months elapsed between an ISO date and now. */
export function monthsSince(startISO: string, now = new Date()): number {
  const start = new Date(startISO);
  if (Number.isNaN(start.getTime())) return 0;
  let months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

export const milestoneKey = (bookingId: string, months: number) => `${bookingId}:${months}`;

export interface MilestoneState {
  milestone: Milestone;
  key: string;
  /** Tenure has passed the mark. */
  reached: boolean;
  /** Reached and not yet paid out. */
  claimable: boolean;
  claimed: boolean;
}

/** Milestone ladder for one booking, against what the card has already paid. */
export function milestonesFor(
  booking: Booking,
  card: RewardCard | undefined,
  now = new Date(),
): MilestoneState[] {
  const months = monthsSince(booking.startDate, now);
  return MILESTONES.map((milestone) => {
    const key = milestoneKey(booking.id, milestone.months);
    const claimed = card?.claimed.includes(key) ?? false;
    const reached = months >= milestone.months;
    return { milestone, key, reached, claimed, claimable: reached && !claimed };
  });
}

/* ------------------------------- perks ------------------------------- */

export interface CoinPerk {
  id: string;
  name: string;
  coins: number;
  blurb: string;
  /** What redeeming pays into the card. */
  grant: { cashback?: number; points?: number };
}

/** The coin store. Every perk settles as cashback so the POC stays honest. */
export const COIN_PERKS: CoinPerk[] = [
  {
    id: 'delivery',
    name: 'Delivery & assembly waiver',
    coins: 1,
    blurb: 'Covers the ₹299 delivery fee on your next furniture order.',
    grant: { cashback: 299 },
  },
  {
    id: 'credit',
    name: '₹750 marketplace credit',
    coins: 2,
    blurb: 'Spend it on furniture, décor or a festival pack.',
    grant: { cashback: 750 },
  },
  {
    id: 'service',
    name: 'Free service visit',
    coins: 3,
    blurb: 'One plumber or electrician call-out on us, plus 200 bonus points.',
    grant: { cashback: 400, points: 200 },
  },
  {
    id: 'rentfree',
    name: 'A month of furniture rent free',
    coins: 4,
    blurb: 'Waives one monthly bill on your rented furniture.',
    grant: { cashback: 1500 },
  },
];

/** Best rupee value one coin can fetch in the store — drives the "worth up to" copy. */
export const COIN_VALUE = Math.max(
  ...COIN_PERKS.map(
    (p) => ((p.grant.cashback ?? 0) + (p.grant.points ?? 0) * POINT_VALUE) / p.coins,
  ),
);
