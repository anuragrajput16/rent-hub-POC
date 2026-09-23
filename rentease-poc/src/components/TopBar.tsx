import { Link, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../context/AuthContext';
import { useCartCount, useRewardCard } from '../api/hooks';
import { NotificationBell } from './NotificationBell';
import { UserMenu } from './UserMenu';
import { BrandMark, IconCart, IconCoin, IconMenu } from './icons';
import { inr } from '../lib/format';
import type { Role } from '../types';

export function TopBar({ onMenu }: { onMenu?: () => void }) {
  const { user, role, switchRole } = useAuth();
  const cartCount = useCartCount();
  const rewardCard = useRewardCard(user?.id);
  const navigate = useNavigate();

  async function pick(next: Role) {
    const u = await switchRole(next);
    navigate(homeFor(u.role));
  }

  return (
    <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-green-deep bg-green px-3 py-3.5 text-[#EEF3EC] sm:gap-5 sm:px-[26px]">
      {onMenu && (
        <button
          type="button"
          onClick={onMenu}
          aria-label="Open menu"
          className="grid h-9 w-9 flex-none cursor-pointer place-items-center rounded-lg border-0 bg-white/10 text-[#EEF3EC] lg:hidden"
        >
          <IconMenu className="h-5 w-5" />
        </button>
      )}

      <Link
        to={homeFor(role)}
        className="display flex items-center gap-[11px] text-xl font-bold tracking-[-.01em] text-[#EEF3EC] no-underline"
      >
        <BrandMark className="block h-[34px] w-[34px] flex-none" />
        <span className="hidden sm:inline">
          Rent<b className="font-bold text-honey">Ease</b>
        </span>
      </Link>

      {/* Demo role switch — hops between the three seeded accounts. */}
      <div
        className="mx-auto flex gap-0.5 rounded-full bg-black/25 p-1"
        role="tablist"
        aria-label="Choose role"
      >
        {(['owner', 'renter', 'guest'] as Role[]).map((r) => {
          const selected = role === r;
          return (
            <button
              key={r}
              role="tab"
              aria-selected={selected}
              onClick={() => pick(r)}
              className={
                'flex cursor-pointer items-center gap-2 rounded-full border-0 px-2 py-2 text-xs font-semibold transition-colors sm:px-5 sm:text-sm ' +
                (selected ? 'bg-honey text-[#2A1B04]' : 'bg-transparent text-[#CBDAC9] hover:text-white')
              }
            >
              <span
                className={
                  'hidden h-[7px] w-[7px] rounded-full bg-current sm:block ' +
                  (selected ? '' : 'opacity-65')
                }
              />
              <span className="capitalize">{r}</span>
            </button>
          );
        })}
      </div>

      {/* Rewards balance — points, with cashback alongside where there's room. */}
      {rewardCard && (
        <Link
          to="/rewards"
          aria-label={`Rewards: ${rewardCard.points.toLocaleString('en-IN')} RentPoints, ${inr(rewardCard.cashback)} cashback`}
          title="Your rewards card"
          className="flex flex-none items-center gap-1.5 rounded-lg bg-white/10 px-2 py-2 text-[#EEF3EC] no-underline hover:bg-white/20 sm:gap-2 sm:px-2.5"
        >
          <IconCoin className="h-[18px] w-[18px] flex-none text-honey" />
          <span className="display text-[13px] leading-none font-semibold">
            {rewardCard.points.toLocaleString('en-IN')}
          </span>
          {rewardCard.cashback > 0 && (
            <span className="hidden text-[12.5px] leading-none font-medium text-[#A9BFA9] lg:inline">
              · {inr(rewardCard.cashback)}
            </span>
          )}
        </Link>
      )}

      <NotificationBell />

      <Link
        to="/cart"
        aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
        className="relative grid h-9 w-9 flex-none place-items-center rounded-lg bg-white/10 text-[#EEF3EC] no-underline hover:bg-white/20"
      >
        <IconCart className="h-[18px] w-[18px]" />
        {cartCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-honey px-1 text-[11px] font-bold text-[#2A1B04]">
            {cartCount}
          </span>
        )}
      </Link>

      <UserMenu />
    </header>
  );
}
