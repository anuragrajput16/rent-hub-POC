/**
 * Typed data-access module. Everything returns a Promise, including the mocked
 * reads, so swapping in a real backend never touches a component.
 */
import { delay, mutate, snapshot, uid } from './store';
import { billLabel, inr } from '../lib/format';
import {
  COIN_PERKS,
  MILESTONES,
  MIN_REDEEM_POINTS,
  cashValueOf,
  cashbackFor,
  milestoneKey,
  monthsSince,
  pointsFor,
  tierOf,
} from '../lib/rewards';
import type {
  AppNotification,
  Booking,
  CartLine,
  DB,
  Order,
  RewardCard,
  RewardTxn,
  Role,
  NotificationKind,
  ServiceRequest,
  SupportTicket,
  SupportTopic,
  TourRequest,
  Unit,
  UtilityBill,
  User,
  WalletTxn,
} from '../types';

export { useDb, reset } from './store';
export const todayISO = () => new Date().toISOString().slice(0, 10);

/* ------------------------------- auth ------------------------------- */

export const auth = {
  async login(email: string): Promise<User> {
    const user = snapshot().users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
    );
    if (!user) throw new Error('No account found for that email. Try one of the demo accounts below.');
    mutate((db) => {
      db.currentUserId = user.id;
    });
    return delay(user);
  },

  async register(input: { name: string; email: string; role: Role; city: string }): Promise<User> {
    const exists = snapshot().users.some(
      (u) => u.email.toLowerCase() === input.email.trim().toLowerCase(),
    );
    if (exists) throw new Error('That email is already registered. Sign in instead.');
    const user: User = {
      id: uid('user'),
      name: input.name.trim(),
      email: input.email.trim(),
      role: input.role,
      // Mock KYC: owners and renters land verified, guests do not.
      verified: input.role !== 'guest',
      city: input.city.trim() || 'Indore',
      avatarInitials: initialsOf(input.name),
      walletBalance: input.role === 'owner' ? 0 : 10000,
    };
    mutate((db) => {
      db.users.push(user);
      db.rewardCards.push(blankCard(user.id));
      db.currentUserId = user.id;
    });
    return delay(user);
  },

  async logout(): Promise<void> {
    mutate((db) => {
      db.currentUserId = null;
    });
    return delay(undefined, 80);
  },

  /** Demo affordance: hop between the seeded owner / renter / guest. */
  async switchRole(role: Role): Promise<User> {
    const user = snapshot().users.find((u) => u.role === role);
    if (!user) throw new Error(`No seeded ${role} account.`);
    mutate((db) => {
      db.currentUserId = user.id;
    });
    return delay(user, 120);
  },

  /** Profile edits a user can make themselves. Initials follow the name. */
  async updateProfile(userId: string, patch: { name: string; city: string }): Promise<User> {
    const name = patch.name.trim();
    const city = patch.city.trim();
    if (!name) throw new Error('Your name cannot be empty.');
    if (!city) throw new Error('Add the city you are renting in.');

    let updated!: User;
    mutate((db) => {
      const u = db.users.find((x) => x.id === userId);
      if (!u) throw new Error('User not found');
      u.name = name;
      u.city = city;
      u.avatarInitials = initialsOf(name);
      updated = u;
    });
    return delay(updated);
  },

  /** Guest → owner/renter upgrade (§9 flow 8). */
  async upgrade(userId: string, role: Exclude<Role, 'guest'>): Promise<User> {
    let updated!: User;
    mutate((db) => {
      const u = db.users.find((x) => x.id === userId);
      if (!u) throw new Error('User not found');
      u.role = role;
      u.verified = true;
      updated = u;
    });
    return delay(updated);
  },
};

function initialsOf(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/* --------------------- rewards: shared internals --------------------- */

/** Card numbers are cosmetic here — grouped digits that look like a real one. */
function cardNumber() {
  const group = () => Math.floor(1000 + Math.random() * 9000).toString();
  return `5241 ${group()} ${group()} ${group()}`;
}

export function blankCard(userId: string): RewardCard {
  return {
    id: uid('card'),
    userId,
    number: cardNumber(),
    issuedOn: todayISO(),
    points: 0,
    lifetimePoints: 0,
    cashback: 0,
    coins: 0,
    claimed: [],
  };
}

/** Every user has a card; one is minted on first touch for seeded accounts. */
function cardFor(db: DB, userId: string): RewardCard {
  const found = db.rewardCards.find((c) => c.userId === userId);
  if (found) return found;
  const fresh = blankCard(userId);
  db.rewardCards.push(fresh);
  return fresh;
}

function logReward(db: DB, userId: string, kind: RewardTxn['kind'], delta: number, note: string) {
  db.rewardTxns.unshift({ id: uid('rw'), userId, kind, delta, note, date: todayISO() });
}

/**
 * Move one or more balances on a user's card and log a row for each. Positive
 * deltas earn, negative deltas redeem; lifetime points only ever go up, so
 * spending points never costs the user their tier.
 */
function accrue(
  db: DB,
  userId: string,
  gain: { points?: number; cashback?: number; coins?: number; note: string },
) {
  const card = cardFor(db, userId);
  if (gain.points) {
    card.points += gain.points;
    if (gain.points > 0) card.lifetimePoints += gain.points;
    logReward(db, userId, 'points', gain.points, gain.note);
  }
  if (gain.cashback) {
    card.cashback += gain.cashback;
    logReward(db, userId, 'cashback', gain.cashback, gain.note);
  }
  if (gain.coins) {
    card.coins += gain.coins;
    logReward(db, userId, 'coins', gain.coins, gain.note);
  }
  return card;
}

/** Points + tier cashback for a payment. Used by rent and by checkout. */
function earnOn(
  db: DB,
  userId: string,
  amount: number,
  kind: Parameters<typeof pointsFor>[1],
  note: string,
) {
  const card = cardFor(db, userId);
  const gain = { points: pointsFor(amount, kind), cashback: cashbackFor(amount, card.lifetimePoints) };
  accrue(db, userId, { ...gain, note });
  return gain;
}

/* --------------------------- notifications --------------------------- */

/** Drop a notification on someone's bell. Called from the flows that matter. */
function notify(
  db: DB,
  userId: string,
  n: { kind: NotificationKind; title: string; body: string; to: string },
) {
  db.notifications.unshift({ id: uid('ntf'), userId, ...n, date: todayISO(), read: false });
}

export const notifications = {
  async forUser(userId: string): Promise<AppNotification[]> {
    return delay(snapshot().notifications.filter((n) => n.userId === userId));
  },

  async markRead(id: string): Promise<void> {
    mutate((db) => {
      const found = db.notifications.find((n) => n.id === id);
      if (found) found.read = true;
    });
    return delay(undefined, 80);
  },

  async markAllRead(userId: string): Promise<void> {
    mutate((db) => {
      db.notifications.forEach((n) => {
        if (n.userId === userId) n.read = true;
      });
    });
    return delay(undefined, 80);
  },
};

/* ----------------------------- listings ----------------------------- */

export const listings = {
  async all(): Promise<Unit[]> {
    return delay(snapshot().units);
  },

  async byOwner(ownerId: string): Promise<Unit[]> {
    const db = snapshot();
    const mine = new Set(db.properties.filter((p) => p.ownerId === ownerId).map((p) => p.id));
    return delay(db.units.filter((u) => mine.has(u.propertyId)));
  },

  async get(id: string): Promise<Unit | undefined> {
    return delay(snapshot().units.find((u) => u.id === id));
  },

  async create(input: Omit<Unit, 'id'>): Promise<Unit> {
    const created: Unit = { ...input, id: uid('u') };
    mutate((db) => {
      db.units.unshift(created);
    });
    return delay(created);
  },

  async update(id: string, patch: Partial<Unit>): Promise<void> {
    mutate((db) => {
      const i = db.units.findIndex((u) => u.id === id);
      if (i >= 0) db.units[i] = { ...db.units[i], ...patch };
    });
    return delay(undefined);
  },

  async remove(id: string): Promise<void> {
    mutate((db) => {
      db.units = db.units.filter((u) => u.id !== id);
    });
    return delay(undefined);
  },
};

/* ----------------------------- requests ----------------------------- */

export const requests = {
  async forOwner(ownerId: string): Promise<TourRequest[]> {
    const db = snapshot();
    const mine = new Set(db.properties.filter((p) => p.ownerId === ownerId).map((p) => p.id));
    const unitIds = new Set(db.units.filter((u) => mine.has(u.propertyId)).map((u) => u.id));
    return delay(db.requests.filter((r) => unitIds.has(r.unitId)));
  },

  async forRenter(renterId: string): Promise<TourRequest[]> {
    return delay(snapshot().requests.filter((r) => r.renterId === renterId));
  },

  async create(input: Omit<TourRequest, 'id' | 'status'>): Promise<TourRequest> {
    const created: TourRequest = { ...input, id: uid('req'), status: 'pending' };
    mutate((db) => {
      db.requests.unshift(created);

      const unit = db.units.find((u) => u.id === created.unitId);
      const ownerId = db.properties.find((p) => p.id === unit?.propertyId)?.ownerId;
      if (ownerId)
        notify(db, ownerId, {
          kind: 'request',
          title: created.kind === 'booking' ? 'New booking request' : 'New tour request',
          body: `${created.renterName} · Unit ${unit?.unitNo ?? ''} ${unit?.type ?? ''}`.trim(),
          to: '/owner/requests',
        });
    });
    return delay(created);
  },

  /**
   * Accepting a booking request converts it into an active booking and marks
   * the unit rented (§9 flow 3–4).
   */
  async decide(id: string, status: 'accepted' | 'declined'): Promise<void> {
    mutate((db) => {
      const req = db.requests.find((r) => r.id === id);
      if (!req) return;
      req.status = status;

      const unit = db.units.find((u) => u.id === req.unitId);
      const label = unit ? `Unit ${unit.unitNo} · ${unit.type}` : 'the listing';

      if (status === 'declined') {
        notify(db, req.renterId, {
          kind: 'request',
          title: req.kind === 'booking' ? 'Booking declined' : 'Tour declined',
          body: `The owner could not take your request for ${label}.`,
          to: req.kind === 'booking' ? '/renter/search' : '/renter/tours',
        });
        return;
      }

      if (req.kind !== 'booking') {
        notify(db, req.renterId, {
          kind: 'booking',
          title: 'Tour confirmed',
          body: `${label}${req.when ? ` · ${req.when}` : ''}`,
          to: '/renter/tours',
        });
        return;
      }

      if (!unit) return;
      unit.status = 'rented';
      const booking: Booking = {
        id: uid('bk'),
        unitId: unit.id,
        renterId: req.renterId,
        startDate: new Date().toISOString().slice(0, 10),
        monthlyRent: unit.rent,
        nextDueDate: nextMonthDue(),
        status: 'active',
      };
      db.bookings.unshift(booking);

      const bill = openingBill(booking, unit);
      db.bills.unshift(bill);

      notify(db, req.renterId, {
        kind: 'booking',
        title: 'Booking accepted',
        body: `${label} is yours — rent ${inr(unit.rent)} a month from ${booking.nextDueDate}.`,
        to: '/renter',
      });
      notify(db, req.renterId, {
        kind: 'bill',
        title: 'First electricity bill raised',
        body: `${inr(bill.amount)} for ${bill.period}, due ${bill.dueDate}.`,
        to: '/renter',
      });
    });
    return delay(undefined);
  },
};

function nextMonthDue() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 5);
  return d.toISOString().slice(0, 10);
}

/**
 * First electricity bill, raised with the lease so a brand-new tenant's home
 * screen has something live on it. Metered off the unit's size.
 */
function openingBill(booking: Booking, unit: Unit): UtilityBill {
  const due = new Date();
  due.setDate(due.getDate() + 12);
  return {
    id: uid('bl'),
    bookingId: booking.id,
    userId: booking.renterId,
    kind: 'electricity',
    period: new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
    usage: Math.round(unit.sqft * 0.38),
    amount: Math.round(unit.sqft * 3),
    dueDate: due.toISOString().slice(0, 10),
    status: 'due',
  };
}

/* ----------------------------- bookings ----------------------------- */

export const bookings = {
  async forRenter(renterId: string): Promise<Booking[]> {
    return delay(snapshot().bookings.filter((b) => b.renterId === renterId));
  },

  /**
   * Mock rent payment: debit renter, credit owner, log both txns, and pay
   * RentPoints + tier cashback into both cards.
   */
  async payRent(bookingId: string): Promise<{ amount: number; points: number; cashback: number }> {
    let amount = 0;
    let reward = { points: 0, cashback: 0 };
    mutate((db) => {
      const bk = db.bookings.find((b) => b.id === bookingId);
      if (!bk) throw new Error('Booking not found');
      const unit = db.units.find((u) => u.id === bk.unitId);
      const prop = db.properties.find((p) => p.id === unit?.propertyId);
      const owner = db.users.find((u) => u.id === prop?.ownerId);
      const renter = db.users.find((u) => u.id === bk.renterId);
      if (!renter) throw new Error('Renter not found');
      if (renter.walletBalance < bk.monthlyRent)
        throw new Error('Not enough balance in your wallet for this rent payment.');

      amount = bk.monthlyRent;
      const date = new Date().toISOString().slice(0, 10);
      const label = `Unit ${unit?.unitNo ?? ''}`.trim();

      renter.walletBalance -= amount;
      db.txns.unshift({ id: uid('txn'), userId: renter.id, type: 'debit', amount, note: `Rent paid · ${label}`, date });

      if (owner) {
        owner.walletBalance += amount;
        db.txns.unshift({ id: uid('txn'), userId: owner.id, type: 'credit', amount, note: `Rent · ${label}`, date });
        earnOn(db, owner.id, amount, 'rentReceived', `Rent received · ${label}`);
        notify(db, owner.id, {
          kind: 'rent',
          title: 'Rent received',
          body: `${inr(amount)} credited to your wallet for ${label}.`,
          to: '/owner/wallet',
        });
      }

      reward = earnOn(db, renter.id, amount, 'rent', `Rent paid · ${label}`);

      const d = new Date(bk.nextDueDate);
      d.setMonth(d.getMonth() + 1);
      bk.nextDueDate = d.toISOString().slice(0, 10);
    });
    return delay({ amount, ...reward });
  },
};

/* ------------------------------- bills ------------------------------- */

export const bills = {
  async forUser(userId: string): Promise<UtilityBill[]> {
    return delay(snapshot().bills.filter((b) => b.userId === userId));
  },

  /** Settle a utility or society due from the wallet. Earns like any payment. */
  async pay(billId: string): Promise<{ amount: number; points: number; cashback: number }> {
    let amount = 0;
    let reward = { points: 0, cashback: 0 };
    mutate((db) => {
      const bill = db.bills.find((b) => b.id === billId);
      if (!bill) throw new Error('Bill not found');
      if (bill.status === 'paid') throw new Error('This bill is already paid.');

      const user = db.users.find((u) => u.id === bill.userId);
      if (!user) throw new Error('User not found');
      if (user.walletBalance < bill.amount)
        throw new Error('Not enough balance in your wallet for this bill.');

      amount = bill.amount;
      const note = `${billLabel[bill.kind]} · ${bill.period}`;

      user.walletBalance -= amount;
      bill.status = 'paid';
      bill.paidOn = todayISO();
      db.txns.unshift({
        id: uid('txn'),
        userId: user.id,
        type: 'debit',
        amount,
        note,
        date: todayISO(),
      });

      reward = earnOn(db, user.id, amount, 'bill', note);
    });
    return delay({ amount, ...reward });
  },
};

/* ------------------------------ wallet ------------------------------ */

export const wallet = {
  async txns(userId: string): Promise<WalletTxn[]> {
    return delay(snapshot().txns.filter((t) => t.userId === userId));
  },

  async withdraw(userId: string, amount: number): Promise<void> {
    mutate((db) => {
      const u = db.users.find((x) => x.id === userId);
      if (!u) throw new Error('User not found');
      if (amount <= 0) throw new Error('Enter an amount greater than zero.');
      if (amount > u.walletBalance) throw new Error('That is more than your available balance.');
      u.walletBalance -= amount;
      db.txns.unshift({
        id: uid('txn'),
        userId,
        type: 'withdraw',
        amount,
        note: 'Withdrawn to HDFC ••4412',
        date: new Date().toISOString().slice(0, 10),
      });
    });
    return delay(undefined);
  },
};

/* ------------------------------ rewards ----------------------------- */

export const rewards = {
  async card(userId: string): Promise<RewardCard> {
    let card!: RewardCard;
    mutate((db) => {
      card = cardFor(db, userId);
    });
    return delay(card);
  },

  async txns(userId: string): Promise<RewardTxn[]> {
    return delay(snapshot().rewardTxns.filter((t) => t.userId === userId));
  },

  /** RentPoints → cashback, in whole hundreds above the redemption floor. */
  async redeemPoints(userId: string, points: number): Promise<{ cash: number }> {
    let cash = 0;
    mutate((db) => {
      const card = cardFor(db, userId);
      if (!Number.isFinite(points) || points <= 0) throw new Error('Enter how many points to convert.');
      if (points % 100 !== 0) throw new Error('Points convert in blocks of 100.');
      if (points < MIN_REDEEM_POINTS)
        throw new Error(`Convert at least ${MIN_REDEEM_POINTS.toLocaleString('en-IN')} points at a time.`);
      if (points > card.points) throw new Error('That is more than the points on your card.');

      cash = cashValueOf(points);
      accrue(db, userId, { points: -points, note: `Converted ${points.toLocaleString('en-IN')} points` });
      accrue(db, userId, { cashback: cash, note: `Points converted to cashback` });
    });
    return delay({ cash });
  },

  /** Cashback → rent wallet, where it spends like any other balance. */
  async transferToWallet(userId: string, amount: number): Promise<void> {
    mutate((db) => {
      const card = cardFor(db, userId);
      const user = db.users.find((u) => u.id === userId);
      if (!user) throw new Error('User not found');
      if (!Number.isFinite(amount) || amount <= 0) throw new Error('Enter an amount greater than zero.');
      if (amount > card.cashback) throw new Error('That is more than your cashback balance.');

      accrue(db, userId, { cashback: -amount, note: 'Moved to rent wallet' });
      user.walletBalance += amount;
      db.txns.unshift({
        id: uid('txn'),
        userId,
        type: 'credit',
        amount,
        note: 'Rewards cashback',
        date: todayISO(),
      });
    });
    return delay(undefined);
  },

  /**
   * Pay out a 3 / 6 / 12-month tenure milestone. Either side of the lease can
   * claim its own — the renter for staying, the owner for keeping the unit let
   * — and the key on the card makes each one land exactly once.
   */
  async claimMilestone(
    userId: string,
    bookingId: string,
    months: number,
  ): Promise<{ coins: number; points: number }> {
    let granted = { coins: 0, points: 0 };
    mutate((db) => {
      const milestone = MILESTONES.find((m) => m.months === months);
      if (!milestone) throw new Error('Unknown milestone.');

      const booking = db.bookings.find((b) => b.id === bookingId);
      if (!booking) throw new Error('Booking not found');

      const unit = db.units.find((u) => u.id === booking.unitId);
      const prop = db.properties.find((p) => p.id === unit?.propertyId);
      if (userId !== booking.renterId && userId !== prop?.ownerId)
        throw new Error('That tenure is not on your lease.');

      if (monthsSince(booking.startDate) < months)
        throw new Error('This milestone has not been reached yet.');

      const card = cardFor(db, userId);
      const key = milestoneKey(bookingId, months);
      if (card.claimed.includes(key)) throw new Error('This milestone is already claimed.');

      card.claimed.push(key);
      granted = { coins: milestone.coins, points: milestone.points };
      accrue(db, userId, {
        ...granted,
        note: `${milestone.label} · ${months} months in Unit ${unit?.unitNo ?? ''}`.trim(),
      });
    });
    return delay(granted);
  },

  /** Spend coins from the perk store; the perk settles onto the card. */
  async redeemPerk(userId: string, perkId: string): Promise<{ name: string }> {
    let name = '';
    mutate((db) => {
      const perk = COIN_PERKS.find((p) => p.id === perkId);
      if (!perk) throw new Error('Unknown perk.');
      const card = cardFor(db, userId);
      if (card.coins < perk.coins)
        throw new Error(`Needs ${perk.coins} coin${perk.coins === 1 ? '' : 's'} — you have ${card.coins}.`);

      name = perk.name;
      accrue(db, userId, { coins: -perk.coins, note: `Redeemed · ${perk.name}` });
      accrue(db, userId, {
        points: perk.grant.points,
        cashback: perk.grant.cashback,
        note: `Perk credit · ${perk.name}`,
      });
    });
    return delay({ name });
  },
};

/** The membership tier a user is sitting in right now. */
export function tierForUser(userId: string) {
  return tierOf(snapshot().rewardCards.find((c) => c.userId === userId)?.lifetimePoints ?? 0);
}

/* ------------------------------- shop ------------------------------- */

export const shop = {
  async furniture() {
    return delay(snapshot().furniture);
  },
  async decor() {
    return delay(snapshot().decor);
  },
  async pros() {
    return delay(snapshot().pros);
  },
};

export const cart = {
  async add(line: Omit<CartLine, 'id'>): Promise<void> {
    mutate((db) => {
      const same = db.cart.find(
        (l) => l.kind === line.kind && l.refId === line.refId && l.mode === line.mode,
      );
      if (same) same.qty += line.qty;
      else db.cart.push({ ...line, id: uid('cl') });
    });
    return delay(undefined, 120);
  },

  async addMany(lines: Omit<CartLine, 'id'>[]): Promise<void> {
    for (const l of lines) await this.add(l);
  },

  async setQty(id: string, qty: number): Promise<void> {
    mutate((db) => {
      if (qty <= 0) {
        db.cart = db.cart.filter((l) => l.id !== id);
        return;
      }
      const line = db.cart.find((l) => l.id === id);
      if (line) line.qty = qty;
    });
    return delay(undefined, 80);
  },

  async remove(id: string): Promise<void> {
    mutate((db) => {
      db.cart = db.cart.filter((l) => l.id !== id);
    });
    return delay(undefined, 80);
  },

  /** Mock checkout — empties the cart into an order and debits the wallet. */
  async checkout(userId: string, total: number): Promise<Order> {
    let order!: Order;
    mutate((db) => {
      if (db.cart.length === 0) throw new Error('Your cart is empty.');
      const user = db.users.find((u) => u.id === userId);
      if (!user) throw new Error('Sign in to check out.');

      order = {
        id: uid('ord'),
        userId,
        lines: db.cart,
        total,
        date: new Date().toISOString().slice(0, 10),
      };
      db.orders.unshift(order);
      db.cart = [];

      // Wallet may not cover it; the POC lets the balance floor at zero.
      const charged = Math.min(total, user.walletBalance);
      user.walletBalance -= charged;
      db.txns.unshift({
        id: uid('txn'),
        userId,
        type: 'debit',
        amount: total,
        note: `Marketplace order · ${order.lines.length} item${order.lines.length > 1 ? 's' : ''}`,
        date: order.date,
      });

      earnOn(db, userId, total, 'shop', `Marketplace order · ${order.lines.length} item${order.lines.length > 1 ? 's' : ''}`);

      notify(db, userId, {
        kind: 'order',
        title: 'Order confirmed',
        body: `${order.lines.length} item${order.lines.length > 1 ? 's' : ''} · ${inr(total)}. Delivery in 3–5 days.`,
        to: '/orders',
      });
    });
    return delay(order);
  },

  async orders(userId: string): Promise<Order[]> {
    return delay(snapshot().orders.filter((o) => o.userId === userId));
  },
};

/* ----------------------------- services ----------------------------- */

export const services = {
  async book(input: Omit<ServiceRequest, 'id' | 'status'>): Promise<ServiceRequest> {
    const created: ServiceRequest = { ...input, id: uid('svc'), status: 'requested' };
    mutate((db) => {
      db.serviceRequests.unshift(created);
    });
    return delay(created);
  },

  async forUser(userId: string): Promise<ServiceRequest[]> {
    return delay(snapshot().serviceRequests.filter((s) => s.userId === userId));
  },
};

/* ------------------------------ support ----------------------------- */

/** Which desk owns a topic, and the line it opens the thread with. */
const DESK: Record<SupportTopic, { agent: string; reply: string }> = {
  rent: {
    agent: 'Rent & payments desk',
    reply: 'We have pulled up your wallet and rent history. If a payment shows as debited without a receipt, it settles back within 24 hours.',
  },
  listing: {
    agent: 'Owner support',
    reply: 'An owner-support specialist will look at the unit, its photos and its floor plan, and write back with what needs fixing.',
  },
  booking: {
    agent: 'Tours & bookings desk',
    reply: 'We will check the request with the owner and confirm the slot. Tours can be rescheduled free of charge until the day before.',
  },
  orders: {
    agent: 'Marketplace support',
    reply: 'We are tracking the order with the delivery partner. Rented furniture can be swapped or returned within 7 days of delivery.',
  },
  services: {
    agent: 'Home services desk',
    reply: 'Every professional on RentEase is background-checked. If a visit went wrong we will re-assign it and hold the visit charge.',
  },
  rewards: {
    agent: 'Rewards desk',
    reply: 'Points, cashback and coins are recalculated overnight. If a milestone did not land, we can credit it manually from here.',
  },
  account: {
    agent: 'Account & KYC desk',
    reply: 'For anything that touches identity or ownership documents we verify over a call before making changes to the account.',
  },
};

/** Short, shoutable reference the user can quote back on a call. */
function ticketRef() {
  return `RE-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export const support = {
  /** Raise a ticket. The desk is picked from the topic and replies at once. */
  async raise(input: {
    userId: string;
    topic: SupportTopic;
    subject: string;
    message: string;
  }): Promise<SupportTicket> {
    const subject = input.subject.trim();
    const message = input.message.trim();
    if (!subject) throw new Error('Add a short subject so the desk knows what this is about.');
    if (message.length < 12) throw new Error('Tell us a little more — a sentence or two helps.');

    const desk = DESK[input.topic];
    const created: SupportTicket = {
      id: uid('tkt'),
      userId: input.userId,
      reference: ticketRef(),
      topic: input.topic,
      subject,
      message,
      status: 'in-progress',
      agent: desk.agent,
      reply: desk.reply,
      date: todayISO(),
    };
    mutate((db) => {
      db.supportTickets.unshift(created);
      notify(db, input.userId, {
        kind: 'support',
        title: `${desk.agent} replied`,
        body: `${created.reference} · ${subject}`,
        to: '/help',
      });
    });
    return delay(created);
  },

  async forUser(userId: string): Promise<SupportTicket[]> {
    return delay(snapshot().supportTickets.filter((t) => t.userId === userId));
  },

  /** The user marking their own ticket sorted. */
  async resolve(id: string): Promise<void> {
    mutate((db) => {
      const ticket = db.supportTickets.find((t) => t.id === id);
      if (!ticket) throw new Error('Ticket not found');
      ticket.status = 'resolved';
    });
    return delay(undefined, 120);
  },
};
