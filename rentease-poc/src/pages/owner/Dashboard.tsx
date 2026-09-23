import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { requests as requestsApi } from '../../api';
import { useOwnerRequests, useOwnerUnits, useProperties, useRewardCard, useTxns } from '../../api/hooks';
import { PageHead, SectionTitle, StatCard, EmptyState } from '../../components/ui/Bits';
import { Button, LinkButton } from '../../components/ui/Button';
import { VerifiedBadge } from '../../components/ui/Chip';
import { UnitCard } from '../../components/UnitCard';
import { RequestRow } from '../../components/RequestRow';
import { WalletCard } from '../../components/WalletCard';
import { RewardsCard } from '../../components/RewardsCard';
import { IconCard, IconClock, IconHome, IconPlus, IconUser } from '../../components/icons';
import { inr } from '../../lib/format';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const units = useOwnerUnits(user?.id);
  const reqs = useOwnerRequests(user?.id);
  const properties = useProperties();
  const txns = useTxns(user?.id);
  const rewardCard = useRewardCard(user?.id);
  const [busy, setBusy] = useState(false);

  const primary = properties.find((p) => p.ownerId === user?.id);

  const stats = useMemo(() => {
    const occupied = units.filter((u) => u.status === 'rented').length;
    const thisMonth = new Date().toISOString().slice(0, 7);
    const collected = txns
      .filter((t) => t.type === 'credit' && t.date.startsWith(thisMonth))
      .reduce((sum, t) => sum + t.amount, 0);
    // Seed transactions are dated in the past; fall back to the rent roll so the
    // card is never an empty ₹0 on first load.
    const rentRoll = units.filter((u) => u.status === 'rented').reduce((s, u) => s + u.rent, 0);
    return {
      total: units.length,
      occupied,
      collected: collected || rentRoll,
      pending: reqs.filter((r) => r.status === 'pending').length,
    };
  }, [units, reqs, txns]);

  async function decide(id: string, status: 'accepted' | 'declined') {
    setBusy(true);
    try {
      await requestsApi.decide(id, status);
      toast(status === 'accepted' ? 'Request accepted — the renter has been notified.' : 'Request declined.');
    } finally {
      setBusy(false);
    }
  }

  const pending = reqs.filter((r) => r.status === 'pending');

  return (
    <>
      <PageHead
        title="Your building, at a glance"
        subtitle={
          <>
            {primary ? `${primary.name}, ${primary.area} — ${units.length} units` : 'No property yet'}
            &nbsp;
            {user?.verified && <VerifiedBadge label="Verified owner" />}
          </>
        }
        action={
          <LinkButton to="/owner/listings/new">
            <IconPlus />
            List a new unit
          </LinkButton>
        }
      />

      <div className="mb-[26px] grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total units" value={stats.total} icon={<IconHome />} />
        <StatCard label="Occupied" value={stats.occupied} suffix={`/ ${stats.total}`} icon={<IconUser />} />
        <StatCard label="Collected this month" value={inr(stats.collected)} icon={<IconCard />} />
        <StatCard label="Pending requests" value={stats.pending} icon={<IconClock />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <div>
          <SectionTitle
            title="Your listings"
            link="/owner/listings"
            linkLabel={`Manage all ${units.length}`}
          />
          {units.length === 0 ? (
            <EmptyState
              title="No units listed yet"
              message="Add your first unit and it will show up here with its floor plan."
              action={<LinkButton to="/owner/listings/new">List a unit</LinkButton>}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {units.slice(0, 6).map((u) => (
                <UnitCard key={u.id} unit={u} />
              ))}
            </div>
          )}
        </div>

        <div>
          <SectionTitle title="Rent wallet" />
          <WalletCard
            balance={user?.walletBalance ?? 0}
            subtitle={`${inr(stats.collected)} credited this month across ${stats.occupied} unit${stats.occupied === 1 ? '' : 's'}`}
            onWithdraw={() => navigate('/owner/wallet')}
            onHistory={() => navigate('/owner/wallet')}
          />

          {rewardCard && (
            <>
              <SectionTitle title="Rewards" link="/rewards" linkLabel="Open card" className="mt-[26px]" />
              <RewardsCard card={rewardCard} holder={user?.name ?? ''} compact />
              <p className="m-0 mt-2.5 text-[12.5px] leading-snug text-muted">
                Rent you collect earns points and cashback, and every unit that stays let for 3, 6 or 12
                months pays you a loyalty coin.
              </p>
            </>
          )}

          <SectionTitle title="Requests" link="/owner/requests" className="mt-[26px]" />
          {pending.length === 0 ? (
            <EmptyState title="Nothing waiting on you" message="New tour and booking requests land here." />
          ) : (
            <div className="card overflow-hidden">
              {pending.slice(0, 4).map((r) => (
                <RequestRow
                  key={r.id}
                  request={r}
                  unit={units.find((u) => u.id === r.unitId)}
                  onDecide={decide}
                  busy={busy}
                />
              ))}
            </div>
          )}

          <SectionTitle title="Furnish your units" className="mt-[26px]" />
          <div className="card p-5">
            <p className="m-0 mb-3.5 text-[13.5px] leading-snug text-muted">
              Semi-furnished units rent faster. Put a bed, almirah and study table on monthly rent and
              charge it back in the rent.
            </p>
            <Button variant="ghost" block onClick={() => navigate('/furniture')}>
              Browse furniture
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
