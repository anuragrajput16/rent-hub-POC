/**
 * Decoration ideas — the content behind the Decoration tab.
 *
 * Every idea targets a *surface* (a wall or a door), because those are the two
 * things a renter can dress up without touching the structure. `renterSafe`
 * marks the ones that go up and come down with no nails and no repainting,
 * which is the constraint most people on a rental actually have.
 */

export type Surface = 'wall' | 'door';

export interface Festival {
  id: string;
  name: string;
  /** Roughly when it falls, for the chip subtitle. */
  window: string;
  /** Month it usually lands in (1–12); 0 means "any time of year". */
  month: number;
  tagline: string;
  /** Accent used for the chip and the scene wash. */
  accent: string;
}

export const FESTIVALS: Festival[] = [
  {
    id: 'diwali',
    name: 'Diwali',
    window: 'Oct – Nov',
    month: 10,
    tagline: 'Light, brass and marigold — the one everyone decorates for.',
    accent: '#CE8A22',
  },
  {
    id: 'navratri',
    name: 'Navratri & Durga Puja',
    window: 'Sep – Oct',
    month: 9,
    tagline: 'Mirror work, bright cotton and a backdrop worth dancing in front of.',
    accent: '#B4443C',
  },
  {
    id: 'ganesh',
    name: 'Ganesh Chaturthi',
    window: 'Aug – Sep',
    month: 8,
    tagline: 'A clean corner, a small mandap and flowers that last the ten days.',
    accent: '#C2683A',
  },
  {
    id: 'holi',
    name: 'Holi',
    window: 'March',
    month: 3,
    tagline: 'Colour that washes off — bunting and fabric over anything permanent.',
    accent: '#7C5AA6',
  },
  {
    id: 'eid',
    name: 'Eid',
    window: 'Varies',
    month: 4,
    tagline: 'Lanterns, crescents and a warm low light through the evening.',
    accent: '#2E7D6B',
  },
  {
    id: 'christmas',
    name: 'Christmas',
    window: 'December',
    month: 12,
    tagline: 'A wreath on the door and one warm string of lights indoors.',
    accent: '#3F7D4E',
  },
  {
    id: 'griha',
    name: 'Griha Pravesh',
    window: 'Any time',
    month: 0,
    tagline: 'Move-in day: mango leaves, a nameplate and a rangoli at the threshold.',
    accent: '#B08542',
  },
];

export interface DesignIdea {
  id: string;
  title: string;
  festivalId: string;
  surface: Surface;
  blurb: string;
  /** Key into `DecorScene`. */
  scene: string;
  /** Swatches shown under the title. */
  palette: string[];
  /** Rough spend, in rupees. */
  budget: number;
  /** How long it takes to put up. */
  effort: string;
  /** No nails, no paint, comes off clean. */
  renterSafe: boolean;
  steps: string[];
  /** Décor catalogue ids this idea uses, so the kit can go to the cart. */
  itemIds: string[];
}

export const IDEAS: DesignIdea[] = [
  /* ------------------------------ Diwali ------------------------------ */
  {
    id: 'diwali-diya-wall',
    title: 'Diya ledge on a bare wall',
    festivalId: 'diwali',
    surface: 'wall',
    blurb:
      'One floating ledge, a row of brass diyas and a string of warm lights behind them. The wall does the work; you only light twelve lamps.',
    scene: 'diya-wall',
    palette: ['#CE8A22', '#8C4A1E', '#F6E7C7', '#1E4634'],
    budget: 1700,
    effort: 'An hour',
    renterSafe: true,
    steps: [
      'Clear one wall — the one facing the entrance reads best from the door.',
      'Mount a 3-ft ledge on adhesive strips, or stand the diyas on a console you already own.',
      'Run the fairy lights along the wall behind, taped at the corners only.',
      'Space the diyas evenly and leave the middle one slightly forward.',
    ],
    itemIds: ['d2', 'd1'],
  },
  {
    id: 'diwali-toran-door',
    title: 'Marigold toran and rangoli threshold',
    festivalId: 'diwali',
    surface: 'door',
    blurb:
      'The classic entrance: a marigold toran across the frame and a stencilled rangoli on the floor just inside it.',
    scene: 'toran-door',
    palette: ['#CE8A22', '#C2402A', '#F6E7C7', '#2E5E45'],
    budget: 900,
    effort: 'An hour',
    renterSafe: true,
    steps: [
      'Hang the toran from two adhesive hooks at the top corners of the frame.',
      'Sweep and dry the threshold, then lay the stencil and fill it in.',
      'Set two diyas at the outer corners of the rangoli.',
      'Keep the toran off the hinge side so the door still swings clear.',
    ],
    itemIds: ['d4', 'd3', 'd2'],
  },

  /* ----------------------------- Navratri ----------------------------- */
  {
    id: 'navratri-mirror-wall',
    title: 'Mirror-work garba backdrop',
    festivalId: 'navratri',
    surface: 'wall',
    blurb:
      'A mirror-work hanging centred on a fabric panel, lit from the side so every disc throws light while people dance.',
    scene: 'mirror-wall',
    palette: ['#B4443C', '#CE8A22', '#E8B4C8', '#2E5E45'],
    budget: 3400,
    effort: 'Half a day',
    renterSafe: true,
    steps: [
      'Hang the fabric panel from a tension rod — no drilling into the wall.',
      'Centre the mirror-work piece on the panel at eye height.',
      'Put a lamp low and to one side so the mirrors catch the light.',
      'Leave a clear 6 ft in front of the panel for photos.',
    ],
    itemIds: ['d15', 'd8'],
  },
  {
    id: 'navratri-door-drape',
    title: 'Bandhani drape on the doorway',
    festivalId: 'navratri',
    surface: 'door',
    blurb:
      'Tie-dye fabric gathered over the frame with a mirror-work band across the top — visible from the lift, so guests find the right flat.',
    scene: 'drape-door',
    palette: ['#B4443C', '#CE8A22', '#7C5AA6', '#F6E7C7'],
    budget: 2100,
    effort: 'An hour',
    renterSafe: true,
    steps: [
      'Run a tension rod inside the door frame, above the architrave.',
      'Gather the fabric over it and pull the folds even.',
      'Pin the mirror-work band across the top third.',
      'Trim the hem so it clears the floor by two inches.',
    ],
    itemIds: ['d15', 'd8'],
  },

  /* ------------------------------ Ganesh ------------------------------ */
  {
    id: 'ganesh-corner',
    title: 'Ten-day mandap corner',
    festivalId: 'ganesh',
    surface: 'wall',
    blurb:
      'A corner set aside for the whole festival: fabric behind, a low table in front, and lights that can stay on for ten evenings.',
    scene: 'idol-corner',
    palette: ['#C2683A', '#CE8A22', '#F6E7C7', '#2E5E45'],
    budget: 3000,
    effort: 'Half a day',
    renterSafe: true,
    steps: [
      'Pick the corner furthest from the kitchen and the front door traffic.',
      'Hang the backdrop panel on a tension rod, corner to corner.',
      'Set a low table in front and cover it to the floor.',
      'Frame it with the LED curtain — dim, and on a timer for the ten days.',
    ],
    itemIds: ['d15', 'd9', 'd2'],
  },
  {
    id: 'ganesh-leaf-door',
    title: 'Mango-leaf toran on the frame',
    festivalId: 'ganesh',
    surface: 'door',
    blurb:
      'Fresh mango leaves strung across the doorway — replaced twice over the festival. Nothing else needed.',
    scene: 'leaf-door',
    palette: ['#2E5E45', '#CE8A22', '#F6E7C7', '#8C4A1E'],
    budget: 400,
    effort: 'An hour',
    renterSafe: true,
    steps: [
      'Buy the leaves the morning you put them up — they wilt in a day indoors.',
      'String them with the stems alternating so the line sits flat.',
      'Tie both ends to hooks on the frame, not to the door itself.',
      'Mist the leaves each evening and swap them on day five.',
    ],
    itemIds: ['d7', 'd3'],
  },

  /* ------------------------------- Holi ------------------------------- */
  {
    id: 'holi-bunting-wall',
    title: 'Colour bunting over a protected wall',
    festivalId: 'holi',
    surface: 'wall',
    blurb:
      'Fabric bunting across a wall you have covered first — the point is that everything here washes off or comes down.',
    scene: 'colour-wall',
    palette: ['#7C5AA6', '#C2402A', '#2E7D6B', '#CE8A22'],
    budget: 1200,
    effort: 'An hour',
    renterSafe: true,
    steps: [
      'Tape a dust sheet over the wall first — dry colour stains paint permanently.',
      'Run the bunting in two shallow swags, high enough to stay out of reach.',
      'Move rugs and anything upholstered out of the room entirely.',
      'Take it all down the same evening, before the colour sets.',
    ],
    itemIds: ['d12', 'd15'],
  },
  {
    id: 'holi-door',
    title: 'Washable door screen',
    festivalId: 'holi',
    surface: 'door',
    blurb:
      'A cotton screen over the door so colour-covered hands never touch the paint. Comes off, goes in the machine.',
    scene: 'screen-door',
    palette: ['#7C5AA6', '#E8B4C8', '#CE8A22', '#2E5E45'],
    budget: 800,
    effort: 'An hour',
    renterSafe: true,
    steps: [
      'Cover the outside face of the door with a cotton panel, taped at the top edge.',
      'Add a short bunting line above the frame.',
      'Keep a bucket and an old towel just inside the threshold.',
      'Wash the panel the same night; colour sets hard once it dries.',
    ],
    itemIds: ['d12'],
  },

  /* -------------------------------- Eid -------------------------------- */
  {
    id: 'eid-lantern-wall',
    title: 'Lantern cluster and crescent wall',
    festivalId: 'eid',
    surface: 'wall',
    blurb:
      'Three lanterns hung at staggered heights with a crescent decal behind — low, warm light for evening visits.',
    scene: 'lantern-wall',
    palette: ['#2E7D6B', '#CE8A22', '#F6E7C7', '#1E4634'],
    budget: 2100,
    effort: 'An hour',
    renterSafe: true,
    steps: [
      'Hang the three lanterns from adhesive hooks at staggered heights.',
      'Place the crescent-and-star decals behind and slightly off-centre.',
      'Use warm bulbs only — cool white flattens the whole arrangement.',
      'Keep the lowest lantern above head height near a walkway.',
    ],
    itemIds: ['d14', 'd10'],
  },
  {
    id: 'eid-door',
    title: 'Lit doorway welcome',
    festivalId: 'eid',
    surface: 'door',
    blurb:
      'One lantern beside the door and a warm LED curtain down the frame, so the entrance reads from the end of the corridor.',
    scene: 'lantern-door',
    palette: ['#2E7D6B', '#CE8A22', '#F6E7C7', '#8C4A1E'],
    budget: 1500,
    effort: 'An hour',
    renterSafe: true,
    steps: [
      'Run the LED curtain down one side of the frame, taped behind the architrave.',
      'Stand a lantern on the floor to the handle side, clear of the swing.',
      'Set the lights to a steady warm mode — no flashing in a shared corridor.',
      'Check the flat next door is not blocked by anything you have put out.',
    ],
    itemIds: ['d14', 'd9'],
  },

  /* ----------------------------- Christmas ----------------------------- */
  {
    id: 'christmas-wall',
    title: 'Light curtain instead of a tree',
    festivalId: 'christmas',
    surface: 'wall',
    blurb:
      'For a 1 BHK with no floor to spare: a light curtain on the wall in a tree shape, with the presents underneath.',
    scene: 'lights-wall',
    palette: ['#3F7D4E', '#CE8A22', '#F6E7C7', '#B4443C'],
    budget: 1500,
    effort: 'An hour',
    renterSafe: true,
    steps: [
      'Tape the top of the curtain in a narrow triangle, widest at the bottom.',
      'Tuck the loose strands behind so only the lit strings show.',
      'Put a star or a bow at the apex.',
      'Stack the presents against the skirting underneath.',
    ],
    itemIds: ['d9', 'd10'],
  },
  {
    id: 'christmas-door',
    title: 'Wreath and a warm frame',
    festivalId: 'christmas',
    surface: 'door',
    blurb:
      'A wreath centred on the door with a single warm string down the frame — the whole thing takes twenty minutes.',
    scene: 'wreath-door',
    palette: ['#3F7D4E', '#B4443C', '#CE8A22', '#F6E7C7'],
    budget: 1300,
    effort: 'An hour',
    renterSafe: true,
    steps: [
      'Hang the wreath from an over-door hook — never a nail in the door face.',
      'Centre it at eye height, not in the middle of the door.',
      'Run the warm string down the hinge side of the frame.',
      'Keep the peephole and the number plate clear.',
    ],
    itemIds: ['d13', 'd1'],
  },

  /* --------------------------- Griha Pravesh --------------------------- */
  {
    id: 'griha-door',
    title: 'Move-in threshold',
    festivalId: 'griha',
    surface: 'door',
    blurb:
      'The full welcome for the first day in a new home: mango leaves across the frame, a brass nameplate and a rangoli at the step.',
    scene: 'nameplate-door',
    palette: ['#B08542', '#2E5E45', '#F6E7C7', '#C2402A'],
    budget: 1900,
    effort: 'Half a day',
    renterSafe: true,
    steps: [
      'Fix the nameplate with adhesive strips beside the frame, at eye height.',
      'String the mango-leaf toran across the top of the frame.',
      'Stencil the rangoli on the landing, just outside the threshold.',
      'Light two diyas at the corners as everyone arrives.',
    ],
    itemIds: ['d11', 'd7', 'd3'],
  },
  {
    id: 'griha-wall',
    title: 'First wall in an empty flat',
    festivalId: 'griha',
    surface: 'wall',
    blurb:
      'One wall dressed on day one so the flat stops feeling empty — decals in a loose grid, no paint and no holes.',
    scene: 'decal-wall',
    palette: ['#B08542', '#2E5E45', '#F6E7C7', '#5C6D62'],
    budget: 1200,
    effort: 'Half a day',
    renterSafe: true,
    steps: [
      'Pick the wall you see from the door, not the one behind the sofa.',
      'Lay the decals out on the floor first and photograph the arrangement.',
      'Work from the centre out, smoothing each one from the middle.',
      'Stop at two-thirds of the wall height — a full wall reads busy.',
    ],
    itemIds: ['d10', 'd16'],
  },
];

/* ----------------------------- selectors ----------------------------- */

export const festivalById = (id: string) => FESTIVALS.find((f) => f.id === id);

export const ideasFor = (festivalId: string, surface?: Surface) =>
  IDEAS.filter((i) => i.festivalId === festivalId && (!surface || i.surface === surface));

/**
 * The festival to open on: the next one on the calendar, wrapping into next
 * year. Festivals marked month 0 are year-round and never win.
 */
export function upcomingFestival(now = new Date()): Festival {
  const month = now.getMonth() + 1;
  const dated = FESTIVALS.filter((f) => f.month > 0);
  const ahead = dated
    .map((f) => ({ f, gap: (f.month - month + 12) % 12 }))
    .sort((a, b) => a.gap - b.gap);
  return ahead[0]?.f ?? FESTIVALS[0];
}

/** Ideas for the hero carousel — one per festival, walls and doors alternating. */
export function featuredIdeas(): DesignIdea[] {
  const seen = new Set<string>();
  const picked: DesignIdea[] = [];
  for (const idea of IDEAS) {
    if (seen.has(idea.festivalId)) continue;
    seen.add(idea.festivalId);
    picked.push(idea);
  }
  return picked;
}
