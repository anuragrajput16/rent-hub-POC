import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { bookings as bookingsApi } from '../../api';
import { useProperties, useRenterBookings, useTxns, useUnits } from '../../api/hooks';
import { EmptyState, PageHead, SectionTitle, StatCard } from '../../components/ui/Bits';
import { Button, LinkButton } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/Chip';
import { Modal, SuccessModal } from '../../components/ui/Modal';
import { FloorPlan } from '../../components/FloorPlan';
import { IconCard, IconRupee } from '../../components/icons';
import { dueDate, inr, prettyDate } from '../../lib/format';

export default function RenterBookings() {
  const { user } = useAuth();
  const toast = useToast();
  const list = useRenterBookings(user?.id);
  const units = useUnits();
  const properties = useProperties();
  const txns = useTxns(user?.id);
  const [payFor, setPayFor] = useState<string | null>(null);
  const [paid, setPaid] = useState(0);
  const [earned, setEarned] = useState({ points: 0, cashback: 0 });
  const [busy, setBusy] = useState(false);

  const booking = list.find((b) => b.id === payFor);
  const bookingUnit = units.find((u) => u.id === booking?.unitId);
  const totalPaid = txns.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

  async function pay() {
    if (!payFor) return;
    setBusy(true);
    try {
      const { amount, points, cashback } = await bookingsApi.payRent(payFor);
      setPayFor(null);
      setPaid(amount);
      setEarned({ points, cashback });
      toast(`${inr(amount)} paid · ${points.toLocaleString('en-IN')} RentPoints earned.`);
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead
        title="Bookings & rent"
        subtitle="Your active rentals, the next due date, and every rent receipt."
      />

      <div className="mb-[26px] grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Wallet balance" value={inr(user?.walletBalance ?? 0)} icon={<IconCard />} />
        <StatCard label="Active rentals" value={list.filter((b) => b.status === 'active').length} icon={<IconRupee />} />
        <StatCard label="Paid through RentEase" value={inr(totalPaid)} icon={<IconRupee />} />
      </div>

      <SectionTitle title="Your rentals" className="mt-0" />
      {list.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          message="Once an owner accepts your booking request, the unit and its rent schedule appear here."
          action={<LinkButton to="/renter/search">Find a home</LinkButton>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((b) => {
            const unit = units.find((u) => u.id === b.unitId);
            const prop = properties.find((p) => p.id === unit?.propertyId);
            return (
              <div key={b.id} className="card flex gap-4 p-5">
                <span className="h-16 w-20 flex-none rounded-lg border border-green-line bg-green-soft p-1.5">
                  {unit && <FloorPlan type={unit.floorPlanType} labels={false} className="h-full w-full" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="display m-0 text-base font-semibold">
                        Unit {unit?.unitNo} · {unit?.type}
                      </h3>
                      <p className="m-0 mt-0.5 text-[12.5px] text-muted">
                        {prop?.name}, {prop?.area} · since {prettyDate(b.startDate)}
                      </p>
                    </div>
                    <StatusPill tone={b.status === 'active' ? 'ok' : 'muted'}>
                      {b.status === 'active' ? 'Active' : 'Ended'}
                    </StatusPill>
                  </div>

                  <div className="display mt-3 text-[22px] font-semibold">
                    {inr(b.monthlyRent)}
                    <span className="font-sans text-[12.5px] font-normal text-muted"> / month</span>
                  </div>
                  <p className="m-0 mt-1 text-[13px] font-medium text-rented">
                    Next due {dueDate(b.nextDueDate)}
                  </p>

                  <div className="mt-3.5 flex gap-2">
                    <Button size="sm" onClick={() => setPayFor(b.id)} disabled={b.status !== 'active'}>
                      Pay rent
                    </Button>
                    {unit && (
                      <LinkButton to={`/listing/${unit.id}`} variant="ghost" size="sm">
                        View home
                      </LinkButton>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SectionTitle title="Payment history" />
      {txns.length === 0 ? (
        <EmptyState title="No payments yet" message="Rent and marketplace receipts collect here." />
      ) : (
        <div className="card overflow-hidden">
          {txns.map((t) => (
            <div key={t.id} className="flex items-center gap-3.5 border-b border-line px-[18px] py-3.5 last:border-b-0">
              <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-green-soft text-green">
                <IconCard className="h-[18px] w-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <b className="block text-sm font-semibold">{t.note}</b>
                <span className="block text-[12.5px] text-muted">{prettyDate(t.date)}</span>
              </div>
              <span className={`display text-[15px] font-semibold ${t.type === 'credit' ? 'text-green' : 'text-rented'}`}>
                {t.type === 'credit' ? '+' : '−'}
                {inr(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={!!booking}
        title="Pay rent"
        onClose={() => setPayFor(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayFor(null)}>
              Cancel
            </Button>
            <Button onClick={pay} disabled={busy}>
              {busy ? 'Paying…' : `Pay ${inr(booking?.monthlyRent ?? 0)}`}
            </Button>
          </>
        }
      >
        <dl className="m-0 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-muted">Home</dt>
          <dd className="m-0 text-right font-semibold">
            Unit {bookingUnit?.unitNo} · {bookingUnit?.type}
          </dd>
          <dt className="text-muted">Due date</dt>
          <dd className="m-0 text-right font-semibold">{dueDate(booking?.nextDueDate ?? '')}</dd>
          <dt className="text-muted">Paying from</dt>
          <dd className="m-0 text-right font-semibold">Wallet · {inr(user?.walletBalance ?? 0)}</dd>
          <dt className="border-t border-line pt-2 text-muted">Amount</dt>
          <dd className="display m-0 border-t border-line pt-2 text-right text-lg font-semibold">
            {inr(booking?.monthlyRent ?? 0)}
          </dd>
        </dl>
      </Modal>

      <SuccessModal
        open={paid > 0}
        title="Payment successful"
        message={
          <>
            <b>{inr(paid)}</b> has been credited to your owner's rent wallet and your next due date has
            moved on a month. Your rewards card picked up{' '}
            <b>{earned.points.toLocaleString('en-IN')} RentPoints</b>
            {earned.cashback > 0 && <> and <b>{inr(earned.cashback)} cashback</b></>}.
          </>
        }
        onClose={() => setPaid(0)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setPaid(0)}>
              Done
            </Button>
            <LinkButton to="/rewards">View rewards</LinkButton>
          </>
        }
      />
    </>
  );
}
