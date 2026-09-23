/**
 * Layout planner stub (BUILD_BRIEF §2 / §9.7). No ML — each floor-plan type maps
 * to a hardcoded furniture bundle sized for the rooms in that schematic.
 */
import type { FurnitureItem, UnitType } from '../types';

interface Bundle {
  headline: string;
  note: string;
  /** Furniture ids and how many of each fit. */
  items: Array<{ id: string; qty: number; where: string }>;
}

export const BUNDLES: Record<UnitType, Bundle> = {
  '1 RK': {
    headline: 'Single-room starter',
    note: 'One room doing three jobs — a queen bed along the long wall, a study table under the window, and one almirah so nothing sits on the floor.',
    items: [
      { id: 'f1', qty: 1, where: 'Room · long wall' },
      { id: 'f2', qty: 1, where: 'Room · by the window' },
      { id: 'f3', qty: 1, where: 'Room · beside the door' },
    ],
  },
  '1 BHK': {
    headline: 'One-bedroom essentials',
    note: 'Bed and almirah in the bedroom, a three-seater along the hall wall, and a study table that still leaves a walkway to the kitchen.',
    items: [
      { id: 'f1', qty: 1, where: 'Bed · centre' },
      { id: 'f3', qty: 1, where: 'Bed · opposite wall' },
      { id: 'f4', qty: 1, where: 'Hall · long wall' },
      { id: 'f2', qty: 1, where: 'Hall · corner' },
    ],
  },
  '2 BHK': {
    headline: 'Two-bedroom family set',
    note: 'A queen in the master, a second bed in the smaller room, sofa and dining set in the hall — sized so the hall still walks through comfortably.',
    items: [
      { id: 'f1', qty: 2, where: 'Both bedrooms' },
      { id: 'f3', qty: 2, where: 'Both bedrooms' },
      { id: 'f4', qty: 1, where: 'Hall · facing the balcony' },
      { id: 'f5', qty: 1, where: 'Hall · near the kitchen' },
    ],
  },
  '3 BHK': {
    headline: 'Three-bedroom full house',
    note: 'Beds and wardrobes in all three rooms, a sofa and dining table in the hall, and a study corner in the third bedroom.',
    items: [
      { id: 'f1', qty: 3, where: 'All three bedrooms' },
      { id: 'f3', qty: 3, where: 'All three bedrooms' },
      { id: 'f4', qty: 1, where: 'Hall · long wall' },
      { id: 'f5', qty: 1, where: 'Hall · near the kitchen' },
      { id: 'f2', qty: 1, where: 'Third bedroom · study corner' },
      { id: 'f6', qty: 1, where: 'Third bedroom · beside the table' },
    ],
  },
};

export interface BundleLine {
  item: FurnitureItem;
  qty: number;
  where: string;
}

export function bundleFor(type: UnitType, catalogue: FurnitureItem[]): BundleLine[] {
  return BUNDLES[type].items
    .map((line) => {
      const item = catalogue.find((f) => f.id === line.id);
      return item ? { item, qty: line.qty, where: line.where } : null;
    })
    .filter((l): l is BundleLine => l !== null);
}

export const bundleTotals = (lines: BundleLine[]) => ({
  rent: lines.reduce((s, l) => s + l.item.rentPerMonth * l.qty, 0),
  buy: lines.reduce((s, l) => s + l.item.buyPrice * l.qty, 0),
});
