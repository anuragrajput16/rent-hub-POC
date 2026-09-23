/** Cart line → resolved product, price and label. Shared by the cart and orders. */
import type { TierSpec } from './rewards';
import type { CartLine, DecorItem, FurnitureItem } from '../types';

export interface ResolvedLine {
  line: CartLine;
  name: string;
  art: string;
  /** Per-unit price for the chosen mode. */
  unitPrice: number;
  /** `/ month`, `/ day` or '' for an outright purchase. */
  unitSuffix: string;
  subtotal: number;
}

export function resolveLine(
  line: CartLine,
  furniture: FurnitureItem[],
  decor: DecorItem[],
): ResolvedLine | null {
  if (line.kind === 'furniture') {
    const item = furniture.find((f) => f.id === line.refId);
    if (!item) return null;
    const unitPrice = line.mode === 'rent' ? item.rentPerMonth : item.buyPrice;
    return {
      line,
      name: item.name,
      art: item.image,
      unitPrice,
      unitSuffix: line.mode === 'rent' ? '/ month' : '',
      subtotal: unitPrice * line.qty,
    };
  }

  const item = decor.find((d) => d.id === line.refId);
  if (!item) return null;
  const unitPrice = line.mode === 'rent' ? (item.rentPerDay ?? item.buyPrice) : item.buyPrice;
  return {
    line,
    name: item.name,
    art: item.image,
    unitPrice,
    unitSuffix: line.mode === 'rent' ? '/ day' : '',
    subtotal: unitPrice * line.qty,
  };
}

export function resolveLines(
  lines: CartLine[],
  furniture: FurnitureItem[],
  decor: DecorItem[],
): ResolvedLine[] {
  return lines
    .map((l) => resolveLine(l, furniture, decor))
    .filter((l): l is ResolvedLine => l !== null);
}

export const DELIVERY_FEE = 299;

export interface OrderTotals {
  subtotal: number;
  /** Membership discount, from the shopper's rewards tier. */
  discount: number;
  delivery: number;
  total: number;
}

/** One place both the cart summary and the checkout call agree on the price. */
export function orderTotals(subtotal: number, tier: TierSpec): OrderTotals {
  if (subtotal <= 0) return { subtotal: 0, discount: 0, delivery: 0, total: 0 };
  const discount = Math.round(subtotal * tier.shopDiscount);
  const delivery = tier.freeDelivery ? 0 : DELIVERY_FEE;
  return { subtotal, discount, delivery, total: subtotal - discount + delivery };
}
