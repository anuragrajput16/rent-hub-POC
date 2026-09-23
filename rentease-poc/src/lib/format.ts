/** Rupee + date helpers shared across screens. */

export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

export const inrCompact = (n: number) =>
  n >= 100000 ? `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)} L` : inr(n);

export function prettyDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function dueDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
}

/** 13.33 → 13′4″ — room and furniture sizes, as Indian floor plans print them. */
export function ftin(v: number) {
  const inches = Math.round(Math.abs(v) * 12);
  return `${v < 0 ? '-' : ''}${Math.floor(inches / 12)}′${inches % 12}″`;
}

export const furnishingLabel = {
  unfurnished: 'Unfurnished',
  semi: 'Semi-furnished',
  furnished: 'Fully furnished',
} as const;

export const tradeLabel = {
  plumber: 'Plumber',
  electrician: 'Electrician',
  construction: 'Construction',
} as const;

export const billLabel = {
  electricity: 'Electricity',
  water: 'Water',
  maintenance: 'Society maintenance',
  internet: 'Internet',
} as const;

export const supportTopicLabel = {
  rent: 'Rent & payments',
  listing: 'Listings & units',
  booking: 'Tours & bookings',
  orders: 'Orders & delivery',
  services: 'Home services',
  rewards: 'Rewards card',
  account: 'Account & KYC',
} as const;

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ');
