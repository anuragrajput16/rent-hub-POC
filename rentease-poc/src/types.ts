/** Domain model — BUILD_BRIEF §7. */

export type Role = 'owner' | 'renter' | 'guest';
export type UnitType = '1 RK' | '1 BHK' | '2 BHK' | '3 BHK';
export type UnitStatus = 'available' | 'rented';
export type Furnishing = 'unfurnished' | 'semi' | 'furnished';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Mock KYC / ownership flag. */
  verified: boolean;
  city: string;
  avatarInitials: string;
  /** Rupees. */
  walletBalance: number;
}

/** A building or complex. */
export interface Property {
  id: string;
  ownerId: string;
  name: string;
  area: string;
  city: string;
}

/** A listable unit inside a property. */
export interface Unit {
  id: string;
  propertyId: string;
  unitNo: string;
  type: UnitType;
  sqft: number;
  rent: number;
  deposit: number;
  status: UnitStatus;
  furnishing: Furnishing;
  description: string;
  /** Placeholder urls — the POC renders schematic art instead. */
  photos: string[];
  /** Which schematic the FloorPlan component renders. */
  floorPlanType: UnitType;
  rules: string[];
}

export interface TourRequest {
  id: string;
  unitId: string;
  renterId: string;
  /** Renter's display name, denormalised so the owner queue reads without a join. */
  renterName: string;
  kind: 'tour' | 'booking';
  status: 'pending' | 'accepted' | 'declined';
  when?: string;
}

export interface Booking {
  id: string;
  unitId: string;
  renterId: string;
  startDate: string;
  monthlyRent: number;
  nextDueDate: string;
  status: 'active' | 'ended';
}

/** Utility and society dues raised against a live booking. */
export type BillKind = 'electricity' | 'water' | 'maintenance' | 'internet';

export interface UtilityBill {
  id: string;
  bookingId: string;
  /** The renter who owes it. */
  userId: string;
  kind: BillKind;
  /** Billing period label, e.g. "September 2025". */
  period: string;
  /** Metered consumption — electricity and water only. */
  usage?: number;
  amount: number;
  dueDate: string;
  status: 'due' | 'paid';
  paidOn?: string;
}

export interface WalletTxn {
  id: string;
  userId: string;
  type: 'credit' | 'debit' | 'withdraw';
  amount: number;
  note: string;
  date: string;
}

/** Tier ladder for the rewards card — earned, never bought. */
export type RewardTier = 'bronze' | 'silver' | 'gold' | 'platinum';

/** One card per user. Holds every reward balance the app can pay out. */
export interface RewardCard {
  id: string;
  userId: string;
  /** Printed on the card face, four groups of four. */
  number: string;
  issuedOn: string;
  /** Spendable RentPoints. */
  points: number;
  /** Points ever earned — sets the tier, never spent down. */
  lifetimePoints: number;
  /** Redeemable rupees, moved to the wallet on demand. */
  cashback: number;
  /** Loyalty coins from the 3 / 6 / 12-month tenure milestones. */
  coins: number;
  /** `${bookingId}:${months}` keys already paid out, so a milestone lands once. */
  claimed: string[];
}

export interface RewardTxn {
  id: string;
  userId: string;
  kind: 'points' | 'cashback' | 'coins';
  /** Signed — earning is positive, redeeming negative. */
  delta: number;
  note: string;
  date: string;
}

export interface FurnitureItem {
  id: string;
  name: string;
  category: string;
  rentPerMonth: number;
  buyPrice: number;
  image: string;
}

export interface DecorItem {
  id: string;
  name: string;
  occasion: string;
  buyPrice: number;
  rentPerDay?: number;
  image: string;
}

export type Trade = 'plumber' | 'electrician' | 'construction';

export interface ServicePro {
  id: string;
  trade: Trade;
  name: string;
  rating: number;
  ratePerVisit: number;
}

export interface ServiceRequest {
  id: string;
  userId: string;
  proId: string;
  slot: string;
  status: 'requested' | 'confirmed' | 'done';
}

/** Where a support request lands on the (mocked) help desk. */
export type SupportTopic =
  | 'rent'
  | 'listing'
  | 'booking'
  | 'orders'
  | 'services'
  | 'rewards'
  | 'account';

export interface SupportTicket {
  id: string;
  userId: string;
  /** Short human reference printed back to the user, e.g. RE-4K2Q. */
  reference: string;
  topic: SupportTopic;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved';
  /** Desk that picked it up — mocked, one per topic. */
  agent: string;
  /** Canned first response, so the thread never looks empty. */
  reply: string;
  date: string;
}

export interface CartLine {
  id: string;
  kind: 'furniture' | 'decor';
  refId: string;
  mode: 'rent' | 'buy';
  qty: number;
}

export interface Order {
  id: string;
  userId: string;
  lines: CartLine[];
  total: number;
  date: string;
}

/** What a notification is about — sets its icon in the bell menu. */
export type NotificationKind =
  | 'request'
  | 'booking'
  | 'rent'
  | 'bill'
  | 'reward'
  | 'order'
  | 'support';

/** Named `App…` so it never collides with the DOM's own `Notification`. */
export interface AppNotification {
  id: string;
  userId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  /** Where tapping it takes you. */
  to: string;
  date: string;
  read: boolean;
}

/** Whole persisted state — one object so the mock store is easy to reset. */
export interface DB {
  users: User[];
  properties: Property[];
  units: Unit[];
  requests: TourRequest[];
  bookings: Booking[];
  bills: UtilityBill[];
  txns: WalletTxn[];
  rewardCards: RewardCard[];
  rewardTxns: RewardTxn[];
  furniture: FurnitureItem[];
  decor: DecorItem[];
  pros: ServicePro[];
  serviceRequests: ServiceRequest[];
  supportTickets: SupportTicket[];
  notifications: AppNotification[];
  cart: CartLine[];
  orders: Order[];
  /** id of the signed-in user, or null. */
  currentUserId: string | null;
}
