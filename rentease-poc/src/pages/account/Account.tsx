/** Profile, role and session — the page behind the top-bar account menu. */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useRewardCard } from '../../api/hooks';
import { ErrorNote, Field, PageHead, SectionTitle, StatCard, inputClass } from '../../components/ui/Bits';
import { Button, LinkButton } from '../../components/ui/Button';
import { Avatar, VerifiedBadge } from '../../components/ui/Chip';
import { LogoutConfirm } from '../../components/LogoutConfirm';
import {
  IconCard,
  IconCoin,
  IconDoc,
  IconGift,
  IconHelp,
  IconInfo,
  IconLogout,
  IconRupee,
  IconStar,
} from '../../components/icons';
import { inr, prettyDate } from '../../lib/format';
import { tierOf } from '../../lib/rewards';
import type { Role } from '../../types';

const ROLE_COPY: Record<Role, { label: string; body: string }> = {
  owner: {
    label: 'Property owner',
    body: 'You can list units with floor plans, screen tour and booking requests, collect rent in the wallet and withdraw it to your bank.',
  },
  renter: {
    label: 'Renter',
    body: 'You can search verified homes, book tours, rent online, pay rent and bills from the wallet, and earn on every payment.',
  },
  guest: {
    label: 'Guest shopper',
    body: 'You can shop furniture and décor and book home services. Renting or listing a home needs a verified renter or owner account.',
  },
};

const SHORTCUTS = [
  { to: '/rewards', label: 'Rewards card', icon: <IconGift />, note: 'Points, cashback and coins' },
  { to: '/orders', label: 'Orders & receipts', icon: <IconDoc />, note: 'Everything you have bought' },
  { to: '/help', label: 'Help & support', icon: <IconHelp />, note: 'FAQs and the ticket desk' },
  { to: '/about', label: 'About RentEase', icon: <IconInfo />, note: 'What the product does' },
];

export default function Account() {
  const { user, role, updateProfile } = useAuth();
  const toast = useToast();
  const card = useRewardCard(user?.id);

  const [form, setForm] = useState({ name: user?.name ?? '', city: user?.city ?? '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const tier = tierOf(card?.lifetimePoints ?? 0);
  const dirty = form.name !== user?.name || form.city !== user?.city;

  async function save() {
    setBusy(true);
    setError('');
    try {
      await updateProfile(form);
      toast('Profile updated.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead
        title="Account"
        subtitle="Your profile, your role and everything tied to this login."
        action={user?.verified ? <VerifiedBadge label="ID verified" /> : undefined}
      />

      <div className="mb-[26px] grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Wallet balance" value={inr(user?.walletBalance ?? 0)} icon={<IconCard />} />
        <StatCard
          label="RentPoints"
          value={(card?.points ?? 0).toLocaleString('en-IN')}
          icon={<IconCoin />}
        />
        <StatCard label="Cashback" value={inr(card?.cashback ?? 0)} icon={<IconRupee />} />
        <StatCard label="Tier" value={tier.name} suffix={`· ${card?.coins ?? 0} coins`} icon={<IconStar />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="card p-5">
          <div className="mb-5 flex items-center gap-3.5">
            <Avatar initials={user?.avatarInitials ?? ''} size={52} />
            <div className="min-w-0">
              <h2 className="display m-0 text-lg font-semibold">{user?.name}</h2>
              <p className="m-0 text-[13px] text-muted">
                {ROLE_COPY[role ?? 'guest'].label}
                {card ? ` · member since ${prettyDate(card.issuedOn)}` : ''}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="City">
              <input
                className={inputClass}
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </Field>
            <Field label="Email" hint="Sign-in email cannot be changed in this proof of concept.">
              <input className={inputClass} value={user?.email ?? ''} readOnly disabled />
            </Field>
            <Field label="Account type">
              <input className={inputClass} value={ROLE_COPY[role ?? 'guest'].label} readOnly disabled />
            </Field>
          </div>

          {error && (
            <div className="mt-4">
              <ErrorNote>{error}</ErrorNote>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button onClick={save} disabled={busy || !dirty}>
              {busy ? 'Saving…' : 'Save changes'}
            </Button>
            {dirty && (
              <Button
                variant="ghost"
                onClick={() => setForm({ name: user?.name ?? '', city: user?.city ?? '' })}
              >
                Discard
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <h3 className="display m-0 text-base font-semibold">Your role</h3>
            <p className="m-0 mt-1.5 text-[13.5px] leading-snug text-muted">
              {ROLE_COPY[role ?? 'guest'].body}
            </p>
            <LinkButton to="/upgrade" variant="ghost" size="sm" className="mt-4">
              {role === 'guest' ? 'Upgrade account' : 'Change account type'}
            </LinkButton>
          </div>

          <div className="card p-5">
            <h3 className="display m-0 text-base font-semibold">Session</h3>
            <p className="m-0 mt-1.5 text-[13.5px] leading-snug text-muted">
              Signing out returns you to the login screen. Nothing on the account is deleted — your
              listings, bookings and rewards are waiting when you come back.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-4 border-[#E6C3AB] text-rented hover:bg-rented-soft"
              onClick={() => setSigningOut(true)}
            >
              <IconLogout />
              Log out
            </Button>
          </div>
        </div>
      </div>

      <SectionTitle title="Shortcuts" />
      <div className="card divide-y divide-line overflow-hidden">
        {SHORTCUTS.map((s) => (
          <Link
            key={s.to}
            to={s.to}
            className="flex items-center gap-3.5 px-[18px] py-3.5 text-ink no-underline hover:bg-green-soft"
          >
            <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-green-soft text-green [&_svg]:h-[18px] [&_svg]:w-[18px]">
              {s.icon}
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-sm font-semibold">{s.label}</b>
              <span className="block text-[12.5px] text-muted">{s.note}</span>
            </span>
            <span className="text-[13.5px] font-semibold text-green">Open →</span>
          </Link>
        ))}
      </div>

      <p className="mt-5 rounded-card border border-line bg-panel px-4 py-3 text-[13px] text-muted">
        This is a proof of concept — profile changes are saved to the mock store in your browser, and
        the Owner / Renter / Guest pill in the top bar hops between the three seeded demo accounts.
      </p>

      <LogoutConfirm open={signingOut} onClose={() => setSigningOut(false)} />
    </>
  );
}
