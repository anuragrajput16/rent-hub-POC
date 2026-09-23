/** Shared listing filter used by the renter dashboard and the search page. */
import { budgetRange, ANY_TYPE, type SearchFilters } from '../components/SearchBar';
import type { Property, Unit } from '../types';

export function filterUnits(
  units: Unit[],
  properties: Property[],
  filters: SearchFilters,
): Unit[] {
  const range = budgetRange(filters.budget);
  const q = filters.location.trim().toLowerCase();

  return units.filter((u) => {
    if (u.status !== 'available') return false;
    if (filters.type !== ANY_TYPE && u.type !== filters.type) return false;
    if (u.rent < range.min || u.rent > range.max) return false;
    if (!q) return true;

    const p = properties.find((x) => x.id === u.propertyId);
    return `${p?.name ?? ''} ${p?.area ?? ''} ${p?.city ?? ''}`.toLowerCase().includes(q);
  });
}
