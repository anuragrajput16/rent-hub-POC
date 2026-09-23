import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOwnerUnits, useProperties } from '../../api/hooks';
import { EmptyState, PageHead } from '../../components/ui/Bits';
import { Button, LinkButton } from '../../components/ui/Button';
import { UnitCard, UnitRow } from '../../components/UnitCard';
import { IconGrid, IconList, IconPlus } from '../../components/icons';
import { cx } from '../../lib/format';
import type { UnitStatus } from '../../types';

type Filter = 'all' | UnitStatus;

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: 'all', label: 'All units' },
  { value: 'available', label: 'Available' },
  { value: 'rented', label: 'Rented' },
];

export default function OwnerListings() {
  const { user } = useAuth();
  const units = useOwnerUnits(user?.id);
  const properties = useProperties();
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const shown = filter === 'all' ? units : units.filter((u) => u.status === filter);

  return (
    <>
      <PageHead
        title="My listings"
        subtitle={`${units.length} units across ${new Set(units.map((u) => u.propertyId)).size} propert${
          new Set(units.map((u) => u.propertyId)).size === 1 ? 'y' : 'ies'
        }`}
        action={
          <LinkButton to="/owner/listings/new">
            <IconPlus />
            List a new unit
          </LinkButton>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={cx(
              'cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
              filter === f.value
                ? 'border-green bg-green text-[#F1F6EF]'
                : 'border-green-line bg-panel text-green hover:bg-green-soft',
            )}
          >
            {f.label}
          </button>
        ))}

        <div className="ml-auto flex gap-1 rounded-[10px] border border-line bg-panel p-1">
          <Button
            variant={view === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            aria-label="Grid view"
            aria-pressed={view === 'grid'}
            className={view === 'grid' ? '' : 'border-0'}
            onClick={() => setView('grid')}
          >
            <IconGrid />
          </Button>
          <Button
            variant={view === 'list' ? 'primary' : 'ghost'}
            size="sm"
            aria-label="List view"
            aria-pressed={view === 'list'}
            className={view === 'list' ? '' : 'border-0'}
            onClick={() => setView('list')}
          >
            <IconList />
          </Button>
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState
          title="No units here"
          message="Nothing matches this filter yet. Try another filter, or list a new unit."
          action={<LinkButton to="/owner/listings/new">List a unit</LinkButton>}
        />
      ) : view === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((u) => (
            <UnitCard key={u.id} unit={u} />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {shown.map((u) => (
            <UnitRow
              key={u.id}
              unit={u}
              property={properties.find((p) => p.id === u.propertyId)?.name}
            />
          ))}
        </div>
      )}
    </>
  );
}
