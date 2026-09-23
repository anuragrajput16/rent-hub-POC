import { Link } from 'react-router-dom';
import { FloorPlan } from './FloorPlan';
import { Button, LinkButton } from './ui/Button';
import { StatusPill } from './ui/Chip';
import { inr } from '../lib/format';
import type { Unit } from '../types';

/** Owner-side unit tile: cover photo (or floor plan), type, sq ft, rent, status. */
export function UnitCard({ unit, onEdit }: { unit: Unit; onEdit?: (u: Unit) => void }) {
  const available = unit.status === 'available';

  return (
    <article className="card flex flex-col overflow-hidden">
      <div className="relative border-b border-line bg-green-soft p-3.5">
        {unit.photos.length > 0 ? (
          <img
            src={unit.photos[0]}
            alt={`Unit ${unit.unitNo}`}
            loading="lazy"
            className="block h-24 w-full rounded-lg object-cover"
          />
        ) : (
          <FloorPlan type={unit.floorPlanType} className="block h-24 w-full" />
        )}
        <span className="absolute top-[11px] right-[11px]">
          <StatusPill tone={available ? 'ok' : 'rented'}>
            {available ? 'Available' : 'Rented'}
          </StatusPill>
        </span>
      </div>

      <div className="flex flex-1 flex-col px-4 pt-3.5 pb-4">
        <div className="flex items-baseline justify-between gap-2">
          <span className="display text-base font-semibold whitespace-nowrap">{unit.type}</span>
          <span className="text-[12.5px] text-muted">Unit {unit.unitNo}</span>
        </div>

        <div className="my-2.5 flex gap-3.5 text-[13px] text-muted">
          <span>
            <b className="font-semibold text-ink">{unit.sqft}</b> sq ft
          </span>
          <span>{available ? 'Ready to move' : 'Occupied'}</span>
        </div>

        <div className="display mt-auto text-[19px] font-semibold">
          {inr(unit.rent)}
          <span className="font-sans text-[12.5px] font-normal text-muted"> / month</span>
        </div>

        <div className="mt-3 flex gap-2">
          {onEdit ? (
            <Button variant="ghost" size="sm" className="flex-1" onClick={() => onEdit(unit)}>
              Edit
            </Button>
          ) : (
            <LinkButton to={`/owner/listings/${unit.id}/edit`} variant="ghost" size="sm" className="flex-1">
              Edit
            </LinkButton>
          )}
          <LinkButton to={`/listing/${unit.id}`} size="sm" className="flex-1">
            View
          </LinkButton>
        </div>
      </div>
    </article>
  );
}

/** Compact row used in the owner's full listings table view. */
export function UnitRow({ unit, property }: { unit: Unit; property?: string }) {
  return (
    <Link
      to={`/listing/${unit.id}`}
      className="flex items-center gap-3.5 border-b border-line px-4 py-3.5 no-underline last:border-b-0 hover:bg-green-soft/60"
    >
      <span className="h-10 w-[52px] flex-none overflow-hidden rounded-lg border border-green-line bg-green-soft">
        {unit.photos.length > 0 ? (
          <img src={unit.photos[0]} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <FloorPlan type={unit.floorPlanType} labels={false} className="h-full w-full p-1" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <b className="block text-sm font-semibold text-ink">
          Unit {unit.unitNo} · {unit.type}
        </b>
        <span className="block text-[12.5px] text-muted">
          {property ? `${property} · ` : ''}
          {unit.sqft} sq ft
        </span>
      </span>
      <span className="display hidden text-[15px] font-semibold text-ink sm:block">{inr(unit.rent)}</span>
      <StatusPill tone={unit.status === 'available' ? 'ok' : 'rented'}>
        {unit.status === 'available' ? 'Available' : 'Rented'}
      </StatusPill>
    </Link>
  );
}
