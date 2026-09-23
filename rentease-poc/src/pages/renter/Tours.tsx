import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProperties, useRenterRequests, useUnits } from '../../api/hooks';
import { EmptyState, PageHead, SectionTitle } from '../../components/ui/Bits';
import { LinkButton } from '../../components/ui/Button';
import { StatusPill } from '../../components/ui/Chip';
import { FloorPlan } from '../../components/FloorPlan';
import { inr } from '../../lib/format';
import type { TourRequest } from '../../types';

export default function RenterTours() {
  const { user } = useAuth();
  const reqs = useRenterRequests(user?.id);
  const units = useUnits();
  const properties = useProperties();

  const groups: Array<{ title: string; items: TourRequest[] }> = [
    { title: 'Awaiting the owner', items: reqs.filter((r) => r.status === 'pending') },
    { title: 'Confirmed', items: reqs.filter((r) => r.status === 'accepted') },
    { title: 'Declined', items: reqs.filter((r) => r.status === 'declined') },
  ];

  return (
    <>
      <PageHead
        title="My tours"
        subtitle="Every tour and booking you have asked for, and where the owner has got to."
      />

      {reqs.length === 0 ? (
        <EmptyState
          title="No tours yet"
          message="Find a home you like and hit ‘Book a tour’. The owner's answer shows up here."
          action={<LinkButton to="/renter/search">Search homes</LinkButton>}
        />
      ) : (
        groups
          .filter((g) => g.items.length > 0)
          .map((g) => (
            <div key={g.title}>
              <SectionTitle title={`${g.title} (${g.items.length})`} />
              <div className="card overflow-hidden">
                {g.items.map((r) => {
                  const unit = units.find((u) => u.id === r.unitId);
                  const prop = properties.find((p) => p.id === unit?.propertyId);
                  return (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-center gap-3.5 border-b border-line px-[18px] py-4 last:border-b-0"
                    >
                      <span className="h-11 w-14 flex-none rounded-lg border border-green-line bg-green-soft p-1">
                        {unit && <FloorPlan type={unit.floorPlanType} labels={false} className="h-full w-full" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <b className="block text-sm font-semibold">
                          {unit ? (
                            <Link to={`/listing/${unit.id}`} className="text-ink no-underline hover:underline">
                              {unit.type} · {prop?.name}
                            </Link>
                          ) : (
                            'Listing removed'
                          )}
                        </b>
                        <span className="block text-[12.5px] text-muted">
                          {r.kind === 'booking' ? 'Booking request' : 'Tour request'}
                          {r.when ? ` · ${r.when}` : ''}
                          {unit ? ` · ${inr(unit.rent)}/mo` : ''}
                        </span>
                      </div>
                      <StatusPill
                        tone={r.status === 'accepted' ? 'ok' : r.status === 'declined' ? 'rented' : 'wait'}
                      >
                        {r.status === 'accepted'
                          ? r.kind === 'booking'
                            ? 'Booking confirmed'
                            : 'Tour confirmed'
                          : r.status === 'declined'
                            ? 'Declined'
                            : 'Awaiting owner'}
                      </StatusPill>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
      )}
    </>
  );
}
