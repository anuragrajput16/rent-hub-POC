import { FloorPlan } from './FloorPlan';
import { LinkButton } from './ui/Button';
import { Chip } from './ui/Chip';
import { IconArea, IconPin } from './icons';
import { furnishingLabel, inr } from '../lib/format';
import type { Property, Unit } from '../types';

/**
 * Renter-side browse card. Shows the owner's cover photo when the listing has
 * one, and falls back to the floor-plan schematic when it doesn't.
 */
export function ListingCard({ unit, property }: { unit: Unit; property?: Property }) {
  return (
    <article className="card flex flex-col overflow-hidden">
      <div className="relative block h-[132px] overflow-hidden bg-[linear-gradient(135deg,#2C5B44,#1E4634_60%)]">
        {unit.photos.length > 0 ? (
          <>
            <img
              src={unit.photos[0]}
              alt={`${unit.type} at ${property?.name ?? 'this listing'}`}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Scrim keeps the price chip and sq ft readable over any photo. */}
            <span
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,55,38,.45)_0%,transparent_38%,rgba(21,55,38,.62)_100%)]"
            />
          </>
        ) : (
          <div className="absolute inset-0 p-3 opacity-30">
            <FloorPlan type={unit.floorPlanType} tone="light" labels={false} className="h-full w-full" />
          </div>
        )}
        <span className="display absolute top-3 right-3 rounded-[9px] bg-honey px-[11px] py-[5px] text-[13.5px] font-bold text-[#2A1B04]">
          {inr(unit.rent)}/mo
        </span>
        <span className="absolute bottom-[11px] left-3 flex items-center gap-1.5 text-[12.5px] font-medium text-[#EAF2E7]">
          <IconArea className="h-3.5 w-3.5 text-honey" />
          {unit.sqft} sq ft
        </span>
      </div>

      <div className="flex flex-1 flex-col px-4 pt-3.5 pb-4">
        <h3 className="display m-0 mb-1 text-base font-semibold">
          {unit.type} · {property?.name ?? 'Listing'}
        </h3>
        <div className="mb-3 flex items-center gap-1.5 text-[13px] text-muted">
          <IconPin className="h-3.5 w-3.5" />
          {property ? `${property.area}, ${property.city}` : 'Indore'}
        </div>

        <div className="mb-3.5 flex flex-wrap gap-[7px]">
          <Chip>Verified owner</Chip>
          <Chip>{unit.photos.length > 0 ? `${unit.photos.length} photos` : 'Floor plan'}</Chip>
          <Chip>{furnishingLabel[unit.furnishing]}</Chip>
        </div>

        <div className="mt-auto flex gap-2">
          <LinkButton to={`/listing/${unit.id}`} variant="ghost" size="sm" className="flex-1">
            Details
          </LinkButton>
          <LinkButton to={`/listing/${unit.id}?tour=1`} size="sm" className="flex-1">
            Book a tour
          </LinkButton>
        </div>
      </div>
    </article>
  );
}
