import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { cart } from '../../api';
import { useFurniture } from '../../api/hooks';
import { FloorPlan, UNIT_TYPES } from '../../components/FloorPlan';
import { PageHead, SectionTitle } from '../../components/ui/Bits';
import { Button, LinkButton } from '../../components/ui/Button';
import { ProductArt } from '../../components/ProductArt';
import { BedFitRoom } from '../../components/BedFitRoom';
import { StatusPill } from '../../components/ui/Chip';
import { IconClose, IconPlus } from '../../components/icons';
import { BUNDLES, bundleFor, bundleTotals } from '../../lib/planner';
import { BEDS, CLEARANCES, planBedrooms } from '../../lib/bedfit';
import type { BedId, FitStatus } from '../../lib/bedfit';
import { cx, ftin, inr } from '../../lib/format';
import type { UnitType } from '../../types';

const FIT: Record<FitStatus, { tone: 'ok' | 'wait' | 'rented'; label: string }> = {
  RECOMMENDED: { tone: 'ok', label: 'Recommended' },
  FITS_WITH_CAVEAT: { tone: 'wait', label: 'Fits, but tight' },
  DOES_NOT_FIT: { tone: 'rented', label: 'Does not fit' },
};

export default function Planner() {
  const [params, setParams] = useSearchParams();
  const furniture = useFurniture();
  const toast = useToast();

  const initial = (params.get('type') as UnitType) ?? '2 BHK';
  const [type, setType] = useState<UnitType>(UNIT_TYPES.includes(initial) ? initial : '2 BHK');
  const [mode, setMode] = useState<'rent' | 'buy'>('rent');
  /** Bundle lines the shopper has taken out, by furniture id. */
  const [removed, setRemoved] = useState<string[]>([]);
  const [thinking, setThinking] = useState(false);
  const [roomIdx, setRoomIdx] = useState(0);
  /** Bed sizes the shopper is previewing instead of the suggestion, by bedroom id. */
  const [bedPick, setBedPick] = useState<Record<string, BedId>>({});

  // A short "generating" beat so the stub reads as a planner, not a lookup.
  useEffect(() => {
    setThinking(true);
    const t = setTimeout(() => setThinking(false), 420);
    return () => clearTimeout(t);
  }, [type]);

  const bundle = BUNDLES[type];
  const lines = bundleFor(type, furniture);
  const kept = lines.filter((l) => !removed.includes(l.item.id));
  const dropped = lines.filter((l) => removed.includes(l.item.id));
  const totals = bundleTotals(kept);

  const plans = planBedrooms(type);
  const plan = plans[Math.min(roomIdx, plans.length - 1)];
  const suggested = plan.options.find((o) => o.bed === plan.recommended) ?? plan.options[0];
  const shown = plan.options.find((o) => o.bed === bedPick[plan.room.id]) ?? suggested;
  const queen = plan.options.find((o) => o.bed === 'queen');

  function pick(next: UnitType) {
    setType(next);
    setRemoved([]);
    setRoomIdx(0);
    setBedPick({});
    setParams({ type: next }, { replace: true });
  }

  function drop(id: string) {
    setRemoved((prev) => [...prev, id]);
  }

  function restore(id: string) {
    setRemoved((prev) => prev.filter((x) => x !== id));
  }

  async function addBundle() {
    if (kept.length === 0) return;
    await cart.addMany(
      kept.map((l) => ({ kind: 'furniture' as const, refId: l.item.id, mode, qty: l.qty })),
    );
    toast(`Bundle added — ${kept.length} items on ${mode === 'rent' ? 'monthly rent' : 'purchase'}.`);
  }

  return (
    <>
      <PageHead
        title="Layout planner"
        subtitle="Pick a floor plan and RentEase lays out furniture that fits, then prices the whole set."
      />

      <div className="mb-5 rounded-card border border-honey/40 bg-honey-soft/50 px-4 py-3 text-[13px] text-ink">
        <b className="font-semibold">Proof of concept.</b> Layouts here are pre-computed per plan type —
        there is no model running behind them yet.
      </div>

      <SectionTitle title="1. Choose your floor plan" className="mt-0" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {UNIT_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => pick(t)}
            aria-pressed={type === t}
            className={cx(
              'card cursor-pointer p-3 text-left transition-colors',
              type === t ? 'border-green bg-green-soft' : 'hover:border-green-line',
            )}
          >
            <FloorPlan type={t} labels={false} className="h-14 w-full" />
            <p className="m-0 mt-2 text-center text-[13px] font-semibold">{t}</p>
          </button>
        ))}
      </div>

      <SectionTitle title="2. Your suggested layout" />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="overflow-hidden rounded-card bg-[linear-gradient(120deg,#153726,#245240)] p-5 sm:p-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="m-0 text-[12.5px] font-semibold text-honey">
                {thinking ? 'Laying out the room…' : 'Powered by AI'}
              </p>
              <h3 className="display m-0 mt-1 text-xl font-semibold text-[#F3F8F1]">
                {bundle.headline}
              </h3>
            </div>
            <span className="rounded-full border border-honey/40 bg-white/5 px-3 py-1 text-[12px] font-semibold text-honey">
              {type}
            </span>
          </div>

          <div
            className={cx(
              'rounded-xl border border-honey/30 bg-white/5 p-4 transition-opacity',
              thinking && 'opacity-40',
            )}
          >
            <FloorPlan
              type={type}
              tone="light"
              furnished
              className="mx-auto block h-52 w-full max-w-xl sm:h-64"
              title={`Suggested furniture layout for a ${type}`}
            />
          </div>

          <p className="m-0 mt-4 max-w-[62ch] text-sm leading-relaxed text-[#B9CDB6]">{bundle.note}</p>
        </div>

        <aside className="card p-5 lg:sticky lg:top-[85px]">
          <h3 className="display m-0 text-base font-semibold">Suggested bundle</h3>
          <p className="m-0 mt-1 text-[12.5px] text-muted">
            {kept.reduce((n, l) => n + l.qty, 0)} pieces for a {type}
            {dropped.length > 0 && ` · ${dropped.length} removed`}
          </p>

          <div className="mt-4 mb-4 flex gap-1 rounded-[10px] border border-line bg-[#F3F6F1] p-1">
            {(['rent', 'buy'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
                className={cx(
                  'flex-1 cursor-pointer rounded-lg border-0 px-3 py-2 text-[13px] font-semibold transition-colors',
                  mode === m ? 'bg-green text-[#F1F6EF]' : 'bg-transparent text-muted hover:text-green',
                )}
              >
                {m === 'rent' ? 'Rent monthly' : 'Buy outright'}
              </button>
            ))}
          </div>

          {kept.length === 0 ? (
            <p className="m-0 rounded-[10px] border border-line bg-[#F3F6F1] px-3.5 py-3 text-[13px] text-muted">
              You have taken everything out of this bundle. Add a piece back below, or browse the full
              catalogue instead.
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {kept.map((l) => (
                <li key={l.item.id} className="flex items-center gap-3">
                  <span className="h-10 w-12 flex-none rounded-lg border border-line bg-green-soft p-1">
                    <ProductArt art={l.item.image} className="h-full w-full" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block text-[13.5px] font-semibold">
                      {l.item.name}
                      {l.qty > 1 ? ` × ${l.qty}` : ''}
                    </b>
                    <span className="block text-[12px] text-muted">{l.where}</span>
                  </span>
                  <span className="text-[13px] font-semibold whitespace-nowrap">
                    {mode === 'rent'
                      ? `${inr(l.item.rentPerMonth * l.qty)}/mo`
                      : inr(l.item.buyPrice * l.qty)}
                  </span>
                  <button
                    type="button"
                    onClick={() => drop(l.item.id)}
                    aria-label={`Remove ${l.item.name} from the bundle`}
                    title="Remove from bundle"
                    className="grid h-7 w-7 flex-none cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-muted hover:bg-rented-soft hover:text-rented"
                  >
                    <IconClose className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {dropped.length > 0 && (
            <div className="mt-4 border-t border-line pt-3.5">
              <div className="mb-2.5 flex items-center justify-between gap-3">
                <p className="m-0 text-[12.5px] font-semibold text-muted">Removed</p>
                <button
                  type="button"
                  onClick={() => setRemoved([])}
                  className="cursor-pointer border-0 bg-transparent p-0 text-[12.5px] font-semibold text-green hover:underline"
                >
                  Restore all
                </button>
              </div>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {dropped.map((l) => (
                  <li key={l.item.id} className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-[13px] text-muted line-through">
                      {l.item.name}
                      {l.qty > 1 ? ` × ${l.qty}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => restore(l.item.id)}
                      aria-label={`Add ${l.item.name} back to the bundle`}
                      className="flex flex-none cursor-pointer items-center gap-1.5 rounded-lg border border-green-line bg-panel px-2.5 py-1 text-[12.5px] font-semibold text-green hover:bg-green-soft"
                    >
                      <IconPlus className="h-3 w-3" />
                      Add back
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 flex items-baseline justify-between border-t border-line pt-3.5">
            <span className="text-[13px] text-muted">Bundle total</span>
            <span className="display text-[20px] font-semibold">
              {mode === 'rent' ? (
                <>
                  {inr(totals.rent)}
                  <span className="font-sans text-[12px] font-normal text-muted"> / month</span>
                </>
              ) : (
                inr(totals.buy)
              )}
            </span>
          </div>

          <Button block className="mt-4" onClick={addBundle} disabled={kept.length === 0}>
            {kept.length === 0 ? 'Bundle is empty' : 'Add bundle to cart'}
          </Button>
          <LinkButton to="/furniture" variant="ghost" block className="mt-2">
            Browse everything instead
          </LinkButton>
        </aside>
      </div>

      <SectionTitle title="3. Where the bed goes" />
      <p className="m-0 mb-4 max-w-[70ch] text-[13.5px] text-muted">
        For each bedroom, the largest bed that leaves {ftin(CLEARANCES.minSide)} to walk down both sides
        and {ftin(CLEARANCES.foot)} past the foot. Room sizes are typical for a {type}, not measured from
        your flat, so check the walls before you order.
      </p>

      {plans.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {plans.map((p, i) => (
            <button
              key={p.room.id}
              type="button"
              onClick={() => setRoomIdx(i)}
              aria-pressed={plan === p}
              className={cx(
                'cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
                plan === p
                  ? 'border-green bg-green text-[#F1F6EF]'
                  : 'border-green-line bg-panel text-green hover:bg-green-soft',
              )}
            >
              {p.room.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-start">
        <div className="card p-4 sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h3 className="display m-0 text-base font-semibold">{plan.room.label}</h3>
              <p className="m-0 mt-0.5 text-[12.5px] text-muted">
                {ftin(plan.room.width)} × {ftin(plan.room.depth)} ·{' '}
                {Math.round(plan.room.width * plan.room.depth)} sqft
              </p>
            </div>
            <FloorPlan
              type={type}
              labels={false}
              highlight={plan.room.box}
              className="h-12 w-[72px] flex-none"
              title={`Where the ${plan.room.label.toLowerCase()} sits in the ${type}`}
            />
          </div>

          <BedFitRoom plan={plan} option={shown} className="mx-auto block h-auto w-full max-w-md" />

          <ul className="m-0 mt-3 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0 text-[12px] text-muted">
            <li className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-green" aria-hidden />
              Walkway, {ftin(CLEARANCES.minSide)} or more
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-rented" aria-hidden />
              Too tight to walk
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-2.5 w-3 rounded-sm border border-dashed border-green" aria-hidden />
              Door swing
            </li>
            <li className="flex items-center gap-1.5">
              <span className="h-2.5 w-3 rounded-sm border border-muted bg-panel" aria-hidden />
              Side table
            </li>
          </ul>
        </div>

        <aside className="card p-5">
          <p className="m-0 text-[12.5px] font-semibold text-muted">Suggested for this room</p>
          <div className="mt-1 flex flex-wrap items-center gap-2.5">
            <span className="display text-[22px] font-semibold">{suggested.label} bed</span>
            <StatusPill tone={FIT[suggested.status].tone}>{FIT[suggested.status].label}</StatusPill>
          </div>

          <p className="m-0 mt-4 mb-2 text-[12.5px] font-semibold text-muted">Compare sizes</p>
          <div className="flex flex-col gap-2">
            {plan.options.map((o) => {
              const tight = o.sideA === null || o.sideB === null ? null : Math.min(o.sideA, o.sideB);
              return (
                <button
                  key={o.bed}
                  type="button"
                  onClick={() => setBedPick((prev) => ({ ...prev, [plan.room.id]: o.bed }))}
                  aria-pressed={shown.bed === o.bed}
                  className={cx(
                    'flex cursor-pointer items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left transition-colors',
                    shown.bed === o.bed ? 'border-green bg-green-soft' : 'border-line bg-panel hover:border-green-line',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <b className="block text-[13.5px] font-semibold">{o.label}</b>
                    <span className="block text-[12px] text-muted">
                      {ftin(BEDS[o.bed].width)} × {ftin(BEDS[o.bed].length)}
                      {tight !== null && ` · ${ftin(tight)} tightest side`}
                    </span>
                  </span>
                  <StatusPill tone={FIT[o.status].tone}>{FIT[o.status].label}</StatusPill>
                </button>
              );
            })}
          </div>

          <p className="m-0 mt-4 text-[13px] leading-relaxed text-ink">{shown.notes}</p>

          <div className="mt-4 border-t border-line pt-3.5">
            <p className="m-0 text-[12.5px] font-semibold text-muted">Headboard</p>
            <p className="m-0 mt-1 text-[13px] leading-relaxed">{plan.reasoning}</p>
          </div>

          <p className="m-0 mt-4 rounded-[10px] border border-line bg-[#F3F6F1] px-3.5 py-3 text-[12.5px] text-muted">
            {plan.recommended === 'queen'
              ? 'The queen bed in the bundle above is the right size for this room.'
              : queen && queen.status !== 'DOES_NOT_FIT'
                ? 'We only rent a queen bed for now. It fits here too, with more room on each side.'
                : 'We only rent a queen bed for now, and it does not suit this room.'}
          </p>
        </aside>
      </div>
    </>
  );
}
