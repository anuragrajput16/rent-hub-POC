/**
 * Top-bar account dropdown: who you are, the pages that belong to your role,
 * the shared ones, and a sign-out that asks first.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './ui/Chip';
import { LogoutConfirm } from './LogoutConfirm';
import {
  IconCard,
  IconChevron,
  IconClock,
  IconDoc,
  IconBell,
  IconGift,
  IconGrid,
  IconHelp,
  IconHome,
  IconInfo,
  IconList,
  IconLogout,
  IconRupee,
  IconSofa,
  IconStar,
  IconUser,
} from './icons';
import type { Role } from '../types';

interface MenuLink {
  to: string;
  label: string;
  icon: ReactNode;
}

const ROLE_LABEL: Record<Role, string> = {
  owner: 'Property owner',
  renter: 'Renter',
  guest: 'Guest shopper',
};

/** The pages that only make sense for the role you are signed in as. */
const ROLE_LINKS: Record<Role, MenuLink[]> = {
  owner: [
    { to: '/owner', label: 'Owner overview', icon: <IconHome /> },
    { to: '/owner/listings', label: 'My listings', icon: <IconGrid /> },
    { to: '/owner/requests', label: 'Requests', icon: <IconList /> },
    { to: '/owner/wallet', label: 'Rent wallet', icon: <IconCard /> },
  ],
  renter: [
    { to: '/renter', label: 'Your home', icon: <IconHome /> },
    { to: '/renter/bookings', label: 'Bookings & rent', icon: <IconRupee /> },
    { to: '/renter/tours', label: 'My tours', icon: <IconClock /> },
  ],
  guest: [
    { to: '/upgrade', label: 'Upgrade account', icon: <IconStar /> },
    { to: '/furniture', label: 'Marketplace', icon: <IconSofa /> },
  ],
};

/** Everything anyone signed in can open. */
const SHARED_LINKS: MenuLink[] = [
  { to: '/notifications', label: 'Notifications', icon: <IconBell /> },
  { to: '/rewards', label: 'Rewards card', icon: <IconGift /> },
  { to: '/orders', label: 'Orders & receipts', icon: <IconDoc /> },
  { to: '/help', label: 'Help & support', icon: <IconHelp /> },
  { to: '/about', label: 'About RentEase', icon: <IconInfo /> },
];

export function UserMenu() {
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const item =
    'flex items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-[13.5px] font-medium text-ink no-underline hover:bg-green-soft [&_svg]:h-[17px] [&_svg]:w-[17px] [&_svg]:flex-none [&_svg]:text-green';

  return (
    <div ref={wrapRef} className="relative flex-none">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex cursor-pointer items-center gap-2 rounded-lg border-0 bg-white/10 py-1.5 pr-2 pl-1.5 text-[#EEF3EC] hover:bg-white/20 sm:gap-2.5 sm:pr-2.5"
      >
        <Avatar initials={user.avatarInitials} size={30} />
        <span className="hidden text-left text-[13px] leading-tight md:block">
          <b className="block font-semibold">{user.name}</b>
          <small className="text-[#A9BFA9]">{ROLE_LABEL[user.role]}</small>
        </span>
        <IconChevron className={'h-4 w-4 transition-transform ' + (open ? 'rotate-180' : '')} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account"
          className="card rise absolute top-[calc(100%+10px)] right-0 z-50 w-[262px] overflow-hidden text-ink"
        >
          <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
            <Avatar initials={user.avatarInitials} size={38} />
            <div className="min-w-0">
              <b className="block truncate text-sm font-semibold">{user.name}</b>
              <span className="block truncate text-[12px] text-muted">{user.email}</span>
              <span className="mt-1 inline-block rounded-full border border-green-line bg-green-soft px-2 py-0.5 text-[11px] font-semibold text-green">
                {ROLE_LABEL[user.role]}
                {user.verified ? ' · Verified' : ''}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-0.5 p-2">
            <Link to="/account" role="menuitem" onClick={() => setOpen(false)} className={item}>
              <IconUser />
              Account settings
            </Link>
            {ROLE_LINKS[role ?? 'guest'].map((l) => (
              <Link key={l.to} to={l.to} role="menuitem" onClick={() => setOpen(false)} className={item}>
                {l.icon}
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-0.5 border-t border-line p-2">
            {SHARED_LINKS.map((l) => (
              <Link key={l.to} to={l.to} role="menuitem" onClick={() => setOpen(false)} className={item}>
                {l.icon}
                {l.label}
              </Link>
            ))}
          </div>

          <div className="border-t border-line p-2">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                setConfirming(true);
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-[9px] border-0 bg-transparent px-2.5 py-2 text-left text-[13.5px] font-semibold text-rented hover:bg-rented-soft [&_svg]:h-[17px] [&_svg]:w-[17px]"
            >
              <IconLogout />
              Log out
            </button>
          </div>
        </div>
      )}

      <LogoutConfirm open={confirming} onClose={() => setConfirming(false)} />
    </div>
  );
}
