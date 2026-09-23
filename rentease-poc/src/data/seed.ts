/** Seeded mock data — BUILD_BRIEF §8. Screens are populated on first run. */
import type { DB, Unit, UnitType } from '../types';

const RULES = [
  'Minimum stay 11 months (lock-in)',
  'Rent due on the 5th of each month',
  'Two months notice before vacating',
  'No subletting; guests overnight need owner approval',
  'Electricity and water billed to the renter',
];

function unit(
  unitNo: string,
  type: UnitType,
  sqft: number,
  rent: number,
  status: Unit['status'],
  furnishing: Unit['furnishing'],
  description: string,
  propertyId = 'p1',
): Unit {
  return {
    id: `u-${propertyId}-${unitNo}`,
    propertyId,
    unitNo,
    type,
    sqft,
    rent,
    deposit: rent * 2,
    status,
    furnishing,
    description,
    photos: [],
    floorPlanType: type,
    rules: RULES,
  };
}

export function buildSeed(): DB {
  return {
    users: [
      {
        id: 'user-owner',
        name: 'Ramesh Kulkarni',
        email: 'ramesh@rentease.test',
        role: 'owner',
        verified: true,
        city: 'Indore',
        avatarInitials: 'RK',
        walletBalance: 48500,
      },
      {
        id: 'user-renter',
        name: 'Priya Sharma',
        email: 'priya@rentease.test',
        role: 'renter',
        verified: true,
        city: 'Indore',
        avatarInitials: 'PS',
        walletBalance: 32000,
      },
      {
        id: 'user-guest',
        name: 'Aditya Rao',
        email: 'aditya@rentease.test',
        role: 'guest',
        verified: false,
        city: 'Indore',
        avatarInitials: 'AR',
        walletBalance: 5000,
      },
    ],

    properties: [
      { id: 'p1', ownerId: 'user-owner', name: 'Sunrise Residency', area: 'Vijay Nagar', city: 'Indore' },
      { id: 'p2', ownerId: 'user-owner-2', name: 'Green Meadows', area: 'Palasia', city: 'Indore' },
      { id: 'p3', ownerId: 'user-owner-2', name: 'Lake View Apartments', area: 'Bhawarkua', city: 'Indore' },
    ],

    // The 9-unit building from §8, plus two extra listings for renter browse.
    units: [
      unit('101', '1 RK', 300, 6000, 'available', 'unfurnished', 'Compact room with kitchen counter, second floor, geyser fitted. Walk to Vijay Nagar square.'),
      unit('102', '1 BHK', 550, 9000, 'available', 'semi', 'Bright one-bedroom with a separate hall, covered parking and 24×7 water.'),
      unit('103', '1 BHK', 560, 9000, 'rented', 'semi', 'Corner unit with a balcony off the hall, modular kitchen and piped gas.'),
      unit('201', '2 BHK', 850, 15000, 'available', 'semi', 'Two bedrooms with wardrobes, east-facing hall, lift and power backup.'),
      unit('202', '2 BHK', 870, 15500, 'available', 'furnished', 'Fully furnished with bed, sofa and dining set. Move in the same day.'),
      unit('203', '2 BHK', 840, 15000, 'rented', 'unfurnished', 'Spacious two-bedroom on the second floor with a utility balcony.'),
      unit('301', '3 BHK', 1200, 22000, 'available', 'semi', 'Top-floor three-bedroom, cross ventilation, two bathrooms and a study nook.'),
      unit('302', '3 BHK', 1250, 23000, 'available', 'furnished', 'Largest unit in the building — furnished, two balconies and a servant toilet.'),
      unit('303', '1 RK', 310, 6200, 'available', 'unfurnished', 'Quiet rear-facing room with kitchen, ideal for a single working professional.'),

      unit('G-04', '1 BHK', 560, 9500, 'available', 'semi', 'Gated society with garden and gym, near Palasia square and the bus stop.', 'p2'),
      unit('L-11', '1 RK', 310, 6500, 'available', 'unfurnished', 'Lake-facing single room close to the university, best for students.', 'p3'),
    ],

    requests: [
      { id: 'r1', unitId: 'u-p1-201', renterId: 'user-renter', renterName: 'Priya Sharma', kind: 'tour', status: 'pending', when: 'Sat, 6 Sep · 11:00 AM' },
      { id: 'r2', unitId: 'u-p1-102', renterId: 'user-arjun', renterName: 'Arjun Mehta', kind: 'booking', status: 'pending' },
      { id: 'r3', unitId: 'u-p1-301', renterId: 'user-sneha', renterName: 'Sneha Patel', kind: 'tour', status: 'pending', when: 'Sun, 7 Sep · 4:30 PM' },
      { id: 'r4', unitId: 'u-p2-G-04', renterId: 'user-renter', renterName: 'Priya Sharma', kind: 'tour', status: 'accepted', when: 'Fri, 5 Sep · 6:00 PM' },
    ],

    bookings: [
      { id: 'b1', unitId: 'u-p1-103', renterId: 'user-renter', startDate: '2025-04-05', monthlyRent: 9000, nextDueDate: '2025-10-05', status: 'active' },
    ],

    // Dues raised against the live booking in Unit 103.
    bills: [
      { id: 'bl1', bookingId: 'b1', userId: 'user-renter', kind: 'electricity', period: 'September 2025', usage: 214, amount: 1840, dueDate: '2025-10-12', status: 'due' },
      { id: 'bl2', bookingId: 'b1', userId: 'user-renter', kind: 'water', period: 'September 2025', usage: 9, amount: 320, dueDate: '2025-10-12', status: 'due' },
      { id: 'bl3', bookingId: 'b1', userId: 'user-renter', kind: 'maintenance', period: 'September 2025', amount: 900, dueDate: '2025-10-10', status: 'due' },
      { id: 'bl4', bookingId: 'b1', userId: 'user-renter', kind: 'electricity', period: 'August 2025', usage: 188, amount: 1620, dueDate: '2025-09-12', status: 'paid', paidOn: '2025-09-08' },
    ],

    txns: [
      { id: 't1', userId: 'user-owner', type: 'credit', amount: 15000, note: 'Rent · Unit 203', date: '2025-09-05' },
      { id: 't2', userId: 'user-owner', type: 'credit', amount: 9000, note: 'Rent · Unit 103', date: '2025-09-05' },
      { id: 't3', userId: 'user-owner', type: 'withdraw', amount: 20000, note: 'Withdrawn to HDFC ••4412', date: '2025-08-28' },
      { id: 't4', userId: 'user-renter', type: 'debit', amount: 9000, note: 'Rent paid · Unit 103', date: '2025-09-05' },
    ],

    // Rewards: one card per seeded user. Ramesh has been collecting rent for a
    // while (Gold), Priya is a season in (Silver), Aditya has just shopped once.
    rewardCards: [
      {
        id: 'card-owner',
        userId: 'user-owner',
        number: '5241 8830 1174 6602',
        issuedOn: '2025-01-12',
        points: 4200,
        lifetimePoints: 9200,
        cashback: 1150,
        coins: 3,
        claimed: ['b1:3'],
      },
      {
        id: 'card-renter',
        userId: 'user-renter',
        number: '5241 4067 2298 3140',
        issuedOn: '2025-04-05',
        points: 3400,
        lifetimePoints: 3400,
        cashback: 620,
        coins: 1,
        claimed: ['b1:3'],
      },
      {
        id: 'card-guest',
        userId: 'user-guest',
        number: '5241 7712 9053 8871',
        issuedOn: '2025-08-19',
        points: 400,
        lifetimePoints: 400,
        cashback: 45,
        coins: 0,
        claimed: [],
      },
    ],

    rewardTxns: [
      { id: 'rw1', userId: 'user-owner', kind: 'points', delta: 150, note: 'Rent received · Unit 203', date: '2025-09-05' },
      { id: 'rw2', userId: 'user-owner', kind: 'cashback', delta: 450, note: 'Rent received · Unit 203', date: '2025-09-05' },
      { id: 'rw3', userId: 'user-owner', kind: 'coins', delta: 1, note: 'Settled in · 3 months in Unit 103', date: '2025-07-05' },
      { id: 'rw4', userId: 'user-renter', kind: 'points', delta: 180, note: 'Rent paid · Unit 103', date: '2025-09-05' },
      { id: 'rw5', userId: 'user-renter', kind: 'cashback', delta: 180, note: 'Rent paid · Unit 103', date: '2025-09-05' },
      { id: 'rw6', userId: 'user-renter', kind: 'coins', delta: 1, note: 'Settled in · 3 months in Unit 103', date: '2025-07-05' },
      { id: 'rw7', userId: 'user-renter', kind: 'points', delta: 500, note: 'Settled in · 3 months in Unit 103', date: '2025-07-05' },
      { id: 'rw8', userId: 'user-guest', kind: 'points', delta: 400, note: 'Marketplace order · 3 items', date: '2025-08-19' },
    ],

    furniture: [
      { id: 'f1', name: 'Bed (Queen)', category: 'Bedroom', rentPerMonth: 500, buyPrice: 12000, image: 'bed' },
      { id: 'f2', name: 'Study Table', category: 'Study', rentPerMonth: 200, buyPrice: 4500, image: 'table' },
      { id: 'f3', name: 'Almirah (Wardrobe)', category: 'Storage', rentPerMonth: 350, buyPrice: 9000, image: 'wardrobe' },
      { id: 'f4', name: 'Sofa (3-seater)', category: 'Living', rentPerMonth: 600, buyPrice: 18000, image: 'sofa' },
      { id: 'f5', name: 'Dining Table', category: 'Dining', rentPerMonth: 400, buyPrice: 11000, image: 'dining' },
      { id: 'f6', name: 'Bookshelf', category: 'Study', rentPerMonth: 180, buyPrice: 3800, image: 'shelf' },
    ],

    decor: [
      { id: 'd1', name: 'Diwali fairy lights (10 m)', occasion: 'Diwali', buyPrice: 450, rentPerDay: 90, image: 'lights' },
      { id: 'd2', name: 'Brass diya set (12 pcs)', occasion: 'Diwali', buyPrice: 780, image: 'diya' },
      { id: 'd3', name: 'Rangoli stencil kit', occasion: 'Diwali', buyPrice: 320, image: 'rangoli' },
      { id: 'd4', name: 'Marigold toran (pair)', occasion: 'Festival', buyPrice: 260, rentPerDay: 60, image: 'toran' },
      { id: 'd5', name: 'Housewarming theme pack', occasion: 'Housewarming', buyPrice: 2400, rentPerDay: 500, image: 'pack' },
      { id: 'd6', name: 'Birthday balloon arch', occasion: 'Party', buyPrice: 1100, rentPerDay: 300, image: 'balloon' },
      // Wall- and door-focused pieces the Decoration ideas draw on.
      { id: 'd7', name: 'Mango-leaf toran (fresh)', occasion: 'Festival', buyPrice: 180, image: 'leaftoran' },
      { id: 'd8', name: 'Mirror-work wall hanging', occasion: 'Navratri', buyPrice: 1650, rentPerDay: 350, image: 'mirrorwork' },
      { id: 'd9', name: 'LED curtain lights (3 m)', occasion: 'Festival', buyPrice: 890, rentPerDay: 180, image: 'curtain' },
      { id: 'd10', name: 'Peel-and-stick wall decals', occasion: 'Everyday', buyPrice: 640, image: 'decal' },
      { id: 'd11', name: 'Brass door nameplate', occasion: 'Housewarming', buyPrice: 1250, image: 'nameplate' },
      { id: 'd12', name: 'Holi colour & fabric bunting', occasion: 'Holi', buyPrice: 540, rentPerDay: 120, image: 'bunting' },
      { id: 'd13', name: 'Christmas wreath (14 in)', occasion: 'Christmas', buyPrice: 950, rentPerDay: 200, image: 'wreath' },
      { id: 'd14', name: 'Moroccan lantern set (3 pcs)', occasion: 'Eid', buyPrice: 1400, rentPerDay: 300, image: 'lantern' },
      { id: 'd15', name: 'Fabric backdrop panel (8 ft)', occasion: 'Wedding', buyPrice: 2100, rentPerDay: 450, image: 'backdrop' },
      { id: 'd16', name: 'Wall stencil kit (geometric)', occasion: 'Everyday', buyPrice: 480, image: 'stencil' },
    ],

    pros: [
      { id: 'pro1', trade: 'plumber', name: 'Sanjay Verma', rating: 4.8, ratePerVisit: 350 },
      { id: 'pro2', trade: 'plumber', name: 'Imran Sheikh', rating: 4.6, ratePerVisit: 300 },
      { id: 'pro3', trade: 'electrician', name: 'Deepak Yadav', rating: 4.9, ratePerVisit: 400 },
      { id: 'pro4', trade: 'electrician', name: 'Mahesh Tiwari', rating: 4.5, ratePerVisit: 380 },
      { id: 'pro5', trade: 'construction', name: 'Bhavna Constructions', rating: 4.7, ratePerVisit: 1200 },
      { id: 'pro6', trade: 'construction', name: 'Shree Civil Works', rating: 4.4, ratePerVisit: 1000 },
    ],

    serviceRequests: [],
    supportTickets: [],
    // Enough unread notifications that the bell has a dot on first load.
    notifications: [
      { id: 'n1', userId: 'user-owner', kind: 'request', title: 'New booking request', body: 'Arjun Mehta wants to rent Unit 102 · 1 BHK.', to: '/owner/requests', date: '2025-09-06', read: false },
      { id: 'n2', userId: 'user-owner', kind: 'request', title: 'Tour request · Unit 201', body: 'Priya Sharma asked for Sat, 6 Sep · 11:00 AM.', to: '/owner/requests', date: '2025-09-05', read: false },
      { id: 'n3', userId: 'user-owner', kind: 'rent', title: 'Rent received', body: '₹15,000 credited to your wallet for Unit 203.', to: '/owner/wallet', date: '2025-09-05', read: true },

      { id: 'n4', userId: 'user-renter', kind: 'bill', title: 'Electricity bill raised', body: '₹1,840 for September 2025 — due 12 October.', to: '/renter', date: '2025-09-07', read: false },
      { id: 'n5', userId: 'user-renter', kind: 'rent', title: 'Rent due on the 5th', body: '₹9,000 for Unit 103 will be taken from your wallet.', to: '/renter', date: '2025-09-06', read: false },
      { id: 'n6', userId: 'user-renter', kind: 'booking', title: 'Tour confirmed', body: 'Green Meadows G-04 on Fri, 5 Sep · 6:00 PM.', to: '/renter/tours', date: '2025-09-04', read: true },

      { id: 'n7', userId: 'user-guest', kind: 'reward', title: 'You are on Bronze', body: 'Rent a home to start earning cashback on every payment.', to: '/rewards', date: '2025-09-06', read: false },
      { id: 'n8', userId: 'user-guest', kind: 'order', title: 'Order delivered', body: 'Your fairy light order reached the address on file.', to: '/orders', date: '2025-09-03', read: true },
    ],

    cart: [],
    orders: [],
    currentUserId: null,
  };
}
