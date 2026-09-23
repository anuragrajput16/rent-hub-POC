import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProperties, useUnits } from '../../api/hooks';
import { EmptyState, PageHead } from '../../components/ui/Bits';
import { Button } from '../../components/ui/Button';
import { ListingCard } from '../../components/ListingCard';
import { SearchBar, ANY_TYPE, type SearchFilters } from '../../components/SearchBar';
import { filterUnits } from '../../lib/search';
import { cx } from '../../lib/format';

type Sort = 'relevant' | 'rent-asc' | 'rent-desc' | 'size-desc';

const SORTS: Array<{ value: Sort; label: string }> = [
  { value: 'relevant', label: 'Best match' },
  { value: 'rent-asc', label: 'Rent: low to high' },
  { value: 'rent-desc', label: 'Rent: high to low' },
  { value: 'size-desc', label: 'Largest first' },
];

export default function RenterSearch() {
  const [params, setParams] = useSearchParams();
  const units = useUnits();
  const properties = useProperties();
  const [sort, setSort] = useState<Sort>('relevant');

  const filters: SearchFilters = {
    location: params.get('location') ?? '',
    type: params.get('type') ?? ANY_TYPE,
    budget: params.get('budget') ?? 'any',
  };

  function update(next: SearchFilters) {
    setParams(
      { location: next.location, type: next.type, budget: next.budget },
      { replace: true },
    );
  }

  const results = [...filterUnits(units, properties, filters)].sort((a, b) => {
    if (sort === 'rent-asc') return a.rent - b.rent;
    if (sort === 'rent-desc') return b.rent - a.rent;
    if (sort === 'size-desc') return b.sqft - a.sqft;
    return 0;
  });

  return (
    <>
      <PageHead
        title="Find your next home"
        subtitle={`${results.length} available home${results.length === 1 ? '' : 's'} match your filters.`}
      />

      <SearchBar value={filters} onChange={update} />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] font-semibold text-muted">Sort by</span>
        {SORTS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setSort(s.value)}
            className={cx(
              'cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors',
              sort === s.value
                ? 'border-green bg-green text-[#F1F6EF]'
                : 'border-green-line bg-panel text-green hover:bg-green-soft',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <EmptyState
          title="Nothing matches yet"
          message="No available home fits this location, type and budget together. Try loosening one of them."
          action={
            <Button
              variant="ghost"
              onClick={() => update({ location: '', type: ANY_TYPE, budget: 'any' })}
            >
              Clear all filters
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((u) => (
            <ListingCard key={u.id} unit={u} property={properties.find((p) => p.id === u.propertyId)} />
          ))}
        </div>
      )}
    </>
  );
}
