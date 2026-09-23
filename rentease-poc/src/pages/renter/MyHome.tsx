/**
 * The renter's home screen once a lease is live. Discover and its filters move
 * out of the way — this is the home they already have: the unit, what is due on
 * it, and every RentEase service that applies to it.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { bills as billsApi, bookings as bookingsApi } from '../../api';
import { useBills, useProperties, useRenterBookings, useRewardCard, useUnits } from '../../api/hooks';
import { EmptyState, PageHead, SectionTitle, StatCard } from '../../components/ui/Bits';
import { Button, LinkButton } from '../../components/ui/Button';
import { Chip, StatusPill } from '../../components/ui/Chip';
import { Modal, SuccessModal } from '../../components/ui/Modal';
import { FloorPlan } from '../../components/FloorPlan';
import { RewardsCard } from '../../components/RewardsCard';
import { ServiceCard } from '../../components/ServiceCard';
import {
  IconBolt,
  IconCard,
  IconDoc,
  IconDrop,
  IconGrid,
  IconHelp,
  IconKey,
  IconRupee,
  IconSofa,
  IconSparkle,
  IconWifi,
  IconWrench,
} from '../../components/icons';
import { billLabel, dueDate, furnishingLabel, inr, prettyDate } from '../../lib/format';
import { milestonesFor, monthsSince } from '../../lib/rewards';
import type { BillKind, UtilityBill } from '../../types';

const BILL_ICON: Record<BillKind, typeof IconBolt> = {
  electricity: IconBolt,
  water: IconDrop,
  maintenance: IconWrench,
  internet: IconWifi,
};

/** Everything RentEase can do for a home you already live in. */
const FOR_YOUR_HOME = [
  {
    icon: <IconWrench />,
    title: 'Home services',
    body: 'Plumber, electrician or construction help for this unit. Pick a slot, track the job, pay from the same wallet.',
    to: '/services',
    linkLabel: 'Book a pro',
  },
  {
    icon: <IconSofa />,
    title: 'Furniture on rent',
    body: 'Beds, almirahs, sofas and study tables sized to your floor plan — rent monthly or buy outright.',
    to: '/furniture',
    linkLabel: 'Rent furniture',
  },
  {
    icon: <IconSparkle />,
    title: 'Decoration ideas',
    body: 'Renter-safe wall and door designs with a palette, a budget and a kit that drops straight into the cart.',
    to: '/decoration',
    linkLabel: 'See ideas',
  },
  {
    icon: <IconGrid />,
    title: 'Layout planner',
    body: 'Lay out this floor plan with furniture that fits, then add the whole bundle in one tap.',
    to: '/planner',
    linkLabel: 'Open planner',
  },
  {
    icon: <IconDoc />,
    title: 'Orders & receipts',
    body: 'Everything you have ordered for the home, plus every rent and bill receipt in one place.',
    to: '/orders',
    linkLabel: 'Your history',
  },
  {
    icon: <IconHelp />,
    title: 'Help & support',
    body: 'Questions on rent, deposit, bills or a service visit — the desk answers with a ticket reference.',
    to: '/help',
    linkLabel: 'Get help',
  },
];

export default function MyHome() {
  const { user } = useAuth();
  const toast = useToast();
  const allBookings = useRenterBookings(user?.id);
  const units = useUnits();
  const properties = useProperties();
  const bills = useBills(user?.id);
  const rewardCard = useRewardCard(user?.id);

  const [payRentFor, setPayRentFor] = useState<string | null>(null);
  const [payBill, setPayBill] = useState<UtilityBill | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ title: string; what: string; amount: number; points: number; cashback: number } | null>(null);

  const active = allBookings.filter((b) => b.status === 'active');
  const primary = active[0];
  const primaryUnit = units.find((u) => u.id === primary?.unitId);
  const primaryProperty = properties.find((p) => p.id === primaryUnit?.propertyId);

  const rentBooking = active.find((b) => b.id === payRentFor);
  const rentUnit = units.find((u) => u.id === rentBooking?.unitId);

  const openBills = bills.filter((b) => b.status === 'due');
  const paidBills = bills.filter((b) => b.status === 'paid');
  const billsDue = openBills.reduce((sum, b) => sum + b.amount, 0);
  const depositHeld = active.reduce(
    (sum, b) => sum + (units.find((u) => u.id === b.unitId)?.deposit ?? 0),
    0,
  );

  const monthsIn = primary ? monthsSince(primary.startDate) : 0;
  const nextMilestone = primary
    ? milestonesFor(primary, rewardCard).find((m) => !m.claimed)
    : undefined;

  async function confirmRent() {
    if (!payRentFor) return;
    setBusy(true);
    try {
      const { amount, points, cashback } = await bookingsApi.payRent(payRentFor);
      setPayRentFor(null);
      setDone({ title: 'Rent paid', what: 'rent', amount, points, cashback });
      toast(`${inr(amount)} rent paid · ${points.toLocaleString('en-IN')} RentPoints earned.`);
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function confirmBill() {
    if (!payBill) return;
    const label = billLabel[payBill.kind].toLowerCase();
    setBusy(true);
    try {
      const { amount, points, cashback } = await billsApi.pay(payBill.id);
      setPayBill(null);
      setDone({ title: 'Bill paid', what: `${label} bill`, amount, points, cashback });
      toast(`${inr(amount)} ${label} bill paid.`);
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead
        title="Your home"
        subtitle={
          active.length > 1
            ? `${active.length} homes on rent through RentEase.`
            : `Unit ${primaryUnit?.unitNo} · ${primaryProperty?.name}, ${primaryProperty?.area}, ${primaryProperty?.city}`
        }
        action={
          <LinkButton to="/renter/search" variant="ghost" size="sm">
            Browse other homes
          </LinkButton>
        }
      />

      <div className="mb-[26px] grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Rent due"
          value={inr(primary?.monthlyRent ?? 0)}
          suffix={primary ? `· ${dueDate(primary.nextDueDate)}` : undefined}
          icon={<IconRupee />}
        />
        <StatCard label="Bills due" value={inr(billsDue)} suffix={`· ${openBills.length} open`} icon={<IconBolt />} />
        <StatCard label="Deposit held" value={inr(depositHeld)} icon={<IconKey />} />
        <StatCard label="Wallet balance" value={inr(user?.walletBalance ?? 0)} icon={<IconCard />} />
      </div>

      {/* The unit itself */}
      <SectionTitle title={active.length > 1 ? 'Your rented homes' : 'Your rented home'} className="mt-0" />
      <div className="grid gap-4">
        {active.map((booking) => {
          const unit = units.find((u) => u.id === booking.unitId);
          const property = properties.find((p) => p.id === unit?.propertyId);
          if (!unit) return null;
          return (
            <article key={booking.id} className="card overflow-hidden lg:flex">
              <div className="flex items-center justify-center border-b border-line bg-green-soft p-5 lg:w-[280px] lg:flex-none lg:border-r lg:border-b-0">
                <FloorPlan type={unit.floorPlanType} className="h-[150px] w-full" />
              </div>

              <div className="min-w-0 flex-1 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="display m-0 text-lg font-semibold">
                      Unit {unit.unitNo} · {unit.type}
                    </h3>
                    <p className="m-0 mt-1 text-[13px] text-muted">
                      {property?.name}, {property?.area}, {property?.city} · renting since{' '}
                      {prettyDate(booking.startDate)}
                    </p>
                  </div>
                  <StatusPill tone="ok">Active lease</StatusPill>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Chip>{furnishingLabel[unit.furnishing]}</Chip>
                  <Chip>{unit.sqft} sqft</Chip>
                  <Chip>{monthsIn} month{monthsIn === 1 ? '' : 's'} in</Chip>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 border-t border-line pt-4 sm:grid-cols-4">
                  {[
                    ['Monthly rent', inr(booking.monthlyRent)],
                    ['Next due', dueDate(booking.nextDueDate)],
                    ['Deposit held', inr(unit.deposit)],
                    ['Lease', 'Rolling · 11 months'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-[12px] font-semibold text-muted">{k}</dt>
                      <dd className="display m-0 mt-0.5 text-[15.5px] font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => setPayRentFor(booking.id)}>
                    Pay rent
                  </Button>
                  <LinkButton to={`/listing/${unit.id}`} variant="ghost" size="sm">
                    Home details
                  </LinkButton>
                  <LinkButton to="/services" variant="ghost" size="sm">
                    Book a service
                  </LinkButton>
                  <LinkButton to="/renter/bookings" variant="ghost" size="sm">
                    Rent receipts
                  </LinkButton>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Utilities and society dues */}
      <SectionTitle title="Bills & dues" link="/orders" linkLabel="All receipts" />
      {bills.length === 0 ? (
        <EmptyState
          title="Nothing due right now"
          message="Electricity, water and society dues for this home show up here as they are raised."
        />
      ) : (
        <div className="card overflow-hidden">
          {[...openBills, ...paidBills].map((bill) => {
            const Icon = BILL_ICON[bill.kind];
            const paid = bill.status === 'paid';
            return (
              <div
                key={bill.id}
                className="flex flex-wrap items-center gap-3.5 border-b border-line px-[18px] py-3.5 last:border-b-0"
              >
                <span
                  className={
                    'grid h-10 w-10 flex-none place-items-center rounded-full ' +
                    (paid ? 'bg-[#F1F4EF] text-muted' : 'bg-honey-soft text-honey')
                  }
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <b className="block text-sm font-semibold">
                    {billLabel[bill.kind]} · {bill.period}
                  </b>
                  <span className="block text-[12.5px] text-muted">
                    {bill.usage !== undefined && (
                      <>
                        {bill.usage} {bill.kind === 'water' ? 'kL' : 'units'} ·{' '}
                      </>
                    )}
                    {paid ? `Paid ${prettyDate(bill.paidOn ?? '')}` : `Due ${dueDate(bill.dueDate)}`}
                  </span>
                </div>
                <span className="display text-[16px] font-semibold">{inr(bill.amount)}</span>
                {paid ? (
                  <StatusPill tone="muted">Paid</StatusPill>
                ) : (
                  <Button size="sm" onClick={() => setPayBill(bill)}>
                    Pay bill
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* The rest of the app, pointed at this home */}
      <SectionTitle title="For your home" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {FOR_YOUR_HOME.map((s) => (
          <ServiceCard key={s.to} {...s} />
        ))}
      </div>

      {rewardCard && (
        <>
          <SectionTitle title="Rewards" link="/rewards" linkLabel="Open card" />
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <RewardsCard card={rewardCard} holder={user?.name ?? ''} compact />
            <div className="card p-5">
              <h3 className="display m-0 text-base font-semibold">Staying put pays</h3>
              <p className="m-0 mt-1.5 text-[13.5px] leading-snug text-muted">
                Rent and bills paid through RentEase earn RentPoints and tier cashback on the card.
                Tenure milestones pay loyalty coins to you and to your owner.
              </p>
              {nextMilestone && (
                <p className="m-0 mt-3.5 rounded-[10px] border border-line bg-[#F3F6F1] px-3.5 py-3 text-[13px]">
                  <b className="font-semibold">{nextMilestone.milestone.label}</b> ·{' '}
                  {nextMilestone.claimable ? (
                    <>
                      ready to claim — {nextMilestone.milestone.coins} coin
                      {nextMilestone.milestone.coins === 1 ? '' : 's'} and{' '}
                      {nextMilestone.milestone.points.toLocaleString('en-IN')} points are waiting.
                    </>
                  ) : (
                    <>
                      {nextMilestone.milestone.months - monthsIn} month
                      {nextMilestone.milestone.months - monthsIn === 1 ? '' : 's'} to go in this home.
                    </>
                  )}
                </p>
              )}
              <LinkButton to="/rewards" variant="ghost" size="sm" className="mt-4">
                View the card
              </LinkButton>
            </div>
          </div>
        </>
      )}

      <p className="mt-[30px] rounded-card border border-line bg-panel px-4 py-3 text-[13px] text-muted">
        Looking for another home?{' '}
        <Link to="/renter/search" className="font-semibold text-green no-underline hover:underline">
          Browse verified listings
        </Link>{' '}
        — search and filters moved there once your lease went live.
      </p>

      {/* Pay rent */}
      <Modal
        open={!!rentBooking}
        title="Pay rent"
        onClose={() => setPayRentFor(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayRentFor(null)}>
              Cancel
            </Button>
            <Button onClick={confirmRent} disabled={busy}>
              {busy ? 'Paying…' : `Pay ${inr(rentBooking?.monthlyRent ?? 0)}`}
            </Button>
          </>
        }
      >
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted">Home</dt>
          <dd className="m-0 text-right font-semibold">
            Unit {rentUnit?.unitNo} · {rentUnit?.type}
          </dd>
          <dt className="text-muted">Due date</dt>
          <dd className="m-0 text-right font-semibold">{dueDate(rentBooking?.nextDueDate ?? '')}</dd>
          <dt className="text-muted">Paying from</dt>
          <dd className="m-0 text-right font-semibold">Wallet · {inr(user?.walletBalance ?? 0)}</dd>
          <dt className="border-t border-line pt-2 text-muted">Amount</dt>
          <dd className="display m-0 border-t border-line pt-2 text-right text-lg font-semibold">
            {inr(rentBooking?.monthlyRent ?? 0)}
          </dd>
        </dl>
      </Modal>

      {/* Pay a utility bill */}
      <Modal
        open={!!payBill}
        title={`Pay ${payBill ? billLabel[payBill.kind].toLowerCase() : ''} bill`}
        onClose={() => setPayBill(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayBill(null)}>
              Cancel
            </Button>
            <Button onClick={confirmBill} disabled={busy}>
              {busy ? 'Paying…' : `Pay ${inr(payBill?.amount ?? 0)}`}
            </Button>
          </>
        }
      >
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted">Billing period</dt>
          <dd className="m-0 text-right font-semibold">{payBill?.period}</dd>
          {payBill?.usage !== undefined && (
            <>
              <dt className="text-muted">Metered</dt>
              <dd className="m-0 text-right font-semibold">
                {payBill.usage} {payBill.kind === 'water' ? 'kL' : 'units'}
              </dd>
            </>
          )}
          <dt className="text-muted">Due</dt>
          <dd className="m-0 text-right font-semibold">{dueDate(payBill?.dueDate ?? '')}</dd>
          <dt className="text-muted">Paying from</dt>
          <dd className="m-0 text-right font-semibold">Wallet · {inr(user?.walletBalance ?? 0)}</dd>
          <dt className="border-t border-line pt-2 text-muted">Amount</dt>
          <dd className="display m-0 border-t border-line pt-2 text-right text-lg font-semibold">
            {inr(payBill?.amount ?? 0)}
          </dd>
        </dl>
      </Modal>

      <SuccessModal
        open={!!done}
        title={done?.title ?? ''}
        message={
          <>
            <b>{inr(done?.amount ?? 0)}</b> has been paid from your wallet for {done?.what}. Your card
            picked up <b>{(done?.points ?? 0).toLocaleString('en-IN')} RentPoints</b>
            {(done?.cashback ?? 0) > 0 && (
              <>
                {' '}
                and <b>{inr(done?.cashback ?? 0)} cashback</b>
              </>
            )}
            .
          </>
        }
        onClose={() => setDone(null)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setDone(null)}>
              Done
            </Button>
            <LinkButton to="/rewards">View rewards</LinkButton>
          </>
        }
      />
    </>
  );
}
