import type { ReactNode } from 'react';
import { TIER_STYLE, cashValueOf, tierOf } from '../lib/rewards';
import { IconCoin } from './icons';
import { cx, inr } from '../lib/format';
import type { RewardCard } from '../types';

/** `5241 8830 1174 6602` → `5241 •••• •••• 6602`. */
function maskNumber(number: string) {
  const groups = number.split(' ');
  if (groups.length < 4) return number;
  return `${groups[0]} •••• •••• ${groups[3]}`;
}

function issuedLabel(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(2)}`;
}

/**
 * The one rewards card every member carries — points, cashback and coins on a
 * single face, tiered by lifetime points.
 */
export function RewardsCard({
  card,
  holder,
  compact,
  className,
}: {
  card: RewardCard;
  holder: string;
  compact?: boolean;
  className?: string;
}) {
  const tier = tierOf(card.lifetimePoints);
  const style = TIER_STYLE[tier.id];

  return (
    <div
      className={cx(
        'relative overflow-hidden rounded-card bg-[linear-gradient(150deg,#1E4634_0%,#153726_58%,#102b1e_100%)] text-[#EAF2E7]',
        compact ? 'p-[18px]' : 'p-[22px] sm:p-6',
        className,
      )}
    >
      {/* Same concentric honey rings as the rent wallet, tinted by tier. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-14 h-[210px] w-[210px] rounded-full border"
        style={{ borderColor: `${style.ring}55` }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-6 -right-4 h-[130px] w-[130px] rounded-full border"
        style={{ borderColor: `${style.ring}35` }}
      />

      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="display text-[15px] font-semibold tracking-[-.01em]">
            Rent<b className="font-bold text-honey">Ease</b> Rewards
          </div>
          <div className="mt-0.5 text-[11.5px] tracking-[.14em] text-[#9FB79C] uppercase">
            Member card
          </div>
        </div>
        <span
          className="rounded-full border px-3 py-1 text-[11.5px] font-bold tracking-[.08em] uppercase"
          style={{ borderColor: `${style.ring}80`, color: style.text, background: `${style.ring}22` }}
        >
          {tier.name}
        </span>
      </div>

      {/* EMV-style chip, purely decorative. */}
      <div className="relative mt-5 flex items-center gap-3.5">
        <span
          aria-hidden
          className="h-[26px] w-[34px] flex-none rounded-[5px] border border-honey/45 bg-[linear-gradient(145deg,#E5C689,#C79135)]"
        >
          <span className="mx-auto block h-full w-px bg-[#8C6A2A]/45" />
        </span>
        <span className="font-mono text-[15px] tracking-[.16em] text-[#D8E6D5] sm:text-[17px]">
          {maskNumber(card.number)}
        </span>
      </div>

      <div
        className={cx(
          'relative mt-5 grid grid-cols-3 gap-2 border-t border-white/12 pt-4',
          compact && 'mt-4 pt-3.5',
        )}
      >
        <Balance
          label="RentPoints"
          value={card.points.toLocaleString('en-IN')}
          foot={`worth ${inr(cashValueOf(card.points))}`}
          compact={compact}
        />
        <Balance
          label="Cashback"
          value={inr(card.cashback)}
          foot="ready to move"
          compact={compact}
        />
        <Balance
          label="Coins"
          value={
            <span className="inline-flex items-center gap-1.5">
              <IconCoin className="h-[18px] w-[18px] text-honey" />
              {card.coins}
            </span>
          }
          foot="tenure rewards"
          compact={compact}
        />
      </div>

      {!compact && (
        <div className="relative mt-5 flex items-end justify-between gap-3 text-[11.5px] tracking-[.1em] text-[#9FB79C] uppercase">
          <span className="truncate">{holder}</span>
          <span className="flex-none">Member since {issuedLabel(card.issuedOn)}</span>
        </div>
      )}
    </div>
  );
}

function Balance({
  label,
  value,
  foot,
  compact,
}: {
  label: string;
  value: ReactNode;
  foot: string;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] tracking-[.08em] text-[#9FB79C] uppercase">{label}</div>
      <div className={cx('display font-semibold', compact ? 'text-[19px]' : 'text-[22px] sm:text-[25px]')}>
        {value}
      </div>
      {!compact && <div className="mt-0.5 text-[11.5px] text-[#8CA68A]">{foot}</div>}
    </div>
  );
}
