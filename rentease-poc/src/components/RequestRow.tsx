import { Link } from 'react-router-dom';
import { Button } from './ui/Button';
import { Avatar, StatusPill } from './ui/Chip';
import type { TourRequest, Unit } from '../types';

const KIND_LABEL = { tour: 'Tour request', booking: 'Booking' } as const;

export function RequestRow({
  request,
  unit,
  onDecide,
  busy,
}: {
  request: TourRequest;
  unit?: Unit;
  onDecide?: (id: string, status: 'accepted' | 'declined') => void;
  busy?: boolean;
}) {
  const initials = request.renterName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2.5 border-b border-line px-[18px] py-[15px] last:border-b-0">
      <div className="flex min-w-[200px] flex-1 items-center gap-3">
        <Avatar initials={initials} size={40} />
        <div className="min-w-0">
          <div className="flex items-center gap-[7px] text-[14.5px] font-semibold">
            {request.renterName}
            <span className="rounded-full border border-green-line bg-green-soft px-[7px] py-px text-[11px] font-semibold text-green">
              Verified
            </span>
          </div>
          <div className="mt-0.5 text-[12.5px] text-muted">
            {unit ? (
              <Link to={`/listing/${unit.id}`} className="text-muted no-underline hover:underline">
                Unit {unit.unitNo} · {unit.type}
              </Link>
            ) : (
              'Unit removed'
            )}
            {request.when ? ` · ${request.when}` : ''}
          </div>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        <span className="rounded-full bg-honey-soft px-2.5 py-1 text-xs font-semibold whitespace-nowrap text-honey">
          {KIND_LABEL[request.kind]}
        </span>

        {request.status === 'pending' && onDecide ? (
          <div className="flex gap-2">
            <Button size="sm" disabled={busy} onClick={() => onDecide(request.id, 'accepted')}>
              Accept
            </Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => onDecide(request.id, 'declined')}>
              Decline
            </Button>
          </div>
        ) : (
          <StatusPill tone={request.status === 'accepted' ? 'ok' : request.status === 'declined' ? 'rented' : 'wait'}>
            {request.status === 'accepted'
              ? 'Accepted'
              : request.status === 'declined'
                ? 'Declined'
                : 'Awaiting owner'}
          </StatusPill>
        )}
      </div>
    </div>
  );
}
