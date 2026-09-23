import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth, homeFor } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHead } from '../../components/ui/Bits';
import { Button } from '../../components/ui/Button';
import { FloorPlan } from '../../components/FloorPlan';
import { IconCheck } from '../../components/icons';
import { cx } from '../../lib/format';

const OPTIONS = [
  {
    role: 'renter' as const,
    title: 'Become a renter',
    body: 'Search verified homes, book tours, rent online and pay rent from your wallet.',
    perks: ['Search and filter every listing', 'Book tours and send booking requests', 'Pay rent with receipts', 'Layout planner for your own home'],
    plan: '2 BHK' as const,
  },
  {
    role: 'owner' as const,
    title: 'Become an owner',
    body: 'List your rooms with floor plans, screen renters and collect rent in one wallet.',
    perks: ['List unlimited units with floor plans', 'Accept or decline requests', 'Rent wallet with withdrawals', 'Furnish units before listing'],
    plan: '3 BHK' as const,
  },
];

export default function Upgrade() {
  const { user, upgrade } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [busy, setBusy] = useState<string | null>(null);

  async function choose(role: 'owner' | 'renter') {
    setBusy(role);
    try {
      const updated = await upgrade(role);
      toast(`You are now a verified ${role}.`);
      navigate(location.state?.from ?? homeFor(updated.role), { replace: true });
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHead
        title="Unlock more features"
        subtitle={
          user?.role === 'guest'
            ? 'You can shop and book services as a guest. Renting a home needs a verified role.'
            : 'Switch the kind of account you hold on RentEase.'
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {OPTIONS.map((o) => (
          <div key={o.role} className="card flex flex-col overflow-hidden">
            <div className="border-b border-line bg-[linear-gradient(135deg,#2C5B44,#1E4634_60%)] p-5">
              <FloorPlan type={o.plan} tone="light" labels={false} className="h-20 w-full opacity-70" />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="display m-0 text-lg font-semibold">{o.title}</h3>
              <p className="m-0 mt-1.5 text-[13.5px] leading-snug text-muted">{o.body}</p>

              <ul className="m-0 mt-4 mb-5 flex list-none flex-col gap-2 p-0">
                {o.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-[13.5px]">
                    <IconCheck className="mt-0.5 h-3.5 w-3.5 flex-none text-green" />
                    {p}
                  </li>
                ))}
              </ul>

              <Button
                block
                className={cx('mt-auto', o.role === 'owner' && 'bg-honey text-[#2A1B04]')}
                disabled={busy !== null || user?.role === o.role}
                onClick={() => choose(o.role)}
              >
                {user?.role === o.role
                  ? `You are already ${o.role === 'owner' ? 'an owner' : 'a renter'}`
                  : busy === o.role
                    ? 'Verifying…'
                    : o.title}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 rounded-card border border-line bg-panel px-4 py-3 text-[13px] text-muted">
        In the real product this step collects ID proof, and ownership documents for owners. In this
        proof of concept the upgrade is instant and your account is marked verified.
      </p>
    </>
  );
}
