/** Reactive read hooks. Components read through these and write through `api.*`. */
import { useDb } from './store';
import type {
  AppNotification,
  Booking,
  UtilityBill,
  Property,
  RewardCard,
  RewardTxn,
  SupportTicket,
  TourRequest,
  Unit,
  User,
} from '../types';

export const useCurrentUser = (): User | null =>
  useDb((db) => db.users.find((u) => u.id === db.currentUserId) ?? null);

export const useUsers = () => useDb((db) => db.users);
export const useProperties = () => useDb((db) => db.properties);
export const useUnits = () => useDb((db) => db.units);
export const useFurniture = () => useDb((db) => db.furniture);
export const useDecor = () => useDb((db) => db.decor);
export const usePros = () => useDb((db) => db.pros);
export const useCartLines = () => useDb((db) => db.cart);
export const useCartCount = () =>
  useDb((db) => db.cart.reduce((n, l) => n + l.qty, 0));

export const useUnit = (id: string | undefined): Unit | undefined =>
  useDb((db) => db.units.find((u) => u.id === id));

export const useProperty = (id: string | undefined): Property | undefined =>
  useDb((db) => db.properties.find((p) => p.id === id));

/** Units belonging to every property this owner owns. */
export const useOwnerUnits = (ownerId: string | undefined): Unit[] =>
  useDb((db) => {
    const mine = new Set(
      db.properties.filter((p) => p.ownerId === ownerId).map((p) => p.id),
    );
    return db.units.filter((u) => mine.has(u.propertyId));
  });

export const useOwnerRequests = (ownerId: string | undefined): TourRequest[] =>
  useDb((db) => {
    const mine = new Set(
      db.properties.filter((p) => p.ownerId === ownerId).map((p) => p.id),
    );
    const unitIds = new Set(
      db.units.filter((u) => mine.has(u.propertyId)).map((u) => u.id),
    );
    return db.requests.filter((r) => unitIds.has(r.unitId));
  });

export const useRenterRequests = (renterId: string | undefined): TourRequest[] =>
  useDb((db) => db.requests.filter((r) => r.renterId === renterId));

export const useRenterBookings = (renterId: string | undefined): Booking[] =>
  useDb((db) => db.bookings.filter((b) => b.renterId === renterId));

export const useBills = (userId: string | undefined): UtilityBill[] =>
  useDb((db) => db.bills.filter((b) => b.userId === userId));

export const useTxns = (userId: string | undefined) =>
  useDb((db) => db.txns.filter((t) => t.userId === userId));

export const useOrders = (userId: string | undefined) =>
  useDb((db) => db.orders.filter((o) => o.userId === userId));

export const useServiceRequests = (userId: string | undefined) =>
  useDb((db) => db.serviceRequests.filter((s) => s.userId === userId));

export const useNotifications = (userId: string | undefined): AppNotification[] =>
  useDb((db) => db.notifications.filter((n) => n.userId === userId));

export const useUnreadCount = (userId: string | undefined): number =>
  useDb((db) => db.notifications.filter((n) => n.userId === userId && !n.read).length);

export const useSupportTickets = (userId: string | undefined): SupportTicket[] =>
  useDb((db) => db.supportTickets.filter((t) => t.userId === userId));

export const useRewardCard = (userId: string | undefined): RewardCard | undefined =>
  useDb((db) => db.rewardCards.find((c) => c.userId === userId));

export const useRewardTxns = (userId: string | undefined): RewardTxn[] =>
  useDb((db) => db.rewardTxns.filter((t) => t.userId === userId));

/** Every booking a user has skin in — as the renter, or as the unit's owner. */
export const useTenureBookings = (userId: string | undefined): Booking[] =>
  useDb((db) => {
    const owned = new Set(
      db.units
        .filter((u) => db.properties.some((p) => p.id === u.propertyId && p.ownerId === userId))
        .map((u) => u.id),
    );
    return db.bookings.filter((b) => b.renterId === userId || owned.has(b.unitId));
  });
