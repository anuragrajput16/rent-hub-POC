/** Static "who we are" page — the one screen that explains the whole product. */
import { useDecor, useFurniture, useProperties, usePros, useUnits } from '../../api/hooks';
import { PageHead, SectionTitle } from '../../components/ui/Bits';
import { Chip } from '../../components/ui/Chip';
import { LinkButton } from '../../components/ui/Button';
import { FloorPlan } from '../../components/FloorPlan';
import {
  BrandMark,
  IconCheck,
  IconGift,
  IconGrid,
  IconHelp,
  IconHome,
  IconShield,
  IconSofa,
  IconSparkle,
  IconWrench,
} from '../../components/icons';
import type { ReactNode } from 'react';

const PILLARS: Array<{ icon: ReactNode; title: string; body: string; to: string; cta: string }> = [
  {
    icon: <IconHome />,
    title: 'Rent a home',
    body: 'Verified rooms and flats with real floor plans, honest rent and deposit, and tours you book in the app.',
    to: '/renter/search',
    cta: 'Browse homes',
  },
  {
    icon: <IconSofa />,
    title: 'Furniture on rent',
    body: 'Beds, almirahs, sofas and study tables — rent them by the month or buy outright, delivered to the unit.',
    to: '/furniture',
    cta: 'See furniture',
  },
  {
    icon: <IconSparkle />,
    title: 'Decoration & planner',
    body: 'Festival décor for Diwali, Holi and weddings, plus a layout planner that furnishes any floor plan.',
    to: '/decoration',
    cta: 'Open decoration',
  },
  {
    icon: <IconWrench />,
    title: 'Home services',
    body: 'Background-checked plumbers, electricians and construction crews, booked by slot and paid in-app.',
    to: '/services',
    cta: 'Book a pro',
  },
  {
    icon: <IconGift />,
    title: 'Rewards card',
    body: 'Every rent payment and order earns RentPoints, tier cashback and loyalty coins on one card.',
    to: '/rewards',
    cta: 'View rewards',
  },
  {
    icon: <IconGrid />,
    title: 'One wallet',
    body: 'Rent in, rent out, order payments and service charges settle through a single balance with receipts.',
    to: '/orders',
    cta: 'Your history',
  },
];

const RENTER_STEPS = [
  'Search verified units by area, budget, type and furnishing.',
  'Book a tour, then send a booking request to the owner.',
  'Move in, furnish on rent, and pay every month from your wallet.',
];

const OWNER_STEPS = [
  'List a unit with its floor plan, rent, deposit and house rules.',
  'Screen tour and booking requests from one queue.',
  'Collect rent in the wallet and withdraw to your bank.',
];

const VALUES = [
  {
    title: 'Verified on both sides',
    body: 'Owners are checked for ownership, renters for identity. Service professionals are background-checked before they take a job.',
  },
  {
    title: 'Nothing hidden in the rent',
    body: 'Rent, deposit, furnishing and house rules are on the listing before a tour is booked. No brokerage, no surprise charges.',
  },
  {
    title: 'Money leaves a trail',
    body: 'Every rent payment, order and payout writes a wallet entry, so both sides can point at the same record.',
  },
  {
    title: 'Loyalty that pays back',
    body: 'Staying put and paying on time earns points, cashback and tenure milestones — for the renter and the owner alike.',
  },
];

export default function About() {
  const units = useUnits();
  const properties = useProperties();
  const pros = usePros();
  const furniture = useFurniture();
  const decor = useDecor();

  const cities = Array.from(new Set(properties.map((p) => p.city)));
  const areas = Array.from(new Set(properties.map((p) => p.area)));

  const stats = [
    { label: 'Units listed', value: units.length },
    { label: 'Available now', value: units.filter((u) => u.status === 'available').length },
    { label: 'Verified professionals', value: pros.length },
    { label: 'Furniture & décor pieces', value: furniture.length + decor.length },
  ];

  return (
    <>
      <PageHead
        title="About RentEase"
        subtitle="Renting a home, furnishing it and keeping it running — in one app."
      />

      {/* Mission panel */}
      <section className="card mb-5 overflow-hidden">
        <div className="grid gap-6 bg-[linear-gradient(135deg,#2C5B44,#1E4634_62%)] p-6 text-[#EAF2E7] sm:p-8 lg:grid-cols-[1.6fr_1fr] lg:items-center">
          <div>
            <span className="mb-4 inline-flex items-center gap-2.5">
              <BrandMark className="h-9 w-9" />
              <span className="display text-xl font-bold">
                Rent<b className="font-bold text-honey">Ease</b>
              </span>
            </span>
            <h2 className="display m-0 mb-3 text-[22px] leading-tight font-semibold sm:text-[26px]">
              Renting should be as simple as ordering anything else online.
            </h2>
            <p className="m-0 max-w-[62ch] text-[14.5px] leading-relaxed text-[#C7D8C4]">
              RentEase started with a plain problem: finding a room means chasing brokers, and running
              one means chasing plumbers. We put the whole cycle in one place — listings with real floor
              plans, tours and bookings, furniture and décor on rent, verified home services, and a
              wallet that keeps the money legible for the owner and the renter at once.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {cities.map((c) => (
                <span
                  key={c}
                  className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold"
                >
                  {c}
                </span>
              ))}
              <span className="rounded-lg border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold">
                {areas.length} localities
              </span>
            </div>
          </div>
          <FloorPlan type="2 BHK" tone="light" labels={false} className="h-32 w-full opacity-70 lg:h-40" />
        </div>

        <div className="grid grid-cols-2 divide-line lg:grid-cols-4 lg:divide-x">
          {stats.map((s) => (
            <div key={s.label} className="border-t border-line px-5 py-4">
              <div className="display text-[25px] leading-none font-semibold">{s.value}</div>
              <div className="mt-1.5 text-[12.5px] text-muted">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <SectionTitle title="What RentEase does" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {PILLARS.map((p) => (
          <article key={p.title} className="card flex flex-col gap-3 p-5">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-[11px] bg-green-soft text-green [&_svg]:h-[22px] [&_svg]:w-[22px]">
              {p.icon}
            </span>
            <h3 className="display m-0 text-base font-semibold">{p.title}</h3>
            <p className="m-0 flex-1 text-[13.5px] leading-snug text-muted">{p.body}</p>
            <LinkButton to={p.to} variant="ghost" size="sm" className="self-start">
              {p.cta}
            </LinkButton>
          </article>
        ))}
      </div>

      <SectionTitle title="How it works" />
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          { head: 'If you are renting', steps: RENTER_STEPS },
          { head: 'If you own the place', steps: OWNER_STEPS },
        ].map((col) => (
          <div key={col.head} className="card p-5">
            <h3 className="display m-0 mb-4 text-base font-semibold">{col.head}</h3>
            <ol className="m-0 flex list-none flex-col gap-3.5 p-0">
              {col.steps.map((step, i) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="display grid h-7 w-7 flex-none place-items-center rounded-full bg-honey-soft text-[13px] font-bold text-green-deep">
                    {i + 1}
                  </span>
                  <span className="text-[13.5px] leading-snug">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <SectionTitle title="What we stand for" />
      <div className="card divide-y divide-line overflow-hidden">
        {VALUES.map((v) => (
          <div key={v.title} className="flex items-start gap-3.5 px-[18px] py-4">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-green-soft text-green">
              <IconShield className="h-[18px] w-[18px]" />
            </span>
            <div className="min-w-0">
              <b className="block text-sm font-semibold">{v.title}</b>
              <p className="m-0 mt-1 text-[13.5px] leading-snug text-muted">{v.body}</p>
            </div>
          </div>
        ))}
      </div>

      <SectionTitle title="The company" />
      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="card p-5">
          <dl className="m-0 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              ['Founded', '2024, Indore'],
              ['Head office', 'Vijay Nagar, Indore, Madhya Pradesh'],
              ['Operating in', cities.join(', ')],
              ['Team', 'Product, owner support and a field services desk'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[12.5px] font-semibold text-muted">{k}</dt>
                <dd className="m-0 mt-1 text-[14px]">{v}</dd>
              </div>
            ))}
          </dl>

          <ul className="m-0 mt-5 flex list-none flex-col gap-2 border-t border-line p-0 pt-4">
            {[
              'No brokerage on any listing',
              'Deposits held against a signed agreement',
              'Service visits re-assigned free if a job goes wrong',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2 text-[13.5px]">
                <IconCheck className="mt-0.5 h-3.5 w-3.5 flex-none text-green" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="card flex flex-col gap-3 p-5">
          <span className="grid h-11 w-11 place-items-center rounded-[11px] bg-honey-soft text-honey">
            <IconHelp className="h-[22px] w-[22px]" />
          </span>
          <h3 className="display m-0 text-base font-semibold">Something not adding up?</h3>
          <p className="m-0 flex-1 text-[13.5px] leading-snug text-muted">
            The help centre has answers on rent, bookings, orders, services and rewards — and a form
            that puts your question in front of the right desk.
          </p>
          <div className="flex flex-wrap gap-2">
            <LinkButton to="/help" size="sm">
              Help &amp; support
            </LinkButton>
            <Chip className="self-center">Mon–Sat · 9 AM – 8 PM</Chip>
          </div>
        </div>
      </div>

      <p className="mt-5 rounded-card border border-line bg-panel px-4 py-3 text-[13px] text-muted">
        RentEase is a proof of concept. The accounts, listings, professionals and money movements on
        this build are seeded demo data — no payment gateway is called and no real home is let.
      </p>
    </>
  );
}
