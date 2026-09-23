import type { ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRenterBookings } from '../api/hooks';
import { Button } from './ui/Button';
import { cx } from '../lib/format';
import {
  IconCard,
  IconClock,
  IconDoc,
  IconGift,
  IconGrid,
  IconHeart,
  IconHelp,
  IconHome,
  IconInfo,
  IconKey,
  IconList,
  IconRupee,
  IconSearch,
  IconSofa,
  IconSparkle,
  IconStar,
  IconWrench,
} from './icons';
import type { Role } from '../types';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
}

const NAV: Record<Role, { label: string; items: NavItem[]; promo: { h: string; p: string; b: string; to: string } }> = {
  owner: {
    label: 'Owner menu',
    items: [
      { to: '/owner', label: 'Overview', icon: <IconHome />, end: true },
      { to: '/owner/listings', label: 'My listings', icon: <IconGrid /> },
      { to: '/owner/requests', label: 'Requests', icon: <IconList /> },
      { to: '/owner/wallet', label: 'Rent wallet', icon: <IconCard /> },
      { to: '/rewards', label: 'Rewards', icon: <IconGift /> },
      { to: '/furniture', label: 'Furniture & décor', icon: <IconSofa /> },
      { to: '/decoration', label: 'Decoration', icon: <IconSparkle /> },
      { to: '/services', label: 'Home services', icon: <IconWrench /> },
    ],
    promo: {
      h: 'Furnish before you list',
      p: 'Add beds and almirahs on rent to make units move-in ready.',
      b: 'Explore furniture',
      to: '/furniture',
    },
  },
  renter: {
    label: 'Renter menu',
    items: [
      { to: '/renter', label: 'Discover', icon: <IconHome />, end: true },
      { to: '/renter/search', label: 'Discover', icon: <IconSearch /> },
      { to: '/renter/tours', label: 'My tours', icon: <IconClock /> },
      { to: '/renter/bookings', label: 'Bookings & rent', icon: <IconRupee /> },
      { to: '/rewards', label: 'Rewards', icon: <IconGift /> },
      { to: '/furniture', label: 'Furniture & décor', icon: <IconSofa /> },
      { to: '/decoration', label: 'Decoration', icon: <IconSparkle /> },
      { to: '/services', label: 'Home services', icon: <IconWrench /> },
      { to: '/planner', label: 'Layout planner', icon: <IconGrid /> },
    ],
    promo: {
      h: 'Design with AI',
      p: 'Turn any floor plan into a furnished layout in seconds.',
      b: 'Open planner',
      to: '/planner',
    },
  },
  guest: {
    label: 'Shopper menu',
    items: [
      { to: '/furniture', label: 'Furniture', icon: <IconSofa /> },
      { to: '/decor', label: 'Festival & décor', icon: <IconStar /> },
      { to: '/decoration', label: 'Decoration', icon: <IconSparkle /> },
      { to: '/services', label: 'Home services', icon: <IconWrench /> },
      { to: '/planner', label: 'Layout planner', icon: <IconGrid /> },
      { to: '/orders', label: 'Your history', icon: <IconDoc /> },
      { to: '/rewards', label: 'Rewards', icon: <IconGift /> },
      { to: '/renter/search', label: 'Browse homes', icon: <IconHeart /> },
    ],
    promo: {
      h: 'Unlock more features',
      p: 'Become a verified owner or renter to list, tour and rent a home.',
      b: 'Upgrade account',
      to: '/upgrade',
    },
  },
};

/** Shown to every role, under the promo card. */
const SUPPORT: NavItem[] = [
  { to: '/help', label: 'Help & support', icon: <IconHelp /> },
  { to: '/about', label: 'About RentEase', icon: <IconInfo /> },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    'flex items-center gap-[11px] rounded-[10px] px-3 py-2.5 text-[14.5px] font-medium no-underline',
    '[&_svg]:h-[19px] [&_svg]:w-[19px] [&_svg]:flex-none',
    isActive
      ? 'bg-green text-[#F1F6EF] [&_svg]:text-honey'
      : 'text-ink hover:bg-green-soft [&_svg]:text-green [&_svg]:opacity-85',
  );

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const config = NAV[role ?? 'guest'];
  // Once a lease is live, /renter stops being discovery and becomes the home.
  const hasHome = useRenterBookings(user?.id).some((b) => b.status === 'active');

  return (
    <aside className="h-full border-r border-line bg-[#F0F4EE] px-4 py-[22px]">
      <p className="mx-2.5 mb-2.5 text-xs font-semibold text-muted">{config.label}</p>
      <ul className="m-0 mb-[26px] flex list-none flex-col gap-[3px] p-0">
        {config.items.map((item) => {
          const home = hasHome && item.to === '/renter';
          return (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} onClick={onNavigate} className={linkClass}>
                {home ? <IconKey /> : item.icon}
                {home ? 'Your home' : item.label}
              </NavLink>
            </li>
          );
        })}
      </ul>

      <div className="mx-1.5 mt-2 rounded-xl bg-green p-[15px] text-[#E9F1E6]">
        <h4 className="display m-0 mb-1.5 text-[15px] font-semibold">{config.promo.h}</h4>
        <p className="m-0 mb-3 text-[12.5px] leading-snug text-[#B9CDB6]">{config.promo.p}</p>
        <Button
          variant="honey"
          size="sm"
          block
          onClick={() => {
            navigate(config.promo.to);
            onNavigate?.();
          }}
        >
          {config.promo.b}
        </Button>
      </div>

      <p className="mx-2.5 mt-[26px] mb-2.5 text-xs font-semibold text-muted">Support</p>
      <ul className="m-0 flex list-none flex-col gap-[3px] p-0">
        {SUPPORT.map((item) => (
          <li key={item.to}>
            <NavLink to={item.to} onClick={onNavigate} className={linkClass}>
              {item.icon}
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}
