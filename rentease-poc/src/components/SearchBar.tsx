import type { FormEvent } from 'react';
import { Button } from './ui/Button';
import { IconHome, IconPin, IconRupee, IconSearch } from './icons';
import { UNIT_TYPES } from './FloorPlan';

export interface SearchFilters {
  location: string;
  type: string;
  budget: string;
}

export const ANY_TYPE = 'Any type';

export const BUDGETS = [
  { value: 'any', label: 'Any budget', min: 0, max: Infinity },
  { value: 'low', label: 'Up to ₹10,000', min: 0, max: 10000 },
  { value: 'mid', label: '₹10,000 – ₹18,000', min: 10000, max: 18000 },
  { value: 'high', label: '₹18,000 +', min: 18000, max: Infinity },
];

export function budgetRange(value: string) {
  return BUDGETS.find((b) => b.value === value) ?? BUDGETS[0];
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
}: {
  value: SearchFilters;
  onChange: (next: SearchFilters) => void;
  onSubmit?: () => void;
}) {
  function submit(e: FormEvent) {
    e.preventDefault();
    onSubmit?.();
  }

  return (
    <form
      onSubmit={submit}
      className="card mb-[26px] flex flex-wrap gap-2.5 p-2.5"
      role="search"
      aria-label="Find a home"
    >
      <div className="flex min-w-[150px] flex-1 items-center gap-2 rounded-[10px] bg-[#F3F6F1] px-3 py-2">
        <IconPin className="h-[17px] w-[17px] flex-none text-green" />
        <div className="flex-1">
          <label htmlFor="q-loc" className="block text-[11px] font-semibold text-muted">
            Location
          </label>
          <input
            id="q-loc"
            className="w-full border-0 bg-transparent p-0 text-sm font-medium text-ink outline-none"
            value={value.location}
            placeholder="Any area"
            onChange={(e) => onChange({ ...value, location: e.target.value })}
          />
        </div>
      </div>

      <div className="flex min-w-[150px] flex-1 items-center gap-2 rounded-[10px] bg-[#F3F6F1] px-3 py-2">
        <IconHome className="h-[17px] w-[17px] flex-none text-green" />
        <div className="flex-1">
          <label htmlFor="q-type" className="block text-[11px] font-semibold text-muted">
            Home type
          </label>
          <select
            id="q-type"
            className="w-full cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-ink outline-none"
            value={value.type}
            onChange={(e) => onChange({ ...value, type: e.target.value })}
          >
            <option>{ANY_TYPE}</option>
            {UNIT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex min-w-[150px] flex-1 items-center gap-2 rounded-[10px] bg-[#F3F6F1] px-3 py-2">
        <IconRupee className="h-[17px] w-[17px] flex-none text-green" />
        <div className="flex-1">
          <label htmlFor="q-budget" className="block text-[11px] font-semibold text-muted">
            Budget
          </label>
          <select
            id="q-budget"
            className="w-full cursor-pointer border-0 bg-transparent p-0 text-sm font-medium text-ink outline-none"
            value={value.budget}
            onChange={(e) => onChange({ ...value, budget: e.target.value })}
          >
            {BUDGETS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button type="submit" className="self-stretch">
        <IconSearch />
        Search
      </Button>
    </form>
  );
}
