import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { services } from '../../api';
import { usePros, useServiceRequests } from '../../api/hooks';
import { EmptyState, Field, PageHead, SectionTitle, inputClass } from '../../components/ui/Bits';
import { Button } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/Chip';
import { Modal, SuccessModal } from '../../components/ui/Modal';
import { IconStar, IconWrench } from '../../components/icons';
import { cx, inr, tradeLabel } from '../../lib/format';
import type { ServicePro, Trade } from '../../types';

const SLOTS = [
  'Today · 4:00 PM – 6:00 PM',
  'Tomorrow · 9:00 AM – 11:00 AM',
  'Tomorrow · 2:00 PM – 4:00 PM',
  'This weekend · 10:00 AM – 12:00 PM',
];

const BLURB: Record<Trade, string> = {
  plumber: 'Leakages, taps, fittings, bathroom and kitchen issues.',
  electrician: 'Wiring, switch boards, fittings and appliance installation.',
  construction: 'Repairs, painting, tiling and civil work.',
};

export default function Services() {
  const pros = usePros();
  const { user } = useAuth();
  const toast = useToast();
  const mine = useServiceRequests(user?.id);
  const [trade, setTrade] = useState<Trade | 'all'>('all');
  const [booking, setBooking] = useState<ServicePro | null>(null);
  const [slot, setSlot] = useState(SLOTS[0]);
  const [done, setDone] = useState<ServicePro | null>(null);
  const [busy, setBusy] = useState(false);

  const trades: Array<Trade | 'all'> = ['all', 'plumber', 'electrician', 'construction'];
  const shown = trade === 'all' ? pros : pros.filter((p) => p.trade === trade);

  async function confirm() {
    if (!booking || !user) return;
    setBusy(true);
    try {
      await services.book({ userId: user.id, proId: booking.id, slot });
      setDone(booking);
      setBooking(null);
      toast(`${booking.name} booked for ${slot.toLowerCase()}.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHead
        title="Home services"
        subtitle="Verified plumbers, electricians and construction help — booked and paid for in the app."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {trades.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTrade(t)}
            className={cx(
              'cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
              trade === t
                ? 'border-green bg-green text-[#F1F6EF]'
                : 'border-green-line bg-panel text-green hover:bg-green-soft',
            )}
          >
            {t === 'all' ? 'All trades' : tradeLabel[t]}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((p) => (
          <article key={p.id} className="card flex flex-col gap-3 p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-[11px] bg-green-soft text-green">
                <IconWrench className="h-[22px] w-[22px]" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="display m-0 text-base font-semibold">{p.name}</h3>
                <p className="m-0 text-[12.5px] text-muted">{tradeLabel[p.trade]}</p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-honey-soft px-2 py-1 text-[12px] font-semibold text-honey">
                <IconStar className="h-3 w-3" />
                {p.rating}
              </span>
            </div>

            <p className="m-0 flex-1 text-[13.5px] leading-snug text-muted">{BLURB[p.trade]}</p>

            <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
              <span className="display text-[17px] font-semibold">
                {inr(p.ratePerVisit)}
                <span className="font-sans text-[12px] font-normal text-muted"> / visit</span>
              </span>
              <Button size="sm" onClick={() => setBooking(p)}>
                Book a slot
              </Button>
            </div>
          </article>
        ))}
      </div>

      <SectionTitle title="Your service requests" />
      {mine.length === 0 ? (
        <EmptyState title="Nothing booked yet" message="Bookings you make show up here with their status." />
      ) : (
        <div className="card overflow-hidden">
          {mine.map((s) => {
            const pro = pros.find((p) => p.id === s.proId);
            return (
              <div key={s.id} className="flex flex-wrap items-center gap-3.5 border-b border-line px-[18px] py-3.5 last:border-b-0">
                <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-green-soft text-green">
                  <IconWrench className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <b className="block text-sm font-semibold">
                    {pro?.name} · {pro ? tradeLabel[pro.trade] : ''}
                  </b>
                  <span className="block text-[12.5px] text-muted">{s.slot}</span>
                </div>
                <span className="display hidden text-[15px] font-semibold sm:block">
                  {inr(pro?.ratePerVisit ?? 0)}
                </span>
                <StatusPill tone={s.status === 'done' ? 'ok' : 'wait'}>
                  {s.status === 'requested' ? 'Requested' : s.status === 'confirmed' ? 'Confirmed' : 'Done'}
                </StatusPill>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={!!booking}
        title={`Book ${booking?.name ?? ''}`}
        onClose={() => setBooking(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setBooking(null)}>
              Cancel
            </Button>
            <Button onClick={confirm} disabled={busy}>
              {busy ? 'Booking…' : `Confirm · ${inr(booking?.ratePerVisit ?? 0)}`}
            </Button>
          </>
        }
      >
        <Field label="Pick a slot">
          <select className={inputClass} value={slot} onChange={(e) => setSlot(e.target.value)}>
            {SLOTS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <p className="m-0 mt-4 text-[13px] text-muted">
          {booking ? BLURB[booking.trade] : ''} The visit charge is paid from your RentEase wallet when
          the job is marked done.
        </p>
      </Modal>

      <SuccessModal
        open={!!done}
        title="Service booked"
        message={
          <>
            <b>{done?.name}</b> will reach you at <b>{slot.toLowerCase()}</b>. You can track the job under
            your service requests.
          </>
        }
        onClose={() => setDone(null)}
        actions={<Button onClick={() => setDone(null)}>Done</Button>}
      />
    </>
  );
}
