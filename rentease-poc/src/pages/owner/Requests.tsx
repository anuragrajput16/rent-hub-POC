import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { requests as requestsApi } from '../../api';
import { useOwnerRequests, useOwnerUnits } from '../../api/hooks';
import { EmptyState, PageHead } from '../../components/ui/Bits';
import { RequestRow } from '../../components/RequestRow';
import { cx } from '../../lib/format';
import type { TourRequest } from '../../types';

type Tab = 'pending' | 'accepted' | 'declined';

const TABS: Array<{ value: Tab; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
];

export default function OwnerRequests() {
  const { user } = useAuth();
  const toast = useToast();
  const reqs = useOwnerRequests(user?.id);
  const units = useOwnerUnits(user?.id);
  const [tab, setTab] = useState<Tab>('pending');
  const [busy, setBusy] = useState(false);

  async function decide(id: string, status: 'accepted' | 'declined') {
    setBusy(true);
    try {
      const req = reqs.find((r) => r.id === id);
      await requestsApi.decide(id, status);
      toast(
        status === 'accepted'
          ? req?.kind === 'booking'
            ? 'Booking accepted — the unit is now marked rented.'
            : 'Tour accepted — the renter can see the confirmed slot.'
          : 'Request declined.',
      );
    } finally {
      setBusy(false);
    }
  }

  const counts = TABS.reduce<Record<Tab, number>>(
    (acc, t) => ({ ...acc, [t.value]: reqs.filter((r) => r.status === t.value).length }),
    { pending: 0, accepted: 0, declined: 0 },
  );
  const shown: TourRequest[] = reqs.filter((r) => r.status === tab);

  return (
    <>
      <PageHead
        title="Requests"
        subtitle="Tour and booking requests from verified renters. Accepting a booking marks the unit rented."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTab(t.value)}
            className={cx(
              'cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
              tab === t.value
                ? 'border-green bg-green text-[#F1F6EF]'
                : 'border-green-line bg-panel text-green hover:bg-green-soft',
            )}
          >
            {t.label} ({counts[t.value]})
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          title={`No ${tab} requests`}
          message={
            tab === 'pending'
              ? 'When a renter asks for a tour or sends a booking, it lands here.'
              : `Nothing has been ${tab} yet.`
          }
        />
      ) : (
        <div className="card overflow-hidden">
          {shown.map((r) => (
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
    </>
  );
}
