import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { rewards as rewardsApi } from '../../api';
import {
  useProperties,
  useRewardCard,
  useRewardTxns,
  useTenureBookings,
  useUnits,
} from '../../api/hooks';
import {
  COIN_PERKS,
  COIN_VALUE,
  MIN_REDEEM_POINTS,
  POINT_VALUE,
  TIERS,
  TIER_STYLE,
  cashValueOf,
  milestonesFor,
  monthsSince,
  tierProgress,
} from '../../lib/rewards';
import {
  EmptyState,
  ErrorNote,
  Field,
  PageHead,
  SectionTitle,
  StatCard,
  inputClass,
} from '../../components/ui/Bits';
import { Button } from '../../components/ui/Button';
import { Modal, SuccessModal } from '../../components/ui/Modal';
import { StatusPill } from '../../components/ui/Chip';
import { RewardsCard } from '../../components/RewardsCard';
import { FloorPlan } from '../../components/FloorPlan';
import { IconCard, IconCheck, IconCoin, IconGift, IconMedal, IconRupee } from '../../components/icons';
import { cx, inr, prettyDate } from '../../lib/format';

const KIND_LABEL = { points: 'points', cashback: '', coins: 'coins' } as const;

export default function Rewards() {
  const { user, role } = useAuth();
  const toast = useToast();
  const card = useRewardCard(user?.id);
  const history = useRewardTxns(user?.id);
  const leases = useTenureBookings(user?.id);
  const units = useUnits();
  const properties = useProperties();

  const [convertOpen, setConvertOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [points, setPoints] = useState('');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ title: string; message: string } | null>(null);

  // Seeded accounts created before this feature get a card on first visit.
  useEffect(() => {
    if (user && !card) void rewardsApi.card(user.id);
  }, [user, card]);

  if (!user || !card) return null;

  const { tier, next, pct, remaining } = tierProgress(card.lifetimePoints);
  const style = TIER_STYLE[tier.id];

  async function convert() {
    setError('');
    try {
      const value = Number(points);
      const { cash } = await rewardsApi.redeemPoints(user!.id, value);
      setConvertOpen(false);
      setPoints('');
      setDone({
        title: 'Points converted',
        message: `${value.toLocaleString('en-IN')} RentPoints are now ${inr(cash)} of cashback on your card.`,
      });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function moveToWallet() {
    setError('');
    try {
      const value = Number(amount);
      await rewardsApi.transferToWallet(user!.id, value);
      setMoveOpen(false);
      setAmount('');
      setDone({
        title: 'Cashback moved',
        message: `${inr(value)} is in your rent wallet — spend it on rent, furniture or a service visit.`,
      });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function claim(bookingId: string, months: number, unitNo: string) {
    try {
      const { coins, points: pts } = await rewardsApi.claimMilestone(user!.id, bookingId, months);
      toast(`${months}-month milestone claimed — ${coins} coin${coins === 1 ? '' : 's'} added.`);
      setDone({
        title: `${months} months in Unit ${unitNo}`,
        message: `${coins} loyalty coin${coins === 1 ? '' : 's'} and ${pts.toLocaleString('en-IN')} RentPoints are on your card. Coins buy the perks below.`,
      });
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  async function redeem(perkId: string) {
    try {
      const { name } = await rewardsApi.redeemPerk(user!.id, perkId);
      toast(`${name} redeemed — the credit is on your card.`);
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  return (
    <>
      <PageHead
        title="Rewards"
        subtitle="One card for every rupee you pay through RentEase — points, cashback and tenure coins."
        action={
          <span className={cx('rounded-full border px-3.5 py-1.5 text-[13px] font-semibold', style.chip)}>
            {tier.name} member
          </span>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-start">
        <RewardsCard card={card} holder={user.name} />

        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="display m-0 text-base font-semibold">
              {next ? `${remaining.toLocaleString('en-IN')} points to ${next.name}` : 'Top tier reached'}
            </h3>
            <span className="text-[12.5px] font-semibold text-muted">
              {card.lifetimePoints.toLocaleString('en-IN')} lifetime
            </span>
          </div>

          <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-green-soft">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#1E4634,#CE8A22)]"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[11.5px] font-semibold text-muted">
            <span>{tier.name}</span>
            <span>{next ? next.name : 'Platinum'}</span>
          </div>

          <p className="mt-4 mb-2 text-[12.5px] font-semibold text-muted">What {tier.name} gives you</p>
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {tier.perks.map((perk) => (
              <li key={perk} className="flex items-start gap-2.5 text-[13.5px]">
                <span className="mt-0.5 grid h-[18px] w-[18px] flex-none place-items-center rounded-full bg-green-soft text-green">
                  <IconCheck className="h-3 w-3" />
                </span>
                {perk}
              </li>
            ))}
          </ul>

          <div className="mt-[18px] flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setConvertOpen(true)} disabled={card.points < MIN_REDEEM_POINTS}>
              <IconCoin />
              Convert points
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setMoveOpen(true)} disabled={card.cashback <= 0}>
              Move cashback to wallet
            </Button>
          </div>
          {card.points < MIN_REDEEM_POINTS && (
            <p className="m-0 mt-2.5 text-[12px] text-muted">
              Points convert once you hold {MIN_REDEEM_POINTS.toLocaleString('en-IN')} — you have{' '}
              {card.points.toLocaleString('en-IN')}.
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Points earned all time"
          value={card.lifetimePoints.toLocaleString('en-IN')}
          icon={<IconMedal />}
        />
        <StatCard label="Cashback on card" value={inr(card.cashback)} icon={<IconRupee />} />
        <StatCard
          label="Coins in hand"
          value={card.coins}
          suffix={`worth up to ${inr(Math.round(card.coins * COIN_VALUE))}`}
          icon={<IconCoin />}
        />
      </div>

      {/* ------------------------- tenure milestones ------------------------- */}
      <SectionTitle title="Tenure milestones" />
      <p className="-mt-2 mb-4 max-w-[68ch] text-[13.5px] text-muted">
        Stay in the same home and both sides of the lease get paid. Coins land at 3, 6 and 12
        months — {role === 'owner' ? 'you earn them for keeping a unit let' : 'you earn them for staying put'}.
      </p>

      {leases.length === 0 ? (
        <EmptyState
          title="No lease running yet"
          message="Once a booking is active, its 3 / 6 / 12-month coin ladder shows up here."
        />
      ) : (
        <div className="grid gap-4">
          {leases.map((booking) => {
            const unit = units.find((u) => u.id === booking.unitId);
            const prop = properties.find((p) => p.id === unit?.propertyId);
            const months = monthsSince(booking.startDate);
            const ladder = milestonesFor(booking, card);

            return (
              <div key={booking.id} className="card p-5">
                <div className="flex flex-wrap items-center gap-3.5">
                  <span className="h-12 w-14 flex-none rounded-lg border border-green-line bg-green-soft p-1.5">
                    {unit && <FloorPlan type={unit.floorPlanType} labels={false} className="h-full w-full" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <b className="block text-sm font-semibold">
                      Unit {unit?.unitNo} · {unit?.type} — {prop?.name}
                    </b>
                    <span className="block text-[12.5px] text-muted">
                      {booking.renterId === user.id ? 'Renting' : 'Let out'} since{' '}
                      {prettyDate(booking.startDate)} · {months} month{months === 1 ? '' : 's'} in
                    </span>
                  </div>
                  <StatusPill tone={booking.status === 'active' ? 'ok' : 'muted'}>
                    {booking.status === 'active' ? 'Active lease' : 'Ended'}
                  </StatusPill>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {ladder.map(({ milestone, claimed, claimable }) => (
                    <div
                      key={milestone.months}
                      className={cx(
                        'rounded-xl border p-4',
                        claimed
                          ? 'border-green-line bg-green-soft'
                          : claimable
                            ? 'border-[#EBCF9C] bg-honey-soft'
                            : 'border-line bg-[#F7F9F5]',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <b className="display text-[15px] font-semibold">{milestone.months} months</b>
                        <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-honey">
                          <IconCoin className="h-4 w-4" />
                          {milestone.coins}
                        </span>
                      </div>
                      <p className="m-0 mt-1 text-[12.5px] text-muted">{milestone.blurb}</p>
                      <p className="m-0 mt-0.5 text-[12.5px] font-semibold text-green">
                        +{milestone.points.toLocaleString('en-IN')} points
                      </p>

                      <div className="mt-3">
                        {claimed ? (
                          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-green">
                            <IconCheck className="h-3.5 w-3.5" />
                            Claimed
                          </span>
                        ) : claimable ? (
                          <Button
                            size="sm"
                            variant="honey"
                            block
                            onClick={() => claim(booking.id, milestone.months, unit?.unitNo ?? '')}
                          >
                            Claim {milestone.coins} coin{milestone.coins === 1 ? '' : 's'}
                          </Button>
                        ) : (
                          <span className="text-[12.5px] text-muted">
                            {milestone.months - months} month{milestone.months - months === 1 ? '' : 's'} to go
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------------------- coin store ---------------------------- */}
      <SectionTitle title="Spend your coins" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {COIN_PERKS.map((perk) => {
          const affordable = card.coins >= perk.coins;
          return (
            <div key={perk.id} className="card flex flex-col p-5">
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-honey-soft text-honey">
                <IconGift />
              </span>
              <h3 className="display m-0 text-[15px] font-semibold">{perk.name}</h3>
              <p className="m-0 mt-1 flex-1 text-[12.5px] leading-snug text-muted">{perk.blurb}</p>
              <div className="mt-3.5 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-honey">
                  <IconCoin className="h-[18px] w-[18px]" />
                  {perk.coins} coin{perk.coins === 1 ? '' : 's'}
                </span>
                <Button size="sm" disabled={!affordable} onClick={() => redeem(perk.id)}>
                  Redeem
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ------------------------------ tiers ------------------------------- */}
      <SectionTitle title="Membership tiers" />
      <p className="-mt-2 mb-4 max-w-[68ch] text-[13.5px] text-muted">
        No subscription fee — the tier comes from what you already pay through RentEase. Every rupee of
        rent earns points, and the tier sets your cashback rate and your marketplace discount.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TIERS.map((t) => {
          const current = t.id === tier.id;
          const reached = card.lifetimePoints >= t.from;
          return (
            <div
              key={t.id}
              className={cx(
                'card flex flex-col p-5',
                current && 'border-green ring-2 ring-green/15',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="display m-0 text-base font-semibold">{t.name}</h3>
                {current ? (
                  <StatusPill tone="ok">You</StatusPill>
                ) : reached ? (
                  <StatusPill tone="muted">Passed</StatusPill>
                ) : (
                  <StatusPill tone="wait">{t.from.toLocaleString('en-IN')} pts</StatusPill>
                )}
              </div>
              <div className="display mt-2.5 text-[26px] leading-none font-semibold">
                {Math.round(t.cashbackRate * 100)}%
                <small className="font-sans text-[13px] font-medium text-muted"> cashback</small>
              </div>
              <p className="m-0 mt-1 text-[12.5px] font-semibold text-honey">
                {t.shopDiscount > 0 ? `${Math.round(t.shopDiscount * 100)}% off the marketplace` : 'Standard prices'}
              </p>
              <ul className="m-0 mt-3.5 flex list-none flex-col gap-1.5 p-0">
                {t.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-[12.5px] text-muted">
                    <span className="mt-[7px] h-1 w-1 flex-none rounded-full bg-green" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* ----------------------------- activity ----------------------------- */}
      <SectionTitle title="Reward activity" />
      {history.length === 0 ? (
        <EmptyState
          title="Nothing earned yet"
          message="Pay rent or place a marketplace order and the points land here the same day."
        />
      ) : (
        <div className="card overflow-hidden">
          {history.map((t) => (
            <div key={t.id} className="flex items-center gap-3.5 border-b border-line px-[18px] py-3.5 last:border-b-0">
              <span
                className={cx(
                  'grid h-10 w-10 flex-none place-items-center rounded-full',
                  t.kind === 'coins' ? 'bg-honey-soft text-honey' : 'bg-green-soft text-green',
                )}
              >
                {t.kind === 'coins' ? <IconCoin className="h-[18px] w-[18px]" /> : <IconCard className="h-[18px] w-[18px]" />}
              </span>
              <div className="min-w-0 flex-1">
                <b className="block text-sm font-semibold">{t.note}</b>
                <span className="block text-[12.5px] text-muted">{prettyDate(t.date)}</span>
              </div>
              <span
                className={cx(
                  'display text-[15px] font-semibold',
                  t.delta > 0 ? 'text-green' : 'text-rented',
                )}
              >
                {t.delta > 0 ? '+' : '−'}
                {t.kind === 'cashback'
                  ? inr(Math.abs(t.delta))
                  : `${Math.abs(t.delta).toLocaleString('en-IN')} ${KIND_LABEL[t.kind]}`}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ----------------------------- modals ------------------------------ */}
      <Modal
        open={convertOpen}
        title="Convert points to cashback"
        onClose={() => setConvertOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setConvertOpen(false)}>
              Cancel
            </Button>
            <Button onClick={convert}>Convert</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          <p className="m-0 text-[13.5px] text-muted">
            {card.points.toLocaleString('en-IN')} points on your card · 100 points ={' '}
            <b className="font-semibold text-ink">{inr(100 * POINT_VALUE)}</b>. Converts in blocks of 100,
            from {MIN_REDEEM_POINTS.toLocaleString('en-IN')} up.
          </p>
          <Field label="Points to convert" hint={points ? `You get ${inr(cashValueOf(Number(points) || 0))}` : undefined}>
            <input
              className={inputClass}
              type="number"
              min={MIN_REDEEM_POINTS}
              step={100}
              autoFocus
              placeholder={String(MIN_REDEEM_POINTS)}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </Field>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setPoints(String(Math.floor(card.points / 100) * 100))}>
              Use all {(Math.floor(card.points / 100) * 100).toLocaleString('en-IN')} points
            </Button>
          </div>
          {error && <ErrorNote>{error}</ErrorNote>}
        </div>
      </Modal>

      <Modal
        open={moveOpen}
        title="Move cashback to wallet"
        onClose={() => setMoveOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setMoveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={moveToWallet}>Move</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3.5">
          <p className="m-0 text-[13.5px] text-muted">
            Cashback on card: <b className="font-semibold text-ink">{inr(card.cashback)}</b>. In the wallet
            it pays rent, furniture and service visits.
          </p>
          <Field label="Amount (₹)">
            <input
              className={inputClass}
              type="number"
              min={1}
              autoFocus
              placeholder={String(card.cashback)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Field>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setAmount(String(card.cashback))}>
              Move all {inr(card.cashback)}
            </Button>
          </div>
          {error && <ErrorNote>{error}</ErrorNote>}
        </div>
      </Modal>

      <SuccessModal
        open={!!done}
        title={done?.title ?? ''}
        message={done?.message ?? ''}
        onClose={() => setDone(null)}
        actions={<Button onClick={() => setDone(null)}>Done</Button>}
      />
    </>
  );
}
